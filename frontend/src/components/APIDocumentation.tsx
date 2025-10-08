import { useState } from 'react';
import { Code, Copy, Check, ChevronDown, ChevronRight, Search, Database, BarChart3, Download, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';

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
            { name: 'species', type: 'string', required: false, description: 'Species ID filter (human_hg38, mouse_mm39, pig_susScr11)', default: 'human_hg38' },
        ],
        response: 'Array of gene objects with genomic coordinates',
        example: {
            request: `curl -X GET "https://crossgenome.site/api/genes/search/?q=BDNF&species=human_hg38" \\
  -H "Accept: application/json"`,
            response: `{
  "genes": [
    {
      "gene_id": "ENSG00000176697",
      "symbol": "BDNF",
      "species_id": "human_hg38",
      "chrom": "chr11",
      "start": 27676440,
      "end": 27743605
    }
  ]
}`
        }
    },
    {
        method: 'GET',
        path: '/api/genes/region/',
        description: 'Get comprehensive gene region data including enhancers, SNPs, and CTCF sites',
        category: 'Gene & Region',
        parameters: [
            { name: 'gene', type: 'string', required: true, description: 'Gene symbol', default: 'BDNF' },
            { name: 'species', type: 'string', required: false, description: 'Species identifier', default: 'human_hg38' },
            { name: 'tissue', type: 'string', required: false, description: 'Tissue type (Brain, Heart, Liver)', default: 'Liver' },
            { name: 'tss_kb', type: 'integer', required: false, description: 'Window size around TSS in kb', default: '100' },
            { name: 'classes[]', type: 'array', required: false, description: 'Conservation classes to include (conserved, gained, lost, unlabeled)' },
        ],
        response: 'Comprehensive gene region data object',
        example: {
            request: `curl -X GET "https://crossgenome.site/api/genes/region/?gene=BDNF&species=human_hg38&tissue=Liver&tss_kb=100" \\
  -H "Accept: application/json"`,
            response: `{
  "gene": {
    "gene_id": "ENSG00000176697",
    "symbol": "BDNF",
    "chrom": "chr11",
    "start": 27676440,
    "end": 27743605,
    "tss": 27676440
  },
  "enhancers": [
    {
      "enh_id": "ENH_001",
      "chrom": "chr11",
      "start": 27650000,
      "end": 27651000,
      "tissue": "Liver",
      "score": 0.89,
      "class": "conserved"
    }
  ],
  "gwas_snps": [
    {
      "snp_id": "rs6265",
      "rsid": "rs6265",
      "chrom": "chr11",
      "pos": 27679916,
      "trait": "Depression",
      "pval": 1.2e-8,
      "category": "Neurological"
    }
  ],
  "ctcf_sites": [
    {
      "site_id": "CTCF_001",
      "chrom": "chr11",
      "start": 27650000,
      "end": 27650100
    }
  ],
  "ucsc_url": "https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr11:27676440-27743605"
}`
        }
    },
    {
        method: 'POST',
        path: '/api/genes/combined-data/',
        description: 'Optimized single request for all gene data including visualizations',
        category: 'Gene & Region',
        body: [
            { name: 'gene', type: 'string', required: false, description: 'Gene symbol', example: 'BDNF' },
            { name: 'species', type: 'string', required: false, description: 'Species identifier', example: 'human_hg38' },
            { name: 'tissue', type: 'string', required: false, description: 'Tissue type', example: 'Liver' },
            { name: 'tss_kb', type: 'integer', required: false, description: 'Window size in kb', example: '100' },
            { name: 'classes', type: 'array', required: false, description: 'Conservation classes', example: '["conserved", "gained", "lost", "unlabeled"]' },
            { name: 'nbins', type: 'integer', required: false, description: 'Number of bins for matrix', example: '30' },
            { name: 'normalize_rows', type: 'boolean', required: false, description: 'Normalize matrix rows' },
            { name: 'mark_tss', type: 'boolean', required: false, description: 'Mark TSS on plots' },
            { name: 'stack_tracks', type: 'boolean', required: false, description: 'Stack genome tracks' },
            { name: 'show_gene', type: 'boolean', required: false, description: 'Show gene track' },
            { name: 'show_snps', type: 'boolean', required: false, description: 'Show GWAS SNPs' },
            { name: 'log_expression', type: 'boolean', required: false, description: 'Use log scale for expression' },
        ],
        response: 'Combined data object with region, matrix, tracks, and expression data',
        example: {
            request: `curl -X POST "https://crossgenome.site/api/genes/combined-data/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gene": "BDNF",
    "species": "human_hg38",
    "tissue": "Liver",
    "tss_kb": 100,
    "classes": ["conserved", "gained"],
    "nbins": 30,
    "normalize_rows": false,
    "mark_tss": true,
    "stack_tracks": true,
    "show_gene": true,
    "show_snps": true,
    "log_expression": false
  }'`,
            response: `{
  "regionData": {
    "gene": {...},
    "enhancers": [...],
    "gwas_snps": [...],
    "ctcf_sites": [...]
  },
  "matrixData": {
    "matrix": [...],
    "species": ["human_hg38", "mouse_mm39", "pig_susScr11"],
    "bins": 30
  },
  "tracksData": {
    "data": [...],
    "layout": {...}
  },
  "exprData": {
    "tissues": ["Brain", "Heart", "Liver"],
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
  "presets": {
    "brain": {
      "tissue": "Brain",
      "genes": ["BDNF", "SCN1A", "GRIN2B", "DRD2", "APOE"]
    },
    "heart": {
      "tissue": "Heart",
      "genes": ["TTN", "MYH6", "MYH7", "PLN", "KCNQ1"]
    },
    "liver": {
      "tissue": "Liver",
      "genes": ["ALB", "APOB", "CYP3A4", "HNF4A", "PCSK9"]
    }
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
      "id": "human_hg38",
      "name": "Human (hg38)"
    },
    {
      "id": "mouse_mm39",
      "name": "Mouse (mm39)"
    },
    {
      "id": "macaque_rheMac10",
      "name": "Macaque (rheMac10)"
    },
    {
      "id": "chicken_galGal6",
      "name": "Chicken (galGal6)"
    },
    {
      "id": "pig_susScr11",
      "name": "Pig (susScr11)"
    }
  ]
}`
        }
    },
    {
        method: 'GET',
        path: '/api/gwas/categories/',
        description: 'Get available GWAS trait categories with counts',
        category: 'Data',
        parameters: [],
        response: 'List of GWAS categories with trait counts',
        example: {
            request: `curl -X GET "https://crossgenome.site/api/gwas/categories/" \\
  -H "Accept: application/json"`,
            response: `{
  "categories": [
    {
      "id": "Metabolic",
      "name": "Metabolic",
      "count": 142
    },
    {
      "id": "Neurological",
      "name": "Neurological",
      "count": 98
    },
    {
      "id": "Immune",
      "name": "Immune",
      "count": 156
    }
  ]
}`
        }
    },
    {
        method: 'POST',
        path: '/api/gwas/traits/',
        description: 'Get GWAS traits with aggregated statistics',
        category: 'Data',
        body: [
            { name: 'category', type: 'string', required: false, description: 'Filter by category (or "all")', example: 'Neurological' },
        ],
        response: 'List of traits with SNP and gene counts',
        example: {
            request: `curl -X POST "https://crossgenome.site/api/gwas/traits/" \\
  -H "Content-Type: application/json" \\
  -d '{"category": "Neurological"}'`,
            response: `{
  "traits": [
    {
      "trait": "Alzheimer's Disease",
      "snp_count": 245,
      "gene_count": 89,
      "category": "Neurological",
      "min_pval": 1.2e-15
    },
    {
      "trait": "Parkinson's Disease",
      "snp_count": 178,
      "gene_count": 67,
      "category": "Neurological",
      "min_pval": 3.4e-12
    }
  ]
}`
        }
    },
    {
        method: 'POST',
        path: '/api/gwas/trait-snps/',
        description: 'Get detailed SNP information for a specific trait',
        category: 'Data',
        body: [
            { name: 'trait', type: 'string', required: true, description: 'GWAS trait name', example: "Alzheimer's Disease" },
            { name: 'limit', type: 'integer', required: false, description: 'Maximum number of SNPs to return', example: '100' },
        ],
        response: 'Detailed SNP information with associated genes',
        example: {
            request: `curl -X POST "https://crossgenome.site/api/gwas/trait-snps/" \\
  -H "Content-Type: application/json" \\
  -d '{"trait": "Alzheimer'"'"'s Disease", "limit": 100}'`,
            response: `{
  "snps": [
    {
      "snp_id": "chr19_45411941",
      "rsid": "rs429358",
      "chrom": "chr19",
      "pos": 45411941,
      "trait": "Alzheimer's Disease",
      "pval": 1.2e-15,
      "category": "Neurological",
      "source": "GWAS Catalog",
      "associated_genes": "APOE,APOC1"
    }
  ],
  "total_count": 245
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
            { name: 'species', type: 'string', required: false, description: 'Species identifier', example: 'human_hg38' },
            { name: 'link_mode', type: 'string', required: false, description: 'Linking strategy (gene, nearest)', example: 'gene' },
            { name: 'tss_kb_ctcf', type: 'integer', required: false, description: 'CTCF search window in kb', example: '250' },
            { name: 'domain_snap_tss', type: 'boolean', required: false, description: 'Snap domain to TSS', example: 'true' },
            { name: 'ctcf_cons_groups', type: 'array', required: false, description: 'CTCF conservation groups', example: '["conserved", "human_specific"]' },
            { name: 'enh_cons_groups', type: 'array', required: false, description: 'Enhancer conservation groups', example: '["conserved", "gained", "lost"]' },
            { name: 'ctcf_dist_cap_kb', type: 'integer', required: false, description: 'Distance cap for CTCF analysis', example: '250' },
        ],
        response: '3D chromatin structure analysis results with visualizations',
        example: {
            request: `curl -X POST "https://crossgenome.site/api/analysis/ctcf/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "gene": "BDNF",
    "species": "human_hg38",
    "tss_kb_ctcf": 250,
    "link_mode": "gene",
    "domain_snap_tss": true,
    "ctcf_cons_groups": ["conserved", "human_specific"],
    "enh_cons_groups": ["conserved", "gained", "lost", "unlabeled"]
  }'`,
            response: `{
  "domain_region": {
    "chrom": "chr11",
    "start": 27426440,
    "end": 27993605,
    "gene_symbol": "BDNF"
  },
  "ctcf_sites": [
    {
      "site_id": "CTCF_001",
      "chrom": "chr11",
      "start": 27450000,
      "end": 27450100,
      "conservation": "conserved",
      "score": 8.5
    }
  ],
  "enhancers": [
    {
      "enh_id": "ENH_001",
      "chrom": "chr11",
      "start": 27650000,
      "end": 27651000,
      "class": "conserved"
    }
  ],
  "gwas_snps": [
    {
      "snp_id": "rs6265",
      "rsid": "rs6265",
      "pos": 27679916
    }
  ],
  "tracks_plot": {
    "data": [...],
    "layout": {...}
  },
  "distance_plot": {
    "data": [...],
    "layout": {...}
  },
  "enhancers_plot": {
    "data": [...],
    "layout": {...}
  },
  "expression_plot": {
    "data": [...],
    "layout": {...}
  },
  "gwas_table": {
    "columns": [...],
    "data": [...]
  },
  "ctcf_table": {
    "columns": [...],
    "data": [...]
  },
  "stats": {
    "ctcf_count": 12,
    "enhancer_count": 45,
    "gwas_snp_count": 8
  }
}`
        }
    },
    {
        method: 'POST',
        path: '/api/export/',
        description: 'Export genomic data in various formats (currently under development)',
        category: 'Export & Utility',
        body: [
            { name: 'type', type: 'string', required: false, description: 'Export format type', example: 'csv' },
            { name: 'data_type', type: 'string', required: false, description: 'Type of data to export', example: 'gwas' },
        ],
        response: 'Export functionality status',
        example: {
            request: `curl -X POST "https://crossgenome.site/api/export/" \\
  -H "Content-Type: application/json" \\
  -d '{
    "type": "csv",
    "data_type": "gwas"
  }'`,
            response: `{
  "message": "Export functionality to be implemented"
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
  "message": "Regland API is running",
  "database": "connected"
}`
        }
    }
];

const dataModels = [
    {
        name: 'Gene',
        fields: [
            { name: 'gene_id', type: 'string', description: 'Unique gene identifier (e.g., ENSG00000176697)' },
            { name: 'symbol', type: 'string', description: 'Gene symbol (e.g., BDNF)' },
            { name: 'species_id', type: 'string', description: 'Species identifier (e.g., human_hg38, mouse_mm39)' },
            { name: 'chrom', type: 'string', description: 'Chromosome name (e.g., chr11)' },
            { name: 'start', type: 'integer', description: 'Genomic start position (0-based)' },
            { name: 'end', type: 'integer', description: 'Genomic end position' },
        ]
    },
    {
        name: 'Enhancer',
        fields: [
            { name: 'enh_id', type: 'string', description: 'Unique enhancer identifier' },
            { name: 'chrom', type: 'string', description: 'Chromosome name' },
            { name: 'start', type: 'integer', description: 'Enhancer start position' },
            { name: 'end', type: 'integer', description: 'Enhancer end position' },
            { name: 'tissue', type: 'string', description: 'Tissue specificity (e.g., Brain, Heart, Liver)' },
            { name: 'score', type: 'float', description: 'Regulatory activity score' },
            { name: 'class', type: 'string', description: 'Conservation class (conserved, gained, lost, unlabeled)' },
            { name: 'source', type: 'string', description: 'Data source' },
        ]
    },
    {
        name: 'GWAS SNP',
        fields: [
            { name: 'snp_id', type: 'string', description: 'Unique SNP identifier' },
            { name: 'rsid', type: 'string', description: 'dbSNP reference ID (e.g., rs6265)' },
            { name: 'chrom', type: 'string', description: 'Chromosome name' },
            { name: 'pos', type: 'integer', description: 'Genomic position' },
            { name: 'trait', type: 'string', description: 'Associated phenotype/disease' },
            { name: 'pval', type: 'float', description: 'Association p-value' },
            { name: 'category', type: 'string', description: 'Trait category' },
            { name: 'source', type: 'string', description: 'GWAS data source' },
        ]
    },
    {
        name: 'CTCF Site',
        fields: [
            { name: 'site_id', type: 'string', description: 'Unique CTCF site identifier' },
            { name: 'chrom', type: 'string', description: 'Chromosome name' },
            { name: 'start', type: 'integer', description: 'Binding site start position' },
            { name: 'end', type: 'integer', description: 'Binding site end position' },
            { name: 'score', type: 'float', description: 'Motif match score' },
            { name: 'conservation', type: 'string', description: 'Conservation status' },
        ]
    }
];

export function APIDocumentation() {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedEndpoint, setExpandedEndpoint] = useState<string | null>(null);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('endpoints');

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
                    <h2 className="mb-4 bg-gradient-to-r from-primary via-[var(--genomic-green)] to-primary bg-clip-text text-transparent text-4xl">
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
                <div className="space-y-6">
                    {/* Custom Tabs Navigation */}
                    <div className="flex flex-wrap gap-1 p-0.5 bg-secondary/30 border border-border rounded-md">
                        <button
                            onClick={() => setActiveTab('authentication')}
                            className={`flex-1 min-w-[120px] px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${activeTab === 'authentication'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Endpoints
                        </button>
                        <button
                            onClick={() => setActiveTab('models')}
                            className={`flex-1 min-w-[120px] px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${activeTab === 'models'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Data Models
                        </button>
                        <button
                            onClick={() => setActiveTab('endpoints')}
                            className={`flex-1 min-w-[120px] px-2 sm:px-3 py-1.5 rounded text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap ${activeTab === 'endpoints'
                                ? 'bg-primary text-primary-foreground'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            Error Codes
                        </button>

                    </div>

                    {/* Endpoints Tab */}
                    {activeTab === 'endpoints' && (
                        <div className="space-y-8">
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
                        </div>
                    )}

                    {/* Data Models Tab */}
                    {activeTab === 'models' && (
                        <div className="space-y-6">
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
                        </div>
                    )}

                    {/* Authentication Tab */}
                    {activeTab === 'authentication' && (
                        <div className="space-y-6">
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
                        </div>
                    )}

                    {/* Error Codes Tab */}
                    {activeTab === 'errors' && (
                        <div className="space-y-6">
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
                        </div>
                    )}
                </div>

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
                        <Button
                            asChild
                            variant="outline"
                            className="border-primary/30 hover:bg-primary/10"
                        >
                            <a href="mailto:wesley.goyette@gmail.com">
                                Contact Support
                            </a>
                        </Button>
                    </div>

                    <div className="bg-card border border-border rounded-lg p-6">
                        <h4 className="mb-3 text-foreground">API Updates</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                            Stay informed about new endpoints, features, and breaking changes.
                        </p>
                        <Button
                            asChild
                            variant="outline"
                            className="border-primary/30 hover:bg-primary/10"
                        >
                            <a
                                href="https://github.com/wesleygoyette/cross_species_expression_gwas/commits/main/"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                View Changelog
                            </a>
                        </Button>
                    </div>
                </div>
            </div>
        </section>
    );
}
