import React, { useState } from 'react';
import { 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Box, 
  Chip,
  Tooltip,
  Paper,
  Stack
} from '@mui/material';

// Demo data for the heatmap
const generateDemoData = () => {
  const species = ['Human', 'Mouse', 'Rat', 'Zebrafish', 'Drosophila', 'C. elegans'];
  const genes = ['BRCA1', 'TP53', 'EGFR', 'MYC', 'PTEN', 'APC', 'KRAS', 'PIK3CA', 'NOTCH1', 'WNT1'];
  
  const data = [];
  for (let i = 0; i < species.length; i++) {
    for (let j = 0; j < genes.length; j++) {
      // Generate conservation scores between 0-1
      const conservationScore = Math.random() * 0.8 + 0.1; // 0.1 to 0.9
      data.push({
        species: species[i],
        gene: genes[j],
        conservation: conservationScore,
        expression: Math.random() * 100 + 10, // Expression level 10-110
      });
    }
  }
  return { species, genes, data };
};

const ConservationMap: React.FC = () => {
  const [hoveredCell, setHoveredCell] = useState<{
    species: string;
    gene: string;
    conservation: number;
    expression: number;
  } | null>(null);

  const { species, genes, data } = generateDemoData();

  const getColorForScore = (score: number) => {
    // Create a color gradient from blue (low) to red (high)
    const r = Math.round(255 * score);
    const g = Math.round(100 * (1 - Math.abs(score - 0.5) * 2));
    const b = Math.round(255 * (1 - score));
    return `rgb(${r}, ${g}, ${b})`;
  };

  const getCellData = (speciesName: string, geneName: string) => {
    return data.find(d => d.species === speciesName && d.gene === geneName);
  };

  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Conservation Map
      </Typography>
      
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6" gutterBottom>
                Cross-Species Gene Conservation Heatmap
              </Typography>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption">Conservation Score:</Typography>
                <Box sx={{ width: 100, height: 15, background: 'linear-gradient(to right, rgb(255,100,255), rgb(128,100,128), rgb(255,100,100))', borderRadius: 1 }} />
                <Typography variant="caption">Low → High</Typography>
              </Stack>
            </Box>
            
            <Paper elevation={1} sx={{ p: 2, overflowX: 'auto' }}>
              <Box sx={{ minWidth: 800 }}>
                {/* Header row with gene names */}
                <Box display="flex" mb={1}>
                  <Box sx={{ width: 120, height: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Typography variant="subtitle2" fontWeight="bold">Species</Typography>
                  </Box>
                  {genes.map((gene) => (
                    <Box 
                      key={gene}
                      sx={{ 
                        width: 70, 
                        height: 50, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center',
                        transform: 'rotate(-45deg)',
                        transformOrigin: 'center'
                      }}
                    >
                      <Typography variant="caption" fontWeight="bold">
                        {gene}
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Heatmap rows */}
                {species.map((speciesName) => (
                  <Box key={speciesName} display="flex" mb={0.5}>
                    <Box 
                      sx={{ 
                        width: 120, 
                        height: 50, 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'flex-end',
                        pr: 2
                      }}
                    >
                      <Typography variant="body2" fontWeight="medium">
                        {speciesName}
                      </Typography>
                    </Box>
                    {genes.map((gene) => {
                      const cellData = getCellData(speciesName, gene);
                      return (
                        <Tooltip
                          key={`${speciesName}-${gene}`}
                          title={
                            <Box>
                              <Typography variant="body2"><strong>{speciesName} - {gene}</strong></Typography>
                              <Typography variant="caption">Conservation: {(cellData?.conservation || 0).toFixed(3)}</Typography><br/>
                              <Typography variant="caption">Expression: {(cellData?.expression || 0).toFixed(1)}</Typography>
                            </Box>
                          }
                          placement="top"
                        >
                          <Box
                            sx={{
                              width: 70,
                              height: 50,
                              backgroundColor: getColorForScore(cellData?.conservation || 0),
                              border: '1px solid rgba(255,255,255,0.3)',
                              cursor: 'pointer',
                              transition: 'transform 0.2s ease-in-out',
                              '&:hover': {
                                transform: 'scale(1.1)',
                                zIndex: 10,
                                position: 'relative',
                                boxShadow: '0 4px 8px rgba(0,0,0,0.3)'
                              }
                            }}
                            onMouseEnter={() => setHoveredCell(cellData || null)}
                            onMouseLeave={() => setHoveredCell(null)}
                          />
                        </Tooltip>
                      );
                    })}
                  </Box>
                ))}
              </Box>
            </Paper>
          </CardContent>
        </Card>

        {/* Info panel */}
        {hoveredCell && (
          <Card sx={{ backgroundColor: '#f8f9fa' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Selected: {hoveredCell.species} - {hoveredCell.gene}
              </Typography>
              <Stack direction="row" spacing={2}>
                <Chip 
                  label={`Conservation Score: ${hoveredCell.conservation.toFixed(3)}`}
                  color={hoveredCell.conservation > 0.7 ? 'success' : hoveredCell.conservation > 0.4 ? 'warning' : 'error'}
                  variant="outlined"
                />
                <Chip 
                  label={`Expression Level: ${hoveredCell.expression.toFixed(1)}`}
                  color="info"
                  variant="outlined"
                />
              </Stack>
            </CardContent>
          </Card>
        )}

        {/* Legend and description */}
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              About This Visualization
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              This heatmap displays conservation scores for key genes across different species. 
              Higher conservation scores (red) indicate stronger evolutionary conservation, 
              while lower scores (blue) suggest species-specific adaptations. 
              Hover over cells to see detailed information.
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap">
              <Chip label="High Conservation (>0.7)" size="small" sx={{ backgroundColor: 'rgb(255,100,100)', color: 'white' }} />
              <Chip label="Medium Conservation (0.4-0.7)" size="small" sx={{ backgroundColor: 'rgb(128,100,128)', color: 'white' }} />
              <Chip label="Low Conservation (<0.4)" size="small" sx={{ backgroundColor: 'rgb(255,100,255)', color: 'white' }} />
            </Stack>
          </CardContent>
        </Card>
      </Stack>
    </Container>
  );
};

export default ConservationMap;