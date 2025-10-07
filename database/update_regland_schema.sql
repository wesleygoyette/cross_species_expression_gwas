-- RegLand Database Schema Updates for Project Alpha
-- Adding missing species, creating analysis-ready views, and optimizing indexes

-- ============================================================================
-- 1. ADD MISSING SPECIES TO SPECIES TABLE
-- ============================================================================

INSERT OR IGNORE INTO species(species_id, name, genome_build) VALUES
('pig_susScr11', 'Pig', 'susScr11'),
('chicken_grcg7b', 'Chicken', 'grcg7b'),
('macaque_rheMac10', 'Macaque', 'rheMac10');

-- ============================================================================
-- 2. UPDATE SNP_TO_ENHANCER OVERLAP_BP (backfill missing values to 50)
-- ============================================================================

UPDATE snp_to_enhancer 
SET overlap_bp = 50 
WHERE overlap_bp IS NULL;

-- ============================================================================
-- 3. CREATE GENE_TO_ENHANCER_ANNOT TABLE (derived mapping with computed distances)
-- ============================================================================

DROP TABLE IF EXISTS gene_to_enhancer_annot;
CREATE TABLE gene_to_enhancer_annot AS
SELECT ge.gene_id,
       ge.enh_id,
       COALESCE(ge.method, 'nearest') AS method,
       COALESCE(
         ge.distance_bp,
         ABS( (e.start + e.end)/2 - g.start )  -- Using gene.start as TSS proxy
       ) AS distance_bp
FROM gene_to_enhancer ge
JOIN enhancers_all e USING(enh_id)
JOIN genes g USING(gene_id);

-- ============================================================================
-- 4. CREATE PROMOTERS TABLE (materialized from genes ±2kb around TSS)
-- ============================================================================

DROP TABLE IF EXISTS promoters;
CREATE TABLE promoters AS
SELECT gene_id, 
       species_id, 
       chrom,
       start - 2000 AS start,  -- Using gene.start as TSS proxy
       start + 2000 AS end
FROM genes;

-- ============================================================================
-- 5. CREATE ANALYSIS-READY VIEWS
-- ============================================================================

-- High-confidence enhancer view (requires score and known tissue)
DROP VIEW IF EXISTS enhancers_hiconf;
CREATE VIEW enhancers_hiconf AS
SELECT
  e.enh_id,
  e.species_id,
  e.chrom,
  e.start,
  e.end,
  e.score,
  e.source,
  e.tissue
FROM enhancers_all e
WHERE e.score IS NOT NULL
  AND e.tissue IN ('Brain','Heart','Liver');

-- Soft tissue view (keeps score requirement, surfaces NULL as 'unknown')
DROP VIEW IF EXISTS enhancers_tissue_any;
CREATE VIEW enhancers_tissue_any AS
SELECT
  e.enh_id,
  e.species_id,
  e.chrom,
  e.start,
  e.end,
  e.score,
  e.source,
  COALESCE(e.tissue, 'unknown') AS tissue
FROM enhancers_all e
WHERE e.score IS NOT NULL
  AND (e.tissue IN ('Brain','Heart','Liver') OR e.tissue IS NULL);

-- CTCF context view with positional features
DROP VIEW IF EXISTS ctcf_context;
CREATE VIEW ctcf_context AS
WITH ctcf AS (
  SELECT
    site_id,
    species_id,
    chrom,
    start,
    end,
    score,
    ((start + end) / 2) AS mid
  FROM ctcf_sites
)
SELECT
  c.site_id,
  c.species_id,
  c.chrom,
  c.start,
  c.end,
  c.score,
  c.mid AS ctcf_midpoint,
  -- nearest gene on same species & chromosome
  (
    SELECT g.gene_id
    FROM genes g
    WHERE g.species_id = c.species_id
      AND g.chrom = c.chrom
    ORDER BY ABS(g.start - c.mid)
    LIMIT 1
  ) AS nearest_gene_id,
  -- distance to the nearest gene "TSS" (gene.start used as proxy)
  (
    SELECT MIN(ABS(g.start - c.mid))
    FROM genes g
    WHERE g.species_id = c.species_id
      AND g.chrom = c.chrom
  ) AS distance_to_TSS,
  -- any overlap with an enhancer
  EXISTS (
    SELECT 1
    FROM enhancers_all e
    WHERE e.species_id = c.species_id
      AND e.chrom = c.chrom
      AND e.start <= c.end
      AND e.end   >= c.start
  ) AS overlaps_enhancer
FROM ctcf c;

-- GWAS source standardization view
DROP VIEW IF EXISTS gwas_snps_source_std;
CREATE VIEW gwas_snps_source_std AS
SELECT
  g.*,
  TRIM(LOWER(
    CASE
      WHEN g.source IN ('GWAS (parquet)', 'gwas (parquet)', 'parquet') THEN 'gwas_parquet'
      WHEN g.source IN ('GWAS Catalog region export', 'gwas catalog region export', 'gwas_catalog_region') THEN 'gwas_catalog_region'
      WHEN g.source LIKE 'demo%' THEN 'demo'
      ELSE REPLACE(TRIM(LOWER(g.source)), ' ', '_')
    END
  )) AS source_std
FROM gwas_snps g;

-- ============================================================================
-- 6. CREATE OPTIMIZED INDEXES
-- ============================================================================

-- Core genomic location indexes
DROP INDEX IF EXISTS idx_genes_loc;
CREATE INDEX idx_genes_loc
  ON genes(species_id, chrom, start);

DROP INDEX IF EXISTS idx_enh_all_loc;
CREATE INDEX idx_enh_all_loc
  ON enhancers_all(species_id, chrom, start, end);

DROP INDEX IF EXISTS idx_ctcf_loc;
CREATE INDEX idx_ctcf_loc
  ON ctcf_sites(species_id, chrom, start, end);

-- For midpoint/overlap scans in ctcf_context
DROP INDEX IF EXISTS idx_genes_chrom_start;
CREATE INDEX idx_genes_chrom_start
  ON genes(chrom, start);

DROP INDEX IF EXISTS idx_enh_all_chrom_bounds;
CREATE INDEX idx_enh_all_chrom_bounds
  ON enhancers_all(chrom, start, end);

-- Views acceleration (partial indexes)
DROP INDEX IF EXISTS idx_enh_hiconf_tissue;
CREATE INDEX idx_enh_hiconf_tissue
  ON enhancers_all(species_id, chrom, start)
  WHERE score IS NOT NULL AND tissue IN ('Brain','Heart','Liver');

DROP INDEX IF EXISTS idx_enh_score_tissue_null;
CREATE INDEX idx_enh_score_tissue_null
  ON enhancers_all(species_id, chrom, start)
  WHERE score IS NOT NULL AND tissue IS NULL;

DROP INDEX IF EXISTS idx_enh_score_notnull;
CREATE INDEX idx_enh_score_notnull
  ON enhancers_all(score)
  WHERE score IS NOT NULL;

-- Mapping tables (common join keys)
DROP INDEX IF EXISTS idx_ge_gene;
CREATE INDEX idx_ge_gene
  ON gene_to_enhancer(gene_id);

DROP INDEX IF EXISTS idx_ge_enh;
CREATE INDEX idx_ge_enh
  ON gene_to_enhancer(enh_id);

DROP INDEX IF EXISTS idx_s2e_snp;
CREATE INDEX idx_s2e_snp
  ON snp_to_enhancer(snp_id);

DROP INDEX IF EXISTS idx_s2e_enh;
CREATE INDEX idx_s2e_enh
  ON snp_to_enhancer(enh_id);

-- GWAS conveniences
DROP INDEX IF EXISTS idx_gwas_chrom_pos;
CREATE INDEX idx_gwas_chrom_pos
  ON gwas_snps(chrom, pos);

DROP INDEX IF EXISTS idx_gwas_trait;
CREATE INDEX idx_gwas_trait
  ON gwas_snps(trait);

DROP INDEX IF EXISTS idx_gwas_source;
CREATE INDEX idx_gwas_source
  ON gwas_snps(source);

DROP INDEX IF EXISTS idx_gwas_rsid;
CREATE INDEX idx_gwas_rsid
  ON gwas_snps(rsid);

-- Enhancer class lookups
DROP INDEX IF EXISTS idx_enh_class_enh;
CREATE INDEX idx_enh_class_enh
  ON enhancer_class(enh_id);

DROP INDEX IF EXISTS idx_enh_class_label;
CREATE INDEX idx_enh_class_label
  ON enhancer_class(class);

-- New table indexes
DROP INDEX IF EXISTS idx_ge_annot_gene;
CREATE INDEX idx_ge_annot_gene
  ON gene_to_enhancer_annot(gene_id);

DROP INDEX IF EXISTS idx_ge_annot_enh;
CREATE INDEX idx_ge_annot_enh
  ON gene_to_enhancer_annot(enh_id);

DROP INDEX IF EXISTS idx_promoters_loc;
CREATE INDEX idx_promoters_loc
  ON promoters(species_id, chrom, start, end);

-- ============================================================================
-- 7. ANALYZE AND OPTIMIZE
-- ============================================================================

ANALYZE;
PRAGMA optimize;

-- ============================================================================
-- 8. VERIFICATION QUERIES (for testing)
-- ============================================================================

-- Check species table now includes pig
-- SELECT * FROM species WHERE species_id LIKE '%pig%';

-- Check enhancers_hiconf view works
-- SELECT COUNT(*) AS hiconf_count FROM enhancers_hiconf;

-- Check ctcf_context view works  
-- SELECT COUNT(*) AS ctcf_with_context FROM ctcf_context LIMIT 5;

-- Check gene_to_enhancer_annot table
-- SELECT COUNT(*) AS annotated_mappings FROM gene_to_enhancer_annot;

-- Check promoters table
-- SELECT COUNT(*) AS promoter_regions FROM promoters;