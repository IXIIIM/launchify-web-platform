import React, { useState } from 'react';
import { 
  Box, 
  TextField, 
  Button, 
  Typography, 
  FormControlLabel, 
  Checkbox, 
  Link, 
  InputAdornment, 
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { LoginCredentials } from '../../services/AuthService';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
  from?: {
    pathname: string;
  };
}

interface LoginFormProps {
  /**
   * Callback function to navigate to registration page
   */
  onRegisterClick?: () => void;
  
  /**
   * Callback function to navigate to forgot password page
   */
  onForgotPasswordClick?: () => void;
  
  /**
   * Default redirect path after successful login
   */
  defaultRedirectPath?: string;
}

/**
 * Login Form Component
 * 
 * Provides a form for users to log in with email and password
 * Includes remember me and forgot password functionality
 */
const LoginForm: React.FC<LoginFormProps> = ({
  onRegisterClick,
  onForgotPasswordClick,
  defaultRedirectPath = '/dashboard'
}) => {
  const { login, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  // Form state
  const [formData, setFormData] = useState<LoginCredentials>({
    email: '',
    password: '',
    rememberMe: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    email: '',
    password: ''
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked } = e.target;
    
    // Clear validation errors when user types
    if (errors[name as keyof typeof errors]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
    
    // Clear auth error when user types
    if (error) {
      clearError();
    }
    
    // Update form data
    setFormData({
      ...formData,
      [name]: name === 'rememberMe' ? checked : value
    });
  };
  
  // Toggle password visibility
  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };
  
  // Validate form
  const validateForm = (): boolean => {
    const newErrors = {
      email: '',
      password: ''
    };
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }
    
    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    }
    
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return !newErrors.email && !newErrors.password;
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      // Attempt to log in
      await login(formData);
      
      // Redirect to the page the user was trying to access, or the default redirect path
      const redirectPath = locationState?.from?.pathname || defaultRedirectPath;
      navigate(redirectPath, { replace: true });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Login error:', err);
    }
  };
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        width: '100%',
        maxWidth: 400,
        mx: 'auto',
        p: 3
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Log In to Your Account
      </Typography>
      
      {/* Display auth error if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
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
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        disabled={isLoading}
      />
      
      {/* Password field */}
      <TextField
        margin="normal"
        required
        fullWidth
        name="password"
        label="Password"
        type={showPassword ? 'text' : 'password'}
        id="password"
        autoComplete="current-password"
        value={formData.password}
        onChange={handleChange}
        error={!!errors.password}
        helperText={errors.password}
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
      
      {/* Remember me checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            name="rememberMe"
            color="primary"
            checked={formData.rememberMe}
            onChange={handleChange}
            disabled={isLoading}
          />
        }
        label="Remember me"
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
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Log In'}
      </Button>
      
      {/* Links */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        {onForgotPasswordClick && (
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onForgotPasswordClick}
            disabled={isLoading}
          >
            Forgot password?
          </Link>
        )}
        
        {onRegisterClick && (
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onRegisterClick}
            disabled={isLoading}
            sx={{ ml: 'auto' }}
          >
            Don't have an account? Sign Up
          </Link>
        )}
      </Box>
    </Box>
  );
};

export default LoginForm; 