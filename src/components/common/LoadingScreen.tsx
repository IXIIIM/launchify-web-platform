import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

interface LoadingScreenProps {
  /**
   * Message to display below the spinner
   */
  message?: string;
  
  /**
   * Whether to show the full screen loading overlay
   * If false, will display inline
   */
  fullScreen?: boolean;
  
  /**
   * Size of the spinner
   */
  size?: number;
  
  /**
   * Color of the spinner
   */
  color?: 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' | 'inherit';
}

/**
 * Loading Screen Component
 * 
 * Displays a loading spinner with an optional message
 * Can be displayed as a full-screen overlay or inline
 */
const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message = 'Loading...',
  fullScreen = true,
  size = 60,
  color = 'primary'
}) => {
  const content = (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3
      }}
    >
      <CircularProgress size={size} color={color} />
      {message && (
        <Typography
          variant="h6"
          sx={{ mt: 2, color: 'text.secondary' }}
        >
          {message}
        </Typography>
      )}
    </Box>
  );

  if (fullScreen) {
    return (
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          zIndex: 9999
        }}
      >
        {content}
      </Box>
    );
  }

  return content;
};

export default LoadingScreen; 