import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import Navigation from './components/Navigation';
import Home from './pages/Home';
import ExploreGenes from './pages/ExploreGenes';
import ConservationMap from './pages/ConservationMap';
import CTCFAnalysis from './pages/CTCFAnalysis';
import Expression from './pages/Expression';
import GWASHeritability from './pages/GWASHeritability';
import Downloads from './pages/Downloads';
import About from './pages/About';

const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
    },
  },
  palette: {
    mode: 'light',
    primary: {
      main: '#2c3e50',
    },
    secondary: {
      main: '#3498db',
    },
    background: {
      default: '#f8f9fa',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 600,
      fontSize: '1.75rem',
      '@media (max-width:600px)': {
        fontSize: '1.5rem',
      },
    },
    h5: {
      fontWeight: 600,
      fontSize: '1.5rem',
      '@media (max-width:600px)': {
        fontSize: '1.25rem',
      },
    },
    h6: {
      fontWeight: 600,
      fontSize: '1.25rem',
      '@media (max-width:600px)': {
        fontSize: '1.1rem',
      },
    },
    body1: {
      '@media (max-width:600px)': {
        fontSize: '0.9rem',
      },
    },
  },
  components: {
    MuiContainer: {
      styleOverrides: {
        root: {
          paddingLeft: '16px',
          paddingRight: '16px',
          '@media (max-width:600px)': {
            paddingLeft: '8px',
            paddingRight: '8px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
          '@media (max-width:600px)': {
            borderRadius: 8,
            margin: '8px 0',
          },
        },
      },
    },
    MuiCardContent: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            padding: '12px',
            '&:last-child': {
              paddingBottom: '12px',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
          '@media (max-width:600px)': {
            minHeight: '44px',
            fontSize: '0.9rem',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            '& .MuiInputBase-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
    MuiFormControl: {
      styleOverrides: {
        root: {
          '@media (max-width:600px)': {
            '& .MuiInputBase-root': {
              fontSize: '16px', // Prevents zoom on iOS
            },
          },
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <div className="App">
          <Navigation />
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/explore-genes" element={<ExploreGenes />} />
            <Route path="/conservation-map" element={<ConservationMap />} />
            <Route path="/ctcf-3d" element={<CTCFAnalysis />} />
            <Route path="/expression" element={<Expression />} />
            <Route path="/gwas-heritability" element={<GWASHeritability />} />
            <Route path="/downloads" element={<Downloads />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;
