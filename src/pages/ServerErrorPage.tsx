import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { useAuth } from '../context/AuthContext';

/**
 * Server Error (500) Page Component
 * 
 * Displayed when there's an unexpected error on the server
 */
const ServerErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Navigate to home page (dashboard if authenticated, landing page if not)
  const handleNavigateHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/');
  };
  
  // Navigate back
  const handleNavigateBack = () => {
    navigate(-1);
  };
  
  // Refresh the page
  const handleRefresh = () => {
    window.location.reload();
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          p: 4,
          borderRadius: 2,
          textAlign: 'center'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            mb: 4
          }}
        >
          <ErrorOutlineIcon 
            color="error" 
            sx={{ 
              fontSize: 80,
              mb: 2
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            500 - Server Error
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            We're sorry, but something went wrong on our end. Our team has been notified and is working to fix the issue.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleRefresh}
            >
              Refresh Page
            </Button>
            
            <Button
              variant="contained"
              color="secondary"
              onClick={handleNavigateHome}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Go to Home'}
            </Button>
            
            <Button
              variant="outlined"
              onClick={handleNavigateBack}
            >
              Go Back
            </Button>
          </Box>
        </Box>
        
        <Typography variant="body2" color="text.secondary">
          If the problem persists, please contact our support team for assistance.
        </Typography>
      </Paper>
    </Container>
  );
};

export default ServerErrorPage; 