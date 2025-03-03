import React, { useState } from 'react';
import { Container, Paper, Box, Typography, Tabs, Tab } from '@mui/material';
import LoginForm from '../../components/auth/LoginForm';
import RegisterForm from '../../components/auth/RegisterForm';
import ForgotPasswordForm from '../../components/auth/ForgotPasswordForm';
import { useNavigate } from 'react-router-dom';

/**
 * Login Page Component
 * 
 * Provides a page for users to log in, register, or reset their password
 */
const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  
  // State to track which form to display
  const [activeForm, setActiveForm] = useState<'login' | 'register' | 'forgot-password'>('login');
  
  // Handle tab change
  const handleTabChange = (_event: React.SyntheticEvent, newValue: 'login' | 'register') => {
    setActiveForm(newValue);
  };
  
  // Navigate to forgot password form
  const handleForgotPasswordClick = () => {
    setActiveForm('forgot-password');
  };
  
  // Navigate back to login form
  const handleBackToLoginClick = () => {
    setActiveForm('login');
  };
  
  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Paper 
        elevation={3} 
        sx={{ 
          borderRadius: 2,
          overflow: 'hidden'
        }}
      >
        <Box 
          sx={{ 
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            height: '100%'
          }}
        >
          {/* Left side - Brand/Logo */}
          <Box 
            sx={{ 
              bgcolor: 'primary.main',
              color: 'primary.contrastText',
              p: 4,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              width: { xs: '100%', md: '40%' }
            }}
          >
            <Typography variant="h4" component="h1" gutterBottom>
              Launchify
            </Typography>
            <Typography variant="body1" align="center">
              Connect entrepreneurs with investors and mentors to launch successful ventures.
            </Typography>
          </Box>
          
          {/* Right side - Forms */}
          <Box 
            sx={{ 
              p: { xs: 2, sm: 4 },
              width: { xs: '100%', md: '60%' }
            }}
          >
            {activeForm === 'forgot-password' ? (
              <ForgotPasswordForm onLoginClick={handleBackToLoginClick} />
            ) : (
              <>
                {/* Tabs for login/register */}
                <Tabs
                  value={activeForm}
                  onChange={handleTabChange}
                  variant="fullWidth"
                  sx={{ mb: 3 }}
                >
                  <Tab label="Login" value="login" />
                  <Tab label="Register" value="register" />
                </Tabs>
                
                {/* Login form */}
                {activeForm === 'login' && (
                  <LoginForm 
                    onRegisterClick={() => setActiveForm('register')}
                    onForgotPasswordClick={handleForgotPasswordClick}
                  />
                )}
                
                {/* Register form */}
                {activeForm === 'register' && (
                  <RegisterForm 
                    onLoginClick={() => setActiveForm('login')}
                  />
                )}
              </>
            )}
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default LoginPage; 