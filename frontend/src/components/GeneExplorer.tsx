import { useState, useRef, useEffect } from 'react';
import { Search, Download, ZoomIn, ZoomOut, Maximize2, AlertCircle, Info, ChevronRight, ChevronLeft, Database, Activity } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { Slider } from './ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from './ui/tooltip';

interface GeneData {
    fullName: string;
    chromosome: string;
    position: string;
    enhancers: number;
    enhancersWithScore?: number;
    enhancersWithTissue?: number;
    conservation: number;
    species: string[];
    ctcfSites?: number;
    gwasSnps?: number;
    dataQuality: {
        tissueAvailability: 'high' | 'low' | 'none';
        scoreAvailability: 'high' | 'low' | 'none';
        ctcfAnnotation: 'complete' | 'partial' | 'missing';
    };
}

export function GeneExplorer() {
    const [selectedGene, setSelectedGene] = useState('BDNF');
    const [zoomLevel, setZoomLevel] = useState(1);
    const [viewStart, setViewStart] = useState(0); // Start position of the current view
    const [selectedTissue, setSelectedTissue] = useState<string>('Brain');
    const [showError, setShowError] = useState(false);
    const trackRef = useRef<HTMLDivElement>(null);

    const exampleGenes = ['BDNF', 'FOXP2', 'ALB', 'PCSK9', 'TP53', 'APOE'];

    const geneData: Record<string, GeneData> = {
        BDNF: {
            fullName: 'Brain-Derived Neurotrophic Factor',
            chromosome: 'chr11',
            position: '27,654,894-27,724,285',
            enhancers: 48,
            enhancersWithScore: 34,
            enhancersWithTissue: 48,
            conservation: 89,
            species: ['Human', 'Mouse', 'Pig'],
            ctcfSites: 12,
            gwasSnps: 3,
            dataQuality: {
                tissueAvailability: 'high',
                scoreAvailability: 'high',
                ctcfAnnotation: 'missing',
            }
        },
        FOXP2: {
            fullName: 'Forkhead Box P2',
            chromosome: 'chr7',
            position: '114,086,327-114,693,772',
            enhancers: 28,
            enhancersWithScore: 8,
            enhancersWithTissue: 15,
            conservation: 94,
            species: ['Human', 'Mouse', 'Pig'],
            ctcfSites: 18,
            gwasSnps: 1,
            dataQuality: {
                tissueAvailability: 'low',
                scoreAvailability: 'low',
                ctcfAnnotation: 'missing',
            }
        },
        ALB: {
            fullName: 'Albumin',
            chromosome: 'chr4',
            position: '73,404,256-73,421,412',
            enhancers: 9,
            enhancersWithScore: 0,
            enhancersWithTissue: 9,
            conservation: 76,
            species: ['Human', 'Mouse'],
            ctcfSites: 6,
            gwasSnps: 5,
            dataQuality: {
                tissueAvailability: 'low',
                scoreAvailability: 'none',
                ctcfAnnotation: 'missing',
            }
        },
        PCSK9: {
            fullName: 'Proprotein Convertase Subtilisin/Kexin Type 9',
            chromosome: 'chr1',
            position: '55,039,475-55,064,852',
            enhancers: 18,
            enhancersWithScore: 12,
            enhancersWithTissue: 18,
            conservation: 82,
            species: ['Human', 'Mouse'],
            ctcfSites: 8,
            gwasSnps: 12,
            dataQuality: {
                tissueAvailability: 'high',
                scoreAvailability: 'high',
                ctcfAnnotation: 'missing',
            }
        },
    };

    const currentGene = geneData[selectedGene as keyof typeof geneData] || geneData.BDNF;

    // Parse gene coordinates for zoom calculations
    const parsePosition = (position: string) => {
        const [start, end] = position.replace(/,/g, '').split('-').map(Number);
        return { start, end, length: end - start };
    };

    const geneCoords = parsePosition(currentGene.position);

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

    // Mouse wheel zoom support with center-based zooming
    const handleWheel = (e: React.WheelEvent) => {
        if (e.ctrlKey || e.metaKey) {
            e.preventDefault();

            // Get mouse position relative to the track container
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const containerWidth = rect.width;
            const mouseRatio = mouseX / containerWidth; // 0 to 1, where mouse is in the view

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
                return <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">Unavailable</Badge>;
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

    return (
        <section id="gene-explorer" className="py-20 px-4 bg-gradient-to-b from-card/30 to-background">
            <div className="max-w-7xl mx-auto">
                <div className="mb-8">
                    <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                        <Database className="w-3 h-3 mr-1" />
                        195,977 Genes
                    </Badge>
                    <h2 className="text-4xl mb-3">Gene Explorer</h2>
                    <p className="text-muted-foreground">
                        Search and analyze gene regulatory landscapes across species with cross-species conservation data
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-6 w-full">
                    {/* Search Panel */}
                    <div className="lg:col-span-1 space-y-4 w-full min-w-0">
                        <Card className="p-4 bg-card border-border">
                            <div className="space-y-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search gene symbol..."
                                        className="pl-10 bg-input-background w-full min-w-0"
                                        defaultValue={selectedGene}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                const value = (e.target as HTMLInputElement).value.toUpperCase();
                                                if (exampleGenes.includes(value)) {
                                                    setSelectedGene(value);
                                                    setShowError(false);
                                                } else {
                                                    setShowError(true);
                                                }
                                            }
                                        }}
                                    />
                                </div>

                                {showError && (
                                    <Alert className="bg-destructive/10 border-destructive/20">
                                        <AlertCircle className="h-4 w-4 text-destructive" />
                                        <AlertDescription className="text-sm text-destructive">
                                            Gene not found in database. Try example genes below.
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
                                                    setShowError(false);
                                                }}
                                                className={selectedGene === gene ? 'bg-primary hover:bg-primary/90 text-primary-foreground' : ''}
                                                style={{ minWidth: 0, flex: '1 1 0px', wordBreak: 'break-word' }}
                                            >
                                                {gene}
                                            </Button>
                                        ))}
                                    </div>
                                </div>


                            </div>
                        </Card>

                        {/* Gene Info */}
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
                                    <p className="text-sm text-muted-foreground">{currentGene.fullName}</p>
                                </div>

                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Location:</span>
                                        <span className="font-mono text-xs text-foreground">
                                            {currentGene.chromosome}:{currentGene.position}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Enhancers:</span>
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary">{currentGene.enhancers}</Badge>
                                            {currentGene.enhancersWithScore !== undefined && (
                                                <TooltipProvider>
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Badge variant="outline" className="text-xs cursor-help">
                                                                {currentGene.enhancersWithScore} scored
                                                            </Badge>
                                                        </TooltipTrigger>
                                                        <TooltipContent>
                                                            <p className="text-xs">{((currentGene.enhancersWithScore / currentGene.enhancers) * 100).toFixed(0)}% of enhancers have activity scores</p>
                                                        </TooltipContent>
                                                    </Tooltip>
                                                </TooltipProvider>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">CTCF Sites:</span>
                                        <Badge variant="secondary">{currentGene.ctcfSites || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">GWAS SNPs:</span>
                                        <Badge variant="secondary">{currentGene.gwasSnps || 0}</Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-muted-foreground">Conservation:</span>
                                        <span className="text-[var(--genomic-green)]">{currentGene.conservation}%</span>
                                    </div>
                                </div>

                                <div className="pt-3 border-t border-border">
                                    <p className="text-xs text-muted-foreground mb-2">Available in:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {currentGene.species.map((species) => (
                                            <Badge key={species} variant="outline" className="text-xs">
                                                {species}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>

                                {/* Data Quality Indicators */}
                                <div className="pt-3 border-t border-border space-y-2">
                                    <p className="text-xs text-muted-foreground mb-2">Data Quality:</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Tissue Annotation:</span>
                                            {getDataQualityBadge(currentGene.dataQuality.tissueAvailability)}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">Activity Scores:</span>
                                            {getDataQualityBadge(currentGene.dataQuality.scoreAvailability)}
                                        </div>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="text-muted-foreground">CTCF Conservation:</span>
                                            <Badge variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
                                                Missing
                                            </Badge>
                                        </div>
                                    </div>
                                </div>

                                {/* TAD Domain Warning */}
                                {currentGene.dataQuality.ctcfAnnotation === 'missing' && (
                                    <Alert className="bg-[var(--data-orange)]/10 border-[var(--data-orange)]/20">
                                        <AlertCircle className="h-4 w-4 text-[var(--data-orange)]" />
                                        <AlertDescription className="text-xs text-[var(--data-orange)]">
                                            TAD domain and promoter data currently unavailable for this gene
                                        </AlertDescription>
                                    </Alert>
                                )}
                            </div>
                        </Card>
                    </div>

                    {/* Main Panel */}
                    <div className="lg:col-span-2 w-full min-w-0">
                        <Card className="p-6 bg-card border-border w-full min-w-0" style={{ wordBreak: 'break-word', overflowX: 'auto' }}>
                            <Tabs defaultValue="tracks" className="w-full">
                                <TabsList className="mb-6 bg-secondary/50">
                                    <TabsTrigger value="tracks">Genome Tracks</TabsTrigger>
                                    <TabsTrigger value="conservation">Conservation</TabsTrigger>
                                    <TabsTrigger value="expression">Expression</TabsTrigger>
                                    <TabsTrigger value="gwas">GWAS SNPs</TabsTrigger>
                                </TabsList>

                                <TabsContent value="tracks" className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-foreground">Multi-Species Genome Browser</h3>
                                        <div className="flex items-center gap-2">
                                            <Button size="sm" variant="outline">
                                                <Download className="w-4 h-4 mr-2" />
                                                Export BED
                                            </Button>
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
                                            <Button size="icon" variant="outline" onClick={handleZoomReset} className="w-8 h-8">
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

                                            {/* Pan controls - only show when zoomed in */}
                                            {zoomLevel > 1 && (
                                                <>
                                                    <div className="hidden sm:block w-px h-6 bg-border mx-2" />
                                                    <div className="flex items-center gap-1">
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => handlePan('left')}
                                                            disabled={clampedViewStart <= 0}
                                                            className="w-8 h-8"
                                                        >
                                                            <ChevronLeft className="w-3 h-3" />
                                                        </Button>
                                                        <Button
                                                            size="icon"
                                                            variant="outline"
                                                            onClick={() => handlePan('right')}
                                                            disabled={clampedViewStart >= maxViewStart}
                                                            className="w-8 h-8"
                                                        >
                                                            <ChevronRight className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </>
                                            )}
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
                                    <div className="space-y-6" ref={trackRef} onWheel={handleWheel}>
                                        <div className="text-xs text-muted-foreground mb-2 flex items-center gap-2">
                                            <Info className="w-3 h-3" />
                                            Use Up/Down arrows to zoom, Left/Right arrows to pan, Ctrl/Cmd + 0 to reset
                                        </div>
                                        {['Human', 'Mouse', 'Pig'].map((species, idx) => {
                                            const hasData = currentGene.species.includes(species);
                                            const identity = species === 'Human' ? 100 : species === 'Mouse' ? 87 : 79;

                                            // Calculate gene position within current view - gene positioned at center of base window
                                            const geneStart = 0.2 * baseWindowSize; // Gene starts at 20% of base window
                                            const geneEnd = 0.8 * baseWindowSize; // Gene ends at 80% of base window
                                            const geneLeftPercent = getScreenPosition(geneStart);
                                            const geneRightPercent = getScreenPosition(geneEnd);
                                            const geneWidthPercent = geneRightPercent - geneLeftPercent;

                                            return (
                                                <div key={species} className="space-y-2">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <h4 className="text-sm text-foreground">{species}</h4>
                                                            {!hasData && (
                                                                <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                    No data
                                                                </Badge>
                                                            )}
                                                        </div>
                                                        <Badge variant="secondary" className="text-xs">
                                                            {identity}% identity
                                                        </Badge>
                                                    </div>

                                                    <div
                                                        className={`h-32 bg-secondary/20 rounded border border-border relative overflow-hidden transition-all duration-200 ${!hasData ? 'opacity-40' : ''}`}
                                                    >
                                                        {hasData ? (
                                                            <>
                                                                {/* Chromosome ruler */}
                                                                <div className="absolute top-0 left-0 right-0 h-6 border-b border-border/50 bg-secondary/10">
                                                                    <div className="flex justify-between px-2 h-full items-center text-[10px] text-muted-foreground font-mono">
                                                                        {Array.from({ length: Math.min(11, Math.ceil(zoomLevel * 5)) }).map((_, i) => {
                                                                            const tickPosition = (i / Math.min(10, Math.ceil(zoomLevel * 5) - 1)) * 100;
                                                                            const genomicPos = clampedViewStart + (currentWindowSize * i / Math.min(10, Math.ceil(zoomLevel * 5) - 1));
                                                                            return (
                                                                                <div key={i} className="flex flex-col items-center" style={{ left: `${tickPosition}%`, position: 'absolute' }}>
                                                                                    <div className="w-px h-2 bg-border" />
                                                                                    {zoomLevel >= 2 && (
                                                                                        <span className="text-[8px] mt-0.5">
                                                                                            {(genomicPos / 1000).toFixed(0)}k
                                                                                        </span>
                                                                                    )}
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>

                                                                {/* Gene body - responsive to zoom and pan */}
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
                                                                {Array.from({ length: Math.min(currentGene.enhancers, 15) }).map((_, i) => {
                                                                    // Distribute enhancers around the gene (10% to 90% of base window)
                                                                    const enhancerPos = (0.1 + (i / 14) * 0.8) * baseWindowSize;
                                                                    const enhancerScreenPos = getScreenPosition(enhancerPos);
                                                                    const hasScore = currentGene.enhancersWithScore && i < currentGene.enhancersWithScore;

                                                                    return enhancerScreenPos >= -5 && enhancerScreenPos <= 105 ? (
                                                                        <TooltipProvider key={i}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div
                                                                                        className={`absolute top-8 rounded-full cursor-help transition-all duration-200 ${hasScore ? 'bg-[var(--data-orange)]' : 'bg-[var(--data-orange)]/30'
                                                                                            }`}
                                                                                        style={{
                                                                                            left: `${enhancerScreenPos}%`,
                                                                                            width: `${Math.max(2, 4 / Math.sqrt(zoomLevel))}px`,
                                                                                            height: `${Math.min(64, 32 + (zoomLevel * 8))}px`,
                                                                                            opacity: hasData ? 1 - (idx * 0.15) : 0.3
                                                                                        }}
                                                                                    />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <div className="text-xs space-y-1">
                                                                                        <p className="font-mono">Enhancer #{i + 1}</p>
                                                                                        <p className="text-muted-foreground">
                                                                                            Position: {(enhancerPos / 1000).toFixed(1)}kb
                                                                                        </p>
                                                                                        <p className="text-muted-foreground">
                                                                                            {hasScore ? 'Activity score: 0.8' : 'Score: N/A'}
                                                                                        </p>
                                                                                    </div>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : null;
                                                                })}

                                                                {/* CTCF sites - distributed around gene center */}
                                                                {currentGene.ctcfSites && Array.from({ length: Math.min(currentGene.ctcfSites, 8) }).map((_, i) => {
                                                                    // Distribute CTCF sites across wide area (5% to 95% of base window)
                                                                    const ctcfPos = (0.05 + (i / 7) * 0.9) * baseWindowSize;
                                                                    const ctcfScreenPos = getScreenPosition(ctcfPos);

                                                                    return ctcfScreenPos >= -5 && ctcfScreenPos <= 105 ? (
                                                                        <TooltipProvider key={`ctcf-${i}`}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div
                                                                                        className="absolute top-10 bg-[var(--genomic-green)]/60 rounded cursor-help transition-all duration-200"
                                                                                        style={{
                                                                                            left: `${ctcfScreenPos}%`,
                                                                                            width: `${Math.max(2, 6 / Math.sqrt(zoomLevel))}px`,
                                                                                            height: `${Math.min(48, 24 + (zoomLevel * 6))}px`,
                                                                                            opacity: hasData ? 1 - (idx * 0.15) : 0.3
                                                                                        }}
                                                                                    />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <div className="text-xs space-y-1">
                                                                                        <p className="font-mono">CTCF Site #{i + 1}</p>
                                                                                        <p className="text-muted-foreground">
                                                                                            Position: {(ctcfPos / 1000).toFixed(1)}kb
                                                                                        </p>
                                                                                        <p className="text-[var(--data-orange)]">Conservation class: N/A</p>
                                                                                    </div>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : null;
                                                                })}

                                                                {/* GWAS SNPs - positioned around gene center */}
                                                                {currentGene.gwasSnps && Array.from({ length: Math.min(currentGene.gwasSnps || 0, 5) }).map((_, i) => {
                                                                    // Position SNPs around the gene center area (25% to 75% of base window)
                                                                    const snpPos = (0.25 + (i / 4) * 0.5) * baseWindowSize;
                                                                    const snpScreenPos = getScreenPosition(snpPos);

                                                                    return snpScreenPos >= -5 && snpScreenPos <= 105 ? (
                                                                        <TooltipProvider key={`snp-${i}`}>
                                                                            <Tooltip>
                                                                                <TooltipTrigger asChild>
                                                                                    <div
                                                                                        className="absolute top-7 bg-destructive rounded-full cursor-help border-2 border-background transition-all duration-200"
                                                                                        style={{
                                                                                            left: `${snpScreenPos}%`,
                                                                                            width: `${Math.max(4, 8 / Math.sqrt(zoomLevel))}px`,
                                                                                            height: `${Math.max(4, 8 / Math.sqrt(zoomLevel))}px`,
                                                                                        }}
                                                                                    />
                                                                                </TooltipTrigger>
                                                                                <TooltipContent>
                                                                                    <div className="text-xs space-y-1">
                                                                                        <p className="font-mono">rs{1000000 + i}</p>
                                                                                        <p className="text-muted-foreground">
                                                                                            Position: {(snpPos / 1000).toFixed(1)}kb
                                                                                        </p>
                                                                                        <p className="text-muted-foreground">p-value: 1.2e-8</p>
                                                                                    </div>
                                                                                </TooltipContent>
                                                                            </Tooltip>
                                                                        </TooltipProvider>
                                                                    ) : null;
                                                                })}

                                                                {/* Scale */}
                                                                <div className="absolute bottom-1 left-0 right-0 flex justify-between px-2 text-[10px] text-muted-foreground font-mono">
                                                                    <span>{((geneCoords.start + clampedViewStart) / 1000).toFixed(0)}kb</span>
                                                                    <span>{((geneCoords.start + clampedViewStart + currentWindowSize) / 1000).toFixed(0)}kb</span>
                                                                </div>
                                                            </>
                                                        ) : (
                                                            <div className="absolute inset-0 flex items-center justify-center">
                                                                <p className="text-xs text-muted-foreground">No data available for {species}</p>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>

                                    {/* Legend */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/20 rounded-lg border border-border">
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-primary rounded" />
                                            <span className="text-xs text-muted-foreground">Gene</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[var(--data-orange)] rounded" />
                                            <span className="text-xs text-muted-foreground">Enhancer</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-[var(--genomic-green)]/60 rounded" />
                                            <span className="text-xs text-muted-foreground">CTCF Site</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <div className="w-4 h-4 bg-destructive rounded-full" />
                                            <span className="text-xs text-muted-foreground">GWAS SNP</span>
                                        </div>
                                    </div>

                                    {/* Data Quality Warnings */}
                                    {currentGene.dataQuality.scoreAvailability !== 'high' && (
                                        <Alert className="bg-[var(--data-orange)]/10 border-[var(--data-orange)]/20">
                                            <AlertCircle className="h-4 w-4 text-[var(--data-orange)]" />
                                            <AlertDescription className="text-sm text-[var(--data-orange)]">
                                                <strong>Data Quality Notice:</strong> {currentGene.enhancersWithScore || 0} of {currentGene.enhancers} enhancers
                                                ({((((currentGene.enhancersWithScore || 0) / currentGene.enhancers) * 100) || 0).toFixed(0)}%) have activity scores.
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
                                </TabsContent>

                                <TabsContent value="conservation" className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-foreground">Cross-Species Conservation Matrix</h3>
                                        <Badge variant="secondary" className="text-xs">
                                            100 bins
                                        </Badge>
                                    </div>

                                    <div className="space-y-4">
                                        {['Human', 'Mouse', 'Pig'].map((species, idx) => (
                                            <div key={species} className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-foreground">{species}</span>
                                                    <span className="text-xs text-muted-foreground font-mono">
                                                        {species === 'Human' ? '100%' : species === 'Mouse' ? '87%' : '79%'} avg conservation
                                                    </span>
                                                </div>
                                                <div className="h-12 bg-secondary/20 rounded border border-border p-1">
                                                    <div className="grid grid-cols-50 gap-0.5 h-full">
                                                        {Array.from({ length: 50 }).map((_, i) => {
                                                            const baseConservation = species === 'Human' ? 95 : species === 'Mouse' ? 85 : 75;
                                                            const conservation = baseConservation + (Math.random() * 20 - 10);
                                                            const color = conservation > 90 ? 'var(--genomic-green)' :
                                                                conservation > 80 ? 'var(--genomic-blue)' :
                                                                    conservation > 70 ? 'var(--data-orange)' : '#8b91b0';
                                                            return (
                                                                <TooltipProvider key={i}>
                                                                    <Tooltip>
                                                                        <TooltipTrigger asChild>
                                                                            <div
                                                                                className="rounded-sm cursor-help"
                                                                                style={{
                                                                                    backgroundColor: color,
                                                                                    opacity: conservation / 100
                                                                                }}
                                                                            />
                                                                        </TooltipTrigger>
                                                                        <TooltipContent>
                                                                            <p className="text-xs">Bin {i + 1}: {conservation.toFixed(0)}% conserved</p>
                                                                        </TooltipContent>
                                                                    </Tooltip>
                                                                </TooltipProvider>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex items-center gap-4 text-xs">
                                        <span className="text-muted-foreground">Low</span>
                                        <div className="flex-1 h-3 bg-gradient-to-r from-[#8b91b0] via-[var(--data-orange)] via-[var(--genomic-blue)] to-[var(--genomic-green)] rounded" />
                                        <span className="text-muted-foreground">High Conservation</span>
                                    </div>

                                    <Alert className="bg-primary/10 border-primary/20">
                                        <Info className="h-4 w-4 text-primary" />
                                        <AlertDescription className="text-sm text-primary">
                                            Conservation scores represent sequence similarity in enhancer regions across species.
                                            Higher values indicate stronger evolutionary conservation.
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>

                                <TabsContent value="expression" className="space-y-4">
                                    <h3 className="text-foreground mb-4">Tissue Expression Profile</h3>
                                    <div className="space-y-4">
                                        {[
                                            { tissue: 'Brain', value: 92, available: true },
                                            { tissue: 'Heart', value: 45, available: true },
                                            { tissue: 'Liver', value: 28, available: selectedGene !== 'ALB' },
                                            { tissue: 'Kidney', value: 38, available: true },
                                            { tissue: 'Lung', value: 56, available: true },
                                        ].map((item) => (
                                            <div key={item.tissue} className="space-y-2">
                                                <div className="flex justify-between text-sm items-center">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-foreground">{item.tissue}</span>
                                                        {!item.available && (
                                                            <Badge variant="outline" className="text-xs text-muted-foreground">
                                                                Limited data
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <span className="text-muted-foreground font-mono text-xs">
                                                        {item.available ? `${item.value} TPM` : 'N/A'}
                                                    </span>
                                                </div>
                                                <div className="h-3 bg-secondary/30 rounded overflow-hidden">
                                                    {item.available ? (
                                                        <div
                                                            className="h-full bg-gradient-to-r from-primary to-[var(--genomic-green)] rounded"
                                                            style={{ width: `${item.value}%` }}
                                                        />
                                                    ) : (
                                                        <div className="h-full bg-muted-foreground/20 rounded flex items-center justify-center">
                                                            <span className="text-[10px] text-muted-foreground">No data</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <Alert className="bg-primary/10 border-primary/20">
                                        <Info className="h-4 w-4 text-primary" />
                                        <AlertDescription className="text-sm text-primary">
                                            Expression values shown as Transcripts Per Million (TPM) from GTEx v8 RNA-seq data.
                                        </AlertDescription>
                                    </Alert>
                                </TabsContent>

                                <TabsContent value="gwas" className="space-y-4">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-foreground">GWAS SNP Associations</h3>
                                        <Badge variant="secondary">{currentGene.gwasSnps || 0} SNPs</Badge>
                                    </div>

                                    {currentGene.gwasSnps && currentGene.gwasSnps > 0 ? (
                                        <div className="space-y-3">
                                            {Array.from({ length: Math.min(currentGene.gwasSnps, 5) }).map((_, i) => (
                                                <Card key={i} className="p-4 bg-secondary/20 border-border hover:border-primary/30 transition-colors">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-2 h-2 bg-destructive rounded-full" />
                                                            <code className="text-sm text-primary font-mono">rs{1000000 + i * 1234}</code>
                                                        </div>
                                                        <Badge className="bg-[var(--genomic-green)]/10 text-[var(--genomic-green)] border-[var(--genomic-green)]/20">
                                                            p = {(1.2e-8 * (i + 1)).toExponential(1)}
                                                        </Badge>
                                                    </div>
                                                    <div className="space-y-1 text-sm">
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Position:</span>
                                                            <span className="font-mono text-xs text-foreground">
                                                                {currentGene.chromosome}:{27654894 + (i * 10000)}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Associated trait:</span>
                                                            <span className="text-foreground">
                                                                {i === 0 ? 'BMI' : i === 1 ? 'Type 2 Diabetes' : i === 2 ? 'Depression' : 'Cholesterol'}
                                                            </span>
                                                        </div>
                                                        <div className="flex justify-between">
                                                            <span className="text-muted-foreground">Risk allele:</span>
                                                            <code className="text-xs text-destructive">A</code>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))}
                                        </div>
                                    ) : (
                                        <Alert className="bg-secondary/20 border-border">
                                            <Info className="h-4 w-4 text-muted-foreground" />
                                            <AlertDescription className="text-sm text-muted-foreground">
                                                No GWAS SNP associations found for {selectedGene} in the current database.
                                            </AlertDescription>
                                        </Alert>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </div>
        </section>
    );
}