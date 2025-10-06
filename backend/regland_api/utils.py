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
    
    # Cache the result for 15 minutes (was 5 minutes)
    cache.set(cache_key_hash, result, 900)
    
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
    query += " ORDER BY COALESCE(e.score, 0) DESC, e.start LIMIT 1000"
    
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
        LIMIT 25
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
        LIMIT 100
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


# ========================================
# CTCF & 3D Analysis Functions
# ========================================

def get_domain_region(gene_data, link_mode, tss_kb_ctcf, domain_snap_tss, species_id):
    """Get the domain region based on link mode"""
    if link_mode == 'tss':
        # TSS window mode
        half_window = tss_kb_ctcf * 1000
        tss = gene_data['tss']
        return {
            'gene_id': gene_data['gene_id'],
            'chrom': gene_data['chrom'],
            'start': max(0, tss - half_window),
            'end': tss + half_window,
            'tss': tss
        }
    
    elif link_mode == 'ctcf':
        # CTCF-bounded domain mode
        tss = gene_data['tss']
        chrom = gene_data['chrom']
        
        # Find TAD domain containing the TSS
        with connection.cursor() as cursor:
            cursor.execute("""
                SELECT * FROM tad_domains
                WHERE species_id = %s AND chrom = %s AND start < %s AND end > %s
                ORDER BY (end - start) ASC
                LIMIT 1
            """, [species_id, chrom, tss, tss])
            
            tad = cursor.fetchone()
            
            if domain_snap_tss and tad:
                # Use TAD domain boundaries
                columns = [col[0] for col in cursor.description]
                tad_dict = dict(zip(columns, tad))
                return {
                    'gene_id': gene_data['gene_id'],
                    'chrom': gene_data['chrom'],
                    'start': tad_dict['start'],
                    'end': tad_dict['end'],
                    'tss': tss
                }
            else:
                # Fall back to original gene region
                return gene_data
    
    return gene_data


def get_ctcf_data_in_region(species_id, chrom, start, end, cons_groups):
    """Get CTCF sites in region with conservation filtering"""
    # Since conservation class data might be missing, we'll use all CTCF sites
    # and assign a default conservation class
    
    with connection.cursor() as cursor:
        query = """
            SELECT site_id, chrom, start, end, score, motif_p, 
                   COALESCE(NULLIF(cons_class, ''), 'unknown') as cons_class
            FROM ctcf_sites
            WHERE species_id = %s AND chrom = %s AND start < %s AND end > %s
            ORDER BY score DESC
            LIMIT 500
        """
        
        params = [species_id, chrom, end, start]
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        ctcf_sites = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    # Filter by conservation groups if conservation data exists
    if cons_groups and ctcf_sites:
        # Check if we have any real conservation data
        has_cons_data = any(site.get('cons_class') not in [None, '', 'unknown'] 
                           for site in ctcf_sites)
        
        if has_cons_data:
            # Filter by selected conservation groups
            ctcf_sites = [site for site in ctcf_sites 
                         if site.get('cons_class', 'unknown') in cons_groups]
        else:
            # No conservation data available, use all sites but assign default class
            for site in ctcf_sites:
                site['cons_class'] = 'unknown'
    
    return ctcf_sites


def get_enhancers_in_domain(species_id, chrom, start, end, enh_cons_groups):
    """Get enhancers in domain region with conservation filtering"""
    if not enh_cons_groups:
        return []
    
    cons_placeholders = ','.join(['%s' for _ in enh_cons_groups])
    
    with connection.cursor() as cursor:
        query = f"""
            SELECT e.enh_id, e.chrom, e.start, e.end, e.score, e.tissue,
                   COALESCE(ec.class, 'unlabeled') as class
            FROM enhancers_all e
            LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
            WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
              AND COALESCE(ec.class, 'unlabeled') IN ({cons_placeholders})
            ORDER BY e.start
            LIMIT 500
        """
        
        params = [species_id, chrom, end, start] + enh_cons_groups
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        enhancers = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return enhancers


def get_gwas_in_enhancers_domain(species_id, chrom, start, end):
    """Get GWAS SNPs in enhancers within domain"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT s.rsid, s.trait, s.pval, s.chrom, s.pos, s.category
            FROM gwas_snps s
            JOIN snp_to_enhancer se ON se.snp_id = s.snp_id
            JOIN enhancers_all e ON e.enh_id = se.enh_id
            WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
            ORDER BY COALESCE(s.pval, 1e99) ASC
            LIMIT 200
        """, [species_id, chrom, end, start])
        
        columns = [col[0] for col in cursor.description]
        gwas_snps = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return gwas_snps


def create_ctcf_tracks_plot(domain_region, enhancers, ctcf_sites):
    """Create CTCF tracks visualization similar to R version"""
    try:
        fig = go.Figure()
        
        xmin = domain_region['start']
        xmax = domain_region['end']
        tss = domain_region['tss']
        
        # Color palettes
        enh_colors = {
            'conserved': '#31c06a',
            'gained': '#ffcf33',
            'lost': '#8f9aa7',
            'unlabeled': '#4ea4ff'
        }
        
        ctcf_colors = {
            'conserved': '#1f77b4',
            'human_specific': '#d62728',
            'unknown': '#7f7f7f',
            'other': '#7f7f7f'
        }
        
        # Background region
        fig.add_shape(
            type="rect",
            x0=xmin, y0=0.58, x1=xmax, y1=0.62,
            fillcolor="#e1e6ec",
            line={"width": 0}
        )
        
        # Add enhancers
        for i, enh in enumerate(enhancers):
            enh_start = max(enh['start'], xmin)
            enh_end = min(enh['end'], xmax)
            
            # Make thin enhancers more visible
            pad = max(50, (xmax - xmin) * 0.0002)
            if (enh_end - enh_start) < (2 * pad):
                mid = (enh_start + enh_end) / 2
                enh_start = max(xmin, mid - pad)
                enh_end = min(xmax, mid + pad)
            
            color = enh_colors.get(enh.get('class', 'unlabeled'), enh_colors['unlabeled'])
            
            fig.add_shape(
                type="rect",
                x0=enh_start, y0=0.64, x1=enh_end, y1=0.80,
                fillcolor=color,
                line={"color": "#26303a", "width": 0.15}
            )
            
            # Add enhancer to legend (only once per class)
            if i == 0 or enh.get('class') != enhancers[i-1].get('class'):
                fig.add_trace(go.Scatter(
                    x=[None], y=[None],
                    mode='markers',
                    marker=dict(color=color, size=10, symbol='square'),
                    name=f"Enhancer: {enh.get('class', 'unlabeled')}",
                    showlegend=True
                ))
        
        # Add CTCF sites
        for i, ctcf in enumerate(ctcf_sites):
            mid = (ctcf['start'] + ctcf['end']) / 2
            color = ctcf_colors.get(ctcf.get('cons_class', 'unknown'), ctcf_colors['unknown'])
            
            fig.add_shape(
                type="line",
                x0=mid, y0=0.44, x1=mid, y1=0.58,
                line={"color": color, "width": 2}
            )
            
            # Add CTCF to legend (only once per class)
            if i == 0 or ctcf.get('cons_class') != ctcf_sites[i-1].get('cons_class'):
                fig.add_trace(go.Scatter(
                    x=[None], y=[None],
                    mode='markers',
                    marker=dict(color=color, size=10, symbol='line-ns'),
                    name=f"CTCF: {ctcf.get('cons_class', 'unknown')}",
                    showlegend=True
                ))
        
        # Add TSS marker
        fig.add_shape(
            type="line",
            x0=tss, y0=0.82, x1=tss, y1=0.90,
            line={"color": "#e8590c", "width": 2, "dash": "dash"}
        )
        
        # Add TSS label
        fig.add_annotation(
            x=tss, y=0.91,
            text="TSS",
            showarrow=False,
            font=dict(color="#e8590c", size=12),
            yanchor="bottom"
        )
        
        # Update layout
        fig.update_layout(
            xaxis=dict(
                range=[xmin, xmax],
                tickformat=".1f",
                title="Position (Mb)",
                ticksuffix=" Mb",
                tickvals=np.linspace(xmin, xmax, 5),
                ticktext=[f"{x/1e6:.1f}" for x in np.linspace(xmin, xmax, 5)]
            ),
            yaxis=dict(
                range=[0.40, 0.94],
                showticklabels=False,
                showgrid=False
            ),
            height=340,
            margin=dict(l=50, r=50, t=30, b=50),
            legend=dict(
                orientation="h",
                yanchor="bottom",
                y=-0.2,
                xanchor="center",
                x=0.5
            ),
            plot_bgcolor="white"
        )
        
        # Convert to JSON
        plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
        
        return {'plot_data': plot_json}
        
    except Exception as e:
        # Log the error and return a simple fallback plot
        print(f"Error creating CTCF tracks plot: {str(e)}")
        
        # Return a simple fallback plot
        fig = go.Figure()
        fig.add_annotation(
            x=0.5, y=0.5,
            text=f"Error generating plot: {str(e)[:100]}...",
            showarrow=False,
            xref="paper", yref="paper",
            font=dict(size=14)
        )
        fig.update_layout(
            xaxis=dict(visible=False),
            yaxis=dict(visible=False),
            height=300,
            margin=dict(l=50, r=50, t=50, b=50)
        )
        
        plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
        return {'plot_data': plot_json}
def create_ctcf_distance_plot(enhancers, ctcf_sites, domain_region, dist_cap_kb):
    """Create distance to nearest CTCF plot"""
    if not enhancers or not ctcf_sites:
        return create_empty_plot("No enhancers or CTCF sites found")
    
    # Calculate enhancer midpoints
    for enh in enhancers:
        enh['mid'] = (max(enh['start'], domain_region['start']) + 
                     min(enh['end'], domain_region['end'])) / 2
    
    # Calculate CTCF midpoints
    for ctcf in ctcf_sites:
        ctcf['mid'] = (ctcf['start'] + ctcf['end']) / 2
    
    # Find nearest CTCF for each enhancer
    distances = []
    for enh in enhancers:
        min_dist = float('inf')
        nearest_ctcf_class = None
        
        for ctcf in ctcf_sites:
            if enh['chrom'] == ctcf['chrom']:  # Same chromosome
                dist = abs(enh['mid'] - ctcf['mid'])
                if dist < min_dist:
                    min_dist = dist
                    nearest_ctcf_class = ctcf.get('cons_class', 'unknown')
        
        if min_dist != float('inf'):
            distances.append({
                'class': enh.get('class', 'unlabeled'),
                'cons_class': nearest_ctcf_class,
                'dist_kb': min(min_dist / 1000, dist_cap_kb)
            })
    
    if not distances:
        return create_empty_plot("No valid distances calculated")
    
    # Create violin/box plots
    fig = go.Figure()
    
    # Group data by enhancer class
    df = pd.DataFrame(distances)
    
    for enh_class in df['class'].unique():
        if pd.isna(enh_class):
            continue
        
        class_data = df[df['class'] == enh_class]['dist_kb']
        
        if len(class_data) > 0:
            # Use box plot since violin plots need more data points
            fig.add_trace(go.Box(
                y=class_data,
                name=enh_class,
                boxpoints='outliers',
                jitter=0.3,
                pointpos=-1.8
            ))
    
    # Update layout
    fig.update_layout(
        title="Distance to Nearest CTCF by Enhancer Class",
        xaxis_title="Enhancer Class",
        yaxis_title=f"Distance (kb, capped at {dist_cap_kb})",
        height=380,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False
    )
    
    # Convert to JSON
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {'plot_data': plot_json}


def create_enhancers_per_domain_plot(enhancers):
    """Create enhancers per domain plot"""
    if not enhancers:
        return create_empty_plot("No enhancers found in this region")
    
    # Count enhancers by class
    df = pd.DataFrame(enhancers)
    counts = df['class'].value_counts().reset_index()
    counts.columns = ['class', 'count']
    
    # Create bar plot
    fig = go.Figure(data=[
        go.Bar(
            x=counts['class'],
            y=counts['count'],
            text=counts['count'],
            textposition='outside',
            marker_color=['#31c06a' if x == 'conserved' else
                         '#ffcf33' if x == 'gained' else
                         '#8f9aa7' if x == 'lost' else
                         '#4ea4ff' for x in counts['class']]
        )
    ])
    
    fig.update_layout(
        title="Enhancers per Region by Class",
        xaxis_title="Enhancer Class",
        yaxis_title="# Enhancers in region",
        height=380,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False
    )
    
    # Convert to JSON
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {'plot_data': plot_json}


def create_expression_association_plot(enhancers, gene_symbol):
    """Create conserved enhancers vs RNA expression plot"""
    # Count conserved enhancers
    conserved_count = sum(1 for enh in enhancers if enh.get('class') == 'conserved')
    
    # Get expression data (simplified - would need actual expression data)
    try:
        expr_result = get_expression_data_cached(gene_symbol, log_scale=False)
        expr_data = expr_result['expression_data']
        
        # Calculate mean TPM across tissues
        total_tpm = sum(item['tpm'] for item in expr_data)
        mean_tpm = total_tpm / len(expr_data) if expr_data else 0
    except:
        mean_tpm = 0
    
    # Create scatter plot
    fig = go.Figure(data=go.Scatter(
        x=[conserved_count],
        y=[mean_tpm],
        mode='markers',
        marker=dict(size=10, color='blue'),
        name=gene_symbol
    ))
    
    fig.update_layout(
        title=f"Conserved Enhancers vs Expression - {gene_symbol}",
        xaxis_title="# conserved enhancers in region",
        yaxis_title="Mean TPM",
        height=380,
        margin=dict(l=50, r=50, t=50, b=50),
        showlegend=False
    )
    
    # Convert to JSON
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    
    return {'plot_data': plot_json}


def create_gwas_partition_table(enhancers, gwas_snps):
    """Create GWAS over-representation analysis table"""
    if not enhancers:
        return {'table_data': []}
    
    # Create mapping of enhancer IDs with GWAS hits
    gwas_enh_ids = set()
    # This would need proper linking through snp_to_enhancer table
    # For now, simplified approach
    
    # Count enhancers by conservation and GWAS presence
    data = []
    for bucket in ['conserved', 'non_conserved']:
        if bucket == 'conserved':
            bucket_enhancers = [e for e in enhancers if e.get('class') == 'conserved']
        else:
            bucket_enhancers = [e for e in enhancers if e.get('class') != 'conserved']
        
        total = len(bucket_enhancers)
        with_gwas = 0  # Simplified - would need proper calculation
        no_gwas = total - with_gwas
        prop = with_gwas / total if total > 0 else 0
        
        data.append({
            'bucket': bucket,
            'total': total,
            'with_gwas': with_gwas,
            'prop': round(prop, 3),
            'odds_ratio': None if bucket != 'conserved' else 1.0,  # Simplified
            'p_value': None if bucket != 'conserved' else 0.5  # Simplified
        })
    
    return {'table_data': data}


def create_ctcf_sites_table(ctcf_sites):
    """Create table of top CTCF sites"""
    if not ctcf_sites:
        return {'table_data': []}
    
    # Sort by score (descending) and take top sites
    sorted_sites = sorted(ctcf_sites, key=lambda x: x.get('score', 0), reverse=True)[:10]
    
    table_data = []
    for site in sorted_sites:
        mid = round((site['start'] + site['end']) / 2)
        width = site['end'] - site['start']
        
        table_data.append({
            'cons_class': site.get('cons_class', 'other'),
            'score': round(site.get('score', 0), 3),
            'chrom': site['chrom'],
            'start': site['start'],
            'end': site['end'],
            'width': width,
            'mid': mid
        })
    
    return {'table_data': table_data}


def create_empty_plot(message):
    """Create empty plot with message"""
    fig = go.Figure()
    
    fig.add_annotation(
        x=0.5, y=0.5,
        text=message,
        showarrow=False,
        font=dict(size=14, color="gray"),
        xref="paper", yref="paper"
    )
    
    fig.update_layout(
        xaxis=dict(visible=False),
        yaxis=dict(visible=False),
        height=380,
        margin=dict(l=20, r=20, t=20, b=20)
    )
    
    plot_json = json.loads(json.dumps(fig, cls=PlotlyJSONEncoder))
    return {'plot_data': plot_json}