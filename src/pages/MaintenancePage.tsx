import React from 'react';
import { Container, Box, Typography, Paper, CircularProgress } from '@mui/material';
import ConstructionIcon from '@mui/icons-material/Construction';

interface MaintenancePageProps {
  estimatedCompletionTime?: string;
  maintenanceMessage?: string;
}

/**
 * Maintenance Page Component
 * 
 * Displayed when the site is undergoing scheduled maintenance
 */
const MaintenancePage: React.FC<MaintenancePageProps> = ({
  estimatedCompletionTime,
  maintenanceMessage
}) => {
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
          <ConstructionIcon 
            color="warning" 
            sx={{ 
              fontSize: 80,
              mb: 2
            }} 
          />
          
          <Typography variant="h4" component="h1" gutterBottom>
            Site Under Maintenance
          </Typography>
          
          <Typography variant="body1" sx={{ mb: 3, maxWidth: 600, mx: 'auto' }}>
            {maintenanceMessage || 
              "We're currently performing scheduled maintenance to improve your experience. " +
              "We'll be back online shortly. Thank you for your patience."}
          </Typography>
          
          {estimatedCompletionTime && (
            <Box sx={{ mt: 2, mb: 4 }}>
              <Typography variant="h6" gutterBottom>
                Estimated Completion Time:
              </Typography>
              <Typography variant="body1" fontWeight="bold">
                {estimatedCompletionTime}
              </Typography>
            </Box>
          )}
          
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <CircularProgress size={20} sx={{ mr: 1 }} />
            <Typography variant="body2" color="text.secondary">
              Our team is working to complete maintenance as quickly as possible
            </Typography>
          </Box>
        </Box>
        
        <Box sx={{ mt: 4 }}>
          <Typography variant="body2" color="text.secondary">
            For urgent inquiries, please contact our support team at support@launchify.com
          </Typography>
        </Box>
      </Paper>
    </Container>
  );
};

export default MaintenancePage; 