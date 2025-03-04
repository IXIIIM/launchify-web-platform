import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Link, 
  Alert,
  CircularProgress,
  Paper
} from '@mui/material';
import authService, { PasswordResetRequest } from '../../services/AuthService';

interface ForgotPasswordFormProps {
  /**
   * Callback function to navigate to login page
   */
  onLoginClick?: () => void;
}

/**
 * Forgot Password Form Component
 * 
 * Provides a form for users to request a password reset
 */
const ForgotPasswordForm: React.FC<ForgotPasswordFormProps> = ({
  onLoginClick
}) => {
  // Form state
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Validation state
  const [emailError, setEmailError] = useState('');
  
  // Handle email change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    setEmailError('');
    setError(null);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    let isValid = true;
    
    // Email validation
    if (!email) {
      setEmailError('Email is required');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email is invalid');
      isValid = false;
    }
    
    return isValid;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Request password reset
      const resetRequest: PasswordResetRequest = { email };
      await authService.requestPasswordReset(resetRequest);
      
      // Show success message
      setSuccess(true);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to request password reset. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Forgot Password
      </Typography>
      
      {!success ? (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Enter your email address and we'll send you a link to reset your password.
          </Typography>
          
          {/* Display error if any */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: '100%' }}
          >
            {/* Email field */}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={handleEmailChange}
              error={!!emailError}
              helperText={emailError}
              disabled={isLoading}
            />
            
            {/* Submit button */}
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Reset Password'}
            </Button>
            
            {/* Back to login link */}
            {onLoginClick && (
              <Box sx={{ textAlign: 'center', mt: 2 }}>
                <Link
                  component="button"
                  type="button"
                  variant="body2"
                  onClick={onLoginClick}
                  disabled={isLoading}
                >
                  Back to Login
                </Link>
              </Box>
            )}
          </Box>
        </>
      ) : (
        <>
          <Alert severity="success" sx={{ mb: 3 }}>
            Password reset link has been sent to your email address.
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            Please check your email and follow the instructions to reset your password.
            If you don't receive an email within a few minutes, please check your spam folder.
          </Typography>
          
          {/* Back to login link */}
          {onLoginClick && (
            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                onClick={onLoginClick}
                fullWidth
              >
                Back to Login
              </Button>
            </Box>
          )}
        </>
      )}
    </Paper>
  );
};

export default ForgotPasswordForm;
