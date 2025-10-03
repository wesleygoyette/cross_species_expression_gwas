import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Box,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Slider,
  Checkbox,
  FormGroup,
  Button,
  Divider,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  TextField,
  Autocomplete
} from '@mui/material';
import { Download as DownloadIcon } from '@mui/icons-material';
import Plot from 'react-plotly.js';
import api from '../services/api';

interface CTCFAnalysisData {
  domain_region: any;
  ctcf_sites: any[];
  enhancers: any[];
  gwas_snps: any[];
  tracks_plot: any;
  distance_plot: any;
  enhancers_plot: any;
  expression_plot: any;
  gwas_table: any;
  ctcf_table: any;
  stats: {
    ctcf_count: number;
    enhancer_count: number;
    gwas_snp_count: number;
  };
}

const CTCFAnalysis: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<CTCFAnalysisData | null>(null);
  
  // Form state
  const [gene, setGene] = useState('BDNF');
  const [species, setSpecies] = useState('human_hg38');
  const [linkMode, setLinkMode] = useState('tss');
  const [tssKb] = useState(100);
  const [tssKbCtcf, setTssKbCtcf] = useState(250);
  const [domainSnapTss, setDomainSnapTss] = useState(true);
  const [ctcfConsGroups, setCtcfConsGroups] = useState(['conserved', 'human_specific']);
  const [enhConsGroups, setEnhConsGroups] = useState(['conserved', 'gained', 'lost', 'unlabeled']);
  const [ctcfDistCapKb, setCtcfDistCapKb] = useState(250);

  const [geneOptions, setGeneOptions] = useState<string[]>([]);
  const [geneInputValue, setGeneInputValue] = useState('BDNF');

  // Available options
  const speciesOptions = [
    { id: 'human_hg38', name: 'Human (hg38)' },
    { id: 'mouse_mm39', name: 'Mouse (mm39)' },
    { id: 'macaque_rheMac10', name: 'Macaque (rheMac10)' },
    { id: 'chicken_galGal6', name: 'Chicken (galGal6)' },
    { id: 'pig_susScr11', name: 'Pig (susScr11)' }
  ];

  const ctcfConsOptions = ['conserved', 'human_specific', 'other'];
  const enhConsOptions = ['conserved', 'gained', 'lost', 'unlabeled'];

  // Search for genes as user types
  useEffect(() => {
    const searchGenes = async () => {
      if (geneInputValue.length > 1) {
        try {
          const response = await api.get('/genes/search/', {
            params: { q: geneInputValue, species: species }
          });
          const genes = response.data.genes.map((g: any) => g.symbol);
          setGeneOptions(genes);
        } catch (err) {
          console.error('Error searching genes:', err);
        }
      }
    };

    const timeoutId = setTimeout(searchGenes, 300);
    return () => clearTimeout(timeoutId);
  }, [geneInputValue, species]);

  const handleAnalyze = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.post('/analysis/ctcf/', {
        gene,
        species,
        tss_kb: tssKb,
        link_mode: linkMode,
        tss_kb_ctcf: tssKbCtcf,
        domain_snap_tss: domainSnapTss,
        ctcf_cons_groups: ctcfConsGroups,
        enh_cons_groups: enhConsGroups,
        ctcf_dist_cap_kb: ctcfDistCapKb
      });
      
      setData(response.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'An error occurred during analysis');
    } finally {
      setLoading(false);
    }
  };

  const handleCtcfConsGroupChange = (group: string, checked: boolean) => {
    if (checked) {
      setCtcfConsGroups([...ctcfConsGroups, group]);
    } else {
      setCtcfConsGroups(ctcfConsGroups.filter(g => g !== group));
    }
  };

  const handleEnhConsGroupChange = (group: string, checked: boolean) => {
    if (checked) {
      setEnhConsGroups([...enhConsGroups, group]);
    } else {
      setEnhConsGroups(enhConsGroups.filter(g => g !== group));
    }
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        CTCF & 3D Analysis
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 3 }}>
        {/* Sidebar - Controls */}
        <Card sx={{ height: 'fit-content', position: 'sticky', top: 20 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Controls
            </Typography>
            
            {/* Gene and Species */}
            <Box sx={{ mb: 3 }}>
              <Autocomplete
                value={gene}
                onChange={(_, newValue) => setGene(newValue || '')}
                inputValue={geneInputValue}
                onInputChange={(_, newInputValue) => setGeneInputValue(newInputValue)}
                options={geneOptions}
                freeSolo
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Gene Symbol"
                    variant="outlined"
                    size="small"
                    fullWidth
                  />
                )}
                sx={{ mb: 2 }}
              />
              
              <FormControl fullWidth>
                <FormLabel sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                  Species
                </FormLabel>
                <RadioGroup
                  value={species}
                  onChange={(e) => setSpecies(e.target.value)}
                >
                  {speciesOptions.map((spec) => (
                    <FormControlLabel
                      key={spec.id}
                      value={spec.id}
                      control={<Radio size="small" />}
                      label={spec.name}
                    />
                  ))}
                </RadioGroup>
              </FormControl>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Link Mode */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                Link enhancers to gene by
              </FormLabel>
              <RadioGroup
                value={linkMode}
                onChange={(e) => setLinkMode(e.target.value)}
              >
                <FormControlLabel
                  value="tss"
                  control={<Radio size="small" />}
                  label="TSS window"
                />
                <FormControlLabel
                  value="ctcf"
                  control={<Radio size="small" />}
                  label="CTCF-bounded domain"
                />
              </RadioGroup>
            </FormControl>

            {/* TSS Window Slider (for TSS mode) */}
            {linkMode === 'tss' && (
              <Box sx={{ mb: 3 }}>
                <FormLabel component="legend" sx={{ mb: 1, display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
                  Window around TSS: {tssKbCtcf} kb
                </FormLabel>
                <Box sx={{ px: 1, py: 2 }}>
                  <Slider
                    value={tssKbCtcf}
                    onChange={(_, value) => setTssKbCtcf(value as number)}
                    min={10}
                    max={1000}
                    step={10}
                    marks={[
                      { value: 10, label: '10' },
                      { value: 250, label: '250' },
                      { value: 1000, label: '1000' }
                    ]}
                    valueLabelDisplay="auto"
                    valueLabelFormat={(value) => `${value}kb`}
                    sx={{
                      '& .MuiSlider-markLabel': {
                        fontSize: '0.75rem',
                        transform: 'translateX(-50%)',
                        '&:last-child': {
                          transform: 'translateX(-100%)'
                        },
                        '&:first-of-type': {
                          transform: 'translateX(0%)'
                        }
                      },
                      '& .MuiSlider-track': {
                        height: 4
                      },
                      '& .MuiSlider-thumb': {
                        height: 16,
                        width: 16
                      }
                    }}
                  />
                </Box>
              </Box>
            )}

            {/* Domain Snap (for CTCF mode) */}
            {linkMode === 'ctcf' && (
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={domainSnapTss}
                      onChange={(e) => setDomainSnapTss(e.target.checked)}
                    />
                  }
                  label="Snap to domain containing the TSS"
                  sx={{ mb: 1 }}
                />
                <Typography variant="caption" color="text.secondary" sx={{ 
                  display: 'block', 
                  ml: 4, 
                  lineHeight: 1.4,
                  fontSize: '0.75rem'
                }}>
                  If off, the Explore Genes window is used; any TADs overlapping it are considered.
                </Typography>
              </Box>
            )}

            <Divider sx={{ my: 2 }} />

            {/* CTCF Conservation Groups */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                CTCF conservation
              </FormLabel>
              <FormGroup>
                {ctcfConsOptions.map((group) => (
                  <FormControlLabel
                    key={group}
                    control={
                      <Checkbox
                        size="small"
                        checked={ctcfConsGroups.includes(group)}
                        onChange={(e) => handleCtcfConsGroupChange(group, e.target.checked)}
                      />
                    }
                    label={group.replace('_', ' ')}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* Enhancer Classes */}
            <FormControl component="fieldset" sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1, fontSize: '0.875rem', fontWeight: 500 }}>
                Enhancer classes
              </FormLabel>
              <FormGroup>
                {enhConsOptions.map((group) => (
                  <FormControlLabel
                    key={group}
                    control={
                      <Checkbox
                        size="small"
                        checked={enhConsGroups.includes(group)}
                        onChange={(e) => handleEnhConsGroupChange(group, e.target.checked)}
                      />
                    }
                    label={group}
                  />
                ))}
              </FormGroup>
            </FormControl>

            {/* Distance Cap */}
            {/* Distance Cap Slider */}
            <Box sx={{ mb: 3 }}>
              <FormLabel component="legend" sx={{ mb: 1, display: 'block', fontSize: '0.875rem', fontWeight: 500 }}>
                Cap distance plot at: {ctcfDistCapKb} kb
              </FormLabel>
              <Box sx={{ px: 1, py: 2 }}>
                <Slider
                  value={ctcfDistCapKb}
                  onChange={(_, value) => setCtcfDistCapKb(value as number)}
                  min={25}
                  max={1000}
                  step={25}
                  marks={[
                    { value: 25, label: '25' },
                    { value: 250, label: '250' },
                    { value: 1000, label: '1000' }
                  ]}
                  valueLabelDisplay="auto"
                  valueLabelFormat={(value) => `${value}kb`}
                  sx={{
                    '& .MuiSlider-markLabel': {
                      fontSize: '0.75rem',
                      transform: 'translateX(-50%)',
                      '&:last-child': {
                        transform: 'translateX(-100%)'
                      },
                      '&:first-of-type': {
                        transform: 'translateX(0%)'
                      }
                    },
                    '& .MuiSlider-track': {
                      height: 4
                    },
                    '& .MuiSlider-thumb': {
                      height: 16,
                      width: 16
                    }
                  }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 2 }} />

            {/* Analyze Button */}
            <Button
              variant="contained"
              fullWidth
              onClick={handleAnalyze}
              disabled={loading}
              sx={{ mb: 2 }}
            >
              {loading ? <CircularProgress size={24} /> : 'Analyze'}
            </Button>

            {/* Status */}
            {data && (
              <Alert severity="success" sx={{ mt: 1 }}>
                Analysis complete: {data.stats.ctcf_count} CTCF sites, {data.stats.enhancer_count} enhancers, {data.stats.gwas_snp_count} GWAS SNPs
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && (
            <Alert severity="error" onClose={() => setError(null)}>
              {error}
            </Alert>
          )}

          {/* 3D Domain View */}
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">3D domain view</Typography>
                <Tooltip title="Download PNG">
                  <IconButton size="small">
                    <DownloadIcon />
                  </IconButton>
                </Tooltip>
              </Box>
              
              {data?.tracks_plot ? (
                <Plot
                  data={(() => {
                    // Group traces by legendgroup to reduce duplicate legend entries
                    const processedData = data.tracks_plot.plot_data.data.map((trace: any, index: number) => {
                      const legendName = trace.name || '';
                      const seenLegends = new Set();
                      
                      return {
                        ...trace,
                        showlegend: !seenLegends.has(legendName) ? (seenLegends.add(legendName), true) : false,
                        legendgroup: legendName,
                        legendgroupTitle: {
                          text: legendName.includes(':') ? legendName.split(':')[0] : legendName
                        }
                      };
                    });
                    
                    // Further reduce by keeping only one entry per unique name
                    const uniqueLegends = new Set();
                    return processedData.map((trace: any) => ({
                      ...trace,
                      showlegend: trace.name && !uniqueLegends.has(trace.name) ? (uniqueLegends.add(trace.name), true) : false
                    }));
                  })()}
                  layout={{
                    ...data.tracks_plot.plot_data.layout,
                    showlegend: true,
                    legend: {
                      orientation: 'h',
                      x: 0.5,
                      y: -0.25,
                      xanchor: 'center',
                      yanchor: 'top',
                      font: {
                        size: 9
                      },
                      itemsizing: 'constant',
                      itemwidth: 30,
                      tracegroupgap: 10,
                      bgcolor: 'rgba(255,255,255,0.9)',
                      bordercolor: 'rgba(0,0,0,0.3)',
                      borderwidth: 1
                    },
                    margin: {
                      ...data.tracks_plot.plot_data.layout.margin,
                      b: 120
                    }
                  }}
                  config={{ 
                    displayModeBar: true, 
                    responsive: true,
                    modeBarButtonsToRemove: ['pan2d', 'lasso2d', 'select2d', 'autoScale2d']
                  }}
                  style={{ width: '100%', height: '380px' }}
                />
              ) : (
                <Box 
                  sx={{ 
                    height: 380, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1
                  }}
                >
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : 'Click "Analyze" to generate CTCF tracks visualization'}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>

          {/* Distance and Enhancer Plots */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Distances to nearest CTCF
                  </Typography>
                  
                  {data?.distance_plot ? (
                    <Plot
                      data={data.distance_plot.plot_data.data}
                      layout={data.distance_plot.plot_data.layout}
                      config={{ displayModeBar: true, responsive: true }}
                      style={{ width: '100%', height: '380px' }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        height: 380, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary">
                        {loading ? 'Loading...' : 'CTCF distance plot will appear here'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Enhancers per region (by class)
                  </Typography>
                  
                  {data?.enhancers_plot ? (
                    <Plot
                      data={data.enhancers_plot.plot_data.data}
                      layout={data.enhancers_plot.plot_data.layout}
                      config={{ displayModeBar: true, responsive: true }}
                      style={{ width: '100%', height: '380px' }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        height: 380, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary">
                        {loading ? 'Loading...' : 'Enhancer distribution plot will appear here'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* Association and GWAS Plots */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Conserved enhancers vs RNA
                  </Typography>
                  
                  {data?.expression_plot ? (
                    <Plot
                      data={data.expression_plot.plot_data.data}
                      layout={data.expression_plot.plot_data.layout}
                      config={{ displayModeBar: true, responsive: true }}
                      style={{ width: '100%', height: '380px' }}
                    />
                  ) : (
                    <Box 
                      sx={{ 
                        height: 380, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary">
                        {loading ? 'Loading...' : 'Expression association plot will appear here'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>

            <Box>
              <Card>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    GWAS over-representation
                  </Typography>
                  
                  {data?.gwas_table?.table_data ? (
                    <TableContainer component={Paper} sx={{ maxHeight: 380 }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Bucket</TableCell>
                            <TableCell align="right">Total</TableCell>
                            <TableCell align="right">With GWAS</TableCell>
                            <TableCell align="right">Proportion</TableCell>
                            <TableCell align="right">Odds Ratio</TableCell>
                            <TableCell align="right">P-value</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {data.gwas_table.table_data.map((row: any, index: number) => (
                            <TableRow key={index}>
                              <TableCell>{row.bucket}</TableCell>
                              <TableCell align="right">{row.total}</TableCell>
                              <TableCell align="right">{row.with_gwas}</TableCell>
                              <TableCell align="right">{row.prop}</TableCell>
                              <TableCell align="right">
                                {row.odds_ratio ? row.odds_ratio.toFixed(3) : '-'}
                              </TableCell>
                              <TableCell align="right">
                                {row.p_value ? row.p_value.toFixed(3) : '-'}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  ) : (
                    <Box 
                      sx={{ 
                        height: 380, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        backgroundColor: '#f5f5f5',
                        borderRadius: 1
                      }}
                    >
                      <Typography color="text.secondary">
                        {loading ? 'Loading...' : 'GWAS partition table will appear here'}
                      </Typography>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Box>
          </Box>

          {/* CTCF Sites Table */}
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top CTCF sites near gene (ranked by score)
              </Typography>
              
              {data?.ctcf_table?.table_data ? (
                <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Conservation Class</TableCell>
                        <TableCell align="right">Score</TableCell>
                        <TableCell>Chromosome</TableCell>
                        <TableCell align="right">Start</TableCell>
                        <TableCell align="right">End</TableCell>
                        <TableCell align="right">Width</TableCell>
                        <TableCell align="right">Midpoint</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {data.ctcf_table.table_data.map((row: any, index: number) => (
                        <TableRow key={index}>
                          <TableCell>{row.cons_class}</TableCell>
                          <TableCell align="right">{row.score}</TableCell>
                          <TableCell>{row.chrom}</TableCell>
                          <TableCell align="right">{row.start.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.end.toLocaleString()}</TableCell>
                          <TableCell align="right">{row.width}</TableCell>
                          <TableCell align="right">{row.mid.toLocaleString()}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              ) : (
                <Box 
                  sx={{ 
                    height: 200, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    backgroundColor: '#f5f5f5',
                    borderRadius: 1
                  }}
                >
                  <Typography color="text.secondary">
                    {loading ? 'Loading...' : 'CTCF sites table will appear here'}
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

export default CTCFAnalysis;