import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigationItems = [
    { label: 'Home', path: '/' },
    { label: 'Explore Genes', path: '/explore-genes' },
    { label: 'Conservation Map', path: '/conservation-map' },
    { label: 'CTCF & 3D', path: '/ctcf-3d' },
    { label: 'Expression', path: '/expression' },
    { label: 'GWAS / Heritability', path: '/gwas-heritability' },
    { label: 'Downloads', path: '/downloads' },
    { label: 'About', path: '/about' },
  ];

  return (
    <AppBar position="static" sx={{ mb: 3 }}>
      <Toolbar>
        <Typography
          variant="h6"
          component="div"
          sx={{
            flexGrow: 0,
            mr: 4,
            fontWeight: 700,
            fontSize: '1.25rem',
          }}
        >
          Regulatory Landscapes
        </Typography>
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          {navigationItems.map((item) => (
            <Button
              key={item.path}
              color="inherit"
              onClick={() => navigate(item.path)}
              sx={{
                backgroundColor:
                  location.pathname === item.path
                    ? 'rgba(255, 255, 255, 0.2)'
                    : 'transparent',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                },
                borderRadius: 1,
                px: 2,
                py: 1,
                fontSize: '0.9rem',
              }}
            >
              {item.label}
            </Button>
          ))}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;