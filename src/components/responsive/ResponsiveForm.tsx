import React from 'react';
import { Box, Grid, Paper, Typography, Button, CircularProgress } from '@mui/material';
import { useDeviceDetect } from '../../hooks/useDeviceDetect';

interface ResponsiveFormProps {
  title?: string;
  description?: string;
  children: React.ReactNode;
  onSubmit?: (e: React.FormEvent) => void;
  submitLabel?: string;
  cancelLabel?: string;
  onCancel?: () => void;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  maxWidth?: number | string;
  elevation?: number;
  actions?: React.ReactNode;
  fullWidthSubmit?: boolean;
}

/**
 * A responsive form component that adapts to different screen sizes
 * On mobile, form fields stack vertically and buttons are full width
 * On desktop, form maintains a maximum width and buttons are aligned to the right
 */
const ResponsiveForm: React.FC<ResponsiveFormProps> = ({
  title,
  description,
  children,
  onSubmit,
  submitLabel = 'Submit',
  cancelLabel = 'Cancel',
  onCancel,
  isLoading = false,
  isError = false,
  errorMessage = 'An error occurred. Please try again.',
  maxWidth = 600,
  elevation = 2,
  actions,
  fullWidthSubmit = false
}) => {
  const { isMobile } = useDeviceDetect();
  
  return (
    <Paper 
      elevation={elevation} 
      sx={{ 
        p: { xs: 2, sm: 3 }, 
        width: '100%', 
        maxWidth: maxWidth,
        mx: 'auto'
      }}
    >
      {title && (
        <Typography 
          variant="h5" 
          component="h2" 
          gutterBottom
          sx={{ mb: description ? 1 : 3 }}
        >
          {title}
        </Typography>
      )}
      
      {description && (
        <Typography 
          variant="body2" 
          color="text.secondary" 
          sx={{ mb: 3 }}
        >
          {description}
        </Typography>
      )}
      
      <Box 
        component="form" 
        onSubmit={onSubmit}
        noValidate
        sx={{ width: '100%' }}
      >
        <Grid container spacing={2}>
          {React.Children.map(children, (child) => {
            if (!React.isValidElement(child)) return child;
            
            // Check if the child has a gridItem prop
            const gridProps = child.props.gridItem || {};
            
            return (
              <Grid 
                item 
                xs={12} 
                {...gridProps}
              >
                {child}
              </Grid>
            );
          })}
        </Grid>
        
        {isError && (
          <Typography 
            color="error" 
            variant="body2" 
            sx={{ mt: 2 }}
          >
            {errorMessage}
          </Typography>
        )}
        
        <Box 
          sx={{ 
            mt: 3, 
            display: 'flex', 
            flexDirection: isMobile ? 'column' : 'row',
            justifyContent: isMobile ? 'center' : 'flex-end',
            gap: 2
          }}
        >
          {actions ? (
            actions
          ) : (
            <>
              {onCancel && (
                <Button
                  onClick={onCancel}
                  disabled={isLoading}
                  fullWidth={isMobile}
                  variant="outlined"
                >
                  {cancelLabel}
                </Button>
              )}
              
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={isLoading}
                fullWidth={isMobile || fullWidthSubmit}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {submitLabel}
              </Button>
            </>
          )}
        </Box>
      </Box>
    </Paper>
  );
};

export default ResponsiveForm; 