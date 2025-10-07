-- Step-by-step quality fixes for RegLand database
-- Fixing issues identified in the comprehensive script

-- ============================================================================
-- 1. VERIFY AND POPULATE PROMOTERS TABLE
-- ============================================================================

-- Check if promoters table is empty and populate it
INSERT OR IGNORE INTO promoters (gene_id, species_id, chrom, start, end)
SELECT
  g.gene_id,
  g.species_id,
  g.chrom,
  MAX(0, g.start - 2000) AS start,
  g.start + 2000 AS end
FROM genes g
WHERE g.gene_id NOT IN (SELECT DISTINCT gene_id FROM promoters WHERE gene_id IS NOT NULL);

-- ============================================================================
-- 2. CREATE ENHANCED SCORE STATISTICS VIEW
-- ============================================================================

DROP VIEW IF EXISTS enhancers_score_stats;
CREATE VIEW enhancers_score_stats AS
SELECT
  source,
  COUNT(score) AS n_with_score,
  AVG(score) AS mean_score,
  CASE
    WHEN COUNT(score) > 1
    THEN SQRT((SUM(score * score) - SUM(score) * SUM(score) / COUNT(score)) / (COUNT(score) - 1))
    ELSE NULL
  END AS sd_score
FROM enhancers_all
WHERE score IS NOT NULL
GROUP BY source;

-- ============================================================================
-- 3. CREATE Z-SCORE VIEW
-- ============================================================================

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
-- 4. VERIFICATION QUERIES
-- ============================================================================

SELECT 'Promoter regions available:' as metric, COUNT(*) as count FROM promoters
UNION ALL
SELECT 'Gene-enhancer annotations available:', COUNT(*) FROM gene_to_enhancer_annot
UNION ALL
SELECT 'High-confidence enhancers:', COUNT(*) FROM enhancers_hiconf
UNION ALL
SELECT 'Enhancers with scores:', COUNT(*) FROM enhancers_all WHERE score IS NOT NULL;