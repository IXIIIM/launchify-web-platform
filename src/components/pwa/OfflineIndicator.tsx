import React, { useState, useEffect } from 'react';
import { Snackbar, Alert, Box, Typography, Paper } from '@mui/material';
import WifiOffIcon from '@mui/icons-material/WifiOff';
import SignalWifiStatusbar4BarIcon from '@mui/icons-material/SignalWifiStatusbar4Bar';

interface OfflineIndicatorProps {
  variant?: 'banner' | 'snackbar' | 'inline';
  position?: 'top' | 'bottom';
  showOnlineStatus?: boolean;
  onlineTimeout?: number;
}

/**
 * A component that indicates when the user is offline
 */
const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  variant = 'snackbar',
  position = 'bottom',
  showOnlineStatus = true,
  onlineTimeout = 3000
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showOnline, setShowOnline] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (showOnlineStatus) {
        setShowOnline(true);
        setTimeout(() => {
          setShowOnline(false);
        }, onlineTimeout);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [showOnlineStatus, onlineTimeout]);

  // If online and not showing online status, don't render anything
  if (isOnline && !showOnline) {
    return null;
  }

  // Render based on the variant
  switch (variant) {
    case 'banner':
      return (
        <Paper
          elevation={3}
          sx={{
            display: 'flex',
            position: 'fixed',
            left: 0,
            right: 0,
            [position]: 0,
            zIndex: 1000,
            p: 1.5,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: isOnline ? 'success.light' : 'error.light',
            color: isOnline ? 'success.contrastText' : 'error.contrastText'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {isOnline ? (
              <SignalWifiStatusbar4BarIcon sx={{ mr: 1 }} />
            ) : (
              <WifiOffIcon sx={{ mr: 1 }} />
            )}
            <Typography variant="body2">
              {isOnline ? 'You are back online!' : 'You are currently offline. Some features may be unavailable.'}
            </Typography>
          </Box>
        </Paper>
      );
      
    case 'inline':
      return (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            p: 1,
            borderRadius: 1,
            backgroundColor: isOnline ? 'success.light' : 'error.light',
            color: isOnline ? 'success.contrastText' : 'error.contrastText'
          }}
        >
          {isOnline ? (
            <SignalWifiStatusbar4BarIcon sx={{ mr: 1, fontSize: '1rem' }} />
          ) : (
            <WifiOffIcon sx={{ mr: 1, fontSize: '1rem' }} />
          )}
          <Typography variant="caption">
            {isOnline ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      );
      
    case 'snackbar':
    default:
      return (
        <Snackbar
          open={!isOnline || showOnline}
          anchorOrigin={{ vertical: position, horizontal: 'center' }}
        >
          <Alert 
            severity={isOnline ? 'success' : 'error'}
            icon={isOnline ? <SignalWifiStatusbar4BarIcon /> : <WifiOffIcon />}
          >
            {isOnline ? 'You are back online!' : 'You are currently offline. Some features may be unavailable.'}
          </Alert>
        </Snackbar>
      );
  }
};

export default OfflineIndicator; 