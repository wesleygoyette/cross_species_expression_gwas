import sqlite3
import pandas as pd
import numpy as np
import json
from django.conf import settings
from django.db import connection
from django.core.cache import cache
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder
import hashlib


# Global variable to cache expression data
_expression_cache = None


def get_combined_region_data(gene_data, species_id, tissue, enhancer_classes, 
                           nbins, normalize_rows, mark_tss, stack_tracks, 
                           show_gene, show_snps, log_expression):
    """
    Optimized function to get all region data in a single efficient operation
    """
    # Calculate tss_kb from gene_data
    tss_kb = (gene_data['end'] - gene_data['start']) // 2000  # Convert to kb
    
    # Create cache key for this specific request
    cache_key = f"gene_data_{gene_data['gene_id']}_{species_id}_{tissue}_{tss_kb}_{'-'.join(sorted(enhancer_classes))}_{nbins}_{normalize_rows}_{mark_tss}_{stack_tracks}_{show_gene}_{show_snps}_{log_expression}"
    cache_key_hash = hashlib.md5(cache_key.encode()).hexdigest()
    
    # Try to get from cache first (5 minute cache)
    cached_result = cache.get(cache_key_hash)
    if cached_result:
        return cached_result
    
    # Get all data with optimized single database connection
    with connection.cursor() as cursor:
        # Get enhancers, GWAS SNPs, and CTCF sites in optimized queries
        enhancers = get_enhancers_in_region_optimized(
            cursor, species_id, gene_data['chrom'], 
            gene_data['start'], gene_data['end'], tissue, enhancer_classes
        )
        
        gwas_snps = get_gwas_snps_in_region_optimized(
            cursor, gene_data['gene_id'], gene_data['chrom'],
            gene_data['start'], gene_data['end']
        )
        
        ctcf_sites = get_ctcf_sites_in_region_optimized(
            cursor, species_id, gene_data['chrom'],
            gene_data['start'], gene_data['end']
        )
    
    # Prepare region data
    region_data = {
        'gene': gene_data,
        'enhancers': enhancers,
        'gwas_snps': gwas_snps,
        'ctcf_sites': ctcf_sites,
        'ucsc_url': get_ucsc_url(species_id, gene_data['chrom'], gene_data['start'], gene_data['end'])
    }
    
    # Create conservation matrix (optimized)
    matrix_data = create_conservation_heatmap_optimized(
        enhancers, gene_data['start'], gene_data['end'], 
        enhancer_classes, nbins, normalize_rows, gene_data
    )
    
    # Create genome tracks plot (optimized)
    tracks_data = create_genome_tracks_plot_optimized(
        gene_data, enhancers, gwas_snps, stack_tracks, show_gene, show_snps
    )
    
    # Get expression data (cached)
    expr_data = get_expression_data_cached(gene_data['symbol'], log_expression)
    
    result = {
        'region_data': region_data,
        'matrix_data': matrix_data,
        'tracks_data': tracks_data,
        'expr_data': expr_data
    }
    
    # Cache the result for 5 minutes
    cache.set(cache_key_hash, result, 300)
    
    return result


def get_enhancers_in_region_optimized(cursor, species_id, chrom, start, end, tissue, enhancer_classes):
    """Optimized enhancer query using existing cursor with limits for performance"""
    class_placeholders = ','.join(['%s' for _ in enhancer_classes])
    
    # Add LIMIT to prevent massive datasets from slowing down the UI
    query = f"""
        SELECT e.enh_id, e.chrom, e.start, e.end, e.tissue, e.score, e.source,
               COALESCE(ec.class, 'unlabeled') as class
        FROM enhancers_all e
        LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
        WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
    """
    
    params = [species_id, chrom, end, start]
    
    if tissue != 'Other':
        query += " AND (COALESCE(e.tissue, 'Other') = %s OR %s = 'Other')"
        params.extend([tissue, tissue])
    
    if enhancer_classes:
        query += f" AND COALESCE(ec.class, 'unlabeled') IN ({class_placeholders})"
        params.extend(enhancer_classes)
    
    # Add ordering and limit for performance - prioritize by score/class
    query += " ORDER BY COALESCE(e.score, 0) DESC, e.start LIMIT 5000"
    
    cursor.execute(query, params)
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_gwas_snps_in_region_optimized(cursor, gene_id, chrom, start, end):
    """Optimized GWAS SNP query using existing cursor with better limits"""
    cursor.execute("""
        SELECT DISTINCT s.snp_id, s.rsid, s.chrom, s.pos, s.trait, s.pval, s.category
        FROM gwas_snps s
        JOIN snp_to_enhancer se ON se.snp_id = s.snp_id
        JOIN enhancers_all e ON e.enh_id = se.enh_id
        JOIN gene_to_enhancer ge ON ge.enh_id = e.enh_id
        WHERE ge.gene_id = %s AND s.chrom = %s AND s.pos BETWEEN %s AND %s
        ORDER BY COALESCE(s.pval, 1e99) ASC, s.rsid ASC
        LIMIT 50
    """, [gene_id, chrom, start, end])
    
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_ctcf_sites_in_region_optimized(cursor, species_id, chrom, start, end):
    """Optimized CTCF sites query using existing cursor with better limits"""
    cursor.execute("""
        SELECT site_id, chrom, start, end, score, motif_p, 
               COALESCE(cons_class, 'other') as cons_class
        FROM ctcf_sites
        WHERE species_id = %s AND chrom = %s AND start < %s AND end > %s
        ORDER BY COALESCE(score, 0) DESC
        LIMIT 200
    """, [species_id, chrom, end, start])
    
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def create_conservation_heatmap_optimized(enhancers, start, end, enhancer_classes, nbins, normalize_rows, gene_data):
    """Optimized conservation matrix creation"""
    if not enhancers:
        return {
            'bins': [],
            'classes': enhancer_classes,
            'matrix': [],
            'region_start': start,
            'region_end': end,
            'nbins': nbins
        }
    
    # Pre-calculate bin boundaries
    bin_width = (end - start) / nbins
    bin_edges = [start + i * bin_width for i in range(nbins + 1)]
    
    # Create bins info
    bins = [{
        'bin': i + 1,
        'start': bin_edges[i],
        'end': bin_edges[i + 1],
        'center': (bin_edges[i] + bin_edges[i + 1]) / 2
    } for i in range(nbins)]
    
    # Vectorized enhancer counting
    matrix = []
    for class_name in enhancer_classes:
        class_enhancers = [enh for enh in enhancers if enh['class'] == class_name]
        row = []
        
        for i in range(nbins):
            bin_start, bin_end = bin_edges[i], bin_edges[i + 1]
            count = sum(1 for enh in class_enhancers 
                       if enh['end'] > bin_start and enh['start'] < bin_end)
            row.append(count)
        matrix.append(row)
    
    # Normalize if requested
    if normalize_rows:
        normalized_matrix = []
        for row in matrix:
            max_val = max(row) if row else 1
            normalized_row = [val / max_val if max_val > 0 else 0 for val in row]
            normalized_matrix.append(normalized_row)
        matrix = normalized_matrix
    
    return {
        'bins': bins,
        'classes': enhancer_classes,
        'matrix': matrix,
        'region_start': start,
        'region_end': end,
        'nbins': nbins,
        'normalized': normalize_rows,
        'tss_position': gene_data['tss'] if gene_data else None
    }


def create_genome_tracks_plot_optimized(gene_data, enhancers, snps, stack_tracks, show_gene, show_snps):
    """Optimized genome tracks plot creation"""
    colors = {
        'conserved': '#31c06a',
        'gained': '#ffcf33', 
        'lost': '#8f9aa7',
        'unlabeled': '#4ea4ff'
    }
    
    fig = go.Figure()
    
    # Pre-filter enhancers to region bounds for performance
    region_enhancers = [
        enh for enh in enhancers 
        if enh['end'] > gene_data['start'] and enh['start'] < gene_data['end']
    ]
    
    # Add enhancer tracks with reduced shapes for better performance
    if stack_tracks:
        y_positions = {'conserved': 0.75, 'gained': 0.6, 'lost': 0.45, 'unlabeled': 0.3}
        for enh in region_enhancers[:200]:  # Limit to 200 enhancers for performance
            class_name = enh['class']
            y_pos = y_positions.get(class_name, 0.3)
            fig.add_shape(
                type="rect",
                x0=max(enh['start'], gene_data['start']),
                x1=min(enh['end'], gene_data['end']),
                y0=y_pos - 0.08,
                y1=y_pos + 0.08,
                fillcolor=colors.get(class_name, '#4ea4ff'),
                line=dict(width=0)
            )
    
    # Add gene body and TSS
    if show_gene:
        fig.add_shape(
            type="rect",
            x0=max(gene_data['gene_start'], gene_data['start']),
            x1=min(gene_data['gene_end'], gene_data['end']),
            y0=0.1,
            y1=0.16,
            fillcolor='#c7d0da',
            line=dict(width=0)
        )
    
    # Add TSS marker
    fig.add_shape(
        type="line",
        x0=gene_data['tss'],
        x1=gene_data['tss'],
        y0=0.16,
        y1=0.92,
        line=dict(color='#e8590c', width=2, dash='dash')
    )
    
    # Add GWAS SNPs (limited for performance)
    if show_snps and snps:
        for snp in snps[:50]:  # Limit to 50 SNPs for performance
            mlog10p = -np.log10(snp['pval']) if snp['pval'] and snp['pval'] > 0 else 0
            height = min(0.90 + (mlog10p / 35), 0.98)
            
            fig.add_shape(
                type="line",
                x0=snp['pos'],
                x1=snp['pos'],
                y0=0.90,
                y1=height,
                line=dict(color='#212529', width=2)
            )
    
    # Optimized layout
    fig.update_layout(
        xaxis=dict(
            range=[gene_data['start'], gene_data['end']],
            title='Genomic Position (Mb)',
            tickformat='.1f'
        ),
        yaxis=dict(
            range=[0.08, 1.02],
            showticklabels=False
        ),
        height=400,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False,  # Disable legend for performance
        title=f"Genome Tracks - {gene_data['symbol']}"
    )
    
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {
        'plot_data': plot_json,
        'enhancer_count': len(enhancers),
        'snp_count': len(snps)
    }


def get_expression_data_cached(gene_symbol, log_scale=False):
    """Get expression data with caching for performance"""
    global _expression_cache
    
    # Initialize cache if needed
    if _expression_cache is None:
        _expression_cache = load_expression_cache()
    
    # Get data from cache
    gene_upper = gene_symbol.upper()
    all_expr_data = _expression_cache.get(gene_upper, [])
    
    # Filter for only Brain, Heart, Liver and aggregate
    tissues_of_interest = ['Brain', 'Heart', 'Liver']
    expr_data = []
    
    for target_tissue in tissues_of_interest:
        # Find matching tissues and calculate average
        matching_values = []
        for item in all_expr_data:
            if target_tissue.lower() in item['tissue'].lower():
                matching_values.append(item['tpm'])
        
        # Calculate mean TPM value
        if matching_values:
            mean_tpm = sum(matching_values) / len(matching_values)
        else:
            mean_tpm = 0.0
        
        # Apply log scale if requested
        if log_scale:
            mean_tpm = np.log10(mean_tpm + 1)
        
        expr_data.append({
            'symbol': gene_symbol,
            'tissue': target_tissue,
            'tpm': mean_tpm
        })
    
    # Create plot
    plot_data = create_expression_plot(expr_data, gene_symbol, log_scale)
    
    return {
        'expression_data': expr_data,
        'plot_data': plot_data
    }


def load_expression_cache():
    """Load and cache expression data for fast access"""
    cache_key = 'expression_data_cache'
    cached_data = cache.get(cache_key)
    
    if cached_data:
        return cached_data
    
    # Load expression data
    expression_file = settings.BASE_DIR.parent.parent / 'data' / 'expression_tpm.tsv'
    expression_cache = {}
    
    try:
        # Load data efficiently
        df = pd.read_csv(expression_file, sep='\t', low_memory=False)
        
        # Process based on format
        if 'tissue' in df.columns and 'tpm' in df.columns:
            # Long format - already correct
            for _, row in df.iterrows():
                gene = row['symbol'].upper()
                if gene not in expression_cache:
                    expression_cache[gene] = []
                expression_cache[gene].append({
                    'symbol': row['symbol'],
                    'tissue': row['tissue'],
                    'tpm': float(row['tpm'])
                })
        else:
            # Wide format - convert to long format with all tissue data
            symbol_col = None
            for col in ['symbol', 'gene', 'Gene', 'SYMBOL']:
                if col in df.columns:
                    symbol_col = col
                    break
            
            if symbol_col:
                # Process each gene
                for _, row in df.iterrows():
                    gene = str(row[symbol_col]).upper()
                    if gene not in expression_cache:
                        expression_cache[gene] = []
                    
                    # Add all tissue data
                    for col in df.columns:
                        if col == symbol_col:
                            continue
                        try:
                            value = float(row[col])
                            if not pd.isna(value):
                                expression_cache[gene].append({
                                    'symbol': row[symbol_col],
                                    'tissue': col,
                                    'tpm': value
                                })
                        except (ValueError, TypeError):
                            continue
    
    except Exception as e:
        print(f"Error loading expression data: {e}")
        # Return empty cache on error
        expression_cache = {}
    
    # Cache for 1 hour
    cache.set(cache_key, expression_cache, 3600)
    return expression_cache


def get_database_path():
    """Get the path to the regland database"""
    return settings.DATABASES['default']['NAME']


def get_gene_region(gene_symbol, species_id, tss_kb):
    """Get gene information and calculate region around TSS"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT gene_id, symbol, chrom, start, end
            FROM genes
            WHERE UPPER(symbol) = %s AND species_id = %s
            LIMIT 1
        """, [gene_symbol.upper(), species_id])
        
        row = cursor.fetchone()
        if not row:
            return None
        
        gene_id, symbol, chrom, start, end = row
        tss = start  # TSS is the start position
        half_window = tss_kb * 1000
        
        return {
            'gene_id': gene_id,
            'symbol': symbol,
            'chrom': chrom,
            'start': max(0, tss - half_window),
            'end': tss + half_window,
            'tss': tss,
            'gene_start': start,
            'gene_end': end
        }


def get_enhancers_in_region(species_id, chrom, start, end, tissue, enhancer_classes):
    """Get enhancers in the specified region with optimizations"""
    class_placeholders = ','.join(['%s' for _ in enhancer_classes])
    
    with connection.cursor() as cursor:
        # Optimized query with LIMIT for performance
        base_query = """
            SELECT e.enh_id, e.chrom, e.start, e.end, e.tissue, e.score, e.source,
                   COALESCE(ec.class, 'unlabeled') as class
            FROM enhancers_all e
            LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
            WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
        """
        
        params = [species_id, chrom, end, start]
        
        # Add tissue filter if tissue is specified and not 'Other'
        if tissue != 'Other':
            base_query += " AND (COALESCE(e.tissue, 'Other') = %s OR %s = 'Other')"
            params.extend([tissue, tissue])
        
        # Add class filter
        if enhancer_classes:
            base_query += f" AND COALESCE(ec.class, 'unlabeled') IN ({class_placeholders})"
            params.extend(enhancer_classes)
        
        # Add limit for performance
        base_query += " ORDER BY e.start LIMIT 1000"
        
        cursor.execute(base_query, params)
        columns = [col[0] for col in cursor.description]
        enhancers = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return enhancers


def get_gwas_snps_in_region(gene_id, chrom, start, end):
    """Get GWAS SNPs linked to enhancers in the region with optimizations"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT s.snp_id, s.rsid, s.chrom, s.pos, s.trait, s.pval, s.category
            FROM gwas_snps s
            JOIN snp_to_enhancer se ON se.snp_id = s.snp_id
            JOIN enhancers_all e ON e.enh_id = se.enh_id
            JOIN gene_to_enhancer ge ON ge.enh_id = e.enh_id
            WHERE ge.gene_id = %s AND s.chrom = %s AND s.pos BETWEEN %s AND %s
            ORDER BY COALESCE(s.pval, 1e99) ASC, s.rsid ASC
            LIMIT 200
        """, [gene_id, chrom, start, end])
        
        columns = [col[0] for col in cursor.description]
        snps = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return snps


def get_ctcf_sites_in_region(species_id, chrom, start, end, cons_classes=None):
    """Get CTCF sites in the specified region"""
    with connection.cursor() as cursor:
        base_query = """
            SELECT site_id, chrom, start, end, score, motif_p, 
                   COALESCE(cons_class, 'other') as cons_class
            FROM ctcf_sites
            WHERE species_id = %s AND chrom = %s AND start < %s AND end > %s
        """
        params = [species_id, chrom, end, start]
        
        if cons_classes:
            placeholders = ','.join(['%s' for _ in cons_classes])
            base_query += f" AND COALESCE(cons_class, 'other') IN ({placeholders})"
            params.extend(cons_classes)
        
        cursor.execute(base_query, params)
        columns = [col[0] for col in cursor.description]
        ctcf_sites = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return ctcf_sites


def create_conservation_heatmap(species_id, chrom, start, end, tissue, enhancer_classes, nbins, normalize_rows, gene_data=None):
    """Create conservation matrix heatmap data"""
    # Get enhancers in region
    enhancers = get_enhancers_in_region(species_id, chrom, start, end, tissue, enhancer_classes)
    
    if not enhancers:
        return {
            'bins': [],
            'classes': enhancer_classes,
            'matrix': [],
            'region_start': start,
            'region_end': end,
            'nbins': nbins
        }
    
    # Create bins
    bin_width = (end - start) / nbins
    bins = []
    for i in range(nbins):
        bin_start = start + i * bin_width
        bin_end = start + (i + 1) * bin_width
        bins.append({
            'bin': i + 1,
            'start': bin_start,
            'end': bin_end,
            'center': (bin_start + bin_end) / 2
        })
    
    # Count enhancers per bin and class
    matrix = []
    for class_name in enhancer_classes:
        row = []
        for bin_data in bins:
            count = 0
            for enh in enhancers:
                if (enh['class'] == class_name and 
                    enh['end'] > bin_data['start'] and 
                    enh['start'] < bin_data['end']):
                    count += 1
            row.append(count)
        matrix.append(row)
    
    # Normalize rows if requested
    if normalize_rows:
        normalized_matrix = []
        for row in matrix:
            max_val = max(row) if row else 1
            normalized_row = [val / max_val if max_val > 0 else 0 for val in row]
            normalized_matrix.append(normalized_row)
        matrix = normalized_matrix
    
    return {
        'bins': bins,
        'classes': enhancer_classes,
        'matrix': matrix,
        'region_start': start,
        'region_end': end,
        'nbins': nbins,
        'normalized': normalize_rows,
        'tss_position': gene_data['tss'] if gene_data else None
    }


def create_genome_tracks_plot(gene_data, species_id, tissue, enhancer_classes, stack_tracks, show_gene, show_snps):
    """Create genome tracks plot data using Plotly"""
    # Get data for the region
    enhancers = get_enhancers_in_region(
        species_id, gene_data['chrom'], 
        gene_data['start'], gene_data['end'],
        tissue, enhancer_classes
    )
    
    snps = []
    if show_snps:
        snps = get_gwas_snps_in_region(
            gene_data['gene_id'], gene_data['chrom'],
            gene_data['start'], gene_data['end']
        )
    
    # Color palette
    colors = {
        'conserved': '#31c06a',
        'gained': '#ffcf33', 
        'lost': '#8f9aa7',
        'unlabeled': '#4ea4ff'
    }
    
    # Create plot data
    fig = go.Figure()
    
    # Add enhancer tracks
    if stack_tracks:
        # Stack enhancers by class
        y_positions = {'conserved': 0.75, 'gained': 0.6, 'lost': 0.45, 'unlabeled': 0.3}
        for enh in enhancers:
            class_name = enh['class']
            y_pos = y_positions.get(class_name, 0.3)
            fig.add_shape(
                type="rect",
                x0=max(enh['start'], gene_data['start']),
                x1=min(enh['end'], gene_data['end']),
                y0=y_pos - 0.08,
                y1=y_pos + 0.08,
                fillcolor=colors.get(class_name, '#4ea4ff'),
                line=dict(width=0),
                name=class_name
            )
    else:
        # Single track for all enhancers
        for enh in enhancers:
            fig.add_shape(
                type="rect",
                x0=max(enh['start'], gene_data['start']),
                x1=min(enh['end'], gene_data['end']),
                y0=0.6,
                y1=0.8,
                fillcolor=colors.get(enh['class'], '#4ea4ff'),
                line=dict(width=0)
            )
    
    # Add gene body if requested
    if show_gene:
        fig.add_shape(
            type="rect",
            x0=max(gene_data['gene_start'], gene_data['start']),
            x1=min(gene_data['gene_end'], gene_data['end']),
            y0=0.1,
            y1=0.16,
            fillcolor='#c7d0da',
            line=dict(width=0)
        )
    
    # Add TSS marker
    fig.add_shape(
        type="line",
        x0=gene_data['tss'],
        x1=gene_data['tss'],
        y0=0.16,
        y1=0.92,
        line=dict(color='#e8590c', width=2, dash='dash')
    )
    
    # Add TSS label
    fig.add_annotation(
        x=gene_data['tss'],
        y=0.93,
        text="TSS",
        showarrow=False,
        font=dict(color='#e8590c', size=12)
    )
    
    # Add GWAS SNPs if requested
    if show_snps and snps:
        for snp in snps:
            mlog10p = -np.log10(snp['pval']) if snp['pval'] and snp['pval'] > 0 else 0
            height = min(0.90 + (mlog10p / 35), 0.98)
            
            # Add SNP line
            fig.add_shape(
                type="line",
                x0=snp['pos'],
                x1=snp['pos'],
                y0=0.90,
                y1=height,
                line=dict(color='#212529', width=2)
            )
            
            # Add SNP point
            fig.add_scatter(
                x=[snp['pos']],
                y=[height],
                mode='markers',
                marker=dict(color='#212529', size=6),
                name=snp['rsid'] or f"SNP_{snp['pos']}",
                showlegend=False
            )
    
    # Update layout
    fig.update_layout(
        xaxis=dict(
            range=[gene_data['start'], gene_data['end']],
            title='Genomic Position (Mb)',
            tickformat='.1f',
            ticksuffix=' Mb'
        ),
        yaxis=dict(
            range=[0.08, 1.02],
            showticklabels=False
        ),
        height=400,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=True,
        title=f"Genome Tracks - {gene_data['symbol']} ({gene_data['chrom']}:{gene_data['start']:,}-{gene_data['end']:,})"
    )
    
    # Convert to JSON
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {
        'plot_data': plot_json,
        'enhancer_count': len(enhancers),
        'snp_count': len(snps)
    }


def get_expression_data(gene_symbol, log_scale=False):
    """Get expression data for a gene from the TSV file"""
    # Path to expression file
    expression_file = settings.BASE_DIR.parent.parent / 'data' / 'expression_tpm.tsv'
    
    try:
        # Try to read a subset first to check format
        df = pd.read_csv(expression_file, sep='\t', nrows=5)
        
        # Check if data is in wide format (tissues as columns) or long format
        if 'tissue' in df.columns and 'tpm' in df.columns:
            # Long format
            full_df = pd.read_csv(expression_file, sep='\t')
            gene_data = full_df[full_df['symbol'].str.upper() == gene_symbol.upper()]
        else:
            # Wide format - need to melt
            full_df = pd.read_csv(expression_file, sep='\t')
            # Find symbol column
            symbol_col = None
            for col in ['symbol', 'gene', 'Gene', 'SYMBOL']:
                if col in full_df.columns:
                    symbol_col = col
                    break
            
            if not symbol_col:
                return []
            
            # Melt to long format
            melted_df = pd.melt(full_df, id_vars=[symbol_col], var_name='tissue', value_name='tpm')
            melted_df = melted_df.rename(columns={symbol_col: 'symbol'})
            
            # Map tissue names to standard categories
            def categorize_tissue(tissue_name):
                tissue_lower = tissue_name.lower()
                if any(keyword in tissue_lower for keyword in ['brain', 'cortex', 'cereb', 'hippo', 'amyg', 'putamen', 'nucleus_acc', 'caudate']):
                    return 'Brain'
                elif any(keyword in tissue_lower for keyword in ['heart', 'atrial', 'ventricle', 'cardiac', 'aorta']):
                    return 'Heart'
                elif 'liver' in tissue_lower:
                    return 'Liver'
                else:
                    return None
            
            melted_df['tissue_category'] = melted_df['tissue'].apply(categorize_tissue)
            melted_df = melted_df.dropna(subset=['tissue_category'])
            
            # Group by gene and tissue category, taking mean
            gene_data = melted_df[melted_df['symbol'].str.upper() == gene_symbol.upper()]
            gene_data = gene_data.groupby(['symbol', 'tissue_category'])['tpm'].mean().reset_index()
            gene_data = gene_data.rename(columns={'tissue_category': 'tissue'})
        
        # Filter for Brain, Heart, Liver only
        tissues_of_interest = ['Brain', 'Heart', 'Liver']
        
        # Create complete dataset with zeros for missing tissues
        result = []
        for tissue in tissues_of_interest:
            tissue_data = gene_data[gene_data['tissue'] == tissue]
            if not tissue_data.empty:
                tpm_value = float(tissue_data['tpm'].iloc[0])
            else:
                tpm_value = 0.0
            
            if log_scale:
                tpm_value = np.log10(tpm_value + 1)
            
            result.append({
                'symbol': gene_symbol,
                'tissue': tissue,
                'tpm': tpm_value
            })
        
        return result
        
    except Exception as e:
        # Return zeros if file not found or error
        tissues = ['Brain', 'Heart', 'Liver']
        return [{'symbol': gene_symbol, 'tissue': tissue, 'tpm': 0.0} for tissue in tissues]


def create_expression_plot(expression_data, gene_symbol, log_scale):
    """Create expression bar plot using Plotly"""
    if not expression_data:
        return {'plot_data': None, 'error': 'No expression data available'}
    
    # Create DataFrame
    df = pd.DataFrame(expression_data)
    
    # Create bar plot
    fig = px.bar(
        df, 
        x='tissue', 
        y='tpm',
        title=f'Expression - {gene_symbol}',
        labels={
            'tpm': 'log10(TPM+1)' if log_scale else 'TPM (GTEx v10 median)',
            'tissue': 'Tissue'
        }
    )
    
    # Add value labels on bars
    for i, row in df.iterrows():
        fig.add_annotation(
            x=row['tissue'],
            y=row['tpm'] + (max(df['tpm']) * 0.02),
            text=f"{row['tpm']:.2f}",
            showarrow=False,
            font=dict(size=10)
        )
    
    # Update layout
    fig.update_layout(
        height=350,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False
    )
    
    # Convert to JSON
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {'plot_data': plot_json}


def get_ucsc_url(species_id, chrom, start, end):
    """Generate UCSC Genome Browser URL"""
    ucsc_db_map = {
        'human_hg38': 'hg38',
        'mouse_mm39': 'mm39',
        'macaque_rheMac10': 'rheMac10',
        'chicken_galGal6': 'galGal6',
        'pig_susScr11': 'susScr11'
    }
    
    db = ucsc_db_map.get(species_id)
    if not db:
        return None
    
    position = f"{chrom}:{start:,}-{end:,}"
    return f"https://genome.ucsc.edu/cgi-bin/hgTracks?db={db}&position={position}"