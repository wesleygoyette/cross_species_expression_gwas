from django.db import connection
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status

from .utils import (
    get_gene_region,
    get_ucsc_url,
    get_enhancers_in_region_optimized,
    get_gwas_snps_in_region_optimized,
    get_ctcf_sites_in_region_optimized
)

@api_view(['GET'])
def gene_search(request):
    """Search for genes by symbol"""
    query = request.GET.get('q', '').upper()
    species_id = request.GET.get('species', 'human_hg38')
    if not query:
        return Response({'genes': []})
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT gene_id, symbol, species_id, chrom, start, end
            FROM genes
            WHERE UPPER(symbol) LIKE %s AND species_id = %s
            ORDER BY 
                CASE WHEN UPPER(symbol) = %s THEN 1 ELSE 2 END,
                symbol
            LIMIT 10
        """, [f'%{query}%', species_id, query])
        columns = [col[0] for col in cursor.description]
        genes = [dict(zip(columns, row)) for row in cursor.fetchall()]
    return Response({'genes': genes})


@api_view(['POST'])
def combined_gene_data(request):
    """Get all gene data in a single optimized request"""
    try:
        data = request.data
        gene_symbol = data.get('gene', 'BDNF').upper()
        species_id = data.get('species', 'human_hg38')
        tissue = data.get('tissue', 'Liver')
        tss_kb = int(data.get('tss_kb', 100))
        enhancer_classes = data.get('classes', ['conserved', 'gained', 'lost', 'unlabeled'])
        nbins = int(data.get('nbins', 30))
        normalize_rows = data.get('normalize_rows', False)
        mark_tss = data.get('mark_tss', True)
        stack_tracks = data.get('stack_tracks', True)
        show_gene = data.get('show_gene', True)
        show_snps = data.get('show_snps', True)
        log_expression = data.get('log_expression', False)
        
        # Get gene information once
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get all region data in parallel using optimized queries
        from .utils import get_combined_region_data
        
        region_results = get_combined_region_data(
            gene_data, species_id, tissue, enhancer_classes,
            nbins, normalize_rows, mark_tss, stack_tracks, 
            show_gene, show_snps, log_expression
        )
        
        return Response({
            'regionData': region_results['region_data'],
            'matrixData': region_results['matrix_data'],
            'tracksData': region_results['tracks_data'],
            'exprData': region_results['expr_data']
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def gene_region_data(request):
    """Get comprehensive data for a gene region with performance optimizations"""
    gene_symbol = request.GET.get('gene', 'BDNF').upper()
    species_id = request.GET.get('species', 'human_hg38')
    tissue = request.GET.get('tissue', 'Liver')
    tss_kb = int(request.GET.get('tss_kb', 100))
    enhancer_classes = request.GET.getlist('classes[]') or ['conserved', 'gained', 'lost', 'unlabeled']
    
    try:
        # Get gene information
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Use optimized single-connection approach
        with connection.cursor() as cursor:
            # Get enhancers in region (limited for performance)
            enhancers = get_enhancers_in_region_optimized(
                cursor, species_id, gene_data['chrom'], 
                gene_data['start'], gene_data['end'],
                tissue, enhancer_classes
            )
            
            # Get GWAS SNPs (limited for performance)
            gwas_snps = get_gwas_snps_in_region_optimized(
                cursor, gene_data['gene_id'], gene_data['chrom'],
                gene_data['start'], gene_data['end']
            )
            
            # Get CTCF sites (limited for performance)
            ctcf_sites = get_ctcf_sites_in_region_optimized(
                cursor, species_id, gene_data['chrom'],
                gene_data['start'], gene_data['end']
            )
        
        return Response({
            'gene': gene_data,
            'enhancers': enhancers,
            'gwas_snps': gwas_snps,
            'ctcf_sites': ctcf_sites,
            'ucsc_url': get_ucsc_url(species_id, gene_data['chrom'], gene_data['start'], gene_data['end'])
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)








@api_view(['GET'])
def species_list(request):
    """Get list of available species from database"""
    from .models import Species
    from .serializers import SpeciesSerializer
    
    species = Species.objects.all().order_by('species_id')
    serializer = SpeciesSerializer(species, many=True)
    return Response({'species': serializer.data})


@api_view(['GET'])
def species_biotype_counts(request):
    """Get biotype counts for all species"""
    from .models import SpeciesBiotypeCount
    from .serializers import SpeciesBiotypeCountSerializer
    
    counts = SpeciesBiotypeCount.objects.all()
    serializer = SpeciesBiotypeCountSerializer(counts, many=True)
    return Response({'species_counts': serializer.data})


@api_view(['GET'])
def gene_presets(request):
    """Get gene presets for different tissues"""
    presets = {
        'brain': {
            'tissue': 'Brain',
            'genes': ['BDNF', 'SCN1A', 'GRIN2B', 'DRD2', 'APOE']
        },
        'heart': {
            'tissue': 'Heart', 
            'genes': ['TTN', 'MYH6', 'MYH7', 'PLN', 'KCNQ1']
        },
        'liver': {
            'tissue': 'Liver',
            'genes': ['ALB', 'APOB', 'CYP3A4', 'HNF4A', 'PCSK9']
        }
    }
    return Response({'presets': presets})


@api_view(['GET'])
def gwas_categories(request):
    """Get available GWAS categories with counts"""
    with connection.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT category, COUNT(*) as count
            FROM gwas_snps
            WHERE category IS NOT NULL AND category != ''
            GROUP BY category
            ORDER BY count DESC
        """)
        rows = cursor.fetchall()
        categories = [{'id': row[0], 'name': row[0], 'count': row[1]} for row in rows]
    
    return Response({'categories': categories})


@api_view(['POST'])
def gwas_traits(request):
    """Get GWAS traits with aggregated statistics, optionally filtered by search query"""
    category = request.data.get('category')
    limit = request.data.get('limit', None)  # Optional limit parameter
    search_query = request.data.get('search', '').strip()  # Search parameter for traits, genes, or SNPs
    
    with connection.cursor() as cursor:
        query = """
            SELECT 
                g.trait,
                COUNT(DISTINCT g.snp_id) as snp_count,
                COUNT(DISTINCT ge.gene_id) as gene_count,
                g.category,
                MIN(CASE WHEN g.pval IS NOT NULL AND g.pval > 0 THEN g.pval END) as min_pval
            FROM gwas_snps g
            LEFT JOIN snp_to_enhancer se ON g.snp_id = se.snp_id
            LEFT JOIN gene_to_enhancer ge ON se.enh_id = ge.enh_id
        """
        params = []
        where_clauses = ["g.trait IS NOT NULL", "g.trait != ''"]
        
        # Add search filter if provided
        if search_query:
            # Search in traits, rsids, categories, or associated genes
            query += """
                LEFT JOIN genes gn ON ge.gene_id = gn.gene_id
            """
            search_condition = """(
                LOWER(g.trait) LIKE LOWER(%s) OR 
                LOWER(g.rsid) LIKE LOWER(%s) OR 
                LOWER(g.category) LIKE LOWER(%s) OR
                LOWER(gn.symbol) LIKE LOWER(%s)
            )"""
            where_clauses.append(search_condition)
            search_pattern = f'%{search_query}%'
            params.extend([search_pattern, search_pattern, search_pattern, search_pattern])
        
        # Add category filter if provided
        if category and category != 'all':
            where_clauses.append("g.category = %s")
            params.append(category)
        
        query += " WHERE " + " AND ".join(where_clauses)
        
        query += """
            GROUP BY g.trait, g.category
            ORDER BY snp_count DESC, min_pval ASC
        """
        
        # Only add limit if specified
        if limit:
            query += " LIMIT %s"
            params.append(int(limit))
        
        cursor.execute(query, params)
        columns = [col[0] for col in cursor.description]
        traits = [dict(zip(columns, row)) for row in cursor.fetchall()]
    
    return Response({'traits': traits})


@api_view(['POST'])
def trait_snps(request):
    """Get detailed SNP information for a specific trait"""
    trait = request.data.get('trait')
    limit = request.data.get('limit')  # Optional limit, defaults to None (no limit)
    
    if not trait:
        return Response({'error': 'Trait is required'}, status=status.HTTP_400_BAD_REQUEST)
    
    with connection.cursor() as cursor:
        query = """
            SELECT DISTINCT
                g.snp_id,
                g.rsid,
                g.chrom,
                g.pos,
                g.trait,
                g.pval,
                g.category,
                g.source,
                GROUP_CONCAT(DISTINCT ge2.symbol) as associated_genes
            FROM gwas_snps g
            LEFT JOIN snp_to_enhancer se ON g.snp_id = se.snp_id
            LEFT JOIN gene_to_enhancer ge ON se.enh_id = ge.enh_id
            LEFT JOIN genes ge2 ON ge.gene_id = ge2.gene_id
            WHERE g.trait = %s
            GROUP BY g.snp_id, g.rsid, g.chrom, g.pos, g.trait, g.pval, g.category, g.source
            ORDER BY g.pval ASC
        """
        params = [trait]
        
        # Only add LIMIT if explicitly provided
        if limit is not None:
            query += " LIMIT %s"
            params.append(int(limit))
        
        cursor.execute(query, params)
        
        columns = [col[0] for col in cursor.description]
        snps = [dict(zip(columns, row)) for row in cursor.fetchall()]
        
        # Get total count
        cursor.execute("""
            SELECT COUNT(DISTINCT snp_id)
            FROM gwas_snps
            WHERE trait = %s
        """, [trait])
        total_count = cursor.fetchone()[0]
    
    return Response({'snps': snps, 'total_count': total_count})


@api_view(['POST'])
def export_data(request):
    """Export data in various formats"""
    export_type = request.data.get('type', 'csv')
    data_type = request.data.get('data_type', 'gwas')
    
    # Implementation for data export
    # This would generate CSV, PNG, or other formats based on request
    
    return Response({'message': 'Export functionality to be implemented'})


# Additional utility views for CTCF and 3D analysis
@api_view(['POST'])
def ctcf_analysis(request):
    """Perform CTCF and 3D domain analysis with enhanced error handling"""
    try:
        from .utils import (
            get_domain_region, get_ctcf_data_in_region, get_enhancers_in_domain,
            get_gwas_in_enhancers_domain, create_ctcf_tracks_plot, 
            create_ctcf_distance_plot, create_enhancers_per_domain_plot,
            create_expression_association_plot, create_gwas_partition_table,
            create_ctcf_sites_table, get_gene_region
        )
        
        data = request.data
        gene_symbol = data.get('gene')
        species_id = data.get('species', 'human_hg38')
        link_mode = data.get('link_mode', 'gene')
        tss_kb_ctcf = int(data.get('tss_kb_ctcf', 250))
        domain_snap_tss = data.get('domain_snap_tss', True)
        ctcf_cons_groups = data.get('ctcf_cons_groups', ['conserved', 'human_specific'])
        enh_cons_groups = data.get('enh_cons_groups', ['conserved', 'gained', 'lost', 'unlabeled'])
        ctcf_dist_cap_kb = int(data.get('ctcf_dist_cap_kb', 250))
        
        if not gene_symbol:
            return Response({'error': 'Gene symbol is required'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Get base gene region
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb_ctcf)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get domain region based on link mode
        domain_region = get_domain_region(
            gene_data, link_mode, tss_kb_ctcf, domain_snap_tss, species_id
        )
        
        # Get CTCF sites in domain - with size limits
        ctcf_sites = get_ctcf_data_in_region(
            species_id, domain_region['chrom'], 
            domain_region['start'], domain_region['end'],
            ctcf_cons_groups
        )[:1000]  # Limit to prevent memory issues
        
        # Get enhancers in domain - with size limits
        enhancers = get_enhancers_in_domain(
            species_id, domain_region['chrom'],
            domain_region['start'], domain_region['end'],
            enh_cons_groups
        )[:1000]  # Limit to prevent memory issues
        
        # Get GWAS SNPs in enhancers
        gwas_snps = get_gwas_in_enhancers_domain(
            species_id, domain_region['chrom'],
            domain_region['start'], domain_region['end']
        )
        
        # Create visualizations with error handling
        try:
            tracks_plot = create_ctcf_tracks_plot(domain_region, enhancers, ctcf_sites)
        except Exception as e:
            print(f"Error creating tracks plot: {e}")
            tracks_plot = {'plot_data': None, 'error': str(e)}
            
        try:
            distance_plot = create_ctcf_distance_plot(enhancers, ctcf_sites, domain_region, ctcf_dist_cap_kb)
        except Exception as e:
            print(f"Error creating distance plot: {e}")
            distance_plot = {'plot_data': None, 'error': str(e)}
            
        try:
            enhancers_plot = create_enhancers_per_domain_plot(enhancers)
        except Exception as e:
            print(f"Error creating enhancers plot: {e}")
            enhancers_plot = {'plot_data': None, 'error': str(e)}
            
        try:
            expression_plot = create_expression_association_plot(enhancers, gene_symbol)
        except Exception as e:
            print(f"Error creating expression plot: {e}")
            expression_plot = {'plot_data': None, 'error': str(e)}
            
        try:
            gwas_table = create_gwas_partition_table(enhancers, gwas_snps)
        except Exception as e:
            print(f"Error creating GWAS table: {e}")
            gwas_table = {'error': str(e)}
            
        try:
            ctcf_table = create_ctcf_sites_table(ctcf_sites)
        except Exception as e:
            print(f"Error creating CTCF table: {e}")
            ctcf_table = {'error': str(e)}
        
        return Response({
            'domain_region': domain_region,
            'ctcf_sites': ctcf_sites[:20],  # Limit for response size
            'enhancers': enhancers[:50],    # Limit for response size
            'gwas_snps': gwas_snps[:50],    # Limit for response size
            'tracks_plot': tracks_plot,
            'distance_plot': distance_plot,
            'enhancers_plot': enhancers_plot,
            'expression_plot': expression_plot,
            'gwas_table': gwas_table,
            'ctcf_table': ctcf_table,
            'stats': {
                'ctcf_count': len(ctcf_sites),
                'enhancer_count': len(enhancers),
                'gwas_snp_count': len(gwas_snps)
            }
        })
        
    except Exception as e:
        print(f"Error in CTCF analysis: {str(e)}")
        import traceback
        traceback.print_exc()
        return Response({
            'error': f'Analysis failed: {str(e)}'
        }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def health_check(request):
    """Health check endpoint with database connectivity verification"""
    try:
        # Test database connection
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
            cursor.fetchone()
        return Response({
            'status': 'healthy',
            'message': 'Regland API is running',
            'database': 'connected'
        })
    except Exception as e:
        return Response({
            'status': 'unhealthy',
            'message': 'Database connection failed',
            'error': str(e)
        }, status=status.HTTP_503_SERVICE_UNAVAILABLE)


@api_view(['GET'])
def gene_data_quality(request):
    """
    Get minimal data quality metrics for a gene (human genome only).
    Returns only what the frontend needs for display.
    
    Query params:
    - gene: Gene symbol (required)
    """
    gene_symbol = request.GET.get('gene', '').upper()
    
    if not gene_symbol:
        return Response(
            {'error': 'Gene symbol is required'}, 
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        # Always use human genome for data quality
        species_id = 'human_hg38'
        
        with connection.cursor() as cursor:
            # Get gene info
            cursor.execute("""
                SELECT gene_id
                FROM genes
                WHERE UPPER(symbol) = %s AND species_id = %s
                LIMIT 1
            """, [gene_symbol, species_id])
            
            gene_row = cursor.fetchone()
            if not gene_row:
                return Response(
                    {'error': f'Gene {gene_symbol} not found'}, 
                    status=status.HTTP_404_NOT_FOUND
                )
            
            gene_id = gene_row[0]
            
            # Get enhancer statistics for this gene (across ALL tissues)
            cursor.execute("""
                SELECT 
                    COUNT(*) as total_enhancers,
                    COUNT(e.tissue) as enhancers_with_tissue,
                    COUNT(CASE WHEN e.score IS NOT NULL AND e.score != '' THEN 1 END) as enhancers_with_score,
                    COUNT(CASE WHEN ec.class = 'conserved' THEN 1 END) as conserved_enhancers
                FROM gene_to_enhancer gte
                LEFT JOIN enhancers_all e ON gte.enh_id = e.enh_id
                LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
                WHERE gte.gene_id = %s
            """, [gene_id])
            
            stats_row = cursor.fetchone()
            total_enhancers = stats_row[0] or 0
            enhancers_with_tissue = stats_row[1] or 0
            enhancers_with_score = stats_row[2] or 0
            conserved_enhancers = stats_row[3] or 0
            
            # Calculate percentages
            tissue_percent = (enhancers_with_tissue / total_enhancers * 100) if total_enhancers > 0 else 0
            score_percent = (enhancers_with_score / total_enhancers * 100) if total_enhancers > 0 else 0
            conservation_percent = (conserved_enhancers / total_enhancers * 100) if total_enhancers > 0 else 0
            
            # Determine quality levels
            tissue_quality = 'high' if tissue_percent >= 70 else ('low' if tissue_percent >= 30 else 'none')
            score_quality = 'high' if score_percent >= 60 else ('low' if score_percent >= 20 else 'none')
            
            # Get available species for this gene
            cursor.execute("""
                SELECT DISTINCT species_id
                FROM genes
                WHERE UPPER(symbol) = %s
                ORDER BY species_id
            """, [gene_symbol])
            
            available_species = [row[0] for row in cursor.fetchall()]
        
        # Build minimal response with only what frontend needs
        response_data = {
            'tissue_availability': tissue_quality,
            'score_availability': score_quality,
            'conservation_percent': round(conservation_percent, 1),
            'available_species': available_species
        }
        
        return Response(response_data)
        
    except Exception as e:
        return Response(
            {'error': f'Failed to get data quality: {str(e)}'}, 
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

