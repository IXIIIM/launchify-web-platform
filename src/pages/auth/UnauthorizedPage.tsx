import React from 'react';
import { Container, Box, Typography, Button, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LockIcon from '@mui/icons-material/Lock';
import { useAuth } from '../../context/AuthContext';

/**
 * Unauthorized Page Component
 * 
 * Displayed when a user tries to access a page they don't have permission for
 */
const UnauthorizedPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Navigate to dashboard or login
  const handleNavigateHome = () => {
    navigate(isAuthenticated ? '/dashboard' : '/login');
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
          <LockIcon 
            color="error" 
            sx={{ 
              fontSize: 80,
              mb: 2
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Access Denied
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            You don't have permission to access this page. This could be because you need additional
            permissions or you need to log in with a different account.
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', justifyContent: 'center' }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleNavigateHome}
            >
              {isAuthenticated ? 'Go to Dashboard' : 'Log In'}
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

export default UnauthorizedPage; 