import React from 'react';
import { Container, Box, Typography, Button, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';

/**
 * Forgot Password Page Component
 * 
 * Allows users to request a password reset by entering their email
 */
const ForgotPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Navigate to login page
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box 
        sx={{ 
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          mb: 4
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Forgot Password
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Enter your email address and we'll send you a link to reset your password.
        </Typography>
        
        <ForgotPasswordForm 
          onLoginClick={handleLoginClick}
        />
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Remember your password?{' '}
            <Link 
              component="button" 
              variant="body2" 
              onClick={handleLoginClick}
            >
              Back to Login
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default ForgotPasswordPage; 