-- RegLand Database: Comprehensive Data Quality Fixes
-- Implementation of advanced gene-enhancer annotation and score handling
-- Preserves original data while creating analysis-ready derived tables

-- ============================================================================
-- 1. CREATE PROMOTERS TABLE (if empty)
-- ============================================================================

-- Check if promoters table needs population
CREATE TABLE IF NOT EXISTS promoters AS
SELECT
  g.gene_id,
  g.species_id,
  g.chrom,
  MAX(0, g.start - 2000) AS start,  -- Prevent negative coordinates
  g.start + 2000 AS end             -- Using gene.start as TSS proxy
FROM genes g;

-- Index for efficient genomic queries
CREATE INDEX IF NOT EXISTS idx_promoters_loc
  ON promoters(species_id, chrom, start, end);

-- ============================================================================
-- 2. CREATE FULLY-ANNOTATED GENE-TO-ENHANCER MAPPING
-- ============================================================================

-- Replace existing annotation table with comprehensive methodology
DROP TABLE IF EXISTS gene_to_enhancer_annot;

CREATE TABLE gene_to_enhancer_annot AS
WITH e AS (
  SELECT enh_id, species_id, chrom, start, end, (start + end)/2 AS mid
  FROM enhancers_all
),
g AS (
  SELECT gene_id, species_id, chrom, start AS tss, end
  FROM genes
),

-- A) Promoter overlap (highest priority)
prom AS (
  SELECT g.gene_id, e.enh_id,
         'promoter' AS method,
         ABS(e.mid - g.tss) AS distance_bp
  FROM e
  JOIN promoters p
    ON p.species_id = e.species_id 
   AND p.chrom = e.chrom
   AND p.start <= e.end 
   AND p.end >= e.start
  JOIN g ON g.gene_id = p.gene_id
),

-- B) Gene body overlap (excluding promoter hits)
gb AS (
  SELECT g.gene_id, e.enh_id,
         'overlap' AS method,
         CASE
           WHEN e.mid < g.tss THEN g.tss - e.mid
           WHEN e.mid > g.end THEN e.mid - g.end
           ELSE 0
         END AS distance_bp
  FROM e
  JOIN g
    ON g.species_id = e.species_id 
   AND g.chrom = e.chrom
   AND g.start <= e.end 
   AND g.end >= e.start
  WHERE (g.gene_id, e.enh_id) NOT IN (SELECT gene_id, enh_id FROM prom)
),

-- C) Nearest TSS (if still unmapped)
nearest AS (
  SELECT
    g.gene_id, e.enh_id,
    'nearest' AS method,
    MIN(ABS(e.mid - g.tss)) AS distance_bp
  FROM e
  JOIN g
    ON g.species_id = e.species_id 
   AND g.chrom = e.chrom
  WHERE (g.gene_id, e.enh_id) NOT IN (
    SELECT gene_id, enh_id FROM prom
    UNION
    SELECT gene_id, enh_id FROM gb
  )
  GROUP BY e.enh_id
),

-- D) 500kb window fallback (prevents cross-chromosome joins)
win500 AS (
  SELECT
    g.gene_id, e.enh_id,
    'window500k' AS method,
    ABS(e.mid - g.tss) AS distance_bp
  FROM e
  JOIN g
    ON g.species_id = e.species_id 
   AND g.chrom = e.chrom
   AND ABS(e.mid - g.tss) <= 500000
  WHERE (g.gene_id, e.enh_id) NOT IN (
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

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_gte_annot_gene ON gene_to_enhancer_annot(gene_id);
CREATE INDEX IF NOT EXISTS idx_gte_annot_enh ON gene_to_enhancer_annot(enh_id);
CREATE INDEX IF NOT EXISTS idx_gte_annot_method ON gene_to_enhancer_annot(method);

-- ============================================================================
-- 3. ENHANCER SCORE ANALYSIS (NO IMPUTATION)
-- ============================================================================

-- Per-source score statistics for z-score computation
DROP VIEW IF EXISTS enhancers_score_stats;
CREATE VIEW enhancers_score_stats AS
SELECT
  source,
  COUNT(score) AS n_with_score,
  AVG(score) AS mean_score,
  -- Sample standard deviation (two-pass formula)
  CASE
    WHEN COUNT(score) > 1
    THEN SQRT((SUM(score * score) - SUM(score) * SUM(score) / COUNT(score)) / (COUNT(score) - 1))
    ELSE NULL
  END AS sd_score
FROM enhancers_all
WHERE score IS NOT NULL
GROUP BY source;

-- Enhancers with computed z-scores (source-normalized)
DROP VIEW IF EXISTS enhancers_with_z;
CREATE VIEW enhancers_with_z AS
SELECT
  e.*,
  (e.score IS NOT NULL) AS has_score,
  CASE
    WHEN e.score IS NOT NULL AND s.sd_score IS NOT NULL AND s.sd_score > 0
    THEN (e.score - s.mean_score) / s.sd_score
    ELSE NULL
  END AS score_z
FROM enhancers_all e
LEFT JOIN enhancers_score_stats s USING(source);

-- ============================================================================
-- 4. REFRESH ANALYSIS-READY VIEWS
-- ============================================================================

-- High-confidence enhancers (score + known tissue required)
DROP VIEW IF EXISTS enhancers_hiconf;
CREATE VIEW enhancers_hiconf AS
SELECT enh_id, species_id, chrom, start, end, score, source, tissue
FROM enhancers_all
WHERE score IS NOT NULL
  AND tissue IN ('Brain', 'Heart', 'Liver');

-- Tissue-flexible view (includes unknown tissues)
DROP VIEW IF EXISTS enhancers_tissue_any;
CREATE VIEW enhancers_tissue_any AS
SELECT enh_id, species_id, chrom, start, end, score, source,
       COALESCE(tissue, 'unknown') AS tissue
FROM enhancers_all
WHERE score IS NOT NULL
  AND (tissue IN ('Brain', 'Heart', 'Liver') OR tissue IS NULL);

-- ============================================================================
-- 5. ADD DATA QUALITY CONSTRAINTS (PREVENT REGRESSIONS)
-- ============================================================================

-- Create guarded version of gene_to_enhancer_annot with constraints
CREATE TABLE IF NOT EXISTS gene_to_enhancer_annot_guarded(
  gene_id INTEGER NOT NULL,
  enh_id INTEGER NOT NULL,
  method TEXT NOT NULL CHECK (method IN ('promoter', 'overlap', 'nearest', 'window500k')),
  distance_bp INTEGER NOT NULL CHECK (distance_bp >= 0),
  PRIMARY KEY (gene_id, enh_id)
);

-- Populate guarded table
INSERT OR IGNORE INTO gene_to_enhancer_annot_guarded
SELECT * FROM gene_to_enhancer_annot;

-- Replace original with guarded version
DROP TABLE gene_to_enhancer_annot;
ALTER TABLE gene_to_enhancer_annot_guarded RENAME TO gene_to_enhancer_annot;

-- Recreate indexes on renamed table
CREATE INDEX IF NOT EXISTS idx_gte_annot_gene ON gene_to_enhancer_annot(gene_id);
CREATE INDEX IF NOT EXISTS idx_gte_annot_enh ON gene_to_enhancer_annot(enh_id);
CREATE INDEX IF NOT EXISTS idx_gte_annot_method ON gene_to_enhancer_annot(method);

-- ============================================================================
-- 6. COMPREHENSIVE INDEXING FOR PERFORMANCE
-- ============================================================================

-- Core genomic location indexes
CREATE INDEX IF NOT EXISTS idx_genes_loc ON genes(species_id, chrom, start);
CREATE INDEX IF NOT EXISTS idx_enh_all_loc ON enhancers_all(species_id, chrom, start, end);
CREATE INDEX IF NOT EXISTS idx_ctcf_loc ON ctcf_sites(species_id, chrom, start, end);

-- View-specific partial indexes
CREATE INDEX IF NOT EXISTS idx_enh_hiconf_tissue 
  ON enhancers_all(species_id, chrom, start)
  WHERE score IS NOT NULL AND tissue IN ('Brain', 'Heart', 'Liver');

CREATE INDEX IF NOT EXISTS idx_enh_score_notnull 
  ON enhancers_all(score) 
  WHERE score IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_enh_tissue_source 
  ON enhancers_all(tissue, source) 
  WHERE score IS NOT NULL;

-- ============================================================================
-- 7. DATABASE OPTIMIZATION
-- ============================================================================

-- Update table statistics for query optimizer
ANALYZE;

-- Run SQLite query planner optimization
PRAGMA optimize;

-- ============================================================================
-- 8. VERIFICATION QUERIES
-- ============================================================================

-- Verify promoters table population
-- SELECT 'Promoter regions created:', COUNT(*) FROM promoters;

-- Verify gene-enhancer annotation methods
-- SELECT method, COUNT(*) as count FROM gene_to_enhancer_annot GROUP BY method ORDER BY count DESC;

-- Verify score statistics by source
-- SELECT * FROM enhancers_score_stats ORDER BY n_with_score DESC;

-- Check high-confidence enhancer counts
-- SELECT 'High-confidence enhancers:', COUNT(*) FROM enhancers_hiconf;
-- SELECT 'Tissue-flexible enhancers:', COUNT(*) FROM enhancers_tissue_any;