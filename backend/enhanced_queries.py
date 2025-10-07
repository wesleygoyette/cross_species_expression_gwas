# RegLand Backend Updates: Integration with Enhanced Database Views
# This file contains improved queries that use our new database views and tables

"""
BACKEND QUERY IMPROVEMENTS FOR REGLAND
=====================================

These updates integrate our database improvements into the Django backend:

1. Use enhancers_hiconf and enhancers_tissue_any views
2. Use gene_to_enhancer_annot for better mapping data  
3. Add data quality indicators
4. Implement tissue coverage warnings

Key Changes:
- Replace direct enhancers_all queries with view-based queries
- Add quality flags to API responses
- Use computed distances from gene_to_enhancer_annot
- Add tissue availability checks
"""

# ============================================================================
# 1. ENHANCED ENHANCER QUERIES (utils.py updates)
# ============================================================================

def get_enhancers_in_region_enhanced(cursor, species_id, chrom, start, end, tissue, enhancer_classes):
    """
    Enhanced enhancer query using our high-confidence views
    Adds quality indicators and uses improved data sources
    """
    class_placeholders = ','.join(['%s' for _ in enhancer_classes])
    
    # Use high-confidence view when tissue is specified and supported
    supported_tissues = ['Brain', 'Heart', 'Liver'] 
    use_hiconf = tissue in supported_tissues
    
    if use_hiconf:
        # Query high-confidence enhancers (guaranteed to have scores)
        query = f"""
            SELECT e.enh_id, e.chrom, e.start, e.end, e.tissue, e.score, e.source,
                   COALESCE(ec.class, 'unlabeled') as class,
                   'high_confidence' as quality_flag,
                   1 as has_score
            FROM enhancers_hiconf e
            LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
            WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
              AND e.tissue = %s
        """
        params = [species_id, chrom, end, start, tissue]
    else:
        # Query tissue-flexible view with quality indicators
        query = f"""
            SELECT e.enh_id, e.chrom, e.start, e.end, e.tissue, e.score, e.source,
                   COALESCE(ec.class, 'unlabeled') as class,
                   CASE 
                     WHEN e.tissue = 'unknown' THEN 'tissue_unknown'
                     WHEN e.score IS NULL THEN 'score_missing' 
                     ELSE 'standard'
                   END as quality_flag,
                   CASE WHEN e.score IS NOT NULL THEN 1 ELSE 0 END as has_score
            FROM enhancers_tissue_any e
            LEFT JOIN enhancer_class ec ON e.enh_id = ec.enh_id
            WHERE e.species_id = %s AND e.chrom = %s AND e.start < %s AND e.end > %s
        """
        params = [species_id, chrom, end, start]
        
        if tissue != 'Other':
            query += " AND (e.tissue = %s OR %s = 'Other')"
            params.extend([tissue, tissue])
    
    if enhancer_classes:
        query += f" AND COALESCE(ec.class, 'unlabeled') IN ({class_placeholders})"
        params.extend(enhancer_classes)
    
    # Prioritize high-quality enhancers
    query += " ORDER BY has_score DESC, COALESCE(e.score, 0) DESC, e.start LIMIT 1000"
    
    cursor.execute(query, params)
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_gwas_snps_with_enhanced_mapping(cursor, gene_id, chrom, start, end):
    """
    Enhanced GWAS SNP query using gene_to_enhancer_annot for better mapping data
    Includes distance and method information
    """
    cursor.execute("""
        SELECT DISTINCT s.snp_id, s.rsid, s.chrom, s.pos, s.trait, s.pval, s.category,
               gea.method as mapping_method,
               gea.distance_bp as gene_distance,
               CASE 
                 WHEN gea.method = 'promoter' THEN 'high_confidence'
                 WHEN gea.method = 'overlap' THEN 'high_confidence'  
                 WHEN gea.method = 'nearest' THEN 'medium_confidence'
                 WHEN gea.method = 'window500k' THEN 'low_confidence'
                 ELSE 'unknown'
               END as mapping_confidence
        FROM gwas_snps s
        JOIN snp_to_enhancer se ON se.snp_id = s.snp_id
        JOIN enhancers_all e ON e.enh_id = se.enh_id
        JOIN gene_to_enhancer_annot gea ON gea.enh_id = e.enh_id
        WHERE gea.gene_id = %s AND s.chrom = %s AND s.pos BETWEEN %s AND %s
        ORDER BY 
          CASE gea.method 
            WHEN 'promoter' THEN 1 
            WHEN 'overlap' THEN 2 
            WHEN 'nearest' THEN 3 
            WHEN 'window500k' THEN 4 
            ELSE 5 
          END,
          gea.distance_bp ASC,
          COALESCE(s.pval, 1e99) ASC
        LIMIT 50
    """, [gene_id, chrom, start, end])
    
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]


def get_tissue_coverage_stats(cursor, species_id):
    """
    Get tissue coverage statistics for data quality warnings
    """
    cursor.execute("""
        SELECT tissue, COUNT(*) as enhancer_count,
               CASE 
                 WHEN COUNT(*) < 100 THEN 'critical'
                 WHEN COUNT(*) < 1000 THEN 'low' 
                 WHEN COUNT(*) < 10000 THEN 'medium'
                 ELSE 'good'
               END as coverage_level
        FROM enhancers_hiconf 
        WHERE species_id = %s
        GROUP BY tissue
        ORDER BY enhancer_count DESC
    """, [species_id])
    
    columns = [col[0] for col in cursor.description]
    return [dict(zip(columns, row)) for row in cursor.fetchall()]

# ============================================================================
# 2. ENHANCED API VIEWS (views.py updates)  
# ============================================================================

def combined_gene_data_enhanced(request):
    """
    Enhanced gene data API with quality indicators and warnings
    """
    try:
        data = request.data
        gene_symbol = data.get('gene', 'BDNF').upper()
        species_id = data.get('species', 'human_hg38')
        tissue = data.get('tissue', 'Liver')
        tss_kb = int(data.get('tss_kb', 100))
        
        # Get gene information
        gene_data = get_gene_region(gene_symbol, species_id, tss_kb)
        if not gene_data:
            return Response({'error': 'Gene not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # Get tissue coverage for warnings
        with connection.cursor() as cursor:
            tissue_stats = get_tissue_coverage_stats(cursor, species_id)
            tissue_coverage = {stat['tissue']: stat for stat in tissue_stats}
            
            # Check if requested tissue has low coverage
            current_tissue_coverage = tissue_coverage.get(tissue, {'coverage_level': 'none', 'enhancer_count': 0})
            
            # Get enhanced region data
            region_results = get_combined_region_data_enhanced(
                gene_data, species_id, tissue, data.get('classes', ['conserved', 'gained']),
                int(data.get('nbins', 30)), data.get('normalize_rows', False),
                data.get('mark_tss', True), data.get('stack_tracks', True), 
                data.get('show_gene', True), data.get('show_snps', True),
                data.get('log_expression', False)
            )
            
            # Add quality metadata
            quality_info = {
                'tissue_coverage': current_tissue_coverage,
                'available_tissues': tissue_coverage,
                'data_quality_flags': region_results.get('quality_flags', {}),
                'warnings': []
            }
            
            # Generate warnings
            if current_tissue_coverage['coverage_level'] in ['critical', 'low']:
                quality_info['warnings'].append({
                    'type': 'tissue_coverage',
                    'message': f"Limited {tissue} data available ({current_tissue_coverage['enhancer_count']} enhancers). Consider using Brain or Heart for {species_id}.",
                    'severity': 'warning'
                })
            
            if species_id == 'human_hg38' and tissue == 'Liver':
                quality_info['warnings'].append({
                    'type': 'data_scarcity', 
                    'message': 'Human liver enhancer data is very limited (9 enhancers). Results may not be representative.',
                    'severity': 'error'
                })
        
        return Response({
            'regionData': region_results['region_data'],
            'matrixData': region_results['matrix_data'], 
            'tracksData': region_results['tracks_data'],
            'exprData': region_results['expr_data'],
            'qualityInfo': quality_info  # NEW: Quality metadata for UI
        })
        
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


# ============================================================================
# 3. NEW API ENDPOINTS FOR DATA QUALITY
# ============================================================================

@api_view(['GET'])
def data_quality_summary(request):
    """
    New API endpoint providing data quality overview
    """
    species_id = request.GET.get('species', 'human_hg38')
    
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
            
        # Get tissue coverage
        tissue_stats = get_tissue_coverage_stats(cursor, species_id)
        
    return Response({
        'species': species_id,
        'quality_stats': quality_stats,
        'tissue_coverage': tissue_stats,
        'recommendations': generate_quality_recommendations(quality_stats, tissue_stats)
    })

def generate_quality_recommendations(quality_stats, tissue_stats):
    """Generate user-friendly recommendations based on data quality"""
    recommendations = []
    
    # Check score coverage
    if quality_stats.get('enhancers_total', 0) > 0:
        score_coverage = quality_stats.get('enhancers_with_scores', 0) / quality_stats['enhancers_total']
        if score_coverage < 0.7:
            recommendations.append({
                'type': 'scores',
                'message': f"Only {score_coverage:.1%} of enhancers have scores. Use high-confidence views for scored analysis.",
                'action': 'Filter to high-confidence enhancers'
            })
    
    # Check tissue coverage
    low_coverage_tissues = [t for t in tissue_stats if t['coverage_level'] in ['critical', 'low']]
    if low_coverage_tissues:
        tissue_names = [t['tissue'] for t in low_coverage_tissues]
        recommendations.append({
            'type': 'tissues',
            'message': f"Limited data for {', '.join(tissue_names)}. Consider alternative tissues.",
            'action': 'Use Brain or Heart for better coverage'
        })
    
    return recommendations