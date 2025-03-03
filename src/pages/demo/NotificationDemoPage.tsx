import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Grid, 
  Paper,
  Divider
} from '@mui/material';
import { useNotification } from '../../context/NotificationContext';

const NotificationDemoPage: React.FC = () => {
  const { addNotification, clearAllNotifications } = useNotification();

  const showSuccessNotification = () => {
    addNotification({
      message: 'Operation completed successfully!',
      type: 'success',
      title: 'Success',
      autoHideDuration: 5000
    });
  };

  const showErrorNotification = () => {
    addNotification({
      message: 'An error occurred while processing your request.',
      type: 'error',
      title: 'Error',
      autoHideDuration: 5000
    });
  };

  const showWarningNotification = () => {
    addNotification({
      message: 'Please review your information before proceeding.',
      type: 'warning',
      title: 'Warning',
      autoHideDuration: 5000
    });
  };

  const showInfoNotification = () => {
    addNotification({
      message: 'Your account was last accessed on June 15, 2023.',
      type: 'info',
      title: 'Information',
      autoHideDuration: 5000
    });
  };

  const showCustomPositionNotification = () => {
    addNotification({
      message: 'This notification appears at the bottom center of the screen.',
      type: 'info',
      title: 'Custom Position',
      anchorOrigin: { vertical: 'bottom', horizontal: 'center' },
      autoHideDuration: 5000
    });
  };

  const showPersistentNotification = () => {
    addNotification({
      message: 'This notification will not disappear automatically. You need to close it manually.',
      type: 'warning',
      title: 'Persistent Notification',
      autoHideDuration: null
    });
  };

  const showNotificationWithAction = () => {
    addNotification({
      message: 'Your profile is 75% complete. Complete it now to unlock all features.',
      type: 'info',
      title: 'Profile Incomplete',
      action: (
        <Button color="inherit" size="small">
          Complete Now
        </Button>
      ),
      autoHideDuration: 8000
    });
  };

  const showMultipleNotifications = () => {
    showSuccessNotification();
    setTimeout(() => showInfoNotification(), 300);
    setTimeout(() => showWarningNotification(), 600);
    setTimeout(() => showErrorNotification(), 900);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Notification System Demo
      </Typography>
      <Typography variant="body1" paragraph>
        This page demonstrates the notification system capabilities. Click the buttons below to see different types of notifications.
      </Typography>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Basic Notification Types
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The system supports four basic notification types: success, error, warning, and info.
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="contained" 
              color="success" 
              onClick={showSuccessNotification}
            >
              Success
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="error" 
              onClick={showErrorNotification}
            >
              Error
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="warning" 
              onClick={showWarningNotification}
            >
              Warning
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="info" 
              onClick={showInfoNotification}
            >
              Info
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="secondary" 
              onClick={showMultipleNotifications}
            >
              Show Multiple
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Advanced Features
        </Typography>
        <Typography variant="body2" color="text.secondary" paragraph>
          The notification system also supports custom positions, persistent notifications, and notifications with actions.
        </Typography>
        <Grid container spacing={2}>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={showCustomPositionNotification}
            >
              Custom Position
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={showPersistentNotification}
            >
              Persistent
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              onClick={showNotificationWithAction}
            >
              With Action
            </Button>
          </Grid>
          <Grid item>
            <Button 
              variant="outlined" 
              color="error" 
              onClick={clearAllNotifications}
            >
              Clear All
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Box sx={{ mt: 4 }}>
        <Divider sx={{ mb: 2 }} />
        <Typography variant="body2" color="text.secondary">
          The notification system is implemented using React Context API and Material-UI components.
          It provides a centralized way to manage notifications across the application.
        </Typography>
      </Box>
    </Container>
  );
};

export default NotificationDemoPage; 