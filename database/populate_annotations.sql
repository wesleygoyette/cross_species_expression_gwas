-- Populate gene_to_enhancer_annot with proper methodology
-- Using the original gene_to_enhancer as base and enhancing it

-- ============================================================================
-- POPULATE GENE_TO_ENHANCER_ANNOT WITH ENHANCED METHODOLOGY
-- ============================================================================

-- Clear existing (empty) table
DELETE FROM gene_to_enhancer_annot;

-- Insert enhanced annotations based on your methodology
INSERT INTO gene_to_enhancer_annot (gene_id, enh_id, method, distance_bp)
WITH e AS (
  SELECT enh_id, species_id, chrom, start, end, (start + end)/2 AS mid
  FROM enhancers_all
),
g AS (
  SELECT gene_id, species_id, chrom, start AS tss, end
  FROM genes
),
-- Get existing mappings from original table
existing AS (
  SELECT gene_id, enh_id FROM gene_to_enhancer
),

-- A) Promoter overlap (highest priority)
prom AS (
  SELECT DISTINCT ex.gene_id, ex.enh_id,
         'promoter' AS method,
         ABS(e.mid - g.tss) AS distance_bp
  FROM existing ex
  JOIN e ON ex.enh_id = e.enh_id
  JOIN g ON ex.gene_id = g.gene_id
  JOIN promoters p ON p.gene_id = g.gene_id
    AND p.species_id = e.species_id 
    AND p.chrom = e.chrom
    AND p.start <= e.end 
    AND p.end >= e.start
),

-- B) Gene body overlap (excluding promoter hits)
gb AS (
  SELECT DISTINCT ex.gene_id, ex.enh_id,
         'overlap' AS method,
         CASE
           WHEN e.mid < g.tss THEN g.tss - e.mid
           WHEN e.mid > g.end THEN e.mid - g.end
           ELSE 0
         END AS distance_bp
  FROM existing ex
  JOIN e ON ex.enh_id = e.enh_id
  JOIN g ON ex.gene_id = g.gene_id
  WHERE g.species_id = e.species_id 
    AND g.chrom = e.chrom
    AND g.start <= e.end 
    AND g.end >= e.start
    AND (ex.gene_id, ex.enh_id) NOT IN (SELECT gene_id, enh_id FROM prom)
),

-- C) Nearest TSS method (for remaining mappings)
nearest AS (
  SELECT DISTINCT ex.gene_id, ex.enh_id,
         'nearest' AS method,
         ABS(e.mid - g.tss) AS distance_bp
  FROM existing ex
  JOIN e ON ex.enh_id = e.enh_id
  JOIN g ON ex.gene_id = g.gene_id
  WHERE g.species_id = e.species_id 
    AND g.chrom = e.chrom
    AND (ex.gene_id, ex.enh_id) NOT IN (
      SELECT gene_id, enh_id FROM prom
      UNION
      SELECT gene_id, enh_id FROM gb
    )
),

-- D) Window500k fallback (for very distant mappings)
win500 AS (
  SELECT DISTINCT ex.gene_id, ex.enh_id,
         'window500k' AS method,
         ABS(e.mid - g.tss) AS distance_bp
  FROM existing ex
  JOIN e ON ex.enh_id = e.enh_id
  JOIN g ON ex.gene_id = g.gene_id
  WHERE g.species_id = e.species_id 
    AND g.chrom = e.chrom
    AND ABS(e.mid - g.tss) <= 500000
    AND (ex.gene_id, ex.enh_id) NOT IN (
      SELECT gene_id, enh_id FROM prom
      UNION SELECT gene_id, enh_id FROM gb
      UNION SELECT gene_id, enh_id FROM nearest
    )
)

-- Union all methods (priority order maintained)
SELECT * FROM prom
UNION ALL
SELECT * FROM gb
UNION ALL
SELECT * FROM nearest
UNION ALL
SELECT * FROM win500;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

SELECT 'Gene-enhancer annotation results:' as metric, '' as details
UNION ALL
SELECT 'Total annotated mappings:', COUNT(*)::TEXT FROM gene_to_enhancer_annot
UNION ALL
SELECT 'Promoter overlaps:', COUNT(*)::TEXT FROM gene_to_enhancer_annot WHERE method = 'promoter'
UNION ALL
SELECT 'Gene body overlaps:', COUNT(*)::TEXT FROM gene_to_enhancer_annot WHERE method = 'overlap'  
UNION ALL
SELECT 'Nearest TSS:', COUNT(*)::TEXT FROM gene_to_enhancer_annot WHERE method = 'nearest'
UNION ALL
SELECT 'Window 500kb:', COUNT(*)::TEXT FROM gene_to_enhancer_annot WHERE method = 'window500k';