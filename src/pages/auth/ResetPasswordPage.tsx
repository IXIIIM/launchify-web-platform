import React from 'react';
import { Container, Box, Typography } from '@mui/material';
import ResetPasswordForm from '../../components/auth/ResetPasswordForm';
import { useNavigate } from 'react-router-dom';

/**
 * Reset Password Page Component
 * 
 * Provides a page for users to reset their password after receiving a reset link
 */
const ResetPasswordPage: React.FC = () => {
  const navigate = useNavigate();
  
  // Navigate to login page
  const handleLoginClick = () => {
    navigate('/login');
  };
  
  return (
    <Container maxWidth="sm" sx={{ py: 8 }}>
      <Box 
        sx={{ 
          textAlign: 'center',
          mb: 4
        }}
      >
        <Typography variant="h4" component="h1" gutterBottom>
          Launchify
        </Typography>
        <Typography variant="body1">
          Reset your password to regain access to your account.
        </Typography>
      </Box>
      
      <ResetPasswordForm 
        onLoginClick={handleLoginClick}
        defaultRedirectPath="/login"
      />
    </Container>
  );
};

export default ResetPasswordPage; 