import React from 'react';
import { Box, CircularProgress, Typography, LinearProgress } from '@mui/material';

interface LoadingIndicatorProps {
  message?: string;
  variant?: 'circular' | 'linear';
  size?: number;
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ 
  message = 'Loading...', 
  variant = 'circular',
  size = 40 
}) => {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        py: 4,
        gap: 2
      }}
    >
      {variant === 'circular' ? (
        <CircularProgress size={size} />
      ) : (
        <Box sx={{ width: '100%', maxWidth: 400 }}>
          <LinearProgress />
        </Box>
      )}
      <Typography color="text.secondary" variant="body2">
        {message}
      </Typography>
    </Box>
  );
};

export default LoadingIndicator;