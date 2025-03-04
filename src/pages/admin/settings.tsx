import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid,
  Switch,
  FormControlLabel,
  Button,
  TextField,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Alert,
  Snackbar,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Email as EmailIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  Storage as StorageIcon,
  Language as LanguageIcon,
  Payments as PaymentsIcon
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';

const AdminSettings: React.FC = () => {
  const {
    settings,
    settingsLoading,
    settingsError,
    getSettings,
    updateSettings
  } = useAdmin();

  // Local state for settings form
  const [formSettings, setFormSettings] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error'>('success');

  // Load settings on component mount
  useEffect(() => {
    getSettings();
  }, [getSettings]);

  // Update local state when settings are loaded
  useEffect(() => {
    if (settings) {
      setFormSettings({ ...settings });
    }
  }, [settings]);

  // Handle form field changes
  const handleChange = (field: string, value: any) => {
    setFormSettings({
      ...formSettings,
      [field]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formSettings) return;
    
    setIsSubmitting(true);
    
    try {
      await updateSettings(formSettings);
      setSnackbarMessage('Settings updated successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage('Failed to update settings');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Reset form to current settings
  const handleReset = () => {
    if (settings) {
      setFormSettings({ ...settings });
    }
  };

  // If loading, show loading indicator
  if (settingsLoading || !formSettings) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  // If error, show error message
  if (settingsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {settingsError.message}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          System Settings
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configure platform-wide settings and features.
        </Typography>
      </Box>

      <form onSubmit={handleSubmit}>
        <Grid container spacing={3}>
          {/* Platform Status */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Platform Status" 
                avatar={<SettingsIcon />}
                action={
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Button 
                      startIcon={<RefreshIcon />} 
                      onClick={handleReset}
                      sx={{ mr: 1 }}
                    >
                      Reset
                    </Button>
                    <Button 
                      type="submit" 
                      variant="contained" 
                      startIcon={<SaveIcon />}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                }
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.maintenanceMode}
                          onChange={(e) => handleChange('maintenanceMode', e.target.checked)}
                          color="warning"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>Maintenance Mode</Typography>
                          <Tooltip title="When enabled, only administrators can access the platform. All other users will see a maintenance message.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.registrationOpen}
                          onChange={(e) => handleChange('registrationOpen', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>User Registration</Typography>
                          <Tooltip title="When disabled, new users cannot register for the platform.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.matchingEnabled}
                          onChange={(e) => handleChange('matchingEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>Matching System</Typography>
                          <Tooltip title="When disabled, users cannot create or receive new matches.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.verificationEnabled}
                          onChange={(e) => handleChange('verificationEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>Verification System</Typography>
                          <Tooltip title="When disabled, users cannot submit new verification requests.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.subscriptionsEnabled}
                          onChange={(e) => handleChange('subscriptionsEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>Subscription System</Typography>
                          <Tooltip title="When disabled, users cannot purchase or manage subscriptions.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.messagingEnabled}
                          onChange={(e) => handleChange('messagingEnabled', e.target.checked)}
                          color="primary"
                        />
                      }
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Typography variant="body1" sx={{ mr: 1 }}>Messaging System</Typography>
                          <Tooltip title="When disabled, users cannot send or receive messages.">
                            <InfoIcon fontSize="small" color="action" />
                          </Tooltip>
                        </Box>
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Advanced Settings */}
          <Grid item xs={12}>
            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <EmailIcon sx={{ mr: 2 }} />
                  <Typography variant="h6">Email Settings</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.emailSettings.enabled}
                          onChange={(e) => handleChange('emailSettings', {
                            ...formSettings.emailSettings,
                            enabled: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="Enable Email Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="From Email Address"
                      value={formSettings.emailSettings.fromEmail}
                      onChange={(e) => handleChange('emailSettings', {
                        ...formSettings.emailSettings,
                        fromEmail: e.target.value
                      })}
                      disabled={!formSettings.emailSettings.enabled}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Support Email Address"
                      value={formSettings.emailSettings.supportEmail}
                      onChange={(e) => handleChange('emailSettings', {
                        ...formSettings.emailSettings,
                        supportEmail: e.target.value
                      })}
                      disabled={!formSettings.emailSettings.enabled}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Email Service Provider</InputLabel>
                      <Select
                        value={formSettings.emailSettings.provider}
                        label="Email Service Provider"
                        onChange={(e) => handleChange('emailSettings', {
                          ...formSettings.emailSettings,
                          provider: e.target.value
                        })}
                        disabled={!formSettings.emailSettings.enabled}
                      >
                        <MenuItem value="sendgrid">SendGrid</MenuItem>
                        <MenuItem value="mailchimp">Mailchimp</MenuItem>
                        <MenuItem value="ses">Amazon SES</MenuItem>
                        <MenuItem value="smtp">Custom SMTP</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <SecurityIcon sx={{ mr: 2 }} />
                  <Typography variant="h6">Security Settings</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.securitySettings.twoFactorEnabled}
                          onChange={(e) => handleChange('securitySettings', {
                            ...formSettings.securitySettings,
                            twoFactorEnabled: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="Enable Two-Factor Authentication"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.securitySettings.strongPasswordsRequired}
                          onChange={(e) => handleChange('securitySettings', {
                            ...formSettings.securitySettings,
                            strongPasswordsRequired: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="Require Strong Passwords"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Password Expiry (days)"
                      type="number"
                      value={formSettings.securitySettings.passwordExpiryDays}
                      onChange={(e) => handleChange('securitySettings', {
                        ...formSettings.securitySettings,
                        passwordExpiryDays: parseInt(e.target.value, 10)
                      })}
                      InputProps={{ inputProps: { min: 0 } }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Max Login Attempts"
                      type="number"
                      value={formSettings.securitySettings.maxLoginAttempts}
                      onChange={(e) => handleChange('securitySettings', {
                        ...formSettings.securitySettings,
                        maxLoginAttempts: parseInt(e.target.value, 10)
                      })}
                      InputProps={{ inputProps: { min: 1 } }}
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <PaymentsIcon sx={{ mr: 2 }} />
                  <Typography variant="h6">Payment Settings</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth>
                      <InputLabel>Payment Provider</InputLabel>
                      <Select
                        value={formSettings.paymentSettings.provider}
                        label="Payment Provider"
                        onChange={(e) => handleChange('paymentSettings', {
                          ...formSettings.paymentSettings,
                          provider: e.target.value
                        })}
                      >
                        <MenuItem value="stripe">Stripe</MenuItem>
                        <MenuItem value="paypal">PayPal</MenuItem>
                        <MenuItem value="braintree">Braintree</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.paymentSettings.testMode}
                          onChange={(e) => handleChange('paymentSettings', {
                            ...formSettings.paymentSettings,
                            testMode: e.target.checked
                          })}
                          color="warning"
                        />
                      }
                      label="Test Mode (Sandbox)"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="API Key"
                      value={formSettings.paymentSettings.apiKey}
                      onChange={(e) => handleChange('paymentSettings', {
                        ...formSettings.paymentSettings,
                        apiKey: e.target.value
                      })}
                      type="password"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Webhook Secret"
                      value={formSettings.paymentSettings.webhookSecret}
                      onChange={(e) => handleChange('paymentSettings', {
                        ...formSettings.paymentSettings,
                        webhookSecret: e.target.value
                      })}
                      type="password"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>

            <Accordion>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <NotificationsIcon sx={{ mr: 2 }} />
                  <Typography variant="h6">Notification Settings</Typography>
                </Box>
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.notificationSettings.emailNotifications}
                          onChange={(e) => handleChange('notificationSettings', {
                            ...formSettings.notificationSettings,
                            emailNotifications: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="Email Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.notificationSettings.pushNotifications}
                          onChange={(e) => handleChange('notificationSettings', {
                            ...formSettings.notificationSettings,
                            pushNotifications: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="Push Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.notificationSettings.smsNotifications}
                          onChange={(e) => handleChange('notificationSettings', {
                            ...formSettings.notificationSettings,
                            smsNotifications: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="SMS Notifications"
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <FormControlLabel
                      control={
                        <Switch
                          checked={formSettings.notificationSettings.inAppNotifications}
                          onChange={(e) => handleChange('notificationSettings', {
                            ...formSettings.notificationSettings,
                            inAppNotifications: e.target.checked
                          })}
                          color="primary"
                        />
                      }
                      label="In-App Notifications"
                    />
                  </Grid>
                </Grid>
              </AccordionDetails>
            </Accordion>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button 
            onClick={handleReset} 
            sx={{ mr: 2 }}
          >
            Cancel
          </Button>
          <Button 
            type="submit" 
            variant="contained" 
            startIcon={<SaveIcon />}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : 'Save All Changes'}
          </Button>
        </Box>
      </form>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdminSettings; 