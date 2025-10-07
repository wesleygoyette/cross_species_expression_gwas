import { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronRight, Search, Database, BarChart3, Download, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

interface Endpoint {
  method: 'GET' | 'POST';
  path: string;
  description: string;
  category: string;
  parameters?: Parameter[];
  body?: BodyParam[];
  response: string;
  example: {
    request: string;
    response: string;
  };
}

interface Parameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  default?: string;
}

interface BodyParam {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: string;
}

const endpoints: Endpoint[] = [
  {
    method: 'GET',
    path: '/api/genes/search/',
    description: 'Search genes by symbol with species filtering',
    category: 'Gene & Region',
    parameters: [
      { name: 'q', type: 'string', required: true, description: 'Gene symbol query (e.g., BDNF, FOXP2)' },
      { name: 'species', type: 'string', required: false, description: 'Species ID filter (human, mouse, pig)' },
    ],
    response: 'Array of gene objects with genomic coordinates',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/genes/search/?q=BDNF&species=human" \\
  -H "Accept: application/json"`,
      response: `{
  "results": [
    {
      "symbol": "BDNF",
      "species_id": "human",
      "chromosome": "chr11",
      "start": 27676440,
      "end": 27743605,
      "strand": "+",
      "genome_build": "hg38",
      "description": "Brain Derived Neurotrophic Factor"
    }
  ],
  "count": 1
}`
    }
  },
  {
    method: 'GET',
    path: '/api/genes/region/',
    description: 'Get comprehensive gene region data including enhancers, SNPs, and CTCF sites',
    category: 'Gene & Region',
    parameters: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol' },
      { name: 'species', type: 'string', required: true, description: 'Species identifier' },
      { name: 'tissue', type: 'string', required: false, description: 'Tissue type (brain, heart, liver)' },
      { name: 'tss_kb', type: 'integer', required: false, description: 'Window size around TSS in kb', default: '500' },
      { name: 'classes[]', type: 'array', required: false, description: 'Conservation classes to include' },
    ],
    response: 'Comprehensive gene region data object',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/genes/region/?gene=BDNF&species=human&tissue=brain&tss_kb=500" \\
  -H "Accept: application/json"`,
      response: `{
  "gene_info": {
    "symbol": "BDNF",
    "coordinates": "chr11:27676440-27743605"
  },
  "enhancers": [
    {
      "id": "ENH_001",
      "chromosome": "chr11",
      "start": 27650000,
      "end": 27651000,
      "tissue": "brain",
      "conservation_class": "Mammalian",
      "activity_score": 0.89
    }
  ],
  "gwas_snps": [
    {
      "rsid": "rs6265",
      "position": 27679916,
      "trait": "Depression",
      "p_value": 1.2e-8,
      "risk_allele": "A"
    }
  ],
  "ctcf_sites": 12,
  "ucsc_link": "https://genome.ucsc.edu/..."
}`
    }
  },
  {
    method: 'POST',
    path: '/api/genes/combined-data/',
    description: 'Optimized single request for all gene data including visualizations',
    category: 'Gene & Region',
    body: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol', example: 'BDNF' },
      { name: 'species', type: 'string', required: true, description: 'Species identifier', example: 'human' },
      { name: 'tissue', type: 'string', required: false, description: 'Tissue type', example: 'brain' },
      { name: 'tss_kb', type: 'integer', required: false, description: 'Window size in kb', example: '500' },
      { name: 'classes', type: 'array', required: false, description: 'Conservation classes', example: '["Mammalian", "Vertebrate"]' },
      { name: 'visualization', type: 'object', required: false, description: 'Visualization parameters' },
    ],
    response: 'Combined data object with region, matrix, tracks, and expression data',
    example: {
      request: `curl -X POST "https://crossgenome.site/api/genes/combined-data/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gene": "BDNF",
    "species": "human",
    "tissue": "brain",
    "tss_kb": 500,
    "classes": ["Mammalian"],
    "visualization": {
      "include_tracks": true,
      "include_matrix": true
    }
  }'`,
      response: `{
  "region_data": { ... },
  "matrix_data": {
    "conservation_matrix": [...],
    "species": ["human", "mouse", "pig"],
    "bins": 100
  },
  "tracks_data": {
    "plotly_data": {...}
  },
  "expression_data": {
    "tissues": ["brain", "heart", "liver"],
    "values": [8.5, 2.1, 0.8]
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/genes/presets/',
    description: 'Get predefined gene sets for different tissues and research areas',
    category: 'Gene & Region',
    parameters: [],
    response: 'Object containing curated gene lists by tissue type',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/genes/presets/" \\
  -H "Accept: application/json"`,
      response: `{
  "brain": ["BDNF", "FOXP2", "APOE", "APP"],
  "heart": ["MYH7", "TNNT2", "SCN5A", "KCNQ1"],
  "liver": ["ALB", "PCSK9", "APOB", "CYP3A4"],
  "metabolic": ["INS", "PPARG", "LEP", "GCK"]
}`
    }
  },
  {
    method: 'GET',
    path: '/api/plots/genome-tracks/',
    description: 'Generate genome browser-style tracks with enhancers, SNPs, and genes',
    category: 'Visualization',
    parameters: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol' },
      { name: 'species', type: 'string', required: true, description: 'Species identifier' },
      { name: 'tissue', type: 'string', required: false, description: 'Tissue filter' },
      { name: 'tss_kb', type: 'integer', required: false, description: 'Region window size', default: '500' },
      { name: 'classes[]', type: 'array', required: false, description: 'Conservation classes' },
      { name: 'stack_tracks', type: 'boolean', required: false, description: 'Stack tracks vertically', default: 'true' },
      { name: 'show_gene', type: 'boolean', required: false, description: 'Display gene track', default: 'true' },
      { name: 'show_snps', type: 'boolean', required: false, description: 'Display GWAS SNPs', default: 'true' },
    ],
    response: 'Interactive Plotly visualization data',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/plots/genome-tracks/?gene=BDNF&species=human&tissue=brain" \\
  -H "Accept: application/json"`,
      response: `{
  "data": [
    {
      "type": "scatter",
      "x": [27650000, 27651000],
      "y": [1, 1],
      "mode": "markers",
      "name": "Enhancers"
    }
  ],
  "layout": {
    "title": "BDNF Regulatory Landscape",
    "xaxis": {"title": "Genomic Position"},
    "height": 400
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/plots/conservation-matrix/',
    description: 'Generate conservation heatmap across multiple species',
    category: 'Visualization',
    parameters: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol' },
      { name: 'species', type: 'string', required: true, description: 'Reference species' },
      { name: 'tissue', type: 'string', required: false, description: 'Tissue type' },
      { name: 'tss_kb', type: 'integer', required: false, description: 'Window size', default: '500' },
      { name: 'nbins', type: 'integer', required: false, description: 'Number of bins', default: '100' },
      { name: 'classes[]', type: 'array', required: false, description: 'Conservation classes' },
      { name: 'norm_rows', type: 'boolean', required: false, description: 'Normalize rows', default: 'false' },
    ],
    response: 'Matrix data for heatmap visualization',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/plots/conservation-matrix/?gene=BDNF&species=human&nbins=100" \\
  -H "Accept: application/json"`,
      response: `{
  "matrix": [
    [0.95, 0.87, 0.12, ...],
    [0.92, 0.85, 0.10, ...],
    [0.45, 0.38, 0.05, ...]
  ],
  "species": ["human", "mouse", "pig"],
  "bins": 100,
  "region": "chr11:27176440-28243605"
}`
    }
  },
  {
    method: 'GET',
    path: '/api/plots/expression/',
    description: 'Get gene expression data across tissues and conditions',
    category: 'Visualization',
    parameters: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol' },
      { name: 'log_scale', type: 'boolean', required: false, description: 'Use log scale', default: 'false' },
    ],
    response: 'Expression data with plot configuration',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/plots/expression/?gene=BDNF&log_scale=true" \\
  -H "Accept: application/json"`,
      response: `{
  "expression": {
    "brain": 8.5,
    "heart": 2.1,
    "liver": 0.8,
    "kidney": 1.2
  },
  "plot_config": {
    "type": "bar",
    "log_scale": true
  }
}`
    }
  },
  {
    method: 'GET',
    path: '/api/species/',
    description: 'List all available species and their genome builds',
    category: 'Data',
    parameters: [],
    response: 'Array of species objects with genome information',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/species/" \\
  -H "Accept: application/json"`,
      response: `{
  "species": [
    {
      "id": "human",
      "name": "Homo sapiens",
      "genome_build": "hg38",
      "chromosomes": 24,
      "genes": 89754
    },
    {
      "id": "mouse",
      "name": "Mus musculus",
      "genome_build": "mm39",
      "chromosomes": 21,
      "genes": 72468
    },
    {
      "id": "pig",
      "name": "Sus scrofa",
      "genome_build": "susScr11",
      "chromosomes": 19,
      "genes": 33755
    }
  ]
}`
    }
  },
  {
    method: 'GET',
    path: '/api/gwas/categories/',
    description: 'Get available GWAS trait categories and associated traits',
    category: 'Data',
    parameters: [],
    response: 'Hierarchical trait category data',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/gwas/categories/" \\
  -H "Accept: application/json"`,
      response: `{
  "categories": [
    {
      "name": "Metabolic",
      "traits": ["BMI", "Type 2 Diabetes", "Cholesterol"],
      "count": 142
    },
    {
      "name": "Neurological",
      "traits": ["Alzheimer's", "Parkinson's", "Depression"],
      "count": 98
    },
    {
      "name": "Immune",
      "traits": ["Rheumatoid Arthritis", "Crohn's Disease"],
      "count": 156
    }
  ],
  "total_traits": 790
}`
    }
  },
  {
    method: 'POST',
    path: '/api/analysis/ctcf/',
    description: 'Advanced CTCF binding site and 3D chromatin domain analysis',
    category: 'Analysis',
    body: [
      { name: 'gene', type: 'string', required: true, description: 'Gene symbol', example: 'BDNF' },
      { name: 'species', type: 'string', required: true, description: 'Species identifier', example: 'human' },
      { name: 'link_mode', type: 'string', required: false, description: 'Linking strategy', example: 'nearest' },
      { name: 'tss_kb_ctcf', type: 'integer', required: false, description: 'CTCF search window', example: '1000' },
      { name: 'domain_snap_tss', type: 'boolean', required: false, description: 'Snap domain to TSS' },
      { name: 'conservation_groups', type: 'array', required: false, description: 'Conservation groups' },
    ],
    response: '3D chromatin structure analysis results',
    example: {
      request: `curl -X POST "https://crossgenome.site/api/analysis/ctcf/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gene": "BDNF",
    "species": "human",
    "tss_kb_ctcf": 1000,
    "link_mode": "nearest"
  }'`,
      response: `{
  "domains": [
    {
      "start": 27176440,
      "end": 28243605,
      "boundary_strength": 0.92,
      "ctcf_count": 12
    }
  ],
  "ctcf_sites": [
    {
      "position": 27650000,
      "motif_score": 8.5,
      "conservation": "Mammalian",
      "orientation": "+"
    }
  ],
  "enhancer_interactions": [
    {
      "enhancer_id": "ENH_001",
      "ctcf_distance": 45000,
      "loop_score": 0.78
    }
  ]
}`
    }
  },
  {
    method: 'POST',
    path: '/api/export/',
    description: 'Export genomic data in various formats (CSV, BED, VCF, PNG)',
    category: 'Export & Utility',
    body: [
      { name: 'data_type', type: 'string', required: true, description: 'Type of data to export', example: 'enhancers' },
      { name: 'format', type: 'string', required: true, description: 'Export format', example: 'csv' },
      { name: 'gene', type: 'string', required: false, description: 'Gene filter' },
      { name: 'species', type: 'string', required: false, description: 'Species filter' },
      { name: 'include_metadata', type: 'boolean', required: false, description: 'Include metadata' },
    ],
    response: 'File download or data URL',
    example: {
      request: `curl -X POST "https://crossgenome.site/api/export/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "data_type": "enhancers",
    "format": "csv",
    "gene": "BDNF",
    "species": "human"
  }'`,
      response: `{
  "download_url": "https://crossgenome.site/exports/bdnf_enhancers.csv",
  "expires_at": "2025-10-08T12:00:00Z",
  "size_bytes": 45678,
  "format": "csv"
}`
    }
  },
  {
    method: 'GET',
    path: '/api/health/',
    description: 'API health check and database connectivity status',
    category: 'Export & Utility',
    parameters: [],
    response: 'System health status',
    example: {
      request: `curl -X GET "https://crossgenome.site/api/health/" \\
  -H "Accept: application/json"`,
      response: `{
  "status": "healthy",
  "database": "connected",
  "version": "2.1.0",
  "last_updated": "2025-10-07",
  "uptime_seconds": 8640000
}`
    }
  }
];

const dataModels = [
  {
    name: 'Gene',
    fields: [
      { name: 'symbol', type: 'string', description: 'Gene symbol (e.g., BDNF)' },
      { name: 'species_id', type: 'string', description: 'Species identifier' },
      { name: 'chromosome', type: 'string', description: 'Chromosome name (e.g., chr11)' },
      { name: 'start', type: 'integer', description: 'Genomic start position (0-based)' },
      { name: 'end', type: 'integer', description: 'Genomic end position' },
      { name: 'strand', type: 'string', description: 'Strand orientation (+/-)' },
      { name: 'genome_build', type: 'string', description: 'Genome assembly version' },
    ]
  },
  {
    name: 'Enhancer',
    fields: [
      { name: 'id', type: 'string', description: 'Unique enhancer identifier' },
      { name: 'chromosome', type: 'string', description: 'Chromosome name' },
      { name: 'start', type: 'integer', description: 'Enhancer start position' },
      { name: 'end', type: 'integer', description: 'Enhancer end position' },
      { name: 'tissue', type: 'string', description: 'Tissue specificity' },
      { name: 'conservation_class', type: 'string', description: 'Conservation class (Mammalian/Vertebrate/Primate)' },
      { name: 'activity_score', type: 'float', description: 'Regulatory activity score (0-1)' },
    ]
  },
  {
    name: 'GWAS SNP',
    fields: [
      { name: 'rsid', type: 'string', description: 'dbSNP reference ID' },
      { name: 'chromosome', type: 'string', description: 'Chromosome name' },
      { name: 'position', type: 'integer', description: 'Genomic position' },
      { name: 'trait', type: 'string', description: 'Associated phenotype/disease' },
      { name: 'p_value', type: 'float', description: 'Association p-value' },
      { name: 'risk_allele', type: 'string', description: 'Risk-conferring allele' },
      { name: 'odds_ratio', type: 'float', description: 'Effect size (OR or beta)' },
    ]
  },
  {
    name: 'CTCF Site',
    fields: [
      { name: 'position', type: 'integer', description: 'Binding site position' },
      { name: 'motif_score', type: 'float', description: 'Motif match score' },
      { name: 'conservation', type: 'string', description: 'Conservation status' },
      { name: 'orientation', type: 'string', description: 'Binding orientation (+/-)' },
      { name: 'chip_signal', type: 'float', description: 'ChIP-seq signal strength' },
    ]
  }
];

export function APIDocumentation() {
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const categories = Array.from(new Set(endpoints.map(e => e.category)));

  const filteredEndpoints = endpoints.filter(endpoint =>
    endpoint.path.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    endpoint.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const copyCode = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const toggleEndpoint = (path: string) => {
    setExpandedEndpoint(expandedEndpoint === path ? null : path);
  };

  const getMethodColor = (method: 'GET' | 'POST') => {
    return method === 'GET' ? 'bg-[var(--genomic-green)]' : 'bg-[var(--genomic-blue)]';
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Gene & Region': return <Database className="w-4 h-4" />;
      case 'Visualization': return <BarChart3 className="w-4 h-4" />;
      case 'Data': return <Search className="w-4 h-4" />;
      case 'Analysis': return <Activity className="w-4 h-4" />;
      case 'Export & Utility': return <Download className="w-4 h-4" />;
      default: return <Code className="w-4 h-4" />;
    }
  };

  return (
    <section id="api" className="py-20 px-4 bg-gradient-to-b from-background to-secondary/20">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12 text-center">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Developer Resources
          </Badge>
          <h2 className="mb-8 bg-gradient-to-r from-primary via-[var(--genomic-green)] to-primary bg-clip-text text-transparent text-4xl">
            API Documentation
          </h2>
          <p className="text-muted-foreground max-w-3xl mx-auto">
            Integrate RegLand's cross-species genomic analysis into your research workflows. 
            Access 3.9M regulatory elements, 195,977 genes, and 790 GWAS traits through our RESTful API.
          </p>
        </div>

        {/* API Overview Card */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Code className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-foreground">Base URL</h3>
            </div>
            <code className="text-sm text-muted-foreground font-mono">
              https://crossgenome.site
            </code>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--genomic-green)]/10 rounded-lg">
                <Activity className="w-5 h-5 text-[var(--genomic-green)]" />
              </div>
              <h3 className="text-foreground">Rate Limits</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              1000 requests/hour
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-[var(--data-orange)]/10 rounded-lg">
                <Database className="w-5 h-5 text-[var(--data-orange)]" />
              </div>
              <h3 className="text-foreground">Format</h3>
            </div>
            <p className="text-sm text-muted-foreground">
              JSON (application/json)
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search endpoints..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-input-background border-border"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="endpoints" className="space-y-6">
          <TabsList className="bg-secondary/50 border border-border">
            <TabsTrigger value="endpoints">Endpoints</TabsTrigger>
            <TabsTrigger value="models">Data Models</TabsTrigger>
            <TabsTrigger value="authentication">Authentication</TabsTrigger>
            <TabsTrigger value="errors">Error Codes</TabsTrigger>
          </TabsList>

          {/* Endpoints Tab */}
          <TabsContent value="endpoints" className="space-y-8">
            {categories.map(category => {
              const categoryEndpoints = filteredEndpoints.filter(e => e.category === category);
              if (categoryEndpoints.length === 0) return null;

              return (
                <div key={category} className="space-y-4">
                  <div className="flex items-center gap-3 pb-2 border-b border-border">
                    {getCategoryIcon(category)}
                    <h3 className="text-foreground">{category} Endpoints</h3>
                    <Badge variant="outline" className="ml-auto">
                      {categoryEndpoints.length}
                    </Badge>
                  </div>

                  {categoryEndpoints.map(endpoint => (
                    <div
                      key={endpoint.path}
                      className="bg-card border border-border rounded-lg overflow-hidden hover:border-primary/30 transition-colors"
                    >
                      {/* Endpoint Header */}
                      <button
                        onClick={() => toggleEndpoint(endpoint.path)}
                        className="w-full p-4 flex items-center gap-4 hover:bg-accent/50 transition-colors text-left"
                      >
                        <Badge className={`${getMethodColor(endpoint.method)} text-black px-3 py-1 font-mono`}>
                          {endpoint.method}
                        </Badge>
                        <code className="flex-1 font-mono text-sm text-foreground">
                          {endpoint.path}
                        </code>
                        {expandedEndpoint === endpoint.path ? (
                          <ChevronDown className="w-5 h-5 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-muted-foreground" />
                        )}
                      </button>

                      {/* Expanded Content */}
                      {expandedEndpoint === endpoint.path && (
                        <div className="border-t border-border">
                          <div className="p-6 space-y-6">
                            {/* Description */}
                            <p className="text-muted-foreground">{endpoint.description}</p>

                            {/* Parameters */}
                            {endpoint.parameters && endpoint.parameters.length > 0 && (
                              <div>
                                <h4 className="mb-3 text-foreground">Parameters</h4>
                                <div className="bg-secondary/30 rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-secondary/50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Name</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Type</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Required</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.parameters.map((param, idx) => (
                                        <tr key={idx} className="border-t border-border/50">
                                          <td className="px-4 py-2">
                                            <code className="text-sm text-primary font-mono">{param.name}</code>
                                          </td>
                                          <td className="px-4 py-2">
                                            <code className="text-sm text-[var(--genomic-green)] font-mono">{param.type}</code>
                                          </td>
                                          <td className="px-4 py-2">
                                            <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                                              {param.required ? 'Yes' : 'No'}
                                            </Badge>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-muted-foreground">
                                            {param.description}
                                            {param.default && (
                                              <span className="ml-2 text-xs text-[var(--data-orange)]">
                                                (default: {param.default})
                                              </span>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Body Parameters */}
                            {endpoint.body && endpoint.body.length > 0 && (
                              <div>
                                <h4 className="mb-3 text-foreground">Request Body</h4>
                                <div className="bg-secondary/30 rounded-lg overflow-hidden">
                                  <table className="w-full">
                                    <thead className="bg-secondary/50">
                                      <tr>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Field</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Type</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Required</th>
                                        <th className="px-4 py-2 text-left text-sm text-foreground">Description</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {endpoint.body.map((param, idx) => (
                                        <tr key={idx} className="border-t border-border/50">
                                          <td className="px-4 py-2">
                                            <code className="text-sm text-primary font-mono">{param.name}</code>
                                          </td>
                                          <td className="px-4 py-2">
                                            <code className="text-sm text-[var(--genomic-green)] font-mono">{param.type}</code>
                                          </td>
                                          <td className="px-4 py-2">
                                            <Badge variant={param.required ? "default" : "outline"} className="text-xs">
                                              {param.required ? 'Yes' : 'No'}
                                            </Badge>
                                          </td>
                                          <td className="px-4 py-2 text-sm text-muted-foreground">
                                            {param.description}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            )}

                            {/* Example Request */}
                            <div>
                              <h4 className="mb-3 text-foreground">Example Request</h4>
                              <div className="relative group">
                                <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto border border-border/50">
                                  <code className="text-sm font-mono">{endpoint.example.request}</code>
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyCode(endpoint.example.request, `req-${endpoint.path}`)}
                                >
                                  {copiedCode === `req-${endpoint.path}` ? (
                                    <Check className="w-4 h-4 text-[var(--genomic-green)]" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            {/* Example Response */}
                            <div>
                              <h4 className="mb-3 text-foreground">Example Response</h4>
                              <div className="relative group">
                                <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto border border-border/50">
                                  <code className="text-sm font-mono">{endpoint.example.response}</code>
                                </pre>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  onClick={() => copyCode(endpoint.example.response, `res-${endpoint.path}`)}
                                >
                                  {copiedCode === `res-${endpoint.path}` ? (
                                    <Check className="w-4 h-4 text-[var(--genomic-green)]" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              );
            })}
          </TabsContent>

          {/* Data Models Tab */}
          <TabsContent value="models" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4 text-foreground">Core Data Models</h3>
              <p className="text-muted-foreground mb-6">
                Understanding the data structures returned by RegLand API endpoints.
              </p>

              <div className="space-y-6">
                {dataModels.map((model, idx) => (
                  <div key={idx} className="space-y-3">
                    <h4 className="text-foreground flex items-center gap-2">
                      <Code className="w-4 h-4 text-primary" />
                      {model.name}
                    </h4>
                    <div className="bg-secondary/30 rounded-lg overflow-hidden">
                      <table className="w-full">
                        <thead className="bg-secondary/50">
                          <tr>
                            <th className="px-4 py-2 text-left text-sm text-foreground">Field</th>
                            <th className="px-4 py-2 text-left text-sm text-foreground">Type</th>
                            <th className="px-4 py-2 text-left text-sm text-foreground">Description</th>
                          </tr>
                        </thead>
                        <tbody>
                          {model.fields.map((field, fidx) => (
                            <tr key={fidx} className="border-t border-border/50">
                              <td className="px-4 py-2">
                                <code className="text-sm text-primary font-mono">{field.name}</code>
                              </td>
                              <td className="px-4 py-2">
                                <code className="text-sm text-[var(--genomic-green)] font-mono">{field.type}</code>
                              </td>
                              <td className="px-4 py-2 text-sm text-muted-foreground">
                                {field.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Authentication Tab */}
          <TabsContent value="authentication" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4 text-foreground">Authentication</h3>
              <p className="text-muted-foreground mb-6">
                Currently, the RegLand API is open for academic research use. For production deployments 
                or high-volume queries, please contact us for API key provisioning.
              </p>

              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg p-4">
                  <h4 className="mb-2 text-foreground">For Future API Key Authentication:</h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    Include your API key in the request header:
                  </p>
                  <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto">
                    <code className="text-sm font-mono">{`curl -X GET "https://crossgenome.site/api/genes/search/?q=BDNF" \\
  -H "Authorization: Bearer YOUR_API_KEY_HERE" \\
  -H "Accept: application/json"`}</code>
                  </pre>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="mb-2 text-primary">Research Data Usage</h4>
                  <p className="text-sm text-muted-foreground">
                    RegLand is provided for academic research purposes. Please cite{' '}
                    <span className="text-primary font-mono">Berthelot et al. Nature Ecology & Evolution 2018</span>{' '}
                    when using data from this platform in publications.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Error Codes Tab */}
          <TabsContent value="errors" className="space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
              <h3 className="mb-4 text-foreground">HTTP Status Codes</h3>
              <p className="text-muted-foreground mb-6">
                RegLand API uses standard HTTP response codes to indicate success or failure.
              </p>

              <div className="space-y-4">
                <div className="bg-secondary/30 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="px-4 py-2 text-left text-sm text-foreground">Code</th>
                        <th className="px-4 py-2 text-left text-sm text-foreground">Status</th>
                        <th className="px-4 py-2 text-left text-sm text-foreground">Description</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-2">
                          <code className="text-sm text-[var(--genomic-green)] font-mono">200</code>
                        </td>
                        <td className="px-4 py-2 text-foreground">OK</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Request successful</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-2">
                          <code className="text-sm text-[var(--data-orange)] font-mono">400</code>
                        </td>
                        <td className="px-4 py-2 text-foreground">Bad Request</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Invalid parameters or request body</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-2">
                          <code className="text-sm text-[var(--data-orange)] font-mono">404</code>
                        </td>
                        <td className="px-4 py-2 text-foreground">Not Found</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Gene, species, or resource not found</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-2">
                          <code className="text-sm text-destructive font-mono">429</code>
                        </td>
                        <td className="px-4 py-2 text-foreground">Too Many Requests</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Rate limit exceeded</td>
                      </tr>
                      <tr className="border-t border-border/50">
                        <td className="px-4 py-2">
                          <code className="text-sm text-destructive font-mono">500</code>
                        </td>
                        <td className="px-4 py-2 text-foreground">Internal Server Error</td>
                        <td className="px-4 py-2 text-sm text-muted-foreground">Server error, please try again</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                <h4 className="mt-6 mb-3 text-foreground">Error Response Format</h4>
                <pre className="bg-[#0d1117] text-[#c9d1d9] p-4 rounded-lg overflow-x-auto border border-border/50">
                  <code className="text-sm font-mono">{`{
  "error": {
    "code": 404,
    "message": "Gene 'INVALID' not found in species 'human'",
    "details": "Please check gene symbol spelling or try a different species"
  }
}`}</code>
                </pre>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* SDK Section */}
        <div className="mt-12 bg-gradient-to-r from-primary/10 via-[var(--genomic-green)]/10 to-primary/10 border border-primary/20 rounded-lg p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-primary/10 rounded-lg">
              <Code className="w-6 h-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="mb-2 text-foreground">Client Libraries & SDKs</h3>
              <p className="text-muted-foreground mb-4">
                Official Python and R packages for seamless integration with your genomics analysis pipelines.
              </p>
              <div className="flex flex-wrap gap-3">
                <Badge variant="outline" className="bg-card">
                  Python SDK (Coming Soon)
                </Badge>
                <Badge variant="outline" className="bg-card">
                  R Package (Coming Soon)
                </Badge>
                <Badge variant="outline" className="bg-card">
                  JavaScript/Node.js (Coming Soon)
                </Badge>
              </div>
            </div>
          </div>
        </div>

        {/* Support Section */}
        <div className="mt-8 grid md:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="mb-3 text-foreground">Need Help?</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Join our developer community or contact our research team for API support.
            </p>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              Contact Support
            </Button>
          </div>

          <div className="bg-card border border-border rounded-lg p-6">
            <h4 className="mb-3 text-foreground">API Updates</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Stay informed about new endpoints, features, and breaking changes.
            </p>
            <Button variant="outline" className="border-primary/30 hover:bg-primary/10">
              View Changelog
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
