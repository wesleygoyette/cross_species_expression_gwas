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