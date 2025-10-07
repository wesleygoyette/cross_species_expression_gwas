-- Simplified gene-to-enhancer annotation population
-- Using direct approach without complex CTEs

-- Clear existing table
DELETE FROM gene_to_enhancer_annot;

-- Step 1: Add all existing mappings with 'nearest' method and computed distance
INSERT INTO gene_to_enhancer_annot (gene_id, enh_id, method, distance_bp)
SELECT 
  ge.gene_id, 
  ge.enh_id,
  'nearest' AS method,
  ABS(((e.start + e.end) / 2) - g.start) AS distance_bp
FROM gene_to_enhancer ge
JOIN genes g ON ge.gene_id = g.gene_id
JOIN enhancers_all e ON ge.enh_id = e.enh_id
WHERE g.species_id = e.species_id AND g.chrom = e.chrom;

-- Verification queries
SELECT 'Total gene-enhancer annotations created: ' || COUNT(*) FROM gene_to_enhancer_annot;
SELECT 'Method distribution:' as info;
SELECT method, COUNT(*) as count FROM gene_to_enhancer_annot GROUP BY method;