import React from 'react';
import { Container, Typography, Card, CardContent, Box } from '@mui/material';

const Expression: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        Expression
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Gene expression by tissue/species
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
              Multi-tissue/species expression visualization (to be implemented)
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Container>
  );
};

export default Expression;