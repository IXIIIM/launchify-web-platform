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
  CircularProgress,
  FormControl,
  FormLabel,
  RadioGroup,
  Radio,
  FormHelperText
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { RegistrationData } from '../../services/AuthService';
import { UserRole } from '../../types/user';
import { useNavigate } from 'react-router-dom';

interface RegisterFormProps {
  /**
   * Callback function to navigate to login page
   */
  onLoginClick?: () => void;
  
  /**
   * Default redirect path after successful registration
   */
  defaultRedirectPath?: string;
  
  /**
   * URL to the terms and conditions page
   */
  termsUrl?: string;
}

/**
 * Registration Form Component
 * 
 * Provides a form for users to register with email, password, name, and role
 * Includes terms and conditions acceptance
 */
const RegisterForm: React.FC<RegisterFormProps> = ({
  onLoginClick,
  defaultRedirectPath = '/dashboard',
  termsUrl = '/terms'
}) => {
  const { register, error, isLoading, clearError } = useAuth();
  const navigate = useNavigate();
  
  // Form state
  const [formData, setFormData] = useState<Omit<RegistrationData, 'role'> & { role: string; confirmPassword: string }>({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: UserRole.ENTREPRENEUR.toString(),
    company: '',
    phoneNumber: '',
    acceptTerms: false
  });
  
  // Validation state
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    role: '',
    acceptTerms: ''
  });
  
  // UI state
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, checked, type } = e.target;
    
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
      [name]: type === 'checkbox' ? checked : value
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
      email: '',
      password: '',
      confirmPassword: '',
      firstName: '',
      lastName: '',
      role: '',
      acceptTerms: ''
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
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    
    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // First name validation
    if (!formData.firstName) {
      newErrors.firstName = 'First name is required';
    }
    
    // Last name validation
    if (!formData.lastName) {
      newErrors.lastName = 'Last name is required';
    }
    
    // Role validation
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    
    // Terms acceptance validation
    if (!formData.acceptTerms) {
      newErrors.acceptTerms = 'You must accept the terms and conditions';
    }
    
    setErrors(newErrors);
    
    // Form is valid if there are no errors
    return !Object.values(newErrors).some(error => error);
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
      return;
    }
    
    try {
      // Convert role string to UserRole enum
      const registrationData: RegistrationData = {
        ...formData,
        role: formData.role as unknown as UserRole
      };
      
      // Remove confirmPassword as it's not part of the RegistrationData interface
      delete (registrationData as any).confirmPassword;
      
      // Attempt to register
      await register(registrationData);
      
      // Redirect to the default redirect path
      navigate(defaultRedirectPath, { replace: true });
    } catch (err) {
      // Error is handled by the auth context
      console.error('Registration error:', err);
    }
  };
  
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      noValidate
      sx={{
        width: '100%',
        maxWidth: 600,
        mx: 'auto',
        p: 3
      }}
    >
      <Typography variant="h5" component="h1" gutterBottom align="center">
        Create Your Account
      </Typography>
      
      {/* Display auth error if any */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {/* Name fields */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          margin="normal"
          required
          fullWidth
          id="firstName"
          label="First Name"
          name="firstName"
          autoComplete="given-name"
          value={formData.firstName}
          onChange={handleChange}
          error={!!errors.firstName}
          helperText={errors.firstName}
          disabled={isLoading}
        />
        
        <TextField
          margin="normal"
          required
          fullWidth
          id="lastName"
          label="Last Name"
          name="lastName"
          autoComplete="family-name"
          value={formData.lastName}
          onChange={handleChange}
          error={!!errors.lastName}
          helperText={errors.lastName}
          disabled={isLoading}
        />
      </Box>
      
      {/* Email field */}
      <TextField
        margin="normal"
        required
        fullWidth
        id="email"
        label="Email Address"
        name="email"
        autoComplete="email"
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
        autoComplete="new-password"
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
      
      {/* Optional fields */}
      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          margin="normal"
          fullWidth
          id="company"
          label="Company Name (Optional)"
          name="company"
          autoComplete="organization"
          value={formData.company}
          onChange={handleChange}
          disabled={isLoading}
        />
        
        <TextField
          margin="normal"
          fullWidth
          id="phoneNumber"
          label="Phone Number (Optional)"
          name="phoneNumber"
          autoComplete="tel"
          value={formData.phoneNumber}
          onChange={handleChange}
          disabled={isLoading}
        />
      </Box>
      
      {/* Role selection */}
      <FormControl 
        component="fieldset" 
        margin="normal" 
        error={!!errors.role}
        disabled={isLoading}
      >
        <FormLabel component="legend">I am registering as a:</FormLabel>
        <RadioGroup
          row
          aria-label="role"
          name="role"
          value={formData.role}
          onChange={handleChange}
        >
          <FormControlLabel 
            value={UserRole.ENTREPRENEUR} 
            control={<Radio />} 
            label="Entrepreneur" 
          />
          <FormControlLabel 
            value={UserRole.INVESTOR} 
            control={<Radio />} 
            label="Investor" 
          />
          <FormControlLabel 
            value={UserRole.MENTOR} 
            control={<Radio />} 
            label="Mentor" 
          />
        </RadioGroup>
        {errors.role && <FormHelperText>{errors.role}</FormHelperText>}
      </FormControl>
      
      {/* Terms and conditions */}
      <FormControl 
        error={!!errors.acceptTerms}
        disabled={isLoading}
        fullWidth
        margin="normal"
      >
        <FormControlLabel
          control={
            <Checkbox
              name="acceptTerms"
              color="primary"
              checked={formData.acceptTerms}
              onChange={handleChange}
            />
          }
          label={
            <Typography variant="body2">
              I agree to the{' '}
              <Link href={termsUrl} target="_blank" rel="noopener">
                Terms and Conditions
              </Link>
            </Typography>
          }
        />
        {errors.acceptTerms && <FormHelperText>{errors.acceptTerms}</FormHelperText>}
      </FormControl>
      
      {/* Submit button */}
      <Button
        type="submit"
        fullWidth
        variant="contained"
        color="primary"
        sx={{ mt: 3, mb: 2 }}
        disabled={isLoading}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Register'}
      </Button>
      
      {/* Login link */}
      {onLoginClick && (
        <Box sx={{ textAlign: 'center', mt: 2 }}>
          <Link
            component="button"
            type="button"
            variant="body2"
            onClick={onLoginClick}
            disabled={isLoading}
          >
            Already have an account? Log In
          </Link>
        </Box>
      )}
    </Box>
  );
};

export default RegisterForm; 