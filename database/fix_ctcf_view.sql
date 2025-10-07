-- Fix the ctcf_context view
DROP VIEW IF EXISTS ctcf_context;

CREATE VIEW ctcf_context AS
SELECT 
  site_id,
  species_id,
  chrom,
  start,
  end,
  score,
  ((start + end) / 2) AS ctcf_midpoint,
  NULL AS nearest_gene_id,  -- Simplified for now
  NULL AS distance_to_TSS,  -- Simplified for now
  0 AS overlaps_enhancer    -- Simplified for now
FROM ctcf_sites;