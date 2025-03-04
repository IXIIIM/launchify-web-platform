import React, { useState, useEffect } from 'react';
import { checkInstallable, showInstallPrompt } from '../../serviceWorkerRegistration';
import { Button, Snackbar, Alert, Box, Typography, Paper } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import CloseIcon from '@mui/icons-material/Close';

interface InstallPromptProps {
  variant?: 'banner' | 'button' | 'snackbar';
  position?: 'top' | 'bottom';
  autoShow?: boolean;
  showDelay?: number;
  onInstall?: () => void;
  onDismiss?: () => void;
}

/**
 * A component that prompts users to install the PWA
 */
const InstallPrompt: React.FC<InstallPromptProps> = ({
  variant = 'snackbar',
  position = 'bottom',
  autoShow = true,
  showDelay = 3000,
  onInstall,
  onDismiss
}) => {
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [installOutcome, setInstallOutcome] = useState<string | null>(null);

  useEffect(() => {
    // Check if the app is installable
    checkInstallable((installable) => {
      setIsInstallable(installable);
      
      // If auto-show is enabled, show the prompt after the specified delay
      if (installable && autoShow) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, showDelay);
        
        return () => clearTimeout(timer);
      }
    });
    
    // Check if the app was installed
    window.addEventListener('appinstalled', () => {
      setShowPrompt(false);
      setInstallOutcome('installed');
      if (onInstall) onInstall();
    });
    
    return () => {
      window.removeEventListener('appinstalled', () => {});
    };
  }, [autoShow, showDelay, onInstall]);

  const handleInstall = () => {
    showInstallPrompt((outcome) => {
      setInstallOutcome(outcome);
      if (outcome === 'accepted' && onInstall) {
        onInstall();
      } else if (outcome === 'dismissed' && onDismiss) {
        onDismiss();
      }
      setShowPrompt(false);
    });
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    if (onDismiss) onDismiss();
  };

  // If the app is not installable, don't render anything
  if (!isInstallable) {
    return null;
  }

  // Render based on the variant
  switch (variant) {
    case 'banner':
      return (
        <Paper
          elevation={3}
          sx={{
            display: showPrompt ? 'flex' : 'none',
            position: 'fixed',
            left: 0,
            right: 0,
            [position]: 0,
            zIndex: 1000,
            p: 2,
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: 'primary.light',
            color: 'primary.contrastText'
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DownloadIcon sx={{ mr: 2 }} />
            <Typography variant="body1">
              Install Launchify for a better experience!
            </Typography>
          </Box>
          <Box>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleInstall}
              sx={{ mr: 1 }}
            >
              Install
            </Button>
            <Button 
              variant="text" 
              color="inherit" 
              onClick={handleDismiss}
              startIcon={<CloseIcon />}
            >
              Not Now
            </Button>
          </Box>
        </Paper>
      );
      
    case 'button':
      return (
        <Button
          variant="contained"
          color="primary"
          startIcon={<DownloadIcon />}
          onClick={handleInstall}
        >
          Install App
        </Button>
      );
      
    case 'snackbar':
    default:
      return (
        <Snackbar
          open={showPrompt}
          autoHideDuration={10000}
          onClose={handleDismiss}
          anchorOrigin={{ vertical: position, horizontal: 'center' }}
        >
          <Alert 
            severity="info" 
            onClose={handleDismiss}
            action={
              <Button color="inherit" size="small" onClick={handleInstall}>
                INSTALL
              </Button>
            }
          >
            Install Launchify for a better experience!
          </Alert>
        </Snackbar>
      );
  }
};

export default InstallPrompt; 