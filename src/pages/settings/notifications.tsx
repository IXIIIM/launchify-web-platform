import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Grid,
  FormControl,
  FormGroup,
  FormControlLabel,
  Switch,
  Divider,
  Button,
  Alert,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  CardHeader,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Email as EmailIcon,
  Notifications as PushIcon,
  DesktopWindows as InAppIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Help as HelpIcon
} from '@mui/icons-material';
import { useNotifications } from '../../hooks/useNotifications';
import { NotificationPreferences } from '../../services/NotificationService';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 2 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `notification-tab-${index}`,
    'aria-controls': `notification-tabpanel-${index}`,
  };
};

const NotificationSettings: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { getNotificationPreferences, updateNotificationPreferences } = useNotifications({
    onSuccess: (message) => {
      setSuccess(message);
      setTimeout(() => setSuccess(null), 5000);
    },
    onError: (message) => {
      setError(message);
      setTimeout(() => setError(null), 5000);
    }
  });

  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const prefs = await getNotificationPreferences();
        setPreferences(prefs);
      } catch (err) {
        setError('Failed to load notification preferences');
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [getNotificationPreferences]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleToggleChange = (
    channel: 'email' | 'push' | 'inApp',
    category: 'documents' | 'signatures' | 'messages' | 'verification' | 'payments' | 'system'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!preferences) return;

    setPreferences({
      ...preferences,
      [channel]: {
        ...preferences[channel],
        [category]: event.target.checked
      }
    });
  };

  const handleSavePreferences = async () => {
    if (!preferences) return;

    setSaving(true);
    setSuccess(null);
    setError(null);

    try {
      await updateNotificationPreferences(preferences);
      setSuccess('Notification preferences saved successfully');
    } catch (err) {
      setError('Failed to save notification preferences');
    } finally {
      setSaving(false);
    }
  };

  const handleRefresh = async () => {
    setLoading(true);
    setSuccess(null);
    setError(null);

    try {
      const prefs = await getNotificationPreferences();
      setPreferences(prefs);
      setSuccess('Notification preferences refreshed');
    } catch (err) {
      setError('Failed to refresh notification preferences');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  if (!preferences) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error">
          Failed to load notification preferences
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleRefresh}
            sx={{ ml: 2 }}
          >
            Retry
          </Button>
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Notification Settings
        </Typography>
        <Box>
          <Tooltip title="Refresh preferences">
            <IconButton onClick={handleRefresh} disabled={loading || saving}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Button
            variant="contained"
            startIcon={<SaveIcon />}
            onClick={handleSavePreferences}
            disabled={loading || saving}
            sx={{ ml: 1 }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </Box>
      </Box>

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            aria-label="notification channel tabs"
            variant="fullWidth"
          >
            <Tab 
              label="Email Notifications" 
              icon={<EmailIcon />} 
              iconPosition="start"
              {...a11yProps(0)} 
            />
            <Tab 
              label="Push Notifications" 
              icon={<PushIcon />} 
              iconPosition="start"
              {...a11yProps(1)} 
            />
            <Tab 
              label="In-App Notifications" 
              icon={<InAppIcon />} 
              iconPosition="start"
              {...a11yProps(2)} 
            />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          <Typography variant="body1" paragraph>
            Configure which email notifications you want to receive. These will be sent to your registered email address.
          </Typography>
          <NotificationCategorySettings 
            channel="email"
            preferences={preferences}
            onChange={handleToggleChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="body1" paragraph>
            Configure which push notifications you want to receive on your devices. You'll need to allow notifications in your browser.
          </Typography>
          <NotificationCategorySettings 
            channel="push"
            preferences={preferences}
            onChange={handleToggleChange}
          />
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="body1" paragraph>
            Configure which notifications you want to see within the application.
          </Typography>
          <NotificationCategorySettings 
            channel="inApp"
            preferences={preferences}
            onChange={handleToggleChange}
          />
        </TabPanel>
      </Paper>

      <Card sx={{ mt: 4 }}>
        <CardHeader title="About Notifications" />
        <CardContent>
          <Typography variant="body1" paragraph>
            Notifications help you stay informed about important events and activities in your account. You can customize which notifications you receive and how you receive them.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Email Notifications:</strong> Sent to your registered email address.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Push Notifications:</strong> Appear on your device even when you're not using the application.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>In-App Notifications:</strong> Appear within the application when you're using it.
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

interface NotificationCategorySettingsProps {
  channel: 'email' | 'push' | 'inApp';
  preferences: NotificationPreferences;
  onChange: (
    channel: 'email' | 'push' | 'inApp',
    category: 'documents' | 'signatures' | 'messages' | 'verification' | 'payments' | 'system'
  ) => (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const NotificationCategorySettings: React.FC<NotificationCategorySettingsProps> = ({
  channel,
  preferences,
  onChange
}) => {
  const categoryDescriptions = {
    documents: 'Notifications about document creation, updates, and sharing',
    signatures: 'Notifications about signature requests and completions',
    messages: 'Notifications about new messages and conversations',
    verification: 'Notifications about identity verification status',
    payments: 'Notifications about payments and transactions',
    system: 'Important system announcements and updates'
  };

  return (
    <Grid container spacing={3}>
      {Object.entries(preferences[channel]).map(([category, enabled], index) => (
        <Grid item xs={12} sm={6} key={category}>
          <FormControl component="fieldset" variant="standard" sx={{ width: '100%' }}>
            <FormGroup>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'medium' }}>
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {categoryDescriptions[category as keyof typeof categoryDescriptions]}
                  </Typography>
                </Box>
                <FormControlLabel
                  control={
                    <Switch
                      checked={enabled}
                      onChange={onChange(channel, category as any)}
                      name={`${channel}-${category}`}
                    />
                  }
                  label=""
                />
              </Box>
            </FormGroup>
          </FormControl>
          {index < Object.entries(preferences[channel]).length - 1 && (
            <Divider sx={{ my: 2 }} />
          )}
        </Grid>
      ))}
    </Grid>
  );
};

export default NotificationSettings; 