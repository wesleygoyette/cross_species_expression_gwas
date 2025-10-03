import React from 'react';
import {
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Box,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import {
  ExploreOutlined,
  TimelineOutlined,
  AccountTreeOutlined,
  ShowChartOutlined,
  ScatterPlotOutlined,
  DownloadOutlined,
} from '@mui/icons-material';

const Home: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      title: 'Explore Genes',
      description: 'Visualize enhancer conservation, expression and GWAS overlap around genes',
      icon: <ExploreOutlined sx={{ fontSize: 40 }} />,
      path: '/explore-genes',
      color: '#3498db',
    },
    {
      title: 'Conservation Map', 
      description: 'View across-species conservation patterns in regulatory landscapes',
      icon: <TimelineOutlined sx={{ fontSize: 40 }} />,
      path: '/conservation-map',
      color: '#2ecc71',
    },
    {
      title: 'CTCF & 3D',
      description: 'Analyze CTCF binding sites and 3D domain organization',
      icon: <AccountTreeOutlined sx={{ fontSize: 40 }} />,
      path: '/ctcf-3d',
      color: '#e74c3c',
    },
    {
      title: 'Expression',
      description: 'Compare gene expression across tissues and species',
      icon: <ShowChartOutlined sx={{ fontSize: 40 }} />,
      path: '/expression',
      color: '#f39c12',
    },
    {
      title: 'GWAS Analysis',
      description: 'Explore GWAS hits and trait associations in regulatory regions',
      icon: <ScatterPlotOutlined sx={{ fontSize: 40 }} />,
      path: '/gwas-heritability',
      color: '#9b59b6',
    },
    {
      title: 'Downloads',
      description: 'Export data and visualizations for further analysis',
      icon: <DownloadOutlined sx={{ fontSize: 40 }} />,
      path: '/downloads',
      color: '#34495e',
    },
  ];

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          align="center"
          gutterBottom
          sx={{ fontWeight: 700, mb: 2 }}
        >
          Regulatory Landscapes
        </Typography>
        
        <Typography
          variant="h6"
          align="center"
          color="text.secondary"
          sx={{ mb: 6, maxWidth: 800, mx: 'auto' }}
        >
          Explore evolutionary conservation of gene regulatory landscapes across species.
          Analyze enhancer activity, GWAS associations, and 3D chromatin organization
          in a comprehensive interactive platform.
        </Typography>

        <Card sx={{ mb: 4, backgroundColor: '#f8f9fa' }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600 }}>
              Welcome
            </Typography>
            <Typography variant="body1" sx={{ mb: 3 }}>
              This platform provides interactive tools to visualize and analyze regulatory landscapes
              across multiple species. You can explore gene regulatory regions, examine conservation
              patterns, analyze GWAS associations, and investigate 3D chromatin organization.
            </Typography>
            <Typography variant="body1">
              Use <strong>Explore Genes</strong> to get started with visualizing enhancer conservation,
              expression profiles, and GWAS overlap for genes of interest.
            </Typography>
          </CardContent>
        </Card>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: {
              xs: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            },
            gap: 3,
          }}
        >
          {features.map((feature, index) => (
            <Card
              key={index}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
                },
              }}
              onClick={() => navigate(feature.path)}
            >
              <CardContent sx={{ flexGrow: 1, p: 3 }}>
                <Box
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    mb: 2,
                    color: feature.color,
                  }}
                >
                  {feature.icon}
                  <Typography
                    variant="h6"
                    component="h2"
                    sx={{ ml: 2, fontWeight: 600 }}
                  >
                    {feature.title}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  {feature.description}
                </Typography>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: feature.color,
                    color: feature.color,
                    '&:hover': {
                      backgroundColor: feature.color,
                      color: 'white',
                    },
                  }}
                  fullWidth
                >
                  Explore
                </Button>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Based on data and methods from{' '}
            <a
              href="https://doi.org/10.1038/s41559-017-0377-2"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#3498db', textDecoration: 'none' }}
            >
              Berthelot et al., Nature Ecology & Evolution, 2018
            </a>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default Home;