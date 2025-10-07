import json
import os
import sqlite3
from django.db import connection
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
import matplotlib
matplotlib.use('Agg')  # Use non-interactive backend
import matplotlib.pyplot as plt
import io
import base64
import plotly.graph_objects as go
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

from .models import Gene, Enhancer, EnhancerClass, GWASSnp, CTCFSite, TADDomain
from .utils import (
    get_gene_region,
    get_enhancers_in_region,
    get_gwas_snps_in_region,
    get_ctcf_sites_in_region,
    create_genome_tracks_plot,
    create_conservation_heatmap,
    get_expression_data,
    create_expression_plot,
    get_ucsc_url,
    get_enhancers_in_region_optimized,
    get_gwas_snps_in_region_optimized,
    get_ctcf_sites_in_region_optimized,
    create_genome_tracks_plot_optimized,
    create_conservation_heatmap_optimized,
    # Enhanced database functions
    get_enhancers_in_region_enhanced,
    get_gwas_snps_with_enhanced_mapping,
    get_tissue_coverage_stats
)


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
        
        # Add quality indicators using enhanced views
        with connection.cursor() as cursor:
            tissue_stats = get_tissue_coverage_stats(cursor, species_id)
            current_tissue_quality = next((t for t in tissue_stats if t['tissue'] == tissue), None)
        
        return Response({
            'regionData': region_results['region_data'],
            'matrixData': region_results['matrix_data'],
            'tracksData': region_results['tracks_data'],
            'exprData': region_results['expr_data'],
            'qualityInfo': {
                'database_version': 'enhanced_v2',
                'tissue_quality': current_tissue_quality,
                'quality_warning': current_tissue_quality['coverage_level'] in ['critical', 'low'] if current_tissue_quality else False
            }
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def gene_search(request):
    """Search for genes by symbol"""
    query = request.GET.get('q', '').upper()
    species_id = request.GET.get('species', 'human_hg38')
    
    if not query:
        return Response({'genes': []})
    
    # Get genes matching the query - prioritize exact matches
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
        
        # Use enhanced single-connection approach with quality indicators
        with connection.cursor() as cursor:
            # Get enhancers in region using enhanced views
            enhancers = get_enhancers_in_region_enhanced(
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
def conservation_matrix(request):
    """Generate conservation matrix data"""
    gene_symbol = request.GET.get('gene', 'BDNF').upper()
    species_id = request.GET.get('species', 'human_hg38')
    tissue = request.GET.get('tissue', 'Liver')
    tss_kb = int(request.GET.get('tss_kb', 100))
    nbins = int(request.GET.get('nbins', 30))
    enhancer_classes = request.GET.getlist('classes[]') or ['conserved', 'gained', 'lost', 'unlabeled']
    normalize_rows = request.GET.get('norm_rows', 'false').lower() == 'true'
    
    try:
        # Get gene region
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Generate conservation matrix data
        matrix_data = create_conservation_heatmap(
            species_id, gene_data['chrom'], gene_data['start'], gene_data['end'],
            tissue, enhancer_classes, nbins, normalize_rows, gene_data
        )
        
        return Response(matrix_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def genome_tracks_plot(request):
    """Generate genome tracks visualization with performance optimizations"""
    gene_symbol = request.GET.get('gene', 'BDNF').upper()
    species_id = request.GET.get('species', 'human_hg38')
    tissue = request.GET.get('tissue', 'Liver')
    tss_kb = int(request.GET.get('tss_kb', 100))
    enhancer_classes = request.GET.getlist('classes[]') or ['conserved', 'gained', 'lost', 'unlabeled']
    stack_tracks = request.GET.get('stack_tracks', 'true').lower() == 'true'
    show_gene = request.GET.get('show_gene', 'true').lower() == 'true'
    show_snps = request.GET.get('show_snps', 'true').lower() == 'true'
    
    try:
        # Get gene region
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get optimized data using single connection
        with connection.cursor() as cursor:
            enhancers = get_enhancers_in_region_optimized(
                cursor, species_id, gene_data['chrom'], 
                gene_data['start'], gene_data['end'],
                tissue, enhancer_classes
            )
            
            gwas_snps = get_gwas_snps_in_region_optimized(
                cursor, gene_data['gene_id'], gene_data['chrom'],
                gene_data['start'], gene_data['end']
            )
        
        # Create optimized plot
        plot_data = create_genome_tracks_plot_optimized(
            gene_data, enhancers, gwas_snps,
            stack_tracks, show_gene, show_snps
        )
        
        return Response(plot_data)
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def expression_data(request):
    """Get expression data for a gene"""
    gene_symbol = request.GET.get('gene', 'BDNF').upper()
    log_scale = request.GET.get('log_scale', 'false').lower() == 'true'
    
    try:
        # Get expression data
        expr_data = get_expression_data(gene_symbol, log_scale)
        
        # Create expression plot
        plot_data = create_expression_plot(expr_data, gene_symbol, log_scale)
        
        return Response({
            'expression_data': expr_data,
            'plot_data': plot_data
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


@api_view(['GET'])
def species_list(request):
    """Get list of available species"""
    species = [
        {'id': 'human_hg38', 'name': 'Human (hg38)'},
        {'id': 'mouse_mm39', 'name': 'Mouse (mm39)'},
        {'id': 'macaque_rheMac10', 'name': 'Macaque (rheMac10)'},
        {'id': 'chicken_galGal6', 'name': 'Chicken (galGal6)'},
        {'id': 'pig_susScr11', 'name': 'Pig (susScr11)'}
    ]
    return Response({'species': species})


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
    """Get available GWAS categories"""
    categories = ['Alcohol', 'BMI', 'Inflammation']
    return Response({'categories': categories})


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

# =============================================================================
# ENHANCED API ENDPOINTS FOR DATABASE QUALITY INTEGRATION
# =============================================================================

@api_view(['GET'])
def data_quality_summary(request):
    """
    API endpoint providing data quality overview for the enhanced database
    """
    species_id = request.GET.get('species', 'human_hg38')
    
    try:
        with connection.cursor() as cursor:
            # Get comprehensive quality stats
            cursor.execute("""
                SELECT 
                    'enhancers_total' as metric,
                    COUNT(*) as value
                FROM enhancers_all WHERE species_id = %s
                UNION ALL
                SELECT 
                    'enhancers_with_scores',
                    COUNT(*) 
                FROM enhancers_all WHERE species_id = %s AND score IS NOT NULL
                UNION ALL
                SELECT 
                    'enhancers_high_confidence',
                    COUNT(*) 
                FROM enhancers_hiconf WHERE species_id = %s
                UNION ALL
                SELECT 
                    'gene_enhancer_mappings',
                    COUNT(*)
                FROM gene_to_enhancer_annot gea 
                JOIN genes g ON gea.gene_id = g.gene_id 
                WHERE g.species_id = %s
            """, [species_id, species_id, species_id, species_id])
            
            quality_stats = {}
            for row in cursor.fetchall():
                quality_stats[row[0]] = row[1]
                
            # Get tissue coverage using our new function
            from .utils import get_tissue_coverage_stats
            tissue_stats = get_tissue_coverage_stats(cursor, species_id)
            
        return Response({
            'species': species_id,
            'quality_stats': quality_stats,
            'tissue_coverage': tissue_stats,
            'recommendations': generate_quality_recommendations(quality_stats, tissue_stats),
            'database_version': 'enhanced_v2'  # Version indicator
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

def generate_quality_recommendations(quality_stats, tissue_stats):
    """Generate user-friendly recommendations based on data quality"""
    recommendations = []
    
    # Check score coverage
    total_enhancers = quality_stats.get('enhancers_total', 0)
    if total_enhancers > 0:
        score_coverage = quality_stats.get('enhancers_with_scores', 0) / total_enhancers
        if score_coverage < 0.7:
            recommendations.append({
                'type': 'scores',
                'message': f"Only {score_coverage:.1%} of enhancers have scores. Use high-confidence views for scored analysis.",
                'action': 'Filter to high-confidence enhancers',
                'severity': 'info'
            })
    
    # Check tissue coverage
    low_coverage_tissues = [t for t in tissue_stats if t['coverage_level'] in ['critical', 'low']]
    if low_coverage_tissues:
        tissue_names = [t['tissue'] for t in low_coverage_tissues]
        recommendations.append({
            'type': 'tissues',
            'message': f"Limited data for {', '.join(tissue_names)}. Consider alternative tissues.",
            'action': 'Use Brain or Heart for better coverage',
            'severity': 'warning'
        })
    
    # Special warning for human liver
    human_liver_issue = next((t for t in tissue_stats if t['tissue'] == 'Liver' and t['enhancer_count'] < 50), None)
    if human_liver_issue:
        recommendations.append({
            'type': 'critical_data_gap',
            'message': 'Human liver enhancer data is extremely limited. Results may not be representative.',
            'action': 'Consider using mouse liver data or alternative tissues',
            'severity': 'error'
        })
    
    return recommendations

@api_view(['GET'])  
def enhanced_tissue_info(request):
    """
    API endpoint providing enhanced tissue information with coverage stats
    """
    species_id = request.GET.get('species', 'human_hg38')
    
    try:
        with connection.cursor() as cursor:
            from .utils import get_tissue_coverage_stats
            tissue_stats = get_tissue_coverage_stats(cursor, species_id)
            
            # Add usage recommendations
            for tissue in tissue_stats:
                if tissue['coverage_level'] == 'good':
                    tissue['recommendation'] = 'Recommended for analysis'
                elif tissue['coverage_level'] == 'medium':
                    tissue['recommendation'] = 'Suitable for analysis with caution'
                elif tissue['coverage_level'] == 'low':
                    tissue['recommendation'] = 'Limited data - use with caution'
                else:  # critical
                    tissue['recommendation'] = 'Not recommended - insufficient data'
            
        return Response({
            'species': species_id,
            'tissues': tissue_stats,
            'total_tissues': len(tissue_stats)
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
