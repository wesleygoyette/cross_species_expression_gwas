import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface Gene {
  gene_id: number;
  symbol: string;
  species_id: string;
  chrom: string;
  start: number;
  end: number;
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
  class?: string;
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

export interface ExpressionData {
  symbol: string;
  tissue: string;
  tpm: number;
}

export interface GeneRegionData {
  gene: Gene;
  enhancers: Enhancer[];
  gwas_snps: GWASSnp[];
  ctcf_sites: CTCFSite[];
  ucsc_url?: string;
}

export interface ConservationMatrix {
  bins: Array<{
    bin: number;
    start: number;
    end: number;
    center: number;
  }>;
  classes: string[];
  matrix: number[][];
  region_start: number;
  region_end: number;
  nbins: number;
  normalized: boolean;
  tss_position?: number;
}

export interface PlotData {
  plot_data: any;
  enhancer_count?: number;
  snp_count?: number;
}

export interface Species {
  id: string;
  name: string;
}

export interface GenePreset {
  tissue: string;
  genes: string[];
}

// API functions
export const searchGenes = async (query: string, species: string = 'human_hg38'): Promise<{ genes: Gene[] }> => {
  const response = await api.get('/genes/search/', {
    params: { q: query, species }
  });
  return response.data;
};

export const getGeneRegionData = async (
  gene: string,
  species: string = 'human_hg38',
  tissue: string = 'Liver',
  tss_kb: number = 100,
  classes: string[] = ['conserved', 'gained', 'lost', 'unlabeled']
): Promise<GeneRegionData> => {
  const response = await api.get('/genes/region/', {
    params: {
      gene,
      species,
      tissue,
      tss_kb,
      'classes[]': classes
    }
  });
  return response.data;
};

export const getConservationMatrix = async (
  gene: string,
  species: string = 'human_hg38',
  tissue: string = 'Liver',
  tss_kb: number = 100,
  nbins: number = 30,
  classes: string[] = ['conserved', 'gained', 'lost', 'unlabeled'],
  norm_rows: boolean = false,
  mark_tss: boolean = true
): Promise<ConservationMatrix> => {
  const response = await api.get('/plots/conservation-matrix/', {
    params: {
      gene,
      species,
      tissue,
      tss_kb,
      nbins,
      'classes[]': classes,
      norm_rows,
      mark_tss
    }
  });
  return response.data;
};

export const getGenomeTracksPlot = async (
  gene: string,
  species: string = 'human_hg38',
  tissue: string = 'Liver',
  tss_kb: number = 100,
  classes: string[] = ['conserved', 'gained', 'lost', 'unlabeled'],
  stack_tracks: boolean = true,
  show_gene: boolean = true,
  show_snps: boolean = true
): Promise<PlotData> => {
  const response = await api.get('/plots/genome-tracks/', {
    params: {
      gene,
      species,
      tissue,
      tss_kb,
      'classes[]': classes,
      stack_tracks,
      show_gene,
      show_snps
    }
  });
  return response.data;
};

export const getExpressionData = async (
  gene: string,
  log_scale: boolean = false
): Promise<{
  expression_data: ExpressionData[];
  plot_data: PlotData;
}> => {
  const response = await api.get('/plots/expression/', {
    params: { gene, log_scale }
  });
  return response.data;
};

export const getSpeciesList = async (): Promise<{ species: Species[] }> => {
  const response = await api.get('/species/');
  return response.data;
};

export const getGenePresets = async (): Promise<{ presets: Record<string, GenePreset> }> => {
  const response = await api.get('/genes/presets/');
  return response.data;
};

export const getGWASCategories = async (): Promise<{ categories: string[] }> => {
  const response = await api.get('/gwas/categories/');
  return response.data;
};

export const exportData = async (type: string, data_type: string): Promise<any> => {
  const response = await api.post('/export/', { type, data_type });
  return response.data;
};

export const healthCheck = async (): Promise<{ status: string; message: string }> => {
  const response = await api.get('/health/');
  return response.data;
};

export default api;