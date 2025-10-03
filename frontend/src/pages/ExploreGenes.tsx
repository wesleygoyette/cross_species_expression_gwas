import React, { useState, useEffect, useCallback, useMemo, memo } from 'react';
import {
  Container,
  Card,
  CardContent,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Slider,
  FormControlLabel,
  Checkbox,
  Button,
  Box,
  Alert,
  CircularProgress,
  Chip,
  Paper,
  Link,
} from '@mui/material';
import Plot from 'react-plotly.js';
import LoadingIndicator from '../components/LoadingIndicator';
import {
  getGeneRegionData,
  getConservationMatrix,
  getGenomeTracksPlot,
  getExpressionData,
  getSpeciesList,
  getGenePresets,
  Species,
  GenePreset,
  GeneRegionData,
} from '../services/api';

// Enhancer class color palette (matching R app)
const ENHANCER_COLORS = {
  conserved: '#31c06a',
  gained: '#ffcf33',
  lost: '#8f9aa7',
  unlabeled: '#4ea4ff'
};

// Memoized Plot component for better performance
const MemoizedPlot = memo(Plot, (prevProps, nextProps) => {
  // Custom comparison to avoid unnecessary re-renders
  return (
    JSON.stringify(prevProps.data) === JSON.stringify(nextProps.data) &&
    JSON.stringify(prevProps.layout) === JSON.stringify(nextProps.layout)
  );
});

const ExploreGenes: React.FC = () => {
  // State for controls
  const [gene, setGene] = useState('BDNF');
  const [species, setSpecies] = useState('human_hg38');
  const [tissue, setTissue] = useState('Liver');
  const [preset, setPreset] = useState('');
  const [tssKb, setTssKb] = useState(100);
  const [enhancerClasses, setEnhancerClasses] = useState(['conserved', 'gained', 'lost', 'unlabeled']);
  const [nbins, setNbins] = useState(30);
  const [normalizeRows, setNormalizeRows] = useState(false);
  const [showCounts, setShowCounts] = useState(false);
  const [markTss, setMarkTss] = useState(true);
  const [stackTracks, setStackTracks] = useState(true);
  const [showGene, setShowGene] = useState(true);
  const [showSnps, setShowSnps] = useState(true);
  const [logExpression, setLogExpression] = useState(false);
  const [showExpressionValues, setShowExpressionValues] = useState(true);

  // Data state
  const [geneRegionData, setGeneRegionData] = useState<GeneRegionData | null>(null);
  const [conservationMatrix, setConservationMatrix] = useState<any>(null);
  const [genomeTracksPlot, setGenomeTracksPlot] = useState<any>(null);
  const [expressionPlot, setExpressionPlot] = useState<any>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [speciesList, setSpeciesList] = useState<Species[]>([]);
  const [presets, setPresets] = useState<Record<string, GenePreset>>({});
  const [legendKey, setLegendKey] = useState(0); // Force re-render of legend
  
  // Applied state - tracks the state when Apply was last clicked
  const [appliedEnhancerClasses, setAppliedEnhancerClasses] = useState(['conserved', 'gained', 'lost', 'unlabeled']);
  const [appliedShowSnps, setAppliedShowSnps] = useState(true);
  const [appliedShowGene, setAppliedShowGene] = useState(true);

  // Optimized function to modify plot data for enhancer styling
  const modifyEnhancerPlotData = useCallback((plotData: any) => {
    if (!plotData?.data) return plotData;

    // Remove debug logging for performance
    // Only log if there are performance issues
    if (plotData.data.length > 10) {
      console.log(`Processing ${plotData.data.length} plot traces`);
    }

    const modifiedData = plotData.data.map((trace: any) => {
      // Check for enhancer data in different trace types
      if (trace.type === 'scatter' && trace.mode?.includes('markers')) {
        // Ensure minimum size for enhancers
        const currentSize = trace.marker?.size || 3;
        const minSize = 4; // Changed from 100 to 4 for reasonable visibility
        const enhancerSize = Array.isArray(currentSize) 
          ? currentSize.map((size: number) => Math.max(size || 3, minSize))
          : Math.max(currentSize, minSize);

        return {
          ...trace,
          marker: {
            ...trace.marker,
            size: enhancerSize,
            line: {
              ...trace.marker?.line,
              color: 'black',
              width: 0.5
            }
          }
        };
      }
      // Check for bar chart traces (enhancers might be rendered as bars)
      else if (trace.type === 'bar') {
        const currentWidth = trace.width || 0;
        const minWidth = 1; // Minimum width in pixels for bars
        
        return {
          ...trace,
          width: Math.max(currentWidth, minWidth)
        };
      }
      return trace;
    });

    // Only log for very large datasets
    if (plotData.layout?.shapes?.length > 1000) {
      console.log(`Processing ${plotData.layout.shapes.length} shapes`);
    }

    // Optimized layout with minimal modifications
    const modifiedLayout = {
      ...plotData.layout,
      plot_bgcolor: 'white',
      paper_bgcolor: 'white',
      margin: { l: 80, r: 50, t: 50, b: 80, pad: 10 },
      xaxis: {
        ...plotData.layout?.xaxis,
        automargin: true,
        tickangle: -45,
        showticklabels: true
      },
      autosize: true,
      // Only modify shapes if there are a reasonable number of them
      shapes: plotData.layout?.shapes?.length > 2000 ? 
        plotData.layout.shapes.slice(0, 2000) : // Limit shapes for performance
        plotData.layout?.shapes?.map((shape: any) => {
          if (shape.type === 'rect') {
            const currentWidth = Math.abs(shape.x1 - shape.x0);
            const minWidthDataCoords = 500; // Reduced minimum width
            
            if (currentWidth < minWidthDataCoords) {
              const center = (shape.x0 + shape.x1) / 2;
              return {
                ...shape,
                x0: center - minWidthDataCoords / 2,
                x1: center + minWidthDataCoords / 2
              };
            }
          }
          return shape;
        }) || []
    };

    return {
      ...plotData,
      data: modifiedData,
      layout: modifiedLayout
    };
  }, []); // Empty dependency array since this function doesn't depend on any state

  // Memoize the modified plot data with proper dependencies
  const modifiedGenomeTracksPlot = useMemo(() => {
    if (!genomeTracksPlot?.plot_data) return null;
    return modifyEnhancerPlotData(genomeTracksPlot.plot_data);
  }, [genomeTracksPlot, modifyEnhancerPlotData]);

  // Load species and presets on mount
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [speciesResponse, presetsResponse] = await Promise.all([
          getSpeciesList(),
          getGenePresets(),
        ]);
        setSpeciesList(speciesResponse.species);
        setPresets(presetsResponse.presets);
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    };
    loadInitialData();
  }, []);

  // Load data when gene/parameters change - with throttling
  const loadData = useCallback(async () => {
    if (!gene.trim()) return;

    setLoading(true);
    setError(null);

    try {
      console.log('Loading data for:', gene);
      
      // Update applied state to match current controls when Apply is clicked
      setAppliedEnhancerClasses(enhancerClasses);
      setAppliedShowSnps(showSnps);
      setAppliedShowGene(showGene);
      
      // Optimized parallel API calls with AbortController for cleanup
      const controller = new AbortController();
      const signal = controller.signal;
      
      const [regionData, matrixData, tracksData, exprData] = await Promise.all([
        getGeneRegionData(gene, species, tissue, tssKb, enhancerClasses),
        getConservationMatrix(gene, species, tissue, tssKb, nbins, enhancerClasses, normalizeRows, markTss),
        getGenomeTracksPlot(gene, species, tissue, tssKb, enhancerClasses, stackTracks, showGene, showSnps),
        getExpressionData(gene, logExpression),
      ]);

      // Check if request was cancelled
      if (signal.aborted) return;

      setGeneRegionData(regionData);
      setConservationMatrix(matrixData);
      setGenomeTracksPlot(tracksData);
      setExpressionPlot(exprData.plot_data);
      
      // Force legend re-render when data is loaded (Apply button clicked)
      setLegendKey(prev => prev + 1);
      
      console.log('Data loaded successfully');
    } catch (err) {
      if (err instanceof Error && err.name === 'AbortError') {
        console.log('Request cancelled');
        return;
      }
      setError(err instanceof Error ? err.message : 'Failed to load data');
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [gene, species, tissue, tssKb, enhancerClasses, nbins, normalizeRows, markTss, stackTracks, showGene, showSnps, logExpression]);

  // Apply preset
  const handlePresetChange = (presetName: string) => {
    setPreset(presetName);
    if (presetName && presets[presetName]) {
      const presetData = presets[presetName];
      setTissue(presetData.tissue);
      setGene(presetData.genes[0]);
    }
  };

  // Handle enhancer class selection
  const handleEnhancerClassChange = (className: string, checked: boolean) => {
    if (checked) {
      setEnhancerClasses(prev => [...prev, className]);
    } else {
      setEnhancerClasses(prev => prev.filter(c => c !== className));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Explore Genes
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, mb: 3 }}>
        {/* Left Sidebar - Controls */}
        <Paper sx={{ width: 320, p: 3, height: 'fit-content', position: 'sticky', top: 20 }}>
          <Typography variant="h6" gutterBottom>
            Controls
          </Typography>

          {/* Gene Input */}
          <TextField
            fullWidth
            label="Gene Symbol"
            value={gene}
            onChange={(e) => setGene(e.target.value)}
            placeholder="e.g., BDNF"
            margin="normal"
          />

          {/* Species Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Species</InputLabel>
            <Select value={species} onChange={(e) => setSpecies(e.target.value)} label="Species">
              {speciesList.map((sp) => (
                <MenuItem key={sp.id} value={sp.id}>
                  {sp.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Tissue Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Tissue</InputLabel>
            <Select value={tissue} onChange={(e) => setTissue(e.target.value)} label="Tissue">
              <MenuItem value="Liver">Liver</MenuItem>
              <MenuItem value="Brain">Brain</MenuItem>
              <MenuItem value="Heart">Heart</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>

          {/* Preset Selection */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Preset</InputLabel>
            <Select value={preset} onChange={(e) => handlePresetChange(e.target.value)} label="Preset">
              <MenuItem value="">None</MenuItem>
              <MenuItem value="brain">Brain (BDNF, SCN1A, GRIN2B, DRD2, APOE)</MenuItem>
              <MenuItem value="heart">Heart (TTN, MYH6, MYH7, PLN, KCNQ1)</MenuItem>
              <MenuItem value="liver">Liver (ALB, APOB, CYP3A4, HNF4A, PCSK9)</MenuItem>
            </Select>
          </FormControl>

          {/* Gene Suggestions */}
          {preset && presets[preset] && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" gutterBottom>
                Suggestions:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {presets[preset].genes.map((suggestedGene) => (
                  <Chip
                    key={suggestedGene}
                    label={suggestedGene}
                    onClick={() => setGene(suggestedGene)}
                    variant={gene === suggestedGene ? 'filled' : 'outlined'}
                    size="small"
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* TSS Window */}
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Distance to TSS: {tssKb} kb</Typography>
            <Slider
              value={tssKb}
              onChange={(_, value) => setTssKb(value as number)}
              min={0}
              max={1000}
              step={10}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Enhancer Classes */}
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Enhancer Classes</Typography>
            {['conserved', 'gained', 'lost', 'unlabeled'].map((className) => (
              <FormControlLabel
                key={className}
                control={
                  <Checkbox
                    checked={enhancerClasses.includes(className)}
                    onChange={(e) => handleEnhancerClassChange(className, e.target.checked)}
                  />
                }
                label={className.charAt(0).toUpperCase() + className.slice(1)}
              />
            ))}
          </Box>

          {/* Number of Bins */}
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Bins across window: {nbins}</Typography>
            <Slider
              value={nbins}
              onChange={(_, value) => setNbins(value as number)}
              min={10}
              max={60}
              step={1}
              valueLabelDisplay="auto"
            />
          </Box>

          {/* Display Options */}
          <Box sx={{ mt: 3 }}>
            <Typography gutterBottom>Display Options</Typography>
            <FormControlLabel
              control={<Checkbox checked={normalizeRows} onChange={(e) => setNormalizeRows(e.target.checked)} />}
              label="Normalize rows (0–100%)"
            />
            <FormControlLabel
              control={<Checkbox checked={showCounts} onChange={(e) => setShowCounts(e.target.checked)} />}
              label="Show bin counts"
            />
            <FormControlLabel
              control={<Checkbox checked={markTss} onChange={(e) => setMarkTss(e.target.checked)} />}
              label="Mark TSS"
            />
            <FormControlLabel
              control={<Checkbox checked={stackTracks} onChange={(e) => setStackTracks(e.target.checked)} />}
              label="Stack lanes by class"
            />
            <FormControlLabel
              control={<Checkbox checked={showGene} onChange={(e) => setShowGene(e.target.checked)} />}
              label="Show gene body"
            />
            <FormControlLabel
              control={<Checkbox checked={showSnps} onChange={(e) => setShowSnps(e.target.checked)} />}
              label="Show GWAS SNPs"
            />
          </Box>

          {/* Apply Button */}
          <Button
            variant="contained"
            fullWidth
            size="large"
            onClick={loadData}
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Apply'}
          </Button>

          {/* Boost Coverage Button */}
          <Button
            variant="outlined"
            fullWidth
            size="small"
            onClick={() => {
              setTssKb(250);
              // Don't call loadData() immediately, let user click Apply
            }}
            sx={{ mt: 1 }}
          >
            Boost coverage (±250 kb)
          </Button>
        </Paper>

        {/* Main Content */}
        <Box sx={{ flexGrow: 1 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Genome Tracks */}
          <Card sx={{ mb: 3 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', minHeight: 'fit-content', height: 'auto' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Genome Tracks</Typography>
                <Button variant="outlined" size="small">
                  Download PNG
                </Button>
              </Box>
              <Box sx={{ 
                flexGrow: 1, 
                display: 'flex', 
                flexDirection: 'column',
                overflow: 'hidden', // Prevent container overflow
                minHeight: '400px'   // Ensure minimum height for labels
              }}>
                {modifiedGenomeTracksPlot ? (
                  <MemoizedPlot
                    data={modifiedGenomeTracksPlot.data}
                    layout={modifiedGenomeTracksPlot.layout}
                    config={{ 
                      responsive: true,
                      displayModeBar: false,
                      staticPlot: true,
                      scrollZoom: false,
                      doubleClick: false,
                      showTips: false,
                      editable: false,
                      // Performance optimizations
                      plotGlPixelRatio: 1,
                      toImageButtonOptions: {
                        format: 'png',
                        width: 800,
                        height: 400,
                        scale: 1
                      }
                    }}
                    style={{ 
                      width: '100%', 
                      height: '380px',
                      flexShrink: 0,
                      minHeight: '380px' // Ensure minimum height
                    }}
                    useResizeHandler={true}
                  />
                ) : (
                  <Box sx={{ height: 380, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Typography color="text.secondary">
                      {loading ? 'Loading genome tracks...' : 'Click Apply to load genome tracks'}
                    </Typography>
                  </Box>
                )}
                
                {/* Dynamic Legend - Reactive to filters and data */}
                <Box 
                  key={`legend-${legendKey}`}
                  sx={{ 
                    mt: 2, 
                    pt: 2, 
                    backgroundColor: 'white', 
                    minHeight: '80px',
                    flexShrink: 0,
                    opacity: 1,
                    transform: 'translateZ(0)', // Force hardware acceleration
                    willChange: 'transform' // Optimize for animations
                  }}
                >
                  <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: '#333' }}>
                    Legend
                  </Typography>
                  
                  {/* Enhancer Classes */}
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#555', mb: 1 }}>
                      Enhancer Classes {geneRegionData?.enhancers && `(${geneRegionData.enhancers.length} total)`}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                      {Object.entries(ENHANCER_COLORS)
                        .filter(([className]) => appliedEnhancerClasses.includes(className))
                        .map(([className, color]) => {
                          const count = geneRegionData?.enhancers?.filter(enh => enh.class === className).length || 0;
                          return (
                            <Box key={`${className}-${color}`} sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: count > 0 ? 1 : 0.5 }}>
                              <Box
                                sx={{
                                  width: 20,
                                  height: 12,
                                  backgroundColor: color,
                                  border: '1px solid #ccc',
                                  borderRadius: 1
                                }}
                              />
                              <Typography variant="body2" sx={{ textTransform: 'capitalize', fontSize: '0.875rem', color: '#333' }}>
                                {className} {count > 0 && `(${count})`}
                              </Typography>
                            </Box>
                          );
                        })}
                    </Box>
                  </Box>

                  {/* Other Track Elements */}
                  <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap', alignItems: 'center' }}>
                    {/* Gene Track */}
                    {appliedShowGene && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Box
                          sx={{
                            width: 20,
                            height: 8,
                            backgroundColor: '#c7d0da',
                            border: '1px solid #ccc',
                            borderRadius: 1
                          }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#333' }}>
                          Gene Body
                        </Typography>
                      </Box>
                    )}

                    {/* TSS Marker */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 2,
                          height: 16,
                          backgroundColor: '#e8590c',
                          borderLeft: '2px dashed #e8590c'
                        }}
                      />
                      <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#333' }}>
                        TSS
                      </Typography>
                    </Box>

                    {/* GWAS SNPs */}
                    {appliedShowSnps && (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, opacity: (geneRegionData?.gwas_snps?.length || 0) > 0 ? 1 : 0.5 }}>
                        <Box
                          sx={{
                            width: 8,
                            height: 8,
                            backgroundColor: '#212529',
                            borderRadius: '50%',
                            border: '1px solid #ccc'
                          }}
                        />
                        <Typography variant="body2" sx={{ fontSize: '0.875rem', color: '#333' }}>
                          GWAS SNPs {geneRegionData?.gwas_snps && `(${geneRegionData.gwas_snps.length})`}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* UCSC Browser Link */}
          {geneRegionData?.ucsc_url && (
            <Card sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Mini genome browser
                </Typography>
                <Typography variant="body2" gutterBottom>
                  <strong>Locus:</strong> {geneRegionData.gene.chrom}:{geneRegionData.gene.start.toLocaleString()}-{geneRegionData.gene.end.toLocaleString()}
                </Typography>
                <Link href={geneRegionData.ucsc_url} target="_blank" rel="noopener noreferrer">
                  <Button variant="outlined" size="small">
                    Open in UCSC Genome Browser
                  </Button>
                </Link>
              </CardContent>
            </Card>
          )}

          {/* Bottom Row - Conservation Matrix and Expression */}
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3, mb: 3 }}>
            {/* Conservation Matrix */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Conservation Matrix</Typography>
                  <Button variant="outlined" size="small">
                    Download PNG
                  </Button>
                </Box>
                {conservationMatrix ? (
                  <Plot
                    data={[
                      {
                        z: conservationMatrix.matrix,
                        x: conservationMatrix.bins.map((_: any, i: number) => {
                          const pos = conservationMatrix.region_start + (i + 0.5) * ((conservationMatrix.region_end - conservationMatrix.region_start) / conservationMatrix.nbins);
                          // Only show labels for every few bins to prevent overcrowding
                          const showEveryNth = Math.max(1, Math.floor(conservationMatrix.nbins / 8));
                          if (i % showEveryNth === 0 || i === conservationMatrix.nbins - 1) {
                            return (pos / 1e6).toFixed(1) + ' Mb';
                          }
                          return '';
                        }),
                        y: conservationMatrix.classes,
                        type: 'heatmap',
                        colorscale: [
                          [0, '#e9ecef'],
                          [1, '#51cf66']
                        ],
                        showscale: true,
                        colorbar: {
                          title: {
                            text: conservationMatrix.normalized ? '% of row max' : 'Count'
                          }
                        }
                      }
                    ]}
                    layout={{
                      xaxis: {
                        title: {
                          text: ''
                        },
                        tickangle: -45,
                        tickmode: 'linear',
                        dtick: Math.max(1, Math.floor(conservationMatrix.nbins / 8)),
                        automargin: true
                      },
                      yaxis: {
                        title: {
                          text: ''
                        },
                        automargin: true
                      },
                      margin: { l: 80, r: 50, t: 20, b: 80 },
                      height: 420,
                      shapes: markTss && conservationMatrix.tss_position ? [
                        {
                          type: 'line',
                          x0: Math.floor(((conservationMatrix.tss_position - conservationMatrix.region_start) / (conservationMatrix.region_end - conservationMatrix.region_start)) * conservationMatrix.nbins) + 1,
                          x1: Math.floor(((conservationMatrix.tss_position - conservationMatrix.region_start) / (conservationMatrix.region_end - conservationMatrix.region_start)) * conservationMatrix.nbins) + 1,
                          y0: -0.5,
                          y1: conservationMatrix.classes.length - 0.5,
                          line: {
                            color: '#6c757d',
                            width: 2,
                            dash: 'dash'
                          }
                        }
                      ] : []
                    }}
                    config={{
                      responsive: true,
                      displayModeBar: false,
                      staticPlot: true,
                      scrollZoom: false
                    }}
                    style={{ width: '100%', height: '420px' }}
                  />
                ) : (
                  <Box sx={{ height: 420, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                      {loading ? 'Loading conservation matrix...' : 'Click Apply to load conservation matrix'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Expression */}
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Expression (per tissue)</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={logExpression}
                          onChange={(e) => setLogExpression(e.target.checked)}
                        />
                      }
                      label="log10(TPM+1)"
                    />
                    <FormControlLabel
                      control={
                        <Checkbox
                          size="small"
                          checked={showExpressionValues}
                          onChange={(e) => setShowExpressionValues(e.target.checked)}
                        />
                      }
                      label="Show values"
                    />
                    <Button variant="outlined" size="small">
                      Download CSV
                    </Button>
                  </Box>
                </Box>
                {expressionPlot?.plot_data ? (
                  <Plot
                    data={expressionPlot.plot_data.data}
                    layout={expressionPlot.plot_data.layout}
                    config={{
                      responsive: true,
                      displayModeBar: false,
                      staticPlot: true,
                      scrollZoom: false
                    }}
                    style={{ width: '100%', height: '340px' }}
                  />
                ) : (
                  <Box sx={{ height: 340, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography color="text.secondary">
                      {loading ? 'Loading expression data...' : 'Click Apply to load expression data'}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Box>

          {/* GWAS Table */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">
                  GWAS hits (near gene)
                  {geneRegionData?.gwas_snps && ` - ${geneRegionData.gwas_snps.length} found`}
                </Typography>
                <Button variant="outlined" size="small" disabled={!geneRegionData?.gwas_snps?.length}>
                  Download CSV
                </Button>
              </Box>
              {geneRegionData?.gwas_snps?.length ? (
                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {appliedShowSnps ? 'Showing in genome tracks and table below' : 'Hidden from genome tracks - shown in table below'}
                  </Typography>
                  
                  {/* Simple table implementation */}
                  <Box sx={{ border: '1px solid #e0e0e0', borderRadius: 1 }}>
                    {/* Table header */}
                    <Box sx={{ 
                      display: 'grid', 
                      gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', 
                      gap: 1, 
                      p: 1, 
                      backgroundColor: '#f5f5f5',
                      fontWeight: 'bold',
                      fontSize: '0.875rem'
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>rsID</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Position</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Trait</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>P-value</Typography>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>Category</Typography>
                    </Box>
                    
                    {/* Table rows - limit to first 15 for better performance */}
                    {geneRegionData.gwas_snps.slice(0, 15).map((snp, index) => (
                      <Box key={snp.snp_id || index} sx={{ 
                        display: 'grid', 
                        gridTemplateColumns: '1fr 1fr 1fr 1fr 1fr', 
                        gap: 1, 
                        p: 1, 
                        borderTop: index > 0 ? '1px solid #e0e0e0' : 'none',
                        '&:hover': { backgroundColor: '#f9f9f9' }
                      }}>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{snp.rsid || 'N/A'}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{snp.pos?.toLocaleString()}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>{snp.trait}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{snp.pval ? snp.pval.toExponential(2) : 'N/A'}</Typography>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                          <Chip label={snp.category || 'Unknown'} size="small" variant="outlined" sx={{ fontSize: '0.7rem' }} />
                        </Typography>
                      </Box>
                    ))}
                    
                    {geneRegionData.gwas_snps.length > 15 && (
                      <Box sx={{ p: 1, textAlign: 'center', borderTop: '1px solid #e0e0e0', backgroundColor: '#f9f9f9' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>
                          Showing first 15 of {geneRegionData.gwas_snps.length} SNPs
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    {loading ? 'Loading GWAS data...' : 
                     geneRegionData ? 'No GWAS SNPs found in this region' : 'Click Apply to load GWAS data'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default ExploreGenes;