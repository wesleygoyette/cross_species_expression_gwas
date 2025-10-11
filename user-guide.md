# CrossGenome.site User Guide

A web platform for exploring evolutionary conservation of gene regulatory landscapes across five species: humans, mice, pigs, chickens, and macaques.

## Overview

CrossGenome.site integrates genomic data to help researchers understand how gene regulation is conserved across species and how genetic variants relate to human diseases. Query gene regulation patterns, disease associations, and tissue-specific enhancer activity all in one place.

**Key Statistics:**
- 195,977 genes across 5 species
- 3.9 million regulatory elements (enhancers)
- 26,404 disease-associated genetic variants (GWAS)
- 790 human traits and diseases
- Tissue data: Brain, Heart, Liver

## Quick Start

### Web Interface

1. **Gene Explorer**: Search for genes to visualize their regulatory landscape
   - View enhancers, GWAS SNPs, and CTCF binding sites
   - Switch between tissue types and species
   - Examine conservation scores and data quality metrics

2. **GWAS Portal**: Discover disease and trait associations
   - Search by disease name, trait, gene, or SNP ID
   - Browse results by category (Cardiovascular, Neurological, Metabolic, etc.)
   - Link findings back to Gene Explorer for detailed analysis

### Common Workflows

**Investigating a disease:**
1. Search the GWAS Portal for your disease
2. Identify associated genes and SNPs
3. Switch to Gene Explorer and search those genes
4. Examine enhancers and check conservation across species

**Studying gene regulation:**
1. Enter a gene in Gene Explorer
2. Select your tissue of interest
3. Review enhancer landscape and conservation scores
4. Compare across species

**Comparative genomics:**
1. Search a gene in Gene Explorer
2. Compare enhancer counts, locations, and conservation scores
3. Note species-specific regulatory features

## Data Sources

- **Enhancer data**: ENCODE, Roadmap Epigenomics
- **GWAS data**: NHGRI-EBI GWAS Catalog
- **Gene annotations**: Ensembl
- **Conservation**: Multi-species alignments

## Species & Assemblies

| Species | Genes | Enhancers | Assembly | Focus |
|---------|-------|-----------|----------|-------|
| Human | 61,689 | 2.71M | GRCh38/hg38 | Disease, reference |
| Mouse | 78,334 | 380K | mm39 | Model organism |
| Pig | 17,602 | 800K | susScr11 | Agriculture, disease models |
| Chicken | 14,238 | — | GRCg7b | Avian biology |
| Macaque | 24,114 | — | rheMac10 | Primate disease models |

## Key Concepts

**Enhancers**: DNA regulatory regions that increase gene expression, often located far from the genes they control. Conservation indicates functional importance.

**GWAS SNPs**: Single nucleotide variations associated with diseases or traits at genome-wide significance (p < 5×10⁻⁸). Association does not imply causation.

**Conservation Score**: Ranges from 0 (not conserved) to 1 (highly conserved), reflecting sequence similarity and regulatory function across species.

**CTCF Sites**: DNA regions where CTCF protein binds; important for organizing chromosomes into 3D structures.

**Data Quality**: Badges indicate coverage (High: >70% conservation, multiple species; Medium: 40-70%, some species; Low: <40%, limited coverage).

## API

Programmatic access is available via REST API. All responses are JSON.

**Key Endpoints:**
- `GET /api/genes/search/?q=GENE_NAME&species=SPECIES`
- `GET /api/genes/region/?gene=GENE&species=SPECIES&tissue=TISSUE&tss_kb=100`
- `GET /api/gwas/traits/?q=DISEASE`
- `GET /api/gwas/trait-snps/?trait=TRAIT`
- `GET /api/genes/expression/?gene=GENE`

**Example:**
```bash
curl -X GET "https://crossgenome.site/api/genes/region/?gene=BDNF&species=human_hg38&tissue=Brain&tss_kb=100"
```

See the API documentation section on the homepage for complete details and response formats.

## Using the Data

✅ **Use freely for research and publication** — just cite the platform  
✅ **Access via web interface or API** — no account needed  
✅ **Download via API** — available in JSON format  

## FAQ

**Why doesn't my gene show data?**  
Try: (1) switching tissues, (2) checking data quality badge, (3) verifying the gene exists in your chosen species, (4) checking if data is available in other species.

**Why do some species have incomplete data?**  
Human is the reference species with the most comprehensive dataset due to extensive genomic research. Mouse is well-characterized as a model organism. Other species have more specialized datasets.

**How are conserved enhancers identified?**  
Conservation scores reflect sequence similarity and regulatory function conservation across species, identified through multi-species alignments.

**What genome assembly should I use?**  
The platform uses the most current assembly for each species. See the Species & Assemblies table above.

**Can I search by genomic coordinates?**  
Currently, search is gene-based. Use official gene symbols for best results.

## Terms

- **TSS**: Transcription Start Site (where gene transcription begins)
- **TPM**: Transcripts Per Million (normalized expression unit)
- **rsID**: Reference SNP identifier (e.g., rs6265)
- **P-value**: Statistical significance (lower = stronger association)

## Getting Help

**Issues & Contributions:**  
https://github.com/wesleygoyette/cross_species_expression_gwas

**Scientific Background:**  
This platform integrates research on regulatory landscape evolution and comparative genomics to enable cross-species translation of genetic findings.

---

**Last updated:** October 2025  
**Current version:** v2.1