import React from 'react';
import { Container, Box, Typography, useTheme, useMediaQuery } from '@mui/material';

interface ResponsivePageWrapperProps {
  title: string;
  children: React.ReactNode;
  maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

const ResponsivePageWrapper: React.FC<ResponsivePageWrapperProps> = ({
  title,
  children,
  maxWidth = 'lg'
}) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Container 
      maxWidth={maxWidth} 
      sx={{ 
        py: { xs: 1, sm: 3 },
        px: { xs: 1, sm: 2 }
      }}
    >
      <Box sx={{ mb: { xs: 2, sm: 3 } }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ 
            fontWeight: 600,
            fontSize: { xs: '1.75rem', sm: '2.125rem' },
            textAlign: { xs: 'center', sm: 'left' }
          }}
        >
          {title}
        </Typography>
      </Box>
      {children}
    </Container>
  );
};

export default ResponsivePageWrapper;