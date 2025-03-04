import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  FormGroup,
  FormControlLabel,
  Switch,
  Button,
  Divider,
  Paper,
  Alert,
  Snackbar,
  CircularProgress,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
  SelectChangeEvent
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import { User } from '../../types/user';

interface NotificationSettingsFormProps {
  user: User;
}

interface NotificationSettings {
  email: {
    messages: boolean;
    matches: boolean;
    updates: boolean;
    marketing: boolean;
    security: boolean;
  };
  push: {
    messages: boolean;
    matches: boolean;
    updates: boolean;
  };
  frequency: 'immediate' | 'daily' | 'weekly' | 'never';
}

const NotificationSettingsForm: React.FC<NotificationSettingsFormProps> = ({ user }) => {
  const [settings, setSettings] = useState<NotificationSettings>({
    email: {
      messages: true,
      matches: true,
      updates: true,
      marketing: false,
      security: true
    },
    push: {
      messages: true,
      matches: true,
      updates: false
    },
    frequency: 'immediate'
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    // In a real app, you would fetch the user's notification settings from the API
    // For now, we'll use mock data
    const fetchSettings = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Mock data - in a real app, this would come from the API
        const mockSettings: NotificationSettings = {
          email: {
            messages: true,
            matches: true,
            updates: true,
            marketing: false,
            security: true
          },
          push: {
            messages: true,
            matches: true,
            updates: false
          },
          frequency: 'daily'
        };
        
        setSettings(mockSettings);
      } catch (err) {
        setError('Failed to load notification settings');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSettings();
  }, [user.id]);

  const handleEmailToggle = (setting: keyof typeof settings.email) => {
    setSettings(prev => ({
      ...prev,
      email: {
        ...prev.email,
        [setting]: !prev.email[setting]
      }
    }));
    setHasChanges(true);
  };

  const handlePushToggle = (setting: keyof typeof settings.push) => {
    setSettings(prev => ({
      ...prev,
      push: {
        ...prev.push,
        [setting]: !prev.push[setting]
      }
    }));
    setHasChanges(true);
  };

  const handleFrequencyChange = (event: SelectChangeEvent<string>) => {
    setSettings(prev => ({
      ...prev,
      frequency: event.target.value as NotificationSettings['frequency']
    }));
    setHasChanges(true);
  };

  const handleSaveSettings = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // In a real app, you would call the API to save the settings
      // For now, we'll simulate an API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Notification settings saved successfully');
      setHasChanges(false);
    } catch (err) {
      setError('Failed to save notification settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !hasChanges) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Email Notifications */}
      <Typography variant="h6" gutterBottom>
        Email Notifications
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.email.messages}
                onChange={() => handleEmailToggle('messages')}
                color="primary"
              />
            }
            label="New messages"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.email.matches}
                onChange={() => handleEmailToggle('matches')}
                color="primary"
              />
            }
            label="New matches and connection requests"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.email.updates}
                onChange={() => handleEmailToggle('updates')}
                color="primary"
              />
            }
            label="Platform updates and announcements"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.email.marketing}
                onChange={() => handleEmailToggle('marketing')}
                color="primary"
              />
            }
            label="Marketing and promotional emails"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.email.security}
                onChange={() => handleEmailToggle('security')}
                color="primary"
              />
            }
            label="Security alerts"
          />
        </FormGroup>
      </Paper>

      {/* Push Notifications */}
      <Typography variant="h6" gutterBottom>
        Push Notifications
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <FormGroup>
          <FormControlLabel
            control={
              <Switch
                checked={settings.push.messages}
                onChange={() => handlePushToggle('messages')}
                color="primary"
              />
            }
            label="New messages"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.push.matches}
                onChange={() => handlePushToggle('matches')}
                color="primary"
              />
            }
            label="New matches and connection requests"
          />
          <FormControlLabel
            control={
              <Switch
                checked={settings.push.updates}
                onChange={() => handlePushToggle('updates')}
                color="primary"
              />
            }
            label="Platform updates and announcements"
          />
        </FormGroup>
      </Paper>

      {/* Notification Frequency */}
      <Typography variant="h6" gutterBottom>
        Notification Frequency
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="notification-frequency-label">Email Digest Frequency</InputLabel>
              <Select
                labelId="notification-frequency-label"
                id="notification-frequency"
                value={settings.frequency}
                label="Email Digest Frequency"
                onChange={handleFrequencyChange}
              >
                <MenuItem value="immediate">Send immediately</MenuItem>
                <MenuItem value="daily">Daily digest</MenuItem>
                <MenuItem value="weekly">Weekly digest</MenuItem>
                <MenuItem value="never">Never</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Paper>

      {/* Save Button */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={isLoading ? <CircularProgress size={24} /> : <SaveIcon />}
          onClick={handleSaveSettings}
          disabled={isLoading || !hasChanges}
        >
          Save Settings
        </Button>
      </Box>

      {/* Error and Success Messages */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={() => setError(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setError(null)} severity="error" sx={{ width: '100%' }}>
          {error}
        </Alert>
      </Snackbar>

      <Snackbar
        open={!!success}
        autoHideDuration={6000}
        onClose={() => setSuccess(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSuccess(null)} severity="success" sx={{ width: '100%' }}>
          {success}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default NotificationSettingsForm; 