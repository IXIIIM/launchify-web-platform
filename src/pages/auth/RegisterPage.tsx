import React from 'react';
import { Container, Box, Typography, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import RegisterForm from '../../components/auth/RegisterForm';

/**
 * Register Page Component
 * 
 * Allows users to create a new account
 */
const RegisterPage: React.FC = () => {
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
          Create an Account
        </Typography>
        
        <Typography variant="body1" sx={{ mb: 3, textAlign: 'center' }}>
          Join Launchify to connect with investors, entrepreneurs, and mentors.
        </Typography>
        
        <RegisterForm 
          onLoginClick={handleLoginClick}
        />
        
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Typography variant="body2">
            Already have an account?{' '}
            <Link 
              component="button" 
              variant="body2" 
              onClick={handleLoginClick}
            >
              Log in
            </Link>
          </Typography>
        </Box>
      </Box>
    </Container>
  );
};

export default RegisterPage; 