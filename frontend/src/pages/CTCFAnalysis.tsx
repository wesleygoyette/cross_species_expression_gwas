import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';

const CTCFAnalysis: React.FC = () => {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        CTCF & 3D Analysis
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 3 }}>
        {/* Sidebar - Controls */}
        <Card sx={{ height: 'fit-content' }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Analysis Controls
            </Typography>
            <Typography color="text.secondary">
              CTCF and 3D domain analysis controls (to be implemented)
            </Typography>
          </CardContent>
        </Card>

        {/* Main Content */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                3D domain view
              </Typography>
              <Box 
                sx={{ 
                  height: 340, 
                  display: 'flex', 
                  alignItems: 'center', 
                  justifyContent: 'center',
                  backgroundColor: '#f5f5f5',
                  borderRadius: 1
                }}
              >
                <Typography color="text.secondary">
                  CTCF tracks visualization (to be implemented)
                </Typography>
              </Box>
            </CardContent>
          </Card>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Distances to nearest CTCF
                </Typography>
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
                    CTCF distance plot (to be implemented)
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Enhancers per region (by class)
                </Typography>
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
                    Enhancer distribution plot (to be implemented)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 3 }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Conserved enhancers vs RNA
                </Typography>
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
                    Expression association plot (to be implemented)
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  GWAS over-representation
                </Typography>
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
                    GWAS partition table (to be implemented)
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Top CTCF sites near gene (ranked by score)
              </Typography>
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
                  CTCF sites table (to be implemented)
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Container>
  );
};

export default CTCFAnalysis;