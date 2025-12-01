import { useState, useRef, useEffect } from 'react';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, AlertCircle, Info, ChevronRight, ChevronLeft, Database, Activity, MoreHorizontal, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';
import { Collapsible, CollapsibleContent } from './ui/collapsible';
import { Checkbox } from './ui/checkbox';
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationNext,
    PaginationPrevious,
    PaginationEllipsis,
} from './ui/pagination';
import {
    getGeneRegionData,
    calculateEnhancerStats,
    formatGenomicPosition,
    searchGenes,
    getGeneExpression,
    getGeneDataQuality,
    getSpeciesDisplayName,
    getSpeciesIdFromName,
    getSpeciesList,
    type GeneRegionResponse,
    type Enhancer,
    type ExpressionData,
    type DataQuality,
    type Species,
} from '../utils/api';

export function GeneExplorer() {
    const [selectedGene, setSelectedGene] = useState('');
    const [availableSpecies, setAvailableSpecies] = useState<Species[]>([]);
    const [selectedSpecies, setSelectedSpecies] = useState<string[]>([]); // Display names of selected species
    const [speciesDataMap, setSpeciesDataMap] = useState<Record<string, GeneRegionResponse | null>>({}); // Map species IDs to their data
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewStart, setViewStart] = useState(0); // Start position of the current view
    const [selectedTissue, setSelectedTissue] = useState<string>('Brain');
    const [selectedTab, setSelectedTab] = useState<string>('tracks');
    const [showError, setShowError] = useState(false);
    const [loading, setLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [apiData, setApiData] = useState<GeneRegionResponse | null>(null);
    const [mouseData, setMouseData] = useState<GeneRegionResponse | null>(null);
    const [pigData, setPigData] = useState<GeneRegionResponse | null>(null);
    const [dataQuality, setDataQuality] = useState<DataQuality | null>(null);
    const [expressionData, setExpressionData] = useState<ExpressionData[]>([]);
    const [expressionLoading, setExpressionLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [showSearchResults, setShowSearchResults] = useState(false);
    const [highlightedIndex, setHighlightedIndex] = useState(-1);
    const [snpSearchQuery, setSnpSearchQuery] = useState('');
    const [snpCurrentPage, setSnpCurrentPage] = useState(1);
    const [snpItemsPerPage] = useState(8);
    const [expandedSnps, setExpandedSnps] = useState<Set<number>>(new Set());
    const trackRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLDivElement>(null);

    const exampleGenes = ['BDNF', 'FOXP2', 'ALB', 'PCSK9', 'TP53'];

    // Fetch available species from API on component mount
    useEffect(() => {
        const fetchSpecies = async () => {
            try {
                const response = await getSpeciesList();
                setAvailableSpecies(response.species);
                // Set default selected species to the display names of available species
                const defaultSpecies = response.species.map(s => getSpeciesDisplayName(s.id));
                setSelectedSpecies(defaultSpecies);
            } catch (error) {
                console.error('Error fetching species list:', error);
                // Fallback to empty if API fails
                setAvailableSpecies([]);
                setSelectedSpecies([]);
            }
        };

        fetchSpecies();
    }, []);

    // Helper function to handle gene selection with validation
    const handleGeneSelection = async (geneInput?: string, useHighlighted: boolean = false) => {
        let value: string;

        if (useHighlighted && highlightedIndex >= 0 && searchResults[highlightedIndex]) {
            // Use the highlighted result
            const highlightedGene = searchResults[highlightedIndex];
            value = highlightedGene.symbol;
        } else if (geneInput) {
            // Use the provided input
            value = geneInput.toUpperCase().trim();
        } else {
            // Use current search query
            value = searchQuery.toUpperCase().trim();
        }

        if (!value) {
            // Reset to initial state when input is empty
            setSelectedGene('');
            setSearchQuery('');
            setShowError(false);
            setErrorMessage('');
            setShowSearchResults(false);
            setHighlightedIndex(-1);
            return;
        }

        // Check if the entered text exactly matches a gene in the search results
        const exactMatch = searchResults.find(gene =>
            gene.symbol.toUpperCase() === value
        );

        if (exactMatch || useHighlighted) {
            // Valid gene found in search results - proceed with selection
            setSelectedGene(value);
            setSearchQuery(value);
            setShowError(false);
            setShowSearchResults(false);
            setHighlightedIndex(-1);
        } else {
            // If no search results available, try to validate by searching the API directly
            try {
                const results = await searchGenes(value, 'human_hg38');
                const directMatch = results.genes.find(gene =>
                    gene.symbol.toUpperCase() === value
                );

                if (directMatch) {
                    // Valid gene found via direct search - proceed with selection
                    setSelectedGene(value);
                    setSearchQuery(value);
                    setShowError(false);
                    setShowSearchResults(false);
                    setHighlightedIndex(-1);
                } else {
                    // Gene not found - show error with suggestions if available
                    setShowError(true);
                    if (results.genes.length > 0) {
                        const suggestions = results.genes.slice(0, 3).map(gene => gene.symbol).join(', ');
                        setErrorMessage(`Gene "${value}" not found. Did you mean: ${suggestions}? Please select from the dropdown or type the complete gene symbol.`);
                    } else {
                        setErrorMessage(`Gene "${value}" not found. Please check the spelling or try a different gene symbol.`);
                    }
                }
            } catch (error) {
                // API error - show error message
                setShowError(true);
                setErrorMessage(`Error validating gene "${value}". Please try again.`);
            }
        }
    };    // Fetch data quality from backend API
    useEffect(() => {
        if (!selectedGene) {
            setDataQuality(null);
            return;
        }

        const fetchDataQuality = async () => {
            try {
                const quality = await getGeneDataQuality(selectedGene);
                setDataQuality(quality);
            } catch (error) {
                console.error('Error fetching data quality:', error);
                setDataQuality(null);
            }
        };

        fetchDataQuality();
    }, [selectedGene]);

    // Fetch real data from API
    useEffect(() => {
        // Don't fetch if no gene is selected
        if (!selectedGene || availableSpecies.length === 0) {
            setSpeciesDataMap({});
            setApiData(null);
            setMouseData(null);
            setPigData(null);
            setLoading(false);
            return;
        }

        const fetchGeneData = async () => {
            setLoading(true);
            setShowError(false);
            setErrorMessage('');

            try {
                // Fetch data for all available species in parallel
                const fetchPromises = availableSpecies.map(species =>
                    Promise.allSettled([
                        Promise.resolve(species.id),
                        getGeneRegionData(selectedGene, species.id, selectedTissue, 100)
                    ]).then(([idResult, dataResult]) => ({
                        speciesId: (idResult as PromiseFulfilledResult<string>).value,
                        data: dataResult.status === 'fulfilled' ? dataResult.value : null,
                        error: dataResult.status === 'rejected' ? dataResult.reason : null
                    }))
                );

                const results = await Promise.all(fetchPromises);

                const newSpeciesDataMap: Record<string, GeneRegionResponse | null> = {};
                let anySucceeded = false;

                results.forEach(result => {
                    newSpeciesDataMap[result.speciesId] = result.data;
                    if (result.data) {
                        anySucceeded = true;
                    }
                    if (result.error) {
                        console.error(`Error fetching data for ${result.speciesId}:`, result.error);
                    }
                });

                setSpeciesDataMap(newSpeciesDataMap);

                // Set legacy state variables for backward compatibility
                setApiData(newSpeciesDataMap['human_hg38'] || null);
                setMouseData(newSpeciesDataMap['mouse_mm39'] || null);
                setPigData(newSpeciesDataMap['pig_susScr11'] || null);

                // Show error only if ALL species failed
                if (!anySucceeded) {
                    setShowError(true);
                    setErrorMessage('Failed to load gene data');
                }
            } catch (error) {
                console.error('Error fetching gene data:', error);
                setShowError(true);
                setErrorMessage(error instanceof Error ? error.message : 'Failed to load gene data');
            } finally {
                setLoading(false);
            }
        };

        fetchGeneData();
    }, [selectedGene, selectedTissue, availableSpecies]);

    // Fetch expression data when gene changes
    useEffect(() => {
        // Don't fetch if no gene is selected
        if (!selectedGene) {
            setExpressionData([]);
            setExpressionLoading(false);
            return;
        }

        const fetchExpressionData = async () => {
            setExpressionLoading(true);
            try {
                const result = await getGeneExpression(selectedGene, false);
                setExpressionData(result.expression_data);
            } catch (error) {
                console.error('Error fetching expression data:', error);
                setExpressionData([]);
            } finally {
                setExpressionLoading(false);
            }
        };

        fetchExpressionData();
    }, [selectedGene]);

    // Reset SNP pagination and search when gene changes
    useEffect(() => {
        setSnpCurrentPage(1);
        setSnpSearchQuery('');
        setExpandedSnps(new Set());
    }, [selectedGene]);

    // Search for genes as user types
    useEffect(() => {
        const searchForGenes = async () => {
            if (searchQuery.length < 2) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            // Don't show search results if the search query exactly matches the selected gene
            if (searchQuery === selectedGene) {
                setSearchResults([]);
                setShowSearchResults(false);
                return;
            }

            // Clear any previous error when user starts typing
            if (showError && searchQuery.length >= 2) {
                setShowError(false);
                setErrorMessage('');
            }

            try {
                const results = await searchGenes(searchQuery, 'human_hg38');
                setSearchResults(results.genes);
                setShowSearchResults(true);
                setHighlightedIndex(-1); // Reset highlighting when results change
            } catch (error) {
                console.error('Error searching genes:', error);
                setSearchResults([]);
                setHighlightedIndex(-1);
            }
        };

        const debounceTimer = setTimeout(searchForGenes, 300);
        return () => clearTimeout(debounceTimer);
    }, [searchQuery, selectedGene, showError]);

    // Close search results when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setShowSearchResults(false);
                setHighlightedIndex(-1);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Compute display values from API data only
    const displayData = apiData ? {
        chromosome: apiData.gene.chrom,
        position: formatGenomicPosition(apiData.gene.start, apiData.gene.end),
        enhancers: apiData.enhancers.length,
        enhancersWithScore: calculateEnhancerStats(apiData.enhancers).withScore,
        enhancersWithTissue: calculateEnhancerStats(apiData.enhancers).withTissue,
        ctcfSites: apiData.ctcf_sites.length,
        gwasSnps: apiData.gwas_snps.length,
    } : null;

    // Use data quality from the dedicated API endpoint
    const geneInfo = dataQuality ? {
        fullName: selectedGene, // We don't have full names in the API, so use the symbol
        conservation: dataQuality.conservation_percent,
        species: dataQuality.available_species.map(id => getSpeciesDisplayName(id)),
        dataQuality: dataQuality, // The whole object is the quality data
    } : null;

    // Parse gene coordinates for zoom calculations
    const parsePosition = (position: string) => {
        const [start, end] = position.replace(/,/g, '').split('-').map(Number);
        return { start, end, length: end - start };
    };

    const geneCoords = displayData ? parsePosition(displayData.position) : { start: 0, end: 100000, length: 100000 };

    // Calculate genomic window size based on zoom level
    // Use gene length as base window, so at 1x zoom we see the full gene region nicely
    const baseWindowSize = Math.max(100000, geneCoords.length * 1.2); // At least 100kb or 120% of gene length
    const currentWindowSize = baseWindowSize / zoomLevel;
    const maxViewStart = Math.max(0, baseWindowSize - currentWindowSize);

    // Ensure viewStart is within bounds when zoom changes
    const clampedViewStart = Math.max(0, Math.min(viewStart, maxViewStart));

    // Tissue-specific warnings based on real database issues
    const tissueWarnings: Record<string, { species: string; message: string }> = {
        'Liver': {
            species: 'Human',
            message: 'Limited data: Only 9 enhancers available for human liver (vs. 29,895 in mouse)'
        }
    };

    // Make zoom increments smaller for smoother experience
    const ZOOM_STEP = 0.5;
    const MAX_ZOOM = 10;
    const MIN_ZOOM = 1;

    // Zoom in/out centered on current view center
    const handleZoomIn = () => {
        const newZoomLevel = Math.min(zoomLevel + ZOOM_STEP, MAX_ZOOM);
        const currentViewCenter = clampedViewStart + currentWindowSize / 2;
        const newWindowSize = baseWindowSize / newZoomLevel;
        const newViewStart = Math.max(0, currentViewCenter - newWindowSize / 2);
        setZoomLevel(newZoomLevel);
        setViewStart(newViewStart);
    };

    const handleZoomOut = () => {
        const newZoomLevel = Math.max(zoomLevel - ZOOM_STEP, MIN_ZOOM);
        const currentViewCenter = clampedViewStart + currentWindowSize / 2;
        const newWindowSize = baseWindowSize / newZoomLevel;
        const newViewStart = Math.max(0, currentViewCenter - newWindowSize / 2);
        setZoomLevel(newZoomLevel);
        setViewStart(newViewStart);
    };

    const handleZoomReset = () => {
        setZoomLevel(1);
        // Reset to centered view showing the gene
        const geneStart = 0.2 * baseWindowSize;
        const geneEnd = 0.8 * baseWindowSize;
        const geneCenterPosition = (geneStart + geneEnd) / 2;
        const windowSize = baseWindowSize / 1; // Window size at 1x zoom
        const centeredViewStart = geneCenterPosition - (windowSize / 2);
        setViewStart(Math.max(0, centeredViewStart));
    };

    // Add pan functionality for when zoomed in
    const handlePan = (direction: 'left' | 'right') => {
        const panAmount = currentWindowSize * 0.1; // Pan by 10% of current window
        if (direction === 'left') {
            setViewStart(Math.max(0, clampedViewStart - panAmount));
        } else {
            setViewStart(Math.min(maxViewStart, clampedViewStart + panAmount));
        }
    };

    // Reset view when gene changes - center the view to show the gene centered on screen
    useEffect(() => {
        setZoomLevel(1);
        // The gene is positioned at 20%-80% of the base window size
        // We want the center of this gene to appear at 50% of the screen
        const windowSize = baseWindowSize / 1; // Window size at 1x zoom
        const geneStart = 0.2 * baseWindowSize; // Gene starts at 20% of base window
        const geneEnd = 0.8 * baseWindowSize; // Gene ends at 80% of base window
        const geneCenterPosition = (geneStart + geneEnd) / 2; // Center at 50% of base window

        // Set view so that gene center appears at center of screen
        // Since gene center is at 50% of base window, and we want it at 50% of screen,
        // we need to set viewStart so that 50% of base window appears at 50% of screen
        const centeredViewStart = geneCenterPosition - (windowSize / 2);
        setViewStart(Math.max(0, centeredViewStart));
    }, [selectedGene, geneCoords.length, baseWindowSize]);

    // Keyboard support for zoom and pan
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement) return; // Don't interfere with input fields

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    handleZoomIn(); // Use up arrow for zoom in
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    handleZoomOut(); // Use down arrow for zoom out
                    break;
                case '0':
                    if (e.ctrlKey || e.metaKey) {
                        e.preventDefault();
                        handleZoomReset();
                    }
                    break;
                case 'ArrowLeft':
                    if (zoomLevel > 1) {
                        e.preventDefault();
                        handlePan('left');
                    }
                    break;
                case 'ArrowRight':
                    if (zoomLevel > 1) {
                        e.preventDefault();
                        handlePan('right');
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [zoomLevel, clampedViewStart, maxViewStart, currentWindowSize, geneCoords.length]);

    // Attach wheel event listener with non-passive option to allow preventDefault
    useEffect(() => {
        const trackElement = trackRef.current;
        if (!trackElement) return;

        const handleWheelEvent = (e: WheelEvent) => {
            if (e.ctrlKey || e.metaKey) {
                e.preventDefault();

                // Get mouse position relative to the track container
                const rect = trackElement.getBoundingClientRect();
                const mouseX = e.clientX - rect.left;
                const containerWidth = rect.width;
                const mouseRatio = mouseX / containerWidth;

                // Calculate the genomic position under the mouse cursor
                const mouseGenomicPos = clampedViewStart + (currentWindowSize * mouseRatio);

                // Determine new zoom level
                const newZoomLevel = e.deltaY < 0
                    ? Math.min(zoomLevel * 1.5, MAX_ZOOM)
                    : Math.max(zoomLevel / 1.5, MIN_ZOOM);

                // Calculate new window size
                const newWindowSize = baseWindowSize / newZoomLevel;

                // Center the new view on the mouse position
                const newViewStart = Math.max(0, Math.min(
                    mouseGenomicPos - (newWindowSize * mouseRatio),
                    geneCoords.length - newWindowSize
                ));

                setZoomLevel(newZoomLevel);
                setViewStart(newViewStart);
            }
        };

        // Add event listener with { passive: false } to allow preventDefault
        trackElement.addEventListener('wheel', handleWheelEvent, { passive: false });

        return () => {
            trackElement.removeEventListener('wheel', handleWheelEvent);
        };
    }, [zoomLevel, clampedViewStart, currentWindowSize, baseWindowSize, geneCoords.length]);

    const getDataQualityColor = (quality: 'high' | 'low' | 'none' | 'complete' | 'partial' | 'missing') => {
        switch (quality) {
            case 'high':
            case 'complete':
                return 'text-[var(--genomic-green)]';
            case 'low':
            case 'partial':
                return 'text-[var(--data-orange)]';
            case 'none':
            case 'missing':
                return 'text-destructive';
            default:
                return 'text-muted-foreground';
        }
    };

    const getDataQualityBadge = (quality: 'high' | 'low' | 'none') => {
        switch (quality) {
            case 'high':
                return <Badge className="bg-[var(--genomic-green)]/10 text-[var(--genomic-green)] border-[var(--genomic-green)]/20">Available</Badge>;
            case 'low':
                return <Badge className="bg-[var(--data-orange)]/10 text-[var(--data-orange)] border-[var(--data-orange)]/20">Limited</Badge>;
            case 'none':
                return <Badge className="bg-red-100 dark:bg-red-950 text-red-800 dark:text-red-200 border-red-300 dark:border-red-700">Unavailable</Badge>;
        }
    };


    // Helper function to calculate if an element should be visible in current zoom window
    const isInView = (elementStart: number, elementEnd: number) => {
        const viewEnd = clampedViewStart + currentWindowSize;
        return elementEnd >= clampedViewStart && elementStart <= viewEnd;
    };

    // Helper function to convert genomic position to screen position (0-100%)
    const getScreenPosition = (genomicPosition: number) => {
        const relativePos = genomicPosition - clampedViewStart;
        return (relativePos / currentWindowSize) * 100;
    };

    // Conservation color gradient (low to high)
    // Epic gradient: light grey to purple to cyan
    // Colors: none/low = #e5e7eb (light grey), mid = #6366f1 (purple), high = #06b6d4 (cyan)
    function getConservationColor(val: number) {
        // val: 0-100
        // Use light grey for no data (0) or very low values
        if (val === 0) {
            return '#6c6c6cff'; // light grey for empty bins
        }
        // Map 0-50: light grey to purple, 50-100: purple to cyan
        if (val <= 50) {
            // Interpolate light grey (#e5e7eb) to purple (#6366f1)
            const t = val / 50;
            // RGB for light grey: (229,231,235), purple: (99,102,241)
            const r = Math.round(229 + (99 - 229) * t);
            const g = Math.round(231 + (102 - 231) * t);
            const b = Math.round(235 + (241 - 235) * t);
            return `rgb(${r},${g},${b})`;
        } else {
            // Interpolate purple (#6366f1) to cyan (#06b6d4)
            const t = (val - 50) / 50;
            // RGB for purple: (99,102,241), cyan: (6,182,212)
            const r = Math.round(99 + (6 - 99) * t);
            const g = Math.round(102 + (182 - 102) * t);
            const b = Math.round(241 + (212 - 241) * t);
            return `rgb(${r},${g},${b})`;
        }
    }

    // Function to handle species selection
    const handleSpeciesToggle = (species: string) => {
        setSelectedSpecies(prev => {
            if (prev.includes(species)) {
                // Remove species if already selected
                return prev.filter(s => s !== species);
            } else {
                // Add species if not selected
                return [...prev, species];
            }
        });
    };

    // Calculate conservation bins from enhancer data
    const calculateConservationBins = (enhancers: Enhancer[], regionStart: number, regionEnd: number, numBins: number = 100): number[] => {
        const binWidth = (regionEnd - regionStart) / numBins;
        const bins: number[] = new Array(numBins).fill(0);

        // Count conserved enhancers in each bin
        enhancers.forEach(enh => {
            // Check both class_name and class (backend returns 'class')
            const enhClass = (enh as any).class || enh.class_name;
            // Only count conserved enhancers
            if (enhClass !== 'conserved') return;

            const enhStart = Math.max(enh.start, regionStart);
            const enhEnd = Math.min(enh.end, regionEnd);

            if (enhEnd <= enhStart) return;

            // Find which bins this enhancer overlaps
            const startBin = Math.floor((enhStart - regionStart) / binWidth);
            const endBin = Math.min(Math.floor((enhEnd - regionStart) / binWidth), numBins - 1);

            for (let i = Math.max(0, startBin); i <= endBin; i++) {
                bins[i]++;
            }
        });

        // Scale based on count - show intensity of conservation
        const maxCount = Math.max(...bins, 1);
        return bins.map(count => Math.round((count / maxCount) * 100));
    };

    return (
        <section id="gene-explorer" className="py-20 px-4 bg-background min-h-screen">
            <div className="max-w-7xl mx-auto h-full">
                <div className="mb-8">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                        <Database className="w-3 h-3 mr-1" />
                        195,977 Genes
                    </Badge>
                    <h2 className="text-4xl font-bold mb-4" style={{
                        background: 'linear-gradient(to right, var(--foreground) 0%, var(--primary) 40%, var(--primary) 70%, var(--genomic-green) 100%)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }}>
                        Gene Explorer
                    </h2>
                    <p className="text-muted-foreground">
                        Search and analyze gene regulatory landscapes across species with cross-species conservation data
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 w-full min-h-[calc(100vh-12rem)]">
                    {/* Search Panel */}
                    <div className="lg:col-span-1 space-y-4 w-full min-w-0 flex flex-col">
                        <Card className="p-4 bg-card border-border">
                            <div className="space-y-4">
                                <div className="relative" ref={searchRef}>
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search gene symbol..."
                                        className="pl-10 bg-input-background w-full min-w-0"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                                        onKeyDown={async (e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                if (highlightedIndex >= 0) {
                                                    // Select the highlighted result
                                                    await handleGeneSelection('', true);
                                                } else {
                                                    // Try to select based on current input
                                                    const value = (e.target as HTMLInputElement).value;
                                                    await handleGeneSelection(value);
                                                }
                                            } else if (e.key === 'ArrowDown') {
                                                e.preventDefault();
                                                if (showSearchResults && searchResults.length > 0) {
                                                    setHighlightedIndex(prev =>
                                                        prev < searchResults.length - 1 ? prev + 1 : 0
                                                    );
                                                }
                                            } else if (e.key === 'ArrowUp') {
                                                e.preventDefault();
                                                if (showSearchResults && searchResults.length > 0) {
                                                    setHighlightedIndex(prev =>
                                                        prev > 0 ? prev - 1 : searchResults.length - 1
                                                    );
                                                }
                                            } else if (e.key === 'Escape') {
                                                setShowSearchResults(false);
                                                setHighlightedIndex(-1);
                                            }
                                        }}
                                        onFocus={() => {
                                            if (searchQuery.length >= 2 && searchResults.length > 0) {
                                                setShowSearchResults(true);
                                            }
                                        }}
                                    />

                                    {/* Autocomplete dropdown */}
                                    {showSearchResults && searchResults.length > 0 && (
                                        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-md shadow-lg z-50 max-h-64 overflow-y-auto">
                                            {searchResults.map((gene, index) => (
                                                <div
                                                    key={gene.gene_id}
                                                    className={`px-4 py-2 cursor-pointer text-sm transition-colors ${index === highlightedIndex
                                                        ? 'bg-primary/20'
                                                        : 'hover:bg-primary/10'
                                                        }`}
                                                    onClick={() => {
                                                        setSelectedGene(gene.symbol);
                                                        setSearchQuery(gene.symbol);
                                                        setShowError(false);
                                                        setShowSearchResults(false);
                                                        setHighlightedIndex(-1);
                                                    }}
                                                    onMouseEnter={() => setHighlightedIndex(index)}
                                                >
                                                    <div className="font-medium text-foreground">{gene.symbol}</div>
                                                    <div className="text-xs text-muted-foreground">
                                                        {gene.chrom}:{gene.start.toLocaleString()}-{gene.end.toLocaleString()}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Search-specific error message */}
                                {showError && errorMessage && !selectedGene && (
                                    <Alert className="bg-destructive/10 border-destructive/20">
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                        <AlertDescription className="text-sm text-destructive">
                                            {errorMessage}
                                        </AlertDescription>
                                    </Alert>
                                )}

                                <div className="space-y-2">
                                    <p className="text-xs text-muted-foreground">Example genes:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {exampleGenes.map((gene) => (
                                            <Button
                                                key={gene}
                                                variant={selectedGene === gene ? 'default' : 'outline'}
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedGene(gene);
                                                    setSearchQuery(gene);
                                                    setShowError(false);
                                                    setShowSearchResults(false);
                                                }}
                                                className={selectedGene === gene ? 'bg-primary hover:bg-primary/90 text-primary-foreground px-4' : 'px-4'}
                                                style={{ minWidth: 0, flex: '1 1 0px', wordBreak: 'break-word' }}
                                            >
                                                {gene}
                                            </Button>
                                        ))}
                                    </div>
                                </div>


                            </div>
                        </Card>

                        {/* Species Selector - Only show when gene is selected */}
                        {selectedGene && (
                            <Card className="p-4 bg-card border-border">
                                <div className="space-y-3">
                                    <div className="flex items-center gap-2">
                                        <h4 className="text-sm font-medium text-foreground">Species to Display</h4>
                                        <TooltipProvider>
                                            <Tooltip>
                                                <TooltipTrigger asChild>
                                                    <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                                </TooltipTrigger>
                                                <TooltipContent>
                                                    <p className="text-xs max-w-xs">Select which species to show in genome tracks and conservation analysis</p>
                                                </TooltipContent>
                                            </Tooltip>
                                        </TooltipProvider>
                                    </div>

                                    <div className="space-y-3">
                                        {availableSpecies.map((speciesObj) => {
                                            const speciesDisplayName = getSpeciesDisplayName(speciesObj.id);
                                            const speciesData = speciesDataMap[speciesObj.id] || null;
                                            const hasData = speciesData !== null;

                                            return (
                                                <div key={speciesObj.id} className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <Checkbox
                                                            id={`species-${speciesObj.id}`}
                                                            checked={selectedSpecies.includes(speciesDisplayName)}
                                                            onCheckedChange={() => handleSpeciesToggle(speciesDisplayName)}
                                                        />
                                                        <label
                                                            htmlFor={`species-${speciesObj.id}`}
                                                            className="text-sm font-medium text-foreground cursor-pointer"
                                                        >
                                                            {speciesDisplayName}
                                                            <span className="text-xs text-muted-foreground font-normal ml-1.5">
                                                                ({speciesObj.genome_build})
                                                            </span>
                                                        </label>
                                                    </div>

                                                    <div className="flex items-center gap-2">
                                                        {hasData ? (
                                                            <Badge variant="outline" className="text-xs text-green-600 border-green-600">
                                                                Data available
                                                            </Badge>
                                                        ) : (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                No data
                                                            </Badge>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {selectedSpecies.length === 0 && (
                                        <Alert className="bg-orange-50 border-orange-200">
                                            <AlertCircle className="h-4 w-4 text-orange-600" />
                                            <AlertDescription className="text-sm text-orange-600">
                                                Please select at least one species to display data.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </div>
                            </Card>
                        )}


                        {/* Gene Info Card - Only show when data is loaded */}
                        {!selectedGene ? (
                            <div className="flex-1"></div>
                        ) : loading ? (
                            <Card className="p-4 bg-card border-border w-full min-w-0">
                                <div className="flex items-center justify-center py-8">
                                    <div className="text-center space-y-2">
                                        <Activity className="w-8 h-8 text-primary mx-auto animate-pulse" />
                                        <p className="text-sm text-muted-foreground">Loading gene data...</p>
                                    </div>
                                </div>
                            </Card>
                        ) : showError ? (
                            <Card className="p-4 bg-card border-border w-full min-w-0">
                                <Alert className="bg-destructive/10 border-destructive/20">
                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                    <AlertDescription className="text-sm text-destructive">
                                        {errorMessage || 'Failed to load gene data'}
                                    </AlertDescription>
                                </Alert>
                            </Card>
                        ) : displayData ? (
                            <Card className="p-4 bg-card border-border w-full min-w-0" style={{ wordBreak: 'break-word' }}>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="text-primary">{selectedGene}</h3>
                                            <TooltipProvider>
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <Info className="w-4 h-4 text-muted-foreground cursor-help" />
                                                    </TooltipTrigger>
                                                    <TooltipContent>
                                                        <p className="text-xs max-w-xs">Gene information retrieved from RegLand database</p>
                                                    </TooltipContent>
                                                </Tooltip>
                                            </TooltipProvider>
                                        </div>
                                        <p className="text-sm text-muted-foreground">{geneInfo?.fullName || selectedGene}</p>
                                    </div>

                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Location:</span>
                                            <span className="font-mono text-xs text-foreground">
                                                {displayData.chromosome}:{displayData.position}
                                            </span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Enhancers:</span>
                                            <div className="flex items-center gap-2">
                                                <Badge variant="secondary">{displayData.enhancers}</Badge>
                                                {displayData.enhancersWithScore !== undefined && (
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <Badge variant="outline" className="text-xs cursor-help">
                                                                    {displayData.enhancersWithScore} scored
                                                                </Badge>
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">{((displayData.enhancersWithScore / displayData.enhancers) * 100).toFixed(0)}% of enhancers have activity scores</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">CTCF Sites:</span>
                                            <Badge variant="secondary">{displayData.ctcfSites || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">GWAS SNPs:</span>
                                            <Badge variant="secondary">{displayData.gwasSnps || 0}</Badge>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Conservation:</span>
                                            <span className="text-[var(--genomic-green)]">{geneInfo?.conservation || 0}%</span>
                                        </div>
                                    </div>

                                    {/* Data Quality Indicators */}
                                    <div className="pt-3 border-t border-border space-y-2">
                                        <p className="text-xs text-muted-foreground mb-2">Data Quality:</p>
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Tissue Annotation:</span>
                                                {getDataQualityBadge(geneInfo?.dataQuality.tissue_availability || 'none')}
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-muted-foreground">Activity Scores:</span>
                                                {getDataQualityBadge(geneInfo?.dataQuality.score_availability || 'none')}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        ) : null}
                    </div>

                    {/* Main Panel - Only show when data is loaded */}
                    {!loading && !showError && displayData && selectedGene && (
                        <div className="lg:col-span-2 w-full min-w-0">
                            <Card className="p-6 bg-card border-border w-full min-w-0" style={{ wordBreak: 'break-word', overflowX: 'auto' }}>
                                <div className="w-full">
                                    {/* Custom Tab Navigation */}
                                    <div className="mb-6 flex flex-wrap gap-2 sm:gap-3 pb-1">
                                        <button
                                            onClick={() => setSelectedTab('tracks')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${selectedTab === 'tracks'
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-secondary/50 text-foreground/70 hover:bg-secondary/80 hover:text-foreground hover:scale-102 border border-border/50'
                                                }`}
                                        >
                                            Genome Tracks
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('conservation')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${selectedTab === 'conservation'
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-secondary/50 text-foreground/70 hover:bg-secondary/80 hover:text-foreground hover:scale-102 border border-border/50'
                                                }`}
                                        >
                                            Conservation
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('expression')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 whitespace-nowrap ${selectedTab === 'expression'
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-secondary/50 text-foreground/70 hover:bg-secondary/80 hover:text-foreground hover:scale-102 border border-border/50'
                                                }`}
                                        >
                                            Expression
                                        </button>
                                        <button
                                            onClick={() => setSelectedTab('gwas')}
                                            className={`px-3 sm:px-4 py-2 text-xs sm:text-sm font-medium rounded-md transition-all duration-300 flex items-center gap-1.5 sm:gap-2 whitespace-nowrap ${selectedTab === 'gwas'
                                                ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/30 scale-105'
                                                : 'bg-secondary/50 text-foreground/70 hover:bg-secondary/80 hover:text-foreground hover:scale-102 border border-border/50'
                                                }`}
                                        >
                                            GWAS SNPs
                                            <Badge
                                                variant="secondary"
                                                className={`text-xs ${selectedTab === 'gwas' ? 'bg-primary-foreground/20 text-primary-foreground' : ''}`}
                                            >
                                                {apiData?.gwas_snps.length || 0}
                                            </Badge>
                                        </button>
                                    </div>

                                    {/* Tab Content - Genome Tracks */}
                                    {selectedTab === 'tracks' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-foreground">Multi-Species Genome Browser</h3>
                                                <div className="flex items-center gap-2">
                                                    {/* <Button size="sm" variant="outline">
                                                        <Download className="w-4 h-4 mr-2" />
                                                        Export BED
                                                    </Button> */}
                                                </div>
                                            </div>

                                            {/* Zoom Controls */}
                                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-2 sm:p-3 bg-secondary/30 rounded-lg border border-border text-xs sm:text-sm">
                                                {/* Left group — Zoom and Pan */}
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={handleZoomOut}
                                                        disabled={zoomLevel <= 1}
                                                        className="w-8 h-8"
                                                    >
                                                        <ZoomOut className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={handleZoomReset}
                                                        disabled={zoomLevel === 1}
                                                        className="w-8 h-8"
                                                    >
                                                        <Maximize2 className="w-4 h-4" />
                                                    </Button>
                                                    <Button
                                                        size="icon"
                                                        variant="outline"
                                                        onClick={handleZoomIn}
                                                        disabled={zoomLevel >= MAX_ZOOM}
                                                        className="w-8 h-8"
                                                    >
                                                        <ZoomIn className="w-4 h-4" />
                                                    </Button>
                                                    <Badge variant="secondary" className="ml-1 sm:ml-2 font-mono">
                                                        <span style={{ userSelect: 'none' }}>{zoomLevel.toFixed(2)}x</span>
                                                    </Badge>

                                                    {/* Pan controls - always visible, disabled when not usable */}
                                                    <div className="hidden sm:block w-px h-6 bg-border mx-2" />
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => handlePan('left')}
                                                            disabled={zoomLevel <= 1 || clampedViewStart <= 0}
                                                            className="w-8 h-8"
                                                        >
                                                            <ChevronLeft className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => handlePan('right')}
                                                            disabled={zoomLevel <= 1 || clampedViewStart >= maxViewStart}
                                                            className="w-8 h-8"
                                                        >
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>


                                            {/* Tissue selector with warning */}
                                            <div className="space-y-2">
                                                <div className="flex items-center gap-2">
                                                    <p className="text-xs text-muted-foreground">Tissue:</p>
                                                    {tissueWarnings[selectedTissue] && (
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    <AlertCircle className="w-4 h-4 text-[var(--data-orange)] cursor-help" />
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p className="text-xs max-w-xs">{tissueWarnings[selectedTissue].message}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                    )}
                                                </div>
                                                <div className="flex gap-2">
                                                    {['Brain', 'Heart', 'Liver'].map((tissue) => (
                                                        <Button
                                                            key={tissue}
                                                            variant={selectedTissue === tissue ? 'default' : 'outline'}
                                                            size="sm"
                                                            onClick={() => setSelectedTissue(tissue)}
                                                            className={selectedTissue === tissue ? 'bg-primary hover:bg-primary/90' : 'hover:bg-primary/10 hover:border-primary'}
                                                        >
                                                            {tissue}
                                                            {tissue === 'Liver' && (
                                                                <Badge variant="secondary" className="ml-2 text-xs bg-[var(--data-orange)]/20">
                                                                    Low
                                                                </Badge>
                                                            )}
                                                        </Button>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Genome tracks */}
                                            <div className="space-y-6" ref={trackRef}>
                                                <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                                    <Info className="w-3 h-3" />
                                                    Use Up/Down arrows to zoom, Left/Right arrows to pan, Ctrl/Cmd + 0 to reset
                                                </div>

                                                {selectedSpecies.length === 0 ? (
                                                    <Alert className="bg-orange-50 border-orange-200">
                                                        <AlertCircle className="h-4 w-4 text-orange-600" />
                                                        <AlertDescription className="text-sm text-orange-600">
                                                            Please select at least one species from the species selector above to display genome tracks.
                                                        </AlertDescription>
                                                    </Alert>
                                                ) : (
                                                    <>
                                                        {availableSpecies
                                                            .filter(speciesObj => selectedSpecies.includes(getSpeciesDisplayName(speciesObj.id)))
                                                            .sort((a, b) => {
                                                                // Sort so tracks with data come first, then tracks without data
                                                                const aData = speciesDataMap[a.id] || null;
                                                                const bData = speciesDataMap[b.id] || null;
                                                                const aHasData = aData !== null;
                                                                const bHasData = bData !== null;

                                                                if (aHasData && !bHasData) return -1;
                                                                if (!aHasData && bHasData) return 1;
                                                                return 0; // Keep original order for items with same data status
                                                            })
                                                            .map((speciesObj, idx) => {
                                                                // Map species to their respective data
                                                                const speciesDisplayName = getSpeciesDisplayName(speciesObj.id);
                                                                const speciesData = speciesDataMap[speciesObj.id] || null;
                                                                const hasData = speciesData !== null;

                                                                // Calculate gene position within current view - gene positioned at center of base window
                                                                const geneStart = 0.2 * baseWindowSize; // Gene starts at 20% of base window
                                                                const geneEnd = 0.8 * baseWindowSize; // Gene ends at 80% of base window
                                                                const geneLeftPercent = getScreenPosition(geneStart);
                                                                const geneRightPercent = getScreenPosition(geneEnd);
                                                                const geneWidthPercent = geneRightPercent - geneLeftPercent;

                                                                return (
                                                                    <div key={speciesObj.id} className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="text-sm font-medium text-foreground">
                                                                                    {speciesDisplayName}
                                                                                    <span className="text-xs text-muted-foreground font-normal ml-1.5">
                                                                                        ({speciesObj.genome_build})
                                                                                    </span>
                                                                                </h4>
                                                                                {!hasData && (
                                                                                    <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                                        No data
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                        <div
                                                                            className={`h-32 bg-secondary/20 rounded border border-border relative overflow-hidden transition-all duration-200 ${!hasData ? 'opacity-40' : ''}`}
                                                                        >
                                                                            {hasData ? (
                                                                                <>
                                                                                    {/* Genomic coordinates ruler */}
                                                                                    <div className="absolute top-0 left-0 right-0 h-6 border-b border-border/50 bg-secondary/10">
                                                                                        <div className="flex justify-between px-2 h-full items-center text-[10px] text-muted-foreground font-mono">
                                                                                            {Array.from({ length: Math.min(11, Math.ceil(zoomLevel * 5)) }).map((_, i) => {
                                                                                                const tickPosition = (i / Math.min(10, Math.ceil(zoomLevel * 5) - 1)) * 100;
                                                                                                const genomicPos = geneCoords.start + clampedViewStart + (currentWindowSize * i / Math.min(10, Math.ceil(zoomLevel * 5) - 1));
                                                                                                return (
                                                                                                    <div key={i} className="flex flex-col items-center" style={{ left: `${tickPosition}%`, position: 'absolute' }}>
                                                                                                        <div className="w-px h-2 bg-border" />
                                                                                                        {zoomLevel >= 2 && (
                                                                                                            <span className="text-[8px] mt-0.5">
                                                                                                                {(genomicPos / 1000000).toFixed(3)}
                                                                                                            </span>
                                                                                                        )}
                                                                                                    </div>
                                                                                                );
                                                                                            })}
                                                                                        </div>
                                                                                    </div>                                                                        {/* Gene body - responsive to zoom and pan */}
                                                                                    {geneLeftPercent < 100 && geneRightPercent > 0 && (
                                                                                        <div
                                                                                            className="absolute top-12 h-6 bg-primary/60 rounded border border-primary flex items-center justify-center transition-all duration-200"
                                                                                            style={{
                                                                                                left: `${Math.max(0, geneLeftPercent)}%`,
                                                                                                width: `${Math.min(100, geneRightPercent) - Math.max(0, geneLeftPercent)}%`
                                                                                            }}
                                                                                        >
                                                                                            <span className="text-[10px] font-mono text-primary-foreground">
                                                                                                {selectedGene}
                                                                                            </span>
                                                                                        </div>
                                                                                    )}

                                                                                    {/* Exons - positioned within the gene and responsive to zoom */}
                                                                                    {zoomLevel >= 2 && geneLeftPercent < 100 && geneRightPercent > 0 &&
                                                                                        [0.3, 0.4, 0.6, 0.7].map((relPos, i) => {
                                                                                            const exonPos = relPos * baseWindowSize;
                                                                                            const exonScreenPos = getScreenPosition(exonPos);
                                                                                            return exonScreenPos >= 0 && exonScreenPos <= 100 ? (
                                                                                                <div
                                                                                                    key={i}
                                                                                                    className="absolute top-12 h-6 bg-primary rounded transition-all duration-200"
                                                                                                    style={{
                                                                                                        left: `${exonScreenPos}%`,
                                                                                                        width: `${Math.max(1, 3 / zoomLevel)}%`,
                                                                                                        opacity: 0.9
                                                                                                    }}
                                                                                                />
                                                                                            ) : null;
                                                                                        })
                                                                                    }

                                                                                    {/* Enhancers - distributed around gene and zoom-responsive */}
                                                                                    {speciesData ? (
                                                                                        // Render real enhancers from API
                                                                                        speciesData.enhancers.slice(0, 50).map((enhancer, i) => {
                                                                                            const enhancerPos = enhancer.start - speciesData.gene.start;
                                                                                            const enhancerScreenPos = getScreenPosition(enhancerPos);
                                                                                            const hasScore = enhancer.score !== null && enhancer.score !== undefined;

                                                                                            return enhancerScreenPos >= -5 && enhancerScreenPos <= 105 ? (
                                                                                                <TooltipProvider key={enhancer.enh_id}>
                                                                                                    <Tooltip>
                                                                                                        <TooltipTrigger asChild>
                                                                                                            <div
                                                                                                                className={`absolute top-8 rounded-full cursor-help transition-all duration-200 ${hasScore ? 'bg-[var(--data-orange)]' : 'bg-[var(--data-orange)]/30'
                                                                                                                    }`}
                                                                                                                style={{
                                                                                                                    left: `${enhancerScreenPos}%`,
                                                                                                                    width: `${Math.max(2, 4 / Math.sqrt(zoomLevel))}px`,
                                                                                                                    height: `${Math.min(64, 32 + (zoomLevel * 8))}px`,
                                                                                                                }}
                                                                                                            />
                                                                                                        </TooltipTrigger>
                                                                                                        <TooltipContent>
                                                                                                            <div className="text-xs space-y-1">
                                                                                                                <p className="font-mono text-primary-foreground">Enhancer #{enhancer.enh_id}</p>
                                                                                                                <p className="text-primary-foreground">
                                                                                                                    {enhancer.chrom}:{enhancer.start.toLocaleString()}-{enhancer.end.toLocaleString()}
                                                                                                                </p>
                                                                                                                {hasScore && (
                                                                                                                    <p className="text-primary-foreground">
                                                                                                                        Score: {typeof enhancer.score === 'number' ? enhancer.score.toFixed(2) : Number(enhancer.score).toFixed(2)}
                                                                                                                    </p>
                                                                                                                )}
                                                                                                                {enhancer.tissue && (
                                                                                                                    <p className="text-primary-foreground">
                                                                                                                        Tissue: {enhancer.tissue}
                                                                                                                    </p>
                                                                                                                )}
                                                                                                                {enhancer.class_name && (
                                                                                                                    <Badge variant="outline" className="text-xs text-primary-foreground border-primary-foreground">
                                                                                                                        {enhancer.class_name}
                                                                                                                    </Badge>
                                                                                                                )}
                                                                                                            </div>
                                                                                                        </TooltipContent>
                                                                                                    </Tooltip>
                                                                                                </TooltipProvider>
                                                                                            ) : null;
                                                                                        })
                                                                                    ) : null}

                                                                                    {/* CTCF sites - from API data */}
                                                                                    {speciesData && speciesData.ctcf_sites.slice(0, 20).map((ctcf, i) => {
                                                                                        const ctcfPos = ctcf.start - speciesData.gene.start;
                                                                                        const ctcfScreenPos = getScreenPosition(ctcfPos);

                                                                                        return ctcfScreenPos >= -5 && ctcfScreenPos <= 105 ? (
                                                                                            <TooltipProvider key={`ctcf-${ctcf.site_id}`}>
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <div
                                                                                                            className="absolute top-10 bg-[var(--genomic-green)]/60 rounded cursor-help transition-all duration-200"
                                                                                                            style={{
                                                                                                                left: `${ctcfScreenPos}%`,
                                                                                                                width: `${Math.max(2, 6 / Math.sqrt(zoomLevel))}px`,
                                                                                                                height: `${Math.min(48, 24 + (zoomLevel * 6))}px`,
                                                                                                            }}
                                                                                                        />
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        <div className="text-xs space-y-1">
                                                                                                            <p className="font-mono text-primary-foreground">CTCF Site #{ctcf.site_id}</p>
                                                                                                            <p className="text-primary-foreground">
                                                                                                                {ctcf.chrom}:{ctcf.start.toLocaleString()}-{ctcf.end.toLocaleString()}
                                                                                                            </p>
                                                                                                            {ctcf.score && (
                                                                                                                <p className="text-primary-foreground">
                                                                                                                    Score: {typeof ctcf.score === 'number' ? ctcf.score.toFixed(2) : Number(ctcf.score).toFixed(2)}
                                                                                                                </p>
                                                                                                            )}
                                                                                                            {ctcf.cons_class && (
                                                                                                                <p className="text-primary-foreground">
                                                                                                                    Conservation: {ctcf.cons_class}
                                                                                                                </p>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </TooltipProvider>
                                                                                        ) : null;
                                                                                    })}

                                                                                    {/* GWAS SNPs - from API data */}
                                                                                    {speciesData && speciesData.gwas_snps.slice(0, 10).map((snp, i) => {
                                                                                        const snpPos = snp.pos - speciesData.gene.start;
                                                                                        const snpScreenPos = getScreenPosition(snpPos);

                                                                                        return snpScreenPos >= -5 && snpScreenPos <= 105 ? (
                                                                                            <TooltipProvider key={`snp-${snp.snp_id}`}>
                                                                                                <Tooltip>
                                                                                                    <TooltipTrigger asChild>
                                                                                                        <div
                                                                                                            className="absolute top-7 bg-destructive rounded-full cursor-help border-2 border-background transition-all duration-200"
                                                                                                            style={{
                                                                                                                left: `${snpScreenPos}%`,
                                                                                                                width: '8px',
                                                                                                                height: '8px',
                                                                                                            }}
                                                                                                        />
                                                                                                    </TooltipTrigger>
                                                                                                    <TooltipContent>
                                                                                                        <div className="text-xs space-y-1">
                                                                                                            <p className="font-mono text-primary-foreground">{snp.rsid || `SNP ${snp.snp_id}`}</p>
                                                                                                            <p className="text-primary-foreground">
                                                                                                                {snp.chrom}:{snp.pos.toLocaleString()}
                                                                                                            </p>
                                                                                                            {snp.trait && (
                                                                                                                <p className="text-primary-foreground">
                                                                                                                    Trait: {snp.trait}
                                                                                                                </p>
                                                                                                            )}
                                                                                                            {snp.pval && (
                                                                                                                <p className="text-primary-foreground">
                                                                                                                    p-value: {snp.pval.toExponential(2)}
                                                                                                                </p>
                                                                                                            )}
                                                                                                        </div>
                                                                                                    </TooltipContent>
                                                                                                </Tooltip>
                                                                                            </TooltipProvider>
                                                                                        ) : null;
                                                                                    })}

                                                                                    {/* Genomic coordinate scale */}
                                                                                    <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] text-muted-foreground font-mono">
                                                                                        <span>
                                                                                            {speciesData.gene.chrom}:{((geneCoords.start + clampedViewStart) / 1000000).toFixed(2)} Mb
                                                                                        </span>
                                                                                        <span>
                                                                                            {speciesData.gene.chrom}:{((geneCoords.start + clampedViewStart + currentWindowSize) / 1000000).toFixed(2)} Mb
                                                                                        </span>
                                                                                    </div>
                                                                                </>
                                                                            ) : (
                                                                                <div className="absolute inset-0 flex items-center justify-center">
                                                                                    <p className="text-xs text-muted-foreground">No data available for {speciesDisplayName}</p>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                );
                                                            })}
                                                    </>
                                                )}
                                            </div>

                                            {/* Legend */}
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg border border-border">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-primary rounded" />
                                                    <span className="text-xs text-muted-foreground">Gene locus</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-[var(--data-orange)] rounded" />
                                                    <span className="text-xs text-muted-foreground">Enhancer</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-[var(--genomic-green)]/60 rounded" />
                                                    <span className="text-xs text-muted-foreground">CTCF site</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="w-4 h-4 bg-destructive rounded-full" />
                                                    <span className="text-xs text-muted-foreground">GWAS SNP</span>
                                                </div>
                                            </div>

                                            {/* Data Quality Warnings */}
                                            {geneInfo?.dataQuality.score_availability !== 'high' && displayData &&
                                                ((displayData.enhancersWithScore || 0) / displayData.enhancers) < 1 && (
                                                    <Alert className="bg-[var(--data-orange)]/10 border-[var(--data-orange)]/20">
                                                        <AlertCircle className="h-4 w-4 text-[var(--data-orange)]" />
                                                        <AlertDescription className="text-sm text-[var(--data-orange)]">
                                                            <strong>Data Quality Notice:</strong> {displayData.enhancersWithScore || 0} of {displayData.enhancers} enhancers
                                                            ({((((displayData.enhancersWithScore || 0) / displayData.enhancers) * 100) || 0).toFixed(0)}%) have activity scores.
                                                            Faded enhancers indicate missing score data.
                                                        </AlertDescription>
                                                    </Alert>
                                                )}

                                            {selectedTissue === 'Liver' && (
                                                <Alert className="bg-destructive/10 border-destructive/20">
                                                    <AlertCircle className="h-4 w-4 text-destructive" />
                                                    <AlertDescription className="text-sm text-destructive">
                                                        <strong>Low Coverage Warning:</strong> Human liver tissue has limited enhancer data (9 total) compared to mouse (29,895).
                                                        Consider using mouse data for liver-specific analyses.
                                                    </AlertDescription>
                                                </Alert>
                                            )}
                                        </div>
                                    )}

                                    {/* Tab Content - Conservation */}
                                    {selectedTab === 'conservation' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <h3 className="text-foreground">Cross-Species Conservation Matrix</h3>
                                                <Badge variant="secondary" className="text-xs">
                                                    100 bins
                                                </Badge>
                                            </div>

                                            {loading ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                    Loading conservation data...
                                                </div>
                                            ) : selectedSpecies.length === 0 ? (
                                                <Alert className="bg-orange-50 border-orange-200">
                                                    <AlertCircle className="h-4 w-4 text-orange-600" />
                                                    <AlertDescription className="text-sm text-orange-600">
                                                        Please select at least one species from the species selector above to display conservation data.
                                                    </AlertDescription>
                                                </Alert>
                                            ) : (
                                                <div className="space-y-4">
                                                    {availableSpecies
                                                        .filter(speciesObj => selectedSpecies.includes(getSpeciesDisplayName(speciesObj.id)))
                                                        .sort((a, b) => {
                                                            // Sort so tracks with data come first, then tracks without data
                                                            const aData = speciesDataMap[a.id] || null;
                                                            const bData = speciesDataMap[b.id] || null;
                                                            const aHasData = aData !== null;
                                                            const bHasData = bData !== null;

                                                            if (aHasData && !bHasData) return -1;
                                                            if (!aHasData && bHasData) return 1;
                                                            return 0; // Keep original order for items with same data status
                                                        })
                                                        .map((speciesObj) => {
                                                            // Map species to their respective data
                                                            const speciesDisplayName = getSpeciesDisplayName(speciesObj.id);
                                                            const speciesData = speciesDataMap[speciesObj.id] || null;

                                                            if (!speciesData) {
                                                                return (
                                                                    <div key={speciesObj.id} className="space-y-2">
                                                                        <div className="flex items-center justify-between">
                                                                            <span className="text-sm text-foreground">{speciesDisplayName}</span>
                                                                            <Badge variant="outline" className="text-xs">
                                                                                No data
                                                                            </Badge>
                                                                        </div>
                                                                        <div className="h-12 bg-secondary/20 rounded border border-border p-1 flex items-center justify-center">
                                                                            <span className="text-xs text-muted-foreground">No enhancer data available</span>
                                                                        </div>
                                                                    </div>
                                                                );
                                                            }

                                                            // Calculate conservation bins from real data
                                                            const conservationBins = calculateConservationBins(
                                                                speciesData.enhancers,
                                                                speciesData.gene.start,
                                                                speciesData.gene.end,
                                                                100
                                                            );

                                                            // Calculate average conservation
                                                            const avgConservation = conservationBins.length > 0
                                                                ? Math.round(conservationBins.reduce((a, b) => a + b, 0) / conservationBins.length)
                                                                : 0;

                                                            // Count conserved enhancers (check both class_name and class)
                                                            const conservedCount = speciesData.enhancers.filter(e => {
                                                                const enhClass = (e as any).class || e.class_name;
                                                                return enhClass === 'conserved';
                                                            }).length;
                                                            const totalCount = speciesData.enhancers.length;

                                                            return (
                                                                <div key={speciesObj.id} className="space-y-2">
                                                                    <div className="flex items-center justify-between">
                                                                        <div className="flex items-center gap-2">
                                                                            <span className="text-sm text-foreground">{speciesDisplayName}</span>
                                                                            <span className="text-xs text-muted-foreground">
                                                                                ({conservedCount}/{totalCount} conserved)
                                                                            </span>
                                                                        </div>
                                                                        <span className="text-xs text-muted-foreground font-mono">
                                                                            {avgConservation}% avg density
                                                                        </span>
                                                                    </div>
                                                                    <div className="h-12 bg-secondary/20 rounded border border-border p-1">
                                                                        <div className="grid grid-cols-50 gap-0.5 h-full">
                                                                            {conservationBins.slice(0, 50).map((val, i) => {
                                                                                return (
                                                                                    <TooltipProvider key={i}>
                                                                                        <Tooltip>
                                                                                            <TooltipTrigger asChild>
                                                                                                <div
                                                                                                    style={{ background: getConservationColor(val), borderRadius: 2 }}
                                                                                                    className="h-full w-full cursor-help"
                                                                                                />
                                                                                            </TooltipTrigger>
                                                                                            <TooltipContent>
                                                                                                <span className="text-xs font-mono">Bin {i + 1}: <b>{val}%</b> density</span>
                                                                                            </TooltipContent>
                                                                                        </Tooltip>
                                                                                    </TooltipProvider>
                                                                                );
                                                                            })}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })}
                                                </div>
                                            )}

                                            {/* Legend: true gradient bar */}
                                            <div className="flex items-center gap-4 text-xs mt-8">
                                                <span className="text-muted-foreground">Low</span>
                                                <div
                                                    className="flex-1 h-3 rounded"
                                                    style={{
                                                        background: 'linear-gradient(90deg, #6c6c6cff 0%, #6366f1 50%, #06b6d4 100%)'
                                                    }}
                                                />
                                                <span className="text-muted-foreground">High Density</span>
                                            </div>
                                            <Alert className="bg-primary/10 border-primary/20 mt-8">
                                                <Info className="h-4 w-4 text-primary" />
                                                <AlertDescription className="text-sm text-primary">
                                                    Heatmap showing spatial distribution of conserved enhancers across the gene region. Color intensity indicates enhancer density per genomic bin.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    {/* Tab Content - Expression */}
                                    {selectedTab === 'expression' && (
                                        <div className="space-y-4">
                                            <h3 className="text-foreground mb-4">Tissue Expression Profile</h3>

                                            {expressionLoading ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                    Loading expression data...
                                                </div>
                                            ) : expressionData.length > 0 ? (
                                                <div className="space-y-4">
                                                    {expressionData.map((item) => {
                                                        // Calculate percentage for bar (normalize to 0-100 scale based on max TPM)
                                                        const maxTPM = Math.max(...expressionData.map(d => d.tpm), 1);
                                                        const percentage = (item.tpm / maxTPM) * 100;
                                                        const available = item.tpm > 0;

                                                        return (
                                                            <div key={item.tissue} className="space-y-2">
                                                                <div className="flex justify-between text-sm items-center">
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-foreground">{item.tissue}</span>
                                                                        {!available && (
                                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                                No data
                                                                            </Badge>
                                                                        )}
                                                                    </div>
                                                                    <span className="text-muted-foreground font-mono text-xs">
                                                                        {available ? `${item.tpm.toFixed(2)} TPM` : 'N/A'}
                                                                    </span>
                                                                </div>
                                                                <div className="h-3 bg-secondary/30 rounded overflow-hidden">
                                                                    {available ? (
                                                                        <div
                                                                            className="h-full bg-gradient-to-r from-primary to-[var(--genomic-green)] rounded transition-all duration-300"
                                                                            style={{ width: `${percentage}%` }}
                                                                        />
                                                                    ) : (
                                                                        <div className="h-full bg-muted-foreground/20 rounded flex items-center justify-center">
                                                                            <span className="text-[10px] text-muted-foreground">No data</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            ) : (
                                                <Alert className="bg-secondary/20 border-border">
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                    <AlertDescription className="text-sm text-muted-foreground">
                                                        No expression data available for {selectedGene}.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <Alert className="bg-primary/10 border-primary/20 mt-12">
                                                <Info className="h-4 w-4 text-primary" />
                                                <AlertDescription className="text-sm text-primary">
                                                    Expression values shown as Transcripts Per Million (TPM) from GTEx v8 RNA-seq data.
                                                    Values are averaged across multiple tissue subtypes for broader tissue categories.
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}

                                    {/* Tab Content - GWAS */}
                                    {selectedTab === 'gwas' && (
                                        <div className="space-y-4">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip>
                                                            <TooltipTrigger asChild>
                                                                <h3 className="text-foreground cursor-help">GWAS SNP Associations</h3>
                                                            </TooltipTrigger>
                                                            <TooltipContent className="max-w-sm">
                                                                <p className="text-sm">
                                                                    Genome-wide association study (GWAS) SNPs associated with traits or diseases.
                                                                    This data is human-specific, while the genome tracks above show cross-species regulatory elements.
                                                                </p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                    <Badge variant="outline" className="text-xs">Human Only</Badge>
                                                </div>
                                                <Badge variant="secondary">{apiData?.gwas_snps.length || 0} Human SNPs</Badge>
                                            </div>

                                            {loading ? (
                                                <div className="text-center py-8 text-muted-foreground">
                                                    <Activity className="w-6 h-6 animate-spin mx-auto mb-2" />
                                                    Loading GWAS data...
                                                </div>
                                            ) : apiData && apiData.gwas_snps.length > 0 ? (
                                                <>
                                                    {/* Search Bar */}
                                                    <div className="relative">
                                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                                        <Input
                                                            placeholder="Search by rsID, position, trait, or category..."
                                                            value={snpSearchQuery}
                                                            onChange={(e) => {
                                                                setSnpSearchQuery(e.target.value);
                                                                setSnpCurrentPage(1); // Reset to first page on search
                                                            }}
                                                            className="pl-10 bg-background/50 border-border focus:border-primary/50"
                                                        />
                                                    </div>

                                                    {(() => {
                                                        // Filter SNPs based on search query and p-value validity
                                                        const filteredSnps = apiData.gwas_snps.filter((snp) => {
                                                            // First filter out SNPs with 0 or invalid p-values
                                                            if (!snp.pval || snp.pval <= 0) return false;

                                                            // Then apply search query filter
                                                            if (!snpSearchQuery) return true;
                                                            const query = snpSearchQuery.toLowerCase();
                                                            return (
                                                                (snp.rsid && snp.rsid.toLowerCase().includes(query)) ||
                                                                snp.snp_id.toString().includes(query) ||
                                                                `${snp.chrom}:${snp.pos}`.toLowerCase().includes(query) ||
                                                                (snp.trait && snp.trait.toLowerCase().includes(query)) ||
                                                                (snp.category && snp.category.toLowerCase().includes(query))
                                                            );
                                                        });

                                                        // Calculate pagination
                                                        const totalPages = Math.ceil(filteredSnps.length / snpItemsPerPage);
                                                        const startIndex = (snpCurrentPage - 1) * snpItemsPerPage;
                                                        const endIndex = startIndex + snpItemsPerPage;
                                                        const paginatedSnps = filteredSnps.slice(startIndex, endIndex);

                                                        return filteredSnps.length > 0 ? (
                                                            <>
                                                                {/* Results Summary */}
                                                                <div className="text-sm text-muted-foreground">
                                                                    Showing {startIndex + 1}-{Math.min(endIndex, filteredSnps.length)} of {filteredSnps.length} SNPs
                                                                    {snpSearchQuery && ` (filtered from ${apiData.gwas_snps.length} total)`}
                                                                </div>

                                                                {/* SNP Cards - Compact Layout with Expandable Details */}
                                                                <div className="space-y-2">
                                                                    {paginatedSnps.map((snp) => {
                                                                        const isExpanded = expandedSnps.has(snp.snp_id);

                                                                        return (
                                                                            <Collapsible
                                                                                key={snp.snp_id}
                                                                                open={isExpanded}
                                                                                onOpenChange={(open) => {
                                                                                    const newExpanded = new Set(expandedSnps);
                                                                                    if (open) {
                                                                                        newExpanded.add(snp.snp_id);
                                                                                    } else {
                                                                                        newExpanded.delete(snp.snp_id);
                                                                                    }
                                                                                    setExpandedSnps(newExpanded);
                                                                                }}
                                                                            >
                                                                                <Card
                                                                                    className="bg-secondary/20 border-border hover:border-primary/30 transition-colors cursor-pointer overflow-hidden"
                                                                                    onClick={() => {
                                                                                        const newExpanded = new Set(expandedSnps);
                                                                                        if (isExpanded) {
                                                                                            newExpanded.delete(snp.snp_id);
                                                                                        } else {
                                                                                            newExpanded.add(snp.snp_id);
                                                                                        }
                                                                                        setExpandedSnps(newExpanded);
                                                                                    }}
                                                                                >
                                                                                    <div className="w-full p-3 hover:bg-secondary/10 transition-colors">
                                                                                        <div className="flex items-center justify-between gap-4">
                                                                                            <div className="flex items-center gap-3 min-w-0 flex-1">
                                                                                                <ChevronDown
                                                                                                    className="w-4 h-4 flex-shrink-0 transition-transform duration-200"
                                                                                                    style={{
                                                                                                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(180deg)'
                                                                                                    }}
                                                                                                />
                                                                                                <code className="text-sm text-primary font-mono truncate">
                                                                                                    {snp.rsid || `${snp.chrom}:${snp.pos}`}
                                                                                                </code>
                                                                                                <span className="font-mono text-xs text-muted-foreground hidden sm:inline">
                                                                                                    {snp.chrom}:{snp.pos.toLocaleString()}
                                                                                                </span>
                                                                                            </div>
                                                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                                                {snp.trait && (
                                                                                                    <span className="text-xs text-foreground max-w-[200px] truncate hidden md:inline" title={snp.trait}>
                                                                                                        {snp.trait}
                                                                                                    </span>
                                                                                                )}
                                                                                                {snp.category && (
                                                                                                    <Badge variant="outline" className="text-xs">
                                                                                                        {snp.category}
                                                                                                    </Badge>
                                                                                                )}
                                                                                                {snp.pval && snp.pval > 0 && (
                                                                                                    <Badge className="bg-[var(--genomic-green)]/10 text-[var(--genomic-green)] border-[var(--genomic-green)]/20 text-xs">
                                                                                                        p = {snp.pval.toExponential(1)}
                                                                                                    </Badge>
                                                                                                )}
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>

                                                                                    <CollapsibleContent>
                                                                                        <div className="px-3 pb-6 pt-4 border-t border-border/50 hover:bg-secondary/5 transition-colors">
                                                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                                                                                <div className="space-y-2">
                                                                                                    <div className="flex justify-between items-start">
                                                                                                        <span className="text-muted-foreground font-medium">SNP ID:</span>
                                                                                                        <code className="text-xs font-mono text-foreground">{snp.snp_id}</code>
                                                                                                    </div>
                                                                                                    {snp.rsid && (
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-muted-foreground font-medium">rsID:</span>
                                                                                                            <code className="text-xs font-mono text-primary">{snp.rsid}</code>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    <div className="flex justify-between items-start">
                                                                                                        <span className="text-muted-foreground font-medium">Chromosome:</span>
                                                                                                        <span className="text-xs text-foreground">{snp.chrom}</span>
                                                                                                    </div>
                                                                                                    <div className="flex justify-between items-start">
                                                                                                        <span className="text-muted-foreground font-medium">Position:</span>
                                                                                                        <code className="text-xs font-mono text-foreground">{snp.pos.toLocaleString()}</code>
                                                                                                    </div>
                                                                                                </div>

                                                                                                <div className="space-y-2">
                                                                                                    {snp.pval && snp.pval > 0 && (
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-muted-foreground font-medium">P-value:</span>
                                                                                                            <span className="text-xs font-mono text-[var(--genomic-green)]">{snp.pval.toExponential(3)}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {snp.trait && (
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-muted-foreground font-medium">Trait:</span>
                                                                                                            <span className="text-xs text-foreground text-right flex-1 ml-2">{snp.trait}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {snp.category && (
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-muted-foreground font-medium">Category:</span>
                                                                                                            <Badge variant="outline" className="text-xs">{snp.category}</Badge>
                                                                                                        </div>
                                                                                                    )}
                                                                                                    {snp.source && (
                                                                                                        <div className="flex justify-between items-start">
                                                                                                            <span className="text-muted-foreground font-medium">Source:</span>
                                                                                                            <span className="text-xs text-muted-foreground">{snp.source}</span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </CollapsibleContent>
                                                                                </Card>
                                                                            </Collapsible>
                                                                        );
                                                                    })}
                                                                </div>

                                                                {/* Pagination */}
                                                                {totalPages > 1 && (
                                                                    <Pagination className="mt-4">
                                                                        <PaginationContent className="gap-1">
                                                                            <PaginationItem>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        if (snpCurrentPage > 1) {
                                                                                            setSnpCurrentPage(snpCurrentPage - 1);
                                                                                        }
                                                                                    }}
                                                                                    disabled={snpCurrentPage === 1}
                                                                                    className="h-8 gap-1 px-2"
                                                                                >
                                                                                    <ChevronLeft className="h-4 w-4" />
                                                                                    <span className="hidden sm:inline">Previous</span>
                                                                                </Button>
                                                                            </PaginationItem>

                                                                            {/* Page Numbers */}
                                                                            {(() => {
                                                                                const pages: React.ReactElement[] = [];
                                                                                const maxVisiblePages = 5;

                                                                                if (totalPages <= maxVisiblePages) {
                                                                                    // Show all pages if total is small
                                                                                    for (let i = 1; i <= totalPages; i++) {
                                                                                        pages.push(
                                                                                            <PaginationItem key={i}>
                                                                                                <Button
                                                                                                    variant={snpCurrentPage === i ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setSnpCurrentPage(i)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    {i}
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }
                                                                                } else {
                                                                                    // Show first page
                                                                                    pages.push(
                                                                                        <PaginationItem key={1}>
                                                                                            <Button
                                                                                                variant={snpCurrentPage === 1 ? "default" : "outline"}
                                                                                                size="sm"
                                                                                                onClick={() => setSnpCurrentPage(1)}
                                                                                                className="h-8 w-8 p-0"
                                                                                            >
                                                                                                1
                                                                                            </Button>
                                                                                        </PaginationItem>
                                                                                    );

                                                                                    // Show ellipsis if needed
                                                                                    if (snpCurrentPage > 3) {
                                                                                        pages.push(
                                                                                            <PaginationItem key="ellipsis1">
                                                                                                <span className="flex h-8 w-8 items-center justify-center">
                                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                                </span>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }

                                                                                    // Show current page and neighbors
                                                                                    const start = Math.max(2, snpCurrentPage - 1);
                                                                                    const end = Math.min(totalPages - 1, snpCurrentPage + 1);

                                                                                    for (let i = start; i <= end; i++) {
                                                                                        pages.push(
                                                                                            <PaginationItem key={i}>
                                                                                                <Button
                                                                                                    variant={snpCurrentPage === i ? "default" : "outline"}
                                                                                                    size="sm"
                                                                                                    onClick={() => setSnpCurrentPage(i)}
                                                                                                    className="h-8 w-8 p-0"
                                                                                                >
                                                                                                    {i}
                                                                                                </Button>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }

                                                                                    // Show ellipsis if needed
                                                                                    if (snpCurrentPage < totalPages - 2) {
                                                                                        pages.push(
                                                                                            <PaginationItem key="ellipsis2">
                                                                                                <span className="flex h-8 w-8 items-center justify-center">
                                                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                                                </span>
                                                                                            </PaginationItem>
                                                                                        );
                                                                                    }

                                                                                    // Show last page
                                                                                    pages.push(
                                                                                        <PaginationItem key={totalPages}>
                                                                                            <Button
                                                                                                variant={snpCurrentPage === totalPages ? "default" : "outline"}
                                                                                                size="sm"
                                                                                                onClick={() => setSnpCurrentPage(totalPages)}
                                                                                                className="h-8 w-8 p-0"
                                                                                            >
                                                                                                {totalPages}
                                                                                            </Button>
                                                                                        </PaginationItem>
                                                                                    );
                                                                                }

                                                                                return pages;
                                                                            })()}

                                                                            <PaginationItem>
                                                                                <Button
                                                                                    variant="outline"
                                                                                    size="sm"
                                                                                    onClick={() => {
                                                                                        if (snpCurrentPage < totalPages) {
                                                                                            setSnpCurrentPage(snpCurrentPage + 1);
                                                                                        }
                                                                                    }}
                                                                                    disabled={snpCurrentPage === totalPages}
                                                                                    className="h-8 gap-1 px-2"
                                                                                >
                                                                                    <span className="hidden sm:inline">Next</span>
                                                                                    <ChevronRight className="h-4 w-4" />
                                                                                </Button>
                                                                            </PaginationItem>
                                                                        </PaginationContent>
                                                                    </Pagination>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <Alert className="bg-secondary/20 border-border">
                                                                <Info className="h-4 w-4 text-muted-foreground" />
                                                                <AlertDescription className="text-sm text-muted-foreground">
                                                                    No GWAS SNPs match your search criteria. Try adjusting your search terms.
                                                                </AlertDescription>
                                                            </Alert>
                                                        );
                                                    })()}
                                                </>
                                            ) : (
                                                <Alert className="bg-secondary/20 border-border">
                                                    <Info className="h-4 w-4 text-muted-foreground" />
                                                    <AlertDescription className="text-sm text-muted-foreground">
                                                        No human GWAS SNP associations found for {selectedGene} in the current database.
                                                        The genome tracks above may show regulatory elements from other species.
                                                    </AlertDescription>
                                                </Alert>
                                            )}

                                            <Alert className="bg-primary/10 border-primary/20">
                                                <Info className="h-4 w-4 text-primary" />
                                                <AlertDescription className="text-sm text-primary">
                                                    <div className="space-y-1">
                                                        <div>GWAS SNPs shown are within the ±1000kb region around the transcription start site (TSS) of {selectedGene}.</div>
                                                        <div className="text-xs opacity-90">
                                                            Note: This section shows human GWAS data only. The genome tracks above may display additional regulatory elements from mouse and pig species.
                                                        </div>
                                                    </div>
                                                </AlertDescription>
                                            </Alert>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}