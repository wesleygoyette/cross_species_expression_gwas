-- Handle duplicates in gene-to-enhancer mapping properly
-- Use INSERT OR REPLACE to handle duplicate (gene_id, enh_id) pairs

DELETE FROM gene_to_enhancer_annot;

-- Insert with de-duplication - use MIN distance for duplicates
INSERT OR REPLACE INTO gene_to_enhancer_annot (gene_id, enh_id, method, distance_bp)
SELECT 
  ge.gene_id, 
  ge.enh_id,
  'nearest' AS method,
  MIN(ABS(((e.start + e.end) / 2) - g.start)) AS distance_bp
FROM gene_to_enhancer ge
JOIN genes g ON ge.gene_id = g.gene_id
JOIN enhancers_all e ON ge.enh_id = e.enh_id
WHERE g.species_id = e.species_id AND g.chrom = e.chrom
GROUP BY ge.gene_id, ge.enh_id;

-- Verification
SELECT 'Gene-enhancer annotations created: ' || COUNT(*) FROM gene_to_enhancer_annot;
SELECT 'Average distance: ' || ROUND(AVG(distance_bp), 2) || ' bp' FROM gene_to_enhancer_annot;
SELECT method, COUNT(*) as count FROM gene_to_enhancer_annot GROUP BY method;