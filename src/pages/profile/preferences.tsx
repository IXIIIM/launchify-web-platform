import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Checkbox,
  Container,
  Divider,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormLabel,
  Grid,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Slider,
  Switch,
  TextField,
  Typography,
  useTheme,
  Chip,
  Autocomplete,
} from '@mui/material';
import {
  Save as SaveIcon,
  Refresh as ResetIcon,
  TravelExplore as DiscoveryIcon,
  Notifications as NotificationsIcon,
  Visibility as VisibilityIcon,
  Security as SecurityIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';

// Mock data for industries and roles
const INDUSTRIES = [
  'Technology', 'Finance', 'Healthcare', 'Education', 'Real Estate',
  'Manufacturing', 'Retail', 'Media', 'Energy', 'Transportation',
  'Agriculture', 'Construction', 'Hospitality', 'Entertainment',
];

const ROLES = [
  'Entrepreneur', 'Investor', 'Advisor', 'Mentor', 'Service Provider',
  'Corporate Executive', 'Business Developer', 'Marketing Specialist',
  'Technical Expert', 'Financial Analyst', 'Legal Advisor',
];

// Mock preferences data
const MOCK_PREFERENCES = {
  matching: {
    interestedInRoles: ['Investor', 'Advisor', 'Mentor'],
    interestedInIndustries: ['Technology', 'Finance', 'Healthcare'],
    investmentRange: [50000, 500000], // Min and max investment amount
    locationPreference: 'anywhere', // 'local', 'regional', 'anywhere'
    experienceLevel: ['beginner', 'intermediate', 'expert'],
    matchingPriority: 'balanced', // 'industry', 'role', 'investment', 'balanced'
    dealTypes: ['equity', 'debt', 'advisory'],
  },
  discovery: {
    showInDiscovery: true,
    allowRandomMatches: true,
    weeklyMatchSuggestions: true,
    maxMatchesPerWeek: 10,
  },
  notifications: {
    emailNotifications: true,
    pushNotifications: false,
    matchAlerts: true,
    messageAlerts: true,
    documentAlerts: true,
    paymentAlerts: true,
  },
  privacy: {
    profileVisibility: 'verified', // 'public', 'verified', 'matches'
    showContactInfo: false,
    showFinancialDetails: false,
    allowDataForMatching: true,
  },
};

const PreferencesPage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [preferences, setPreferences] = useState(MOCK_PREFERENCES);
  const [loading, setLoading] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    // In a real app, fetch user preferences from API
    // For now, we'll use the mock data
    setPreferences(MOCK_PREFERENCES);
  }, []);

  const handleSavePreferences = () => {
    setLoading(true);
    // In a real app, save preferences to API
    setTimeout(() => {
      setLoading(false);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }, 1000);
  };

  const handleResetPreferences = () => {
    // Reset to default or last saved preferences
    setPreferences(MOCK_PREFERENCES);
  };

  const handleMatchingChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      matching: {
        ...prev.matching,
        [field]: value,
      },
    }));
  };

  const handleDiscoveryChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      discovery: {
        ...prev.discovery,
        [field]: value,
      },
    }));
  };

  const handleNotificationsChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [field]: value,
      },
    }));
  };

  const handlePrivacyChange = (field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      privacy: {
        ...prev.privacy,
        [field]: value,
      },
    }));
  };

  return (
    <Layout title="Preferences">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Preferences
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Customize your experience and matching preferences.
          </Typography>
        </Box>

        <Grid container spacing={4}>
          {/* Matching Preferences */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Matching Preferences" 
                subheader="Define what you're looking for in potential matches"
                avatar={<DiscoveryIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <FormLabel>Interested in Roles</FormLabel>
                      <Autocomplete
                        multiple
                        options={ROLES}
                        value={preferences.matching.interestedInRoles}
                        onChange={(_, newValue) => handleMatchingChange('interestedInRoles', newValue)}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" placeholder="Select roles" />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option}
                              {...getTagProps({ index })}
                              key={option}
                            />
                          ))
                        }
                      />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <FormLabel>Interested in Industries</FormLabel>
                      <Autocomplete
                        multiple
                        options={INDUSTRIES}
                        value={preferences.matching.interestedInIndustries}
                        onChange={(_, newValue) => handleMatchingChange('interestedInIndustries', newValue)}
                        renderInput={(params) => (
                          <TextField {...params} variant="outlined" placeholder="Select industries" />
                        )}
                        renderTags={(value, getTagProps) =>
                          value.map((option, index) => (
                            <Chip
                              label={option}
                              {...getTagProps({ index })}
                              key={option}
                            />
                          ))
                        }
                      />
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <FormLabel>Investment Range ($)</FormLabel>
                      <Box sx={{ px: 2, pt: 2 }}>
                        <Slider
                          value={preferences.matching.investmentRange}
                          onChange={(_, newValue) => handleMatchingChange('investmentRange', newValue)}
                          valueLabelDisplay="on"
                          min={0}
                          max={1000000}
                          step={10000}
                          marks={[
                            { value: 0, label: '$0' },
                            { value: 500000, label: '$500K' },
                            { value: 1000000, label: '$1M' },
                          ]}
                          valueLabelFormat={(value) => `$${value.toLocaleString()}`}
                        />
                      </Box>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset" sx={{ mb: 3 }}>
                      <FormLabel component="legend">Location Preference</FormLabel>
                      <RadioGroup
                        value={preferences.matching.locationPreference}
                        onChange={(e) => handleMatchingChange('locationPreference', e.target.value)}
                      >
                        <FormControlLabel value="local" control={<Radio />} label="Local (within 50 miles)" />
                        <FormControlLabel value="regional" control={<Radio />} label="Regional (within my country)" />
                        <FormControlLabel value="anywhere" control={<Radio />} label="Anywhere (global)" />
                      </RadioGroup>
                    </FormControl>

                    <FormControl component="fieldset" sx={{ mb: 3 }}>
                      <FormLabel component="legend">Experience Level</FormLabel>
                      <FormGroup>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.experienceLevel.includes('beginner')}
                              onChange={(e) => {
                                const newExperience = e.target.checked
                                  ? [...preferences.matching.experienceLevel, 'beginner']
                                  : preferences.matching.experienceLevel.filter(level => level !== 'beginner');
                                handleMatchingChange('experienceLevel', newExperience);
                              }}
                            />
                          }
                          label="Beginner (0-3 years)"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.experienceLevel.includes('intermediate')}
                              onChange={(e) => {
                                const newExperience = e.target.checked
                                  ? [...preferences.matching.experienceLevel, 'intermediate']
                                  : preferences.matching.experienceLevel.filter(level => level !== 'intermediate');
                                handleMatchingChange('experienceLevel', newExperience);
                              }}
                            />
                          }
                          label="Intermediate (3-7 years)"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.experienceLevel.includes('expert')}
                              onChange={(e) => {
                                const newExperience = e.target.checked
                                  ? [...preferences.matching.experienceLevel, 'expert']
                                  : preferences.matching.experienceLevel.filter(level => level !== 'expert');
                                handleMatchingChange('experienceLevel', newExperience);
                              }}
                            />
                          }
                          label="Expert (7+ years)"
                        />
                      </FormGroup>
                    </FormControl>

                    <FormControl fullWidth sx={{ mb: 3 }}>
                      <FormLabel>Matching Priority</FormLabel>
                      <TextField
                        select
                        value={preferences.matching.matchingPriority}
                        onChange={(e) => handleMatchingChange('matchingPriority', e.target.value)}
                        fullWidth
                        variant="outlined"
                        sx={{ mt: 1 }}
                      >
                        <MenuItem value="industry">Industry Focus</MenuItem>
                        <MenuItem value="role">Role Compatibility</MenuItem>
                        <MenuItem value="investment">Investment Range</MenuItem>
                        <MenuItem value="balanced">Balanced (All Factors)</MenuItem>
                      </TextField>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12}>
                    <FormControl component="fieldset">
                      <FormLabel component="legend">Deal Types</FormLabel>
                      <FormGroup row>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.dealTypes.includes('equity')}
                              onChange={(e) => {
                                const newDealTypes = e.target.checked
                                  ? [...preferences.matching.dealTypes, 'equity']
                                  : preferences.matching.dealTypes.filter(type => type !== 'equity');
                                handleMatchingChange('dealTypes', newDealTypes);
                              }}
                            />
                          }
                          label="Equity Investment"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.dealTypes.includes('debt')}
                              onChange={(e) => {
                                const newDealTypes = e.target.checked
                                  ? [...preferences.matching.dealTypes, 'debt']
                                  : preferences.matching.dealTypes.filter(type => type !== 'debt');
                                handleMatchingChange('dealTypes', newDealTypes);
                              }}
                            />
                          }
                          label="Debt Financing"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.dealTypes.includes('advisory')}
                              onChange={(e) => {
                                const newDealTypes = e.target.checked
                                  ? [...preferences.matching.dealTypes, 'advisory']
                                  : preferences.matching.dealTypes.filter(type => type !== 'advisory');
                                handleMatchingChange('dealTypes', newDealTypes);
                              }}
                            />
                          }
                          label="Advisory/Consulting"
                        />
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={preferences.matching.dealTypes.includes('partnership')}
                              onChange={(e) => {
                                const newDealTypes = e.target.checked
                                  ? [...preferences.matching.dealTypes, 'partnership']
                                  : preferences.matching.dealTypes.filter(type => type !== 'partnership');
                                handleMatchingChange('dealTypes', newDealTypes);
                              }}
                            />
                          }
                          label="Strategic Partnership"
                        />
                      </FormGroup>
                    </FormControl>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Discovery Settings */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Discovery Settings" 
                subheader="Control how you discover and are discovered by others"
                avatar={<DiscoveryIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.discovery.showInDiscovery}
                        onChange={(e) => handleDiscoveryChange('showInDiscovery', e.target.checked)}
                      />
                    }
                    label="Show my profile in discovery"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.discovery.allowRandomMatches}
                        onChange={(e) => handleDiscoveryChange('allowRandomMatches', e.target.checked)}
                      />
                    }
                    label="Allow algorithm to suggest matches outside my preferences"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.discovery.weeklyMatchSuggestions}
                        onChange={(e) => handleDiscoveryChange('weeklyMatchSuggestions', e.target.checked)}
                      />
                    }
                    label="Receive weekly match suggestions"
                  />
                </FormGroup>

                <Box sx={{ mt: 3 }}>
                  <FormControl fullWidth>
                    <FormLabel>Maximum matches per week</FormLabel>
                    <Slider
                      value={preferences.discovery.maxMatchesPerWeek}
                      onChange={(_, newValue) => handleDiscoveryChange('maxMatchesPerWeek', newValue)}
                      valueLabelDisplay="auto"
                      step={1}
                      marks
                      min={1}
                      max={20}
                      disabled={!preferences.discovery.weeklyMatchSuggestions}
                    />
                  </FormControl>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Notifications */}
          <Grid item xs={12} md={6}>
            <Card sx={{ height: '100%' }}>
              <CardHeader 
                title="Notification Preferences" 
                subheader="Manage how you receive notifications"
                avatar={<NotificationsIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Typography variant="subtitle2" gutterBottom>
                  Notification Channels
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.emailNotifications}
                        onChange={(e) => handleNotificationsChange('emailNotifications', e.target.checked)}
                      />
                    }
                    label="Email Notifications"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.pushNotifications}
                        onChange={(e) => handleNotificationsChange('pushNotifications', e.target.checked)}
                      />
                    }
                    label="Push Notifications"
                  />
                </FormGroup>

                <Typography variant="subtitle2" gutterBottom sx={{ mt: 3 }}>
                  Notification Types
                </Typography>
                <FormGroup>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.matchAlerts}
                        onChange={(e) => handleNotificationsChange('matchAlerts', e.target.checked)}
                      />
                    }
                    label="Match Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.messageAlerts}
                        onChange={(e) => handleNotificationsChange('messageAlerts', e.target.checked)}
                      />
                    }
                    label="Message Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.documentAlerts}
                        onChange={(e) => handleNotificationsChange('documentAlerts', e.target.checked)}
                      />
                    }
                    label="Document Alerts"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={preferences.notifications.paymentAlerts}
                        onChange={(e) => handleNotificationsChange('paymentAlerts', e.target.checked)}
                      />
                    }
                    label="Payment Alerts"
                  />
                </FormGroup>
              </CardContent>
            </Card>
          </Grid>

          {/* Privacy Settings */}
          <Grid item xs={12}>
            <Card>
              <CardHeader 
                title="Privacy Settings" 
                subheader="Control who can see your information"
                avatar={<SecurityIcon color="primary" />}
              />
              <Divider />
              <CardContent>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <FormControl component="fieldset" fullWidth>
                      <FormLabel component="legend">Profile Visibility</FormLabel>
                      <RadioGroup
                        value={preferences.privacy.profileVisibility}
                        onChange={(e) => handlePrivacyChange('profileVisibility', e.target.value)}
                      >
                        <FormControlLabel value="public" control={<Radio />} label="Public (visible to all users)" />
                        <FormControlLabel value="verified" control={<Radio />} label="Verified Users Only" />
                        <FormControlLabel value="matches" control={<Radio />} label="Matches Only" />
                      </RadioGroup>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <FormGroup>
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.privacy.showContactInfo}
                            onChange={(e) => handlePrivacyChange('showContactInfo', e.target.checked)}
                          />
                        }
                        label="Show contact information to matches"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.privacy.showFinancialDetails}
                            onChange={(e) => handlePrivacyChange('showFinancialDetails', e.target.checked)}
                          />
                        }
                        label="Show financial details to matches"
                      />
                      <FormControlLabel
                        control={
                          <Switch
                            checked={preferences.privacy.allowDataForMatching}
                            onChange={(e) => handlePrivacyChange('allowDataForMatching', e.target.checked)}
                          />
                        }
                        label="Allow my data to be used for matching algorithm improvements"
                      />
                    </FormGroup>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                startIcon={<ResetIcon />}
                onClick={handleResetPreferences}
              >
                Reset
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleSavePreferences}
                disabled={loading}
              >
                {loading ? 'Saving...' : 'Save Preferences'}
              </Button>
            </Box>
            {saveSuccess && (
              <Typography color="success.main" sx={{ mt: 2, textAlign: 'right' }}>
                Preferences saved successfully!
              </Typography>
            )}
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PreferencesPage; 