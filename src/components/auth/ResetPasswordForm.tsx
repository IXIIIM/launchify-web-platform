import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  Link, 
  Alert,
  CircularProgress,
  Paper,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import authService, { PasswordResetConfirmation } from '../../services/AuthService';
import { useNavigate, useLocation } from 'react-router-dom';

interface ResetPasswordFormProps {
  /**
   * Callback function to navigate to login page
   */
  onLoginClick?: () => void;
  
  /**
   * Default redirect path after successful password reset
   */
  defaultRedirectPath?: string;
}

/**
 * Reset Password Form Component
 * 
 * Provides a form for users to set a new password after receiving a reset link
 */
const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({
  onLoginClick,
  defaultRedirectPath = '/login'
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get token from URL query parameters
  const queryParams = new URLSearchParams(location.search);
  const token = queryParams.get('token') || '';
  
  // Form state
  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // Validation state
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: ''
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // Clear validation errors when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear error when user types
    if (error) {
      setError(null);
    }
    
    // Update form data
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Toggle confirm password visibility
  const handleToggleConfirmPasswordVisibility = () => {
    setShowConfirmPassword(!showConfirmPassword);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      newPassword: '',
      confirmPassword: ''
    };
    
    // Password validation
    if (!formData.newPassword) {
      newErrors.newPassword = 'Password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return !newErrors.newPassword && !newErrors.confirmPassword;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    // Validate token
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset link.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Reset password
      const resetData: PasswordResetConfirmation = {
        token,
        newPassword: formData.newPassword
      };
      await authService.confirmPasswordReset(resetData);
      
      // Show success message
      setSuccess(true);
      
      // Redirect to login page after a delay
      setTimeout(() => {
        navigate(defaultRedirectPath, { replace: true });
      }, 3000);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to reset password. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  // If token is missing, show error
  if (!token) {
    return (
      <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
        <Typography variant="h5" component="h1" gutterBottom align="center">
          Reset Password
        </Typography>
        
        <Alert severity="error" sx={{ mb: 3 }}>
          Invalid or missing reset token. Please request a new password reset link.
        </Alert>
        
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
      </Paper>
    );
  }
  
  return (
    <Paper elevation={3} sx={{ maxWidth: 500, mx: 'auto', p: 4 }}>
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Reset Password
      </Typography>
      
      {!success ? (
        <>
          <Typography variant="body1" sx={{ mb: 3 }}>
            Enter your new password below.
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
            {/* New password field */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="newPassword"
              label="New Password"
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              autoComplete="new-password"
              value={formData.newPassword}
              onChange={handleChange}
              error={!!errors.newPassword}
              helperText={errors.newPassword}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
            />
            
            {/* Confirm password field */}
            <TextField
              margin="normal"
              required
              fullWidth
              name="confirmPassword"
              label="Confirm Password"
              type={showConfirmPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={handleChange}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword}
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle confirm password visibility"
                      onClick={handleToggleConfirmPasswordVisibility}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                )
              }}
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
            Your password has been successfully reset.
          </Alert>
          
          <Typography variant="body1" sx={{ mb: 3 }}>
            You will be redirected to the login page in a few seconds.
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

export default ResetPasswordForm; 