import React from 'react';
import { Container, Typography, Card, CardContent, Link, Box } from '@mui/material';

const About: React.FC = () => {
  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
        About
      </Typography>
      
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Regulatory Landscapes Platform
          </Typography>
          
          <Typography variant="body1" paragraph>
            This platform provides interactive tools to explore evolutionary conservation 
            of gene regulatory landscapes across species. The application is built using 
            modern web technologies and replicates the functionality of the original R Shiny 
            application.
          </Typography>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Features
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1">
              <strong>Explore Genes:</strong> Visualize enhancer conservation, expression 
              and GWAS overlap around genes of interest
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Conservation Map:</strong> View across-species conservation patterns 
              in regulatory landscapes
            </Typography>
            <Typography component="li" variant="body1">
              <strong>CTCF & 3D:</strong> Analyze CTCF binding sites and 3D domain organization
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Expression:</strong> Compare gene expression across tissues and species
            </Typography>
            <Typography component="li" variant="body1">
              <strong>GWAS Analysis:</strong> Explore GWAS hits and trait associations 
              in regulatory regions
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Technology Stack
          </Typography>
          
          <Box component="ul" sx={{ pl: 2 }}>
            <Typography component="li" variant="body1">
              <strong>Frontend:</strong> React with TypeScript, Material-UI, Plotly.js
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Backend:</strong> Django with Django REST Framework
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Database:</strong> SQLite (using existing regland.sqlite)
            </Typography>
            <Typography component="li" variant="body1">
              <strong>Visualization:</strong> Plotly.js for interactive plots
            </Typography>
          </Box>

          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
            Reference
          </Typography>
          
          <Typography variant="body1">
            This platform is based on data and methods from:
          </Typography>
          
          <Link 
            href="https://doi.org/10.1038/s41559-017-0377-2" 
            target="_blank" 
            rel="noopener noreferrer"
            sx={{ display: 'block', mt: 1, mb: 2 }}
          >
            Berthelot et al., "Complexity and conservation of regulatory landscapes 
            underlie evolutionary resilience of mammalian gene expression", 
            Nature Ecology & Evolution, 2018
          </Link>

          <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
            Platform developed as a Python/React version of the original R Shiny application.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default About;