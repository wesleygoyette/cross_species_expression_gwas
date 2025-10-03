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
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
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
