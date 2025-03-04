import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SearchOffIcon from '@mui/icons-material/SearchOff';
import { useAuth } from '../context/AuthContext';

/**
 * Not Found (404) Page Component
 * 
 * Displayed when a user tries to access a page that doesn't exist
 */
const NotFoundPage: React.FC = () => {
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
          <SearchOffIcon 
            color="primary" 
            sx={{ 
              fontSize: 80,
              mb: 2
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            404 - Page Not Found
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            The page you're looking for doesn't exist or has been moved.
            We're sorry for the inconvenience.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
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
          If you believe this is an error, please contact support for assistance.
        </Typography>
      </Paper>
    </Container>
  );
};

export default NotFoundPage; 