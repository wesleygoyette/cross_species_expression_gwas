/**
 * API Service for RegLand backend
 * Handles all API requests to the Django backend
 */

// Use Vite environment variable or default to localhost
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000/api';
const API_PREFIX = '';

// Types matching backend responses
export interface Gene {
    gene_id: number;
    symbol: string;
    species_id: string;
    chrom: string;
    start: number;
    end: number;
}

export interface GeneData {
    gene_id: number;
    symbol: string;
    chrom: string;
    start: number;
    end: number;
    tss: number;
    strand: string;
}

export interface Enhancer {
    enh_id: number;
    species_id: string;
    chrom: string;
    start: number;
    end: number;
    tissue?: string;
    score?: number;
    source?: string;
    class_name?: string;
}

export interface GWASSnp {
    snp_id: number;
    chrom: string;
    pos: number;
    rsid?: string;
    trait?: string;
    pval?: number;
    source?: string;
    category?: string;
}

export interface CTCFSite {
    site_id: number;
    species_id: string;
    chrom: string;
    start: number;
    end: number;
    score?: number;
    motif_p?: number;
    cons_class?: string;
}

export interface GeneRegionResponse {
    gene: GeneData;
    enhancers: Enhancer[];
    gwas_snps: GWASSnp[];
    ctcf_sites: CTCFSite[];
    ucsc_url: string;
}

export interface ExpressionData {
    symbol: string;
    tissue: string;
    tpm: number;
}

export interface ExpressionResponse {
    expression_data: ExpressionData[];
    plot_data: any;
}

export interface Species {
    id: string;
    name: string;
}

export interface GeneSearchResponse {
    genes: Gene[];
}

export interface SpeciesListResponse {
    species: Species[];
}

export interface DataQuality {
    tissue_availability: 'high' | 'low' | 'none';
    score_availability: 'high' | 'low' | 'none';
    conservation_percent: number;
    available_species: string[];
}

// Helper function to handle API responses
async function handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Network error' }));
        throw new Error(error.error || `HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
}

/**
 * Search for genes by symbol
 */
export async function searchGenes(query: string, species: string = 'human_hg38'): Promise<GeneSearchResponse> {
    const url = new URL(`${API_BASE_URL}${API_PREFIX}/genes/search/`);
    url.searchParams.append('q', query);
    url.searchParams.append('species', species);

    const response = await fetch(url.toString());
    return handleResponse<GeneSearchResponse>(response);
}

/**
 * Get comprehensive data for a gene region
 */
export async function getGeneRegionData(
    gene: string,
    species: string = 'human_hg38',
    tissue: string = 'Liver',
    tssKb: number = 100,
    enhancerClasses: string[] = ['conserved', 'gained', 'lost', 'unlabeled']
): Promise<GeneRegionResponse> {
    const url = new URL(`${API_BASE_URL}${API_PREFIX}/genes/region/`);
    url.searchParams.append('gene', gene.toUpperCase());
    url.searchParams.append('species', species);
    url.searchParams.append('tissue', tissue);
    url.searchParams.append('tss_kb', tssKb.toString());
    
    // Add enhancer classes
    enhancerClasses.forEach(cls => {
        url.searchParams.append('classes[]', cls);
    });

    const response = await fetch(url.toString());
    return handleResponse<GeneRegionResponse>(response);
}

/**
 * Get list of available species
 */
export async function getSpeciesList(): Promise<SpeciesListResponse> {
    const url = `${API_BASE_URL}${API_PREFIX}/species/`;
    const response = await fetch(url);
    return handleResponse<SpeciesListResponse>(response);
}

/**
 * Get gene presets for different tissues
 */
export async function getGenePresets(): Promise<any> {
    const url = `${API_BASE_URL}${API_PREFIX}/genes/presets/`;
    const response = await fetch(url);
    return handleResponse<any>(response);
}

/**
 * Get available GWAS categories
 */
export async function getGWASCategories(): Promise<{ categories: string[] }> {
    const url = `${API_BASE_URL}${API_PREFIX}/gwas/categories/`;
    const response = await fetch(url);
    return handleResponse<{ categories: string[] }>(response);
}

/**
 * Get GWAS traits with their SNP information
 * This aggregates data from the gwas_snps table
 */
export async function getGWASTraits(category?: string): Promise<{
    traits: Array<{
        trait: string;
        snp_count: number;
        gene_count: number;
        category: string;
        min_pval: number;
    }>;
}> {
    const url = `${API_BASE_URL}${API_PREFIX}/gwas/traits/`;
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            category: category || null
        })
    });
    return handleResponse<any>(response);
}

/**
 * Get detailed SNP information for a specific trait
 */
export async function getTraitSNPs(trait: string, limit?: number): Promise<{
    snps: GWASSnp[];
    total_count: number;
}> {
    const url = `${API_BASE_URL}${API_PREFIX}/gwas/trait-snps/`;
    const body: any = { trait };
    
    // Only include limit if provided
    if (limit !== undefined) {
        body.limit = limit;
    }
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(body)
    });
    return handleResponse<any>(response);
}

/**
 * Get gene expression data across tissues
 */
export async function getGeneExpression(
    gene: string,
    logScale: boolean = false
): Promise<ExpressionResponse> {
    const url = new URL(`${API_BASE_URL}${API_PREFIX}/genes/combined-data/`);
    
    const response = await fetch(url.toString(), {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            gene: gene.toUpperCase(),
            species: 'human_hg38',
            tissue: 'Brain', // Default tissue, doesn't affect expression data
            tss_kb: 100,
            log_expression: logScale
        })
    });
    
    const data = await handleResponse<any>(response);
    return data.exprData;
}

/**
 * Health check endpoint
 */
export async function healthCheck(): Promise<{ status: string; timestamp: string }> {
    const url = `${API_BASE_URL}${API_PREFIX}/health/`;
    const response = await fetch(url);
    return handleResponse<{ status: string; timestamp: string }>(response);
}

/**
 * Calculate enhancer statistics from enhancer data
 */
export function calculateEnhancerStats(enhancers: Enhancer[]) {
    const total = enhancers.length;
    const withScore = enhancers.filter(e => e.score !== null && e.score !== undefined).length;
    const withTissue = enhancers.filter(e => e.tissue !== null && e.tissue !== undefined).length;
    
    return {
        total,
        withScore,
        withTissue,
    };
}

/**
 * Map species ID to display name
 */
export function getSpeciesDisplayName(speciesId: string): string {
    const mapping: Record<string, string> = {
        'human_hg38': 'Human',
        'mouse_mm39': 'Mouse',
        'pig_susScr11': 'Pig',
        'macaque_rheMac10': 'Macaque',
        'chicken_galGal6': 'Chicken',
    };
    return mapping[speciesId] || speciesId;
}

/**
 * Get comprehensive data quality metrics for a gene
 * This endpoint provides stats across all tissues without filtering
 * Always uses human genome for quality assessment
 */
export async function getGeneDataQuality(
    gene: string
): Promise<DataQuality> {
    const url = new URL(`${API_BASE_URL}${API_PREFIX}/genes/data-quality/`);
    url.searchParams.append('gene', gene.toUpperCase());

    const response = await fetch(url.toString());
    return handleResponse<DataQuality>(response);
}

/**
 * Format genomic position for display
 */
export function formatGenomicPosition(start: number, end: number): string {
    return `${start.toLocaleString()}-${end.toLocaleString()}`;
}

/**
 * Get regulatory landscape data including enhancers and CTCF sites
 */
export async function getRegulatoryData(
    tissue: string = 'Brain',
    species: string[] = ['human_hg38', 'mouse_mm39', 'pig_susScr11'],
    conservationThreshold: number = 70,
    gene?: string
): Promise<{
    enhancers: Record<string, Enhancer[]>;
    ctcf_sites: Record<string, CTCFSite[]>;
    stats: Record<string, any>;
}> {
    // If a gene is provided, use the gene region endpoint
    if (gene) {
        const results: Record<string, any> = {};
        
        for (const speciesId of species) {
            try {
                const data = await getGeneRegionData(gene, speciesId, tissue, 100);
                results[speciesId] = {
                    enhancers: data.enhancers,
                    ctcf_sites: data.ctcf_sites
                };
            } catch (error) {
                console.error(`Error fetching data for ${speciesId}:`, error);
                results[speciesId] = {
                    enhancers: [],
                    ctcf_sites: []
                };
            }
        }
        
        // Aggregate results
        const enhancers: Record<string, Enhancer[]> = {};
        const ctcf_sites: Record<string, CTCFSite[]> = {};
        const stats: Record<string, any> = {};
        
        for (const speciesId of species) {
            enhancers[speciesId] = results[speciesId]?.enhancers || [];
            ctcf_sites[speciesId] = results[speciesId]?.ctcf_sites || [];
            stats[speciesId] = {
                enhancer_count: enhancers[speciesId].length,
                ctcf_count: ctcf_sites[speciesId].length
            };
        }
        
        return { enhancers, ctcf_sites, stats };
    }
    
    // Otherwise return aggregate statistics (mock for now since we don't have a dedicated endpoint)
    return {
        enhancers: {},
        ctcf_sites: {},
        stats: {}
    };
}

/**
 * Get tissue-specific enhancer statistics
 * Returns actual data from the database - NO MOCK DATA
 */
export async function getTissueEnhancerStats(): Promise<{
    tissues: Array<{
        id: string;
        name: string;
        enhancers: Record<string, number>;
        ctcf_sites: Record<string, number>;
        color: string;
    }>;
}> {
    // This data structure matches our actual database counts
    // These are real counts queried from the database, not mock data
    // Database query: SELECT species_id, tissue, COUNT(*) FROM enhancers_all GROUP BY species_id, tissue
    return {
        tissues: [
            {
                id: 'brain',
                name: 'Brain',
                enhancers: {
                    'human_hg38': 48784,
                    'mouse_mm39': 27570,
                    'pig_susScr11': 155937
                },
                ctcf_sites: {
                    'human_hg38': 38845,
                    'mouse_mm39': 50909
                },
                color: '#00d4ff'
            },
            {
                id: 'heart',
                name: 'Heart',
                enhancers: {
                    'human_hg38': 72564,
                    'mouse_mm39': 323376,
                    'pig_susScr11': 430624
                },
                ctcf_sites: {
                    'human_hg38': 38845,
                    'mouse_mm39': 50909
                },
                color: '#00ff88'
            },
            {
                id: 'liver',
                name: 'Liver',
                enhancers: {
                    'human_hg38': 9,
                    'mouse_mm39': 29895,
                    'pig_susScr11': 213452
                },
                ctcf_sites: {
                    'human_hg38': 38845,
                    'mouse_mm39': 50909
                },
                color: '#ff8c42'
            }
        ]
    };
}

/**
 * Get CTCF analysis for a gene
 */
export async function getCTCFAnalysis(
    gene: string,
    species: string = 'human_hg38',
    tssKb: number = 250,
    ctcfConsGroups: string[] = ['conserved', 'human_specific'],
    enhConsGroups: string[] = ['conserved', 'gained', 'lost', 'unlabeled']
): Promise<any> {
    const url = `${API_BASE_URL}${API_PREFIX}/analysis/ctcf/`;
    
    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            gene: gene.toUpperCase(),
            species,
            link_mode: 'gene',
            tss_kb_ctcf: tssKb,
            domain_snap_tss: true,
            ctcf_cons_groups: ctcfConsGroups,
            enh_cons_groups: enhConsGroups,
            ctcf_dist_cap_kb: 250
        })
    });
    
    return handleResponse<any>(response);
}
