import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';

const GWASHeritability: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        GWAS / Heritability
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Trait overlap & enrichment
          </Typography>
          <Box 
            sx={{ 
              height: 480, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              backgroundColor: '#f5f5f5',
              borderRadius: 1
            }}
          >
            <Typography color="text.secondary">
              GWAS enrichment analysis (to be implemented)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default GWASHeritability;