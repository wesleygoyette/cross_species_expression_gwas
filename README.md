# Regulatory Landscapes: Interactive Genome Browser & Conservation Analysis

A comprehensive Shiny web application for exploring regulatory element conservation, gene expression, and GWAS associations across multiple species. This tool integrates enhancer data, chromatin architecture (CTCF/TADs), gene expression, and genome-wide association study (GWAS) results to provide a multi-dimensional view of genomic regulation.

## 🎯 Project Overview

This application enables researchers to:
- **Visualize enhancer conservation** across species (Human, Mouse, Macaque, Chicken, Pig)
- **Analyze gene expression patterns** across tissues (Brain, Heart, Liver)
- **Explore GWAS associations** linked to regulatory elements
- **Examine 3D chromatin architecture** through CTCF binding sites and TADs
- **Generate publication-ready plots** and export data

## 🏗️ Architecture & Implementation

### Core Technologies
- **R Shiny**: Interactive web application framework
- **SQLite Database**: Centralized data storage (`data/regland.sqlite`)
- **ggplot2**: High-quality scientific visualizations
- **DT**: Interactive data tables
- **Bootstrap 5**: Modern responsive UI

### Database Schema

The application uses a relational SQLite database with the following key tables:

```sql
-- Core genomic features
genes             (gene_id, symbol, species_id, chrom, start, end)
enhancers         (enh_id, species_id, chrom, start, end, tissue, score, source)
enhancer_class    (enh_id, class)  -- conserved/gained/lost/unlabeled

-- Chromatin architecture
ctcf_sites        (site_id, species_id, chrom, start, end, score, cons_class)
tad_domains       (tad_id, species_id, chrom, start, end, source)

-- GWAS data
gwas_snps         (snp_id, rsid, chrom, pos, trait, pval, category)

-- Associations
gene_to_enhancer  (gene_id, enh_id)
snp_to_enhancer   (snp_id, enh_id)
```

### Data Sources & Processing Pipeline

#### 1. Gene Expression Data (`data/expression_tpm.tsv`)
- **Source**: GTEx v8 median TPM values
- **Processing**: `scripts/build_expression_from_gtex.sh`
- **Format**: Symbol-tissue-TPM triplets
- **Tissues**: Brain, Heart, Liver (aggregated from GTEx subtissues)

#### 2. GWAS Data (`data/gwas_hg38_with_category.tsv`)
- **Source**: NHGRI-EBI GWAS Catalog
- **Processing**: `scripts/fetch_gwas_by_trait.sh`, `scripts/prepare_gwas.R`
- **Categories**: Alcohol, BMI, Inflammation
- **Significance**: Genome-wide significant hits (p < 5×10⁻⁸)

#### 3. Enhancer Data
- **Sources**: Multiple ChIP-seq and ATAC-seq datasets
- **Processing**: `scripts/build_enhancers.sh`
- **Classification**: Cross-species conservation analysis
- **Integration**: Linked to genes via proximity and 3D contacts

#### 4. Chromatin Architecture
- **CTCF Sites**: Conserved and species-specific binding sites
- **TAD Domains**: Topologically associating domain boundaries
- **Conservation Classes**: conserved, human_specific, other

## 🔧 Installation & Setup

### Prerequisites
```bash
# Install R dependencies
R -e "install.packages(c('shiny', 'bslib', 'DT', 'DBI', 'RSQLite', 
                        'ggplot2', 'dplyr', 'tidyr', 'thematic', 
                        'shinyjs', 'scales', 'readr', 'stringr'))"

# Install optional performance packages
R -e "install.packages(c('ragg'))  # Better PNG rendering"
```

### Quick Start
```bash
# Navigate to your project directory
cd path/to/your/regulatory-landscapes-project

# Launch application
R -e "shiny::runApp('app.R', host = '0.0.0.0', port = 3838)"
```

### Data Pipeline Setup

#### 1. Expression Data
```bash
# Download and process GTEx data
./scripts/build_expression_from_gtex.sh
```

#### 2. GWAS Data
```bash
# Fetch GWAS associations by trait
./scripts/fetch_gwas_by_trait.sh

# Or process full GWAS catalog
Rscript scripts/prepare_gwas.R
```

#### 3. Bootstrap Complete Dataset
```bash
# Populate database with all data sources
Rscript scripts/bootstrap_data.R
```

## 📊 Application Features

### 1. Explore Genes Tab
**Primary Interface for Single-Gene Analysis**

**Controls:**
- **Gene Search**: Enter gene symbol (e.g., BDNF, TTN, PCSK9)
- **Species Selection**: Human (hg38), Mouse (mm39), Macaque, Chicken, Pig
- **Tissue Filter**: Brain, Heart, Liver, Other
- **Distance Window**: ±1-1000kb around TSS
- **Enhancer Classes**: conserved, gained, lost, unlabeled

**Visualizations:**
1. **Genome Tracks**: Linear view showing:
   - Gene body annotation
   - Enhancer elements (color-coded by conservation class)
   - GWAS SNPs (sized by significance)
   - TSS marker

2. **Conservation Heatmap**: Matrix showing enhancer density across genomic bins
   - Rows: Conservation classes
   - Columns: Genomic position bins
   - Optional row normalization (0-100%)

3. **Expression Bar Plot**: Tissue-specific TPM values
   - Optional log10 transformation
   - Brain/Heart/Liver comparison

4. **GWAS Table**: Associated variants with:
   - rsID, trait, p-value, category
   - Filterable by trait categories

**Presets:**
- **Brain**: BDNF, SCN1A, GRIN2B, DRD2, APOE
- **Heart**: TTN, MYH6, MYH7, PLN, KCNQ1  
- **Liver**: ALB, APOB, CYP3A4, HNF4A, PCSK9

### 2. CTCF & 3D Tab
**Chromatin Architecture Analysis**

**Linking Modes:**
- **TSS Window**: Simple distance-based (±250kb default)
- **CTCF-bounded Domain**: Use TAD boundaries for gene-enhancer links

**Analysis Options:**
- **CTCF Conservation Groups**: conserved, human_specific, other
- **Enhancer Classes**: conserved, gained, lost, unlabeled
- **Association Tests**: RNA expression, GWAS enrichment, CTCF strength

**Visualizations:**
1. **3D Domain View**: Genome tracks with TAD/CTCF annotations
2. **Distance Distributions**: Enhancer distances to nearest CTCF sites
3. **Enhancers per Domain**: Count by conservation class
4. **Expression Associations**: Conserved enhancers vs RNA levels
5. **GWAS Over-representation**: Statistical enrichment by region type

### 3. Additional Tabs
- **Conservation Map**: Species-wide heatmap overview
- **Expression**: Multi-gene, multi-tissue comparison
- **GWAS/Heritability**: Trait overlap and enrichment analysis
- **Downloads**: Export functionality for all results

## 🔬 Scientific Implementation Details

### Conservation Analysis Algorithm

1. **Enhancer Discovery**: Peak calling on tissue-specific chromatin data
2. **Cross-species Alignment**: Lift-over to common coordinate system
3. **Conservation Classification**:
   - **Conserved**: Present in ≥2 species
   - **Gained**: Species-specific acquisition
   - **Lost**: Ancestral element lost in lineage
   - **Unlabeled**: Insufficient evidence

### Gene-Enhancer Linking

**Method 1: Proximity-based**
```r
# Link enhancers within distance window of TSS
half <- kb_to_bp(input$tss_kb)
enhancers_in_window <- enhancers[
  abs(enhancers$midpoint - gene$tss) <= half
]
```

**Method 2: 3D Chromatin-based**
```r
# Use TAD boundaries to define regulatory domains
tad <- get_tad_containing_tss(gene$tss)
enhancers_in_domain <- enhancers[
  enhancers$start >= tad$start & enhancers$end <= tad$end
]
```

### Expression Integration

**GTEx Processing Pipeline**:
1. Download median TPM values across all tissues
2. Map tissue names to standardized categories:
   - Brain: All brain regions + CNS tissues
   - Heart: Atrial appendage + left ventricle  
   - Liver: Liver tissue only
3. Calculate mean TPM for multi-tissue categories

### GWAS Association Testing

**SNP-Enhancer Overlap**:
```sql
SELECT COUNT(*) as gwas_hits
FROM gwas_snps s
JOIN snp_to_enhancer se ON s.snp_id = se.snp_id
JOIN enhancers e ON se.enh_id = e.enh_id
WHERE e.class = 'conserved'
```

**Enrichment Calculation**:
- Fisher's exact test for over-representation
- Background: All enhancers in genomic window
- Foreground: GWAS-associated enhancers by trait

## 📈 Performance Optimizations

### Database Indexing
```sql
-- Key performance indexes
CREATE INDEX idx_genes_species_chrom_start ON genes(species_id,chrom,start);
CREATE INDEX idx_enh_species_chrom_bounds ON enhancers(species_id,chrom,start,end);
CREATE INDEX idx_snp_chrom_pos ON gwas_snps(chrom,pos);
CREATE INDEX idx_ctcf_species_chrom_bounds ON ctcf_sites(species_id,chrom,start,end);
```

### Reactive Programming
- **Debounced Input**: 400ms delay on gene search
- **Event-driven Updates**: Automatic refresh on parameter changes
- **Conditional Queries**: Only execute when required data exists

### Memory Management
- **Connection Pooling**: Single persistent SQLite connection
- **Lazy Loading**: Data fetched only when visualizations are rendered
- **Efficient Filtering**: SQL-based subsetting before R processing

## 📚 Data Sources & Citations

### Primary Data Sources
- **Gene Annotations**: GENCODE/Ensembl
- **Expression**: GTEx Consortium v8
- **GWAS**: NHGRI-EBI GWAS Catalog
- **Enhancers**: ENCODE, Roadmap Epigenomics
- **CTCF/TADs**: 3D Genome Browser, Hi-C datasets

### Key References
- Berthelot et al., Nature Ecology & Evolution (2018) - Conservation methodology
- GTEx Consortium, Science (2020) - Expression atlas
- Buniello et al., Nucleic Acids Research (2019) - GWAS Catalog

**Technical Implementation**: Research-grade bioinformatics pipeline with production-ready web interface suitable for publication and collaborative research.