# CrossGenome.site User Guide

Welcome to **CrossGenome.site** — your comprehensive platform for exploring evolutionary conservation of gene regulatory landscapes across species! This guide will walk you through all the features available on the website and help you make the most of the genomic data at your fingertips.

## 📚 Table of Contents

1. [Getting Started](#getting-started)
2. [Understanding the Data](#understanding-the-data)
3. [Gene Explorer](#gene-explorer)
4. [GWAS Portal](#gwas-portal)
5. [Regulatory Analyzer](#regulatory-analyzer)
6. [Species Information](#species-information)
7. [Downloading Data](#downloading-data)
8. [Tips & Best Practices](#tips--best-practices)
9. [Frequently Asked Questions](#frequently-asked-questions)
10. [Getting Help](#getting-help)

---

## Getting Started

### What is CrossGenome.site?

CrossGenome.site is a web-based tool that lets you explore how gene regulatory regions are conserved across three mammalian species: **humans**, **mice**, and **pigs**. The platform contains:

- **195,977 genes** analyzed across species
- **3.9 million regulatory elements** (enhancers that control gene expression)
- **26,404 disease-associated genetic variants** from GWAS studies
- **790 human traits** and diseases
- **89,754 CTCF binding sites** (important for chromosome organization)

### Who Should Use This Tool?

This platform is designed for:
- **Researchers** studying gene regulation and disease genetics
- **Biologists** interested in evolutionary conservation
- **Medical professionals** exploring genetic associations with diseases
- **Students** learning about genomics and comparative biology
- **Anyone curious** about how genes work across different species

### System Requirements

- Modern web browser (Chrome, Firefox, Safari, or Edge)
- Internet connection
- No software installation required!

---

## Understanding the Data

### The Three Species

**Human (Homo sapiens)** - Assembly: GRCh38/hg38
- Reference species for human health and disease
- 61,471 genes catalogued
- 121,357 enhancers identified
- 26,404 disease-associated variants

**Mouse (Mus musculus)** - Assembly: mm39
- 65,217 genes catalogued
- 3.44 million enhancers identified
- Widely used model organism for research

**Pig (Sus scrofa)** - Assembly: susScr11
- 69,289 genes catalogued
- 387,612 enhancers identified
- Important for agricultural and biomedical research

### Key Terms Explained

**Gene**: A segment of DNA that contains instructions for making proteins

**Enhancer**: A regulatory DNA region that increases gene expression, often located far from the gene it controls

**Conservation**: When DNA sequences are similar across different species, suggesting they're important and preserved through evolution

**GWAS (Genome-Wide Association Study)**: Research that identifies genetic variants associated with diseases or traits

**SNP (Single Nucleotide Polymorphism)**: A single letter change in DNA that can affect traits or disease risk

**CTCF Binding Site**: DNA regions where CTCF protein binds to organize chromosomes into 3D structures

**TSS (Transcription Start Site)**: The position where gene transcription begins

---

## Gene Explorer

The Gene Explorer is the main tool for investigating individual genes and their regulatory landscapes.

### How to Search for a Gene

1. **Find the Gene Explorer section** on the homepage (it's the first interactive section)

2. **Enter a gene name** in the search box:
   - Type any gene symbol (e.g., "BDNF", "FOXP2", "ALB")
   - The system will suggest matching genes as you type
   - Click on the gene you want from the suggestions

3. **Try example genes** if you're not sure what to search:
   - Click on any of the example gene buttons: BDNF, FOXP2, ALB, PCSK9, TP53
   - These are well-studied genes with interesting regulatory patterns

### Understanding the Gene Overview

Once you select a gene, you'll see a summary card with key information:

**Basic Information**:
- **Chromosome location**: Which chromosome contains this gene (e.g., "chr11")
- **Genomic position**: The exact coordinates on the chromosome (e.g., "27,676,440 - 27,743,605")
- **Gene symbol**: The official name of the gene

**Regulatory Features**:
- **Enhancers**: Number of regulatory elements near this gene
  - "With Score": Enhancers with conservation scores
  - "With Tissue": Enhancers active in specific tissues
- **CTCF Sites**: Number of chromosome organizing elements
- **GWAS SNPs**: Disease-associated genetic variants in the region

**Data Quality Indicators**:
- **Conservation score**: Percentage showing how conserved this gene's regulatory landscape is
- **Available species**: Which organisms have data for this gene
- **Data quality badge**: Visual indicator (High/Medium/Low quality)

### Selecting Tissues

Different tissues (organs) have different active enhancers:

1. **Use the tissue dropdown** menu near the top of the Gene Explorer
2. **Available tissues**:
   - **Brain**: Neural tissue and nervous system
   - **Heart**: Cardiac muscle and cardiovascular system
   - **Liver**: Hepatic tissue and metabolic functions

3. **What changes when you switch tissues**:
   - Different enhancers become visible
   - Expression levels change
   - Conservation patterns may vary

> **💡 Tip**: If you see a warning about limited data, it means fewer enhancers are available for that tissue/species combination.

### Exploring the Genome Browser View

The genome browser shows a visual representation of the gene region with multiple tracks:

#### Understanding the Tracks

**Gene Track** (top):
- Shows the location of your gene of interest
- Displayed as a blue bar with the gene name

**Enhancer Tracks**:
- **Human enhancers**: Light blue bars
- **Mouse enhancers**: Green bars  
- **Pig enhancers**: Orange bars
- **Height of bars**: Represents conservation score (taller = more conserved)

**GWAS SNP Track**:
- Shows disease-associated variants
- Displayed as small markers
- Hover over them to see which disease/trait they're associated with

**CTCF Binding Sites**:
- Purple markers showing chromosome organization points

#### Navigation Controls

**Zoom Controls**:
- **Zoom In button** (➕): Get a closer look at the region
- **Zoom Out button** (➖): See a wider genomic region
- **Reset Zoom button** (⊡): Return to the default view centered on your gene

**Pan Controls**:
- **Left arrow** (←): Move the view window to the left (upstream)
- **Right arrow** (→): Move the view window to the right (downstream)

**Current zoom level** is displayed as "Zoom: 1.0x" (increases up to 10x)

> **💡 Pro Tip**: Zoom in to see individual enhancers and SNPs more clearly, then use the pan buttons to explore neighboring regions.

### Working with Enhancers

The enhancers table shows detailed information about each regulatory element:

**Understanding the Table Columns**:
- **ID**: Unique identifier for the enhancer
- **Position**: Genomic coordinates (chromosome and location)
- **Score**: Conservation score (0-1, higher = more conserved)
- **Class**: Conservation category:
  - **Conserved**: Found in all three species
  - **Gained**: Specific to one species
  - **Lost**: Absent in one species
  - **Unlabeled**: Classification pending
- **Distance to TSS**: How far the enhancer is from the gene start (in kilobases)

**Filtering Enhancers**:
1. Look for the class filter options above the table
2. Click on conservation classes to show only those types
3. Use the search bar to find specific enhancers by ID or position

**Pagination**:
- The table shows 8 enhancers per page
- Use the page numbers at the bottom to navigate
- Look for the total count (e.g., "Showing 1-8 of 125 enhancers")

### Viewing GWAS SNPs (Disease Variants)

The GWAS SNPs table shows genetic variants associated with diseases or traits:

**Table Columns Explained**:
- **SNP ID/rsID**: Official identifier (e.g., "rs6265")
- **Position**: Exact location on the chromosome
- **Trait/Disease**: What condition this variant is associated with
- **P-value**: Statistical significance (lower = stronger association)
  - Values like 1.2e-8 mean very strong evidence
  - Generally, p < 5e-8 is considered significant
- **Category**: Disease category (e.g., "Neurological", "Cardiovascular")

**Finding Specific SNPs**:
1. Use the search box above the table
2. Type a trait name (e.g., "diabetes") or SNP ID
3. Results filter automatically as you type

**Expanding SNP Details**:
- Click the "ⓘ" or expand button next to any SNP
- See additional information like:
  - Associated genes nearby
  - Effect allele information
  - Related studies

### Viewing Gene Expression

The expression viewer shows how active a gene is in different tissues:

**Understanding Expression Levels**:
- **Higher values**: Gene is more active in that tissue
- **Lower values**: Gene is less active
- **TPM (Transcripts Per Million)**: Standard unit for measuring expression

**Species Comparison**:
- Compare the same tissue across human, mouse, and pig
- Look for patterns:
  - **Similar levels**: Conserved function
  - **Different levels**: Species-specific regulation

**Visual Representation**:
- Bar charts show expression levels
- Colors match the species:
  - Blue bars = Human
  - Green bars = Mouse
  - Orange bars = Pig

**Switching Between Tissues**:
- Use the tissue selector dropdown
- Expression patterns will update automatically
- Different tissues often show very different expression levels

### Data Quality Badges

The platform automatically assesses data quality for each gene:

**🟢 High Quality**:
- Data available in all three species
- Conservation score above 70%
- Multiple enhancers identified
- Good coverage of regulatory elements

**🟡 Medium Quality**:
- Data available in 2 species
- Conservation score 40-70%
- Some enhancers identified

**🔴 Low Quality**:
- Limited species coverage (1 species only)
- Conservation score below 40%
- Few or no enhancers identified
- Consider results preliminary

> **Important**: Low quality doesn't mean the gene is unimportant! It may indicate limited research or technical challenges with that genomic region.

---

## GWAS Portal

The GWAS Portal lets you explore disease and trait associations from genome-wide association studies.

### Browsing by Category

**Available Categories**:
1. **All Traits**: View all 790 traits together
2. **Cardiovascular**: Heart disease, blood pressure, cholesterol
3. **Neurological**: Brain disorders, cognition, psychiatric conditions
4. **Metabolic**: Diabetes, obesity, metabolic syndrome
5. **Immune**: Autoimmune diseases, immune response
6. **Cancer**: Various cancer types and susceptibility
7. **Anthropometric**: Height, weight, body measurements
8. **And more**: Additional specialized categories

**How to Select a Category**:
1. Look for the category pills at the top of the GWAS Portal
2. Click on any category name
3. The trait list below will update to show only traits in that category
4. The count next to each category shows how many traits it contains

### Exploring Traits

**Trait Information Display**:
- **Trait name**: Specific disease or characteristic
- **SNP count**: Number of associated genetic variants
- **Gene count**: Number of genes implicated
- **Category**: Disease/trait category
- **Min P-value**: Strongest association strength

**Selecting a Trait**:
1. Click on any trait card from the list
2. The SNP details panel will appear below
3. You can click different traits to compare their genetic variants

**Searching for Traits**:
1. Use the search box at the top of the portal
2. Type a disease name, trait, or keyword
3. Results filter in real-time
4. Search works across trait names and categories

### Understanding SNP Details

When you select a trait, you'll see detailed information about associated genetic variants:

**SNP Card Information**:
- **RS ID**: Official reference SNP identifier (e.g., rs12345678)
- **Position**: Chromosome and exact location
- **P-value**: Association strength with the trait
- **Effect**: What the variant does (if known)
- **Frequency**: How common the variant is in populations

**Associated Genes**:
- Genes located near the SNP
- Clicking a gene name may take you to the Gene Explorer
- Some SNPs affect multiple genes

**Viewing More SNPs**:
- Use the "Show All SNPs" button to see the complete list
- By default, only the top SNPs are shown
- Pagination controls help you navigate many results

### Finding Genes Associated with Diseases

**To find what genes are linked to a specific disease**:
1. Search for or select the disease trait
2. Look at the SNP details
3. Note the "Associated Genes" section
4. Click on gene names to explore them in the Gene Explorer

**Understanding Gene-Disease Connections**:
- **Direct**: SNP is inside the gene
- **Regulatory**: SNP is in an enhancer controlling the gene
- **Proximity**: SNP is near the gene (may or may not affect it)

> **💡 Research Tip**: A disease may be associated with many genes, each contributing a small effect. The p-value helps identify the strongest associations.

### Understanding the Species Tree

The Species Tree section shows evolutionary relationships:

**Phylogenetic Tree Display**:
- Visual representation of how the three species are related
- Branch lengths indicate evolutionary time
- Shows approximately when species diverged:
  - Human-Mouse/Pig split: ~100 million years ago
  - Mouse-Pig split: ~90 million years ago

### Data Coverage by Species

**Human (Reference Species)**:
- Most comprehensive dataset
- Serves as reference for comparisons
- Includes all GWAS data (human diseases/traits)

**Mouse**:
- Largest enhancer database (3.44M enhancers)
- Extensively studied model organism
- Some tissues have better coverage than human

**Pig**:
- Important for agricultural genomics
- Good coverage of basic regulatory features
- Bridges rodents and primates evolutionarily

**Genome Assembly Information**:
- **Human**: GRCh38 (also called hg38)
- **Mouse**: mm39
- **Pig**: susScr11

> **📌 Note**: Assembly names tell you which version of the genome sequence was used. Different assemblies may have slightly different coordinates.

---

## Downloading Data

### What You Can Download

The platform allows you to export various types of data:

**Gene Region Data**:
- Enhancer locations and scores
- GWAS SNP details
- CTCF binding sites
- Gene coordinates

**Expression Data**:
- TPM values across tissues
- Species comparisons
- Tissue-specific patterns

**Visualizations**:
- Genome browser screenshots (where available)
- Plots and charts
- Conservation matrices

### How to Download

**Look for Download Buttons** (📥 icon) in various sections:

1. **In Gene Explorer**:
   - Click download icon near the gene overview
   - Select what data type to export

2. **In Regulatory Analyzer**:
   - Download filtered regulatory element lists
   - Export aggregate statistics

3. **In GWAS Portal**:
   - Export SNP lists for selected traits
   - Download trait-gene associations

**File Formats**:
- **CSV**: Opens in Excel, suitable for most uses
- **JSON**: For programmatic analysis
- **TSV**: Tab-separated, for bioinformatics tools

### Using Downloaded Data

**Opening CSV Files**:
1. Double-click the downloaded file
2. It should open in Excel or similar spreadsheet software
3. If prompted, confirm that data is comma-separated

**Column Headers Explained**:
- Files include descriptive headers
- Genomic coordinates follow standard formats (chr:start-end)
- Conservation scores range from 0 to 1

> **💡 Data Use**: All data is provided for research purposes. If you use this data in publications, please cite the platform (see scientific background section).

---

## Tips & Best Practices

### Getting the Best Results

**Starting Your Analysis**:
1. Begin with well-studied genes (use example genes)
2. Explore the gene in your tissue of interest
3. Compare across species to understand conservation
4. Look at GWAS hits to understand disease relevance

**Interpreting Conservation**:
- **High conservation** (>70%): Strong evolutionary pressure, likely functionally important
- **Medium conservation** (40-70%): Moderate conservation, possible functional significance
- **Low conservation** (<40%): May be species-specific adaptations

**Understanding Missing Data**:
- Not all genes have equal data quality
- Some tissues are better characterized than others
- Check data quality badges before drawing strong conclusions

### Common Workflows

**Workflow 1: Disease Gene Investigation**
1. Go to GWAS Portal
2. Search for your disease of interest
3. Identify associated SNPs and genes
4. Click on genes to explore in Gene Explorer
5. Check if SNPs overlap with enhancers
6. Examine conservation across species

**Workflow 2: Gene Regulation Analysis**
1. Enter gene in Gene Explorer
2. Select relevant tissue
3. Examine enhancer landscape
4. Compare conservation scores
5. Check CTCF organization
6. View expression patterns across species

**Workflow 3: Comparative Genomics**
1. Start with gene of interest
2. Load data for all three species
3. Use Regulatory Analyzer to compare enhancer counts
4. Identify species-specific elements
5. Examine evolutionary conservation patterns

**Workflow 4: Tissue-Specific Regulation**
1. Select your gene
2. Switch between tissues (Brain, Heart, Liver)
3. Note which enhancers are tissue-specific
4. Compare expression levels across tissues
5. Identify tissue-specific regulatory elements

### Avoiding Common Pitfalls

❌ **Don't**: Ignore data quality indicators
✅ **Do**: Check the quality badge before making conclusions

❌ **Don't**: Assume all enhancers affect the nearest gene
✅ **Do**: Consider that enhancers can act over long distances

❌ **Don't**: Compare genes across tissues without considering expression
✅ **Do**: Check expression levels when interpreting tissue differences

❌ **Don't**: Overlook conservation class information
✅ **Do**: Pay attention to whether elements are conserved, gained, or lost

---

## Frequently Asked Questions

### General Questions

**Q: Is this website free to use?**
A: Yes! CrossGenome.site is completely free for academic and research use.

**Q: Do I need to create an account?**
A: No account is needed. All features are immediately accessible.

**Q: Can I use this data in my research?**
A: Yes, but please cite appropriately (see the scientific background section or README).

**Q: How often is the data updated?**
A: The current version is v2.1, updated October 2025. Check the Stats Dashboard for the latest update date.

### Data Questions

**Q: Why doesn't my gene have any enhancers?**
A: This could mean:
- The gene may not have characterized enhancers yet
- Try selecting a different tissue
- Check if the gene exists in other species
- Look at the data quality indicator

**Q: What does "unlabeled" conservation class mean?**
A: "Unlabeled" means the conservation status hasn't been determined yet. The enhancer exists but its evolutionary classification is pending analysis.

**Q: Why do some tissues have very few enhancers?**
A: Some tissues have been less extensively studied than others. Brain tissue typically has the most comprehensive enhancer maps.

**Q: How accurate are the GWAS associations?**
A: GWAS SNPs shown here meet genome-wide significance thresholds (typically p < 5×10⁻⁸). However, association doesn't prove causation.

**Q: Can I search by chromosome position instead of gene name?**
A: Currently, search is primarily gene-based. Use the Gene Explorer search function with gene symbols.

### Technical Questions

**Q: What genome assemblies are used?**
A: Human (hg38/GRCh38), Mouse (mm39), Pig (susScr11)

**Q: What is TPM in the expression data?**
A: TPM stands for Transcripts Per Million, a normalized measure of gene expression that accounts for gene length and sequencing depth.

**Q: How is conservation score calculated?**
A: Conservation scores reflect sequence similarity and regulatory function conservation across species. Scores range from 0 (not conserved) to 1 (highly conserved).

**Q: What does "tss_kb" mean in the API?**
A: It refers to the window size around the Transcription Start Site in kilobases (kb). For example, tss_kb=100 means 100kb upstream and downstream of where the gene starts.

### Troubleshooting

**Q: The page isn't loading properly**
A: Try:
- Refreshing your browser
- Clearing your browser cache
- Using a different browser
- Checking your internet connection

**Q: Search isn't returning results**
A: Make sure:
- You're using official gene symbols (e.g., "BDNF" not "brain derived neurotrophic factor")
- The gene exists in the selected species
- Spelling is correct

**Q: Download isn't working**
A: Check:
- Your browser's download settings
- Pop-up blocker isn't blocking downloads
- You have enough disk space
- Try a different file format

**Q: Zoom is too sensitive/not working**
A: Use the reset button (⊡) to return to default view, then zoom gradually using the + and - buttons.

---

## Getting Help

### Additional Resources

**Website Resources**:
- **API Documentation**: See the API section on the homepage for programmatic access
- **Platform Statistics**: Check the Stats Dashboard for current data coverage
- **README**: Available in the project repository for technical details

### Scientific Background

This platform is based on research into regulatory landscape evolution and disease genetics. The data integrates:
- **Enhancer data** from ENCODE and Roadmap Epigenomics
- **GWAS data** from the NHGRI-EBI GWAS Catalog
- **Gene annotations** from Ensembl
- **Conservation data** from multi-species alignments

### Contact & Support

For questions, bug reports, or feature requests:
- Check the project GitHub repository: **github.com/wesleygoyette/cross_species_expression_gwas**
- Review existing issues or open a new one
- The development team monitors issues and provides support

### Contributing

Interested in contributing to the platform?
- Visit the GitHub repository
- Check the README for developer setup instructions
- Submit pull requests with improvements
- Report bugs or suggest features via GitHub Issues

---

## Quick Reference

### Glossary of Terms

| Term | Definition |
|------|------------|
| **Assembly** | Version of genome sequence (e.g., hg38) |
| **Conservation** | Similarity across species indicating importance |
| **CTCF** | Protein that organizes chromosome structure |
| **Enhancer** | DNA element that increases gene expression |
| **Expression** | Level of gene activity/RNA production |
| **GWAS** | Genome-wide association study |
| **P-value** | Statistical significance measure (lower = stronger) |
| **rsID** | Reference SNP identifier (e.g., rs6265) |
| **SNP** | Single nucleotide change in DNA |
| **TPM** | Transcripts per million (expression unit) |
| **TSS** | Transcription start site (where gene begins) |

### Keyboard Shortcuts

While most navigation is mouse-based, here are some useful shortcuts:
- **Tab**: Move between input fields
- **Enter**: Submit search queries
- **Esc**: Close pop-up panels and dialogs
- **Ctrl/Cmd + F**: Browser search within page

### Species Color Codes

Remember these color associations throughout the site:
- 🔵 **Blue (#00d4ff)**: Human data
- 🟢 **Green (#00ff88)**: Mouse data  
- 🟠 **Orange (#ff8c42)**: Pig data
- 🟣 **Purple (#a855f7)**: CTCF sites

### Data Quality Checklist

Before interpreting results, verify:
- ✅ Data quality badge (High/Medium/Low)
- ✅ Number of enhancers identified
- ✅ Conservation score
- ✅ Species coverage (1, 2, or 3 species)
- ✅ Tissue-specific warnings

---

## Welcome to CrossGenome Exploration!

You now have everything you need to start exploring gene regulatory landscapes across species. Whether you're investigating disease genetics, studying evolutionary conservation, or simply curious about how genes work, CrossGenome.site provides powerful tools in an easy-to-use interface.

**Remember**: 
- Start with example genes to get familiar with the interface
- Pay attention to data quality indicators
- Compare across species and tissues for deeper insights
- Download data for further analysis
- Consult the FAQ if you run into issues

**Happy exploring! 🧬🔬**

---

*Last updated: October 2025*  
*Platform version: v2.1*  
*For technical support, visit: github.com/wesleygoyette/cross_species_expression_gwas*
