import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Avatar, 
  Button, 
  Tabs, 
  Tab, 
  Divider,
  LinearProgress,
  Chip,
  IconButton,
  useTheme,
  useMediaQuery
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SecurityIcon from '@mui/icons-material/Security';
import HistoryIcon from '@mui/icons-material/History';
import NotificationsIcon from '@mui/icons-material/Notifications';
import VerifiedIcon from '@mui/icons-material/Verified';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';
import LoadingScreen from '../../components/common/LoadingScreen';
import PersonalInfoForm from '../../components/profile/PersonalInfoForm';
import SecuritySettingsForm from '../../components/profile/SecuritySettingsForm';
import NotificationSettingsForm from '../../components/profile/NotificationSettingsForm';
import ActivityHistoryList from '../../components/profile/ActivityHistoryList';

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
      id={`profile-tabpanel-${index}`}
      aria-labelledby={`profile-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `profile-tab-${index}`,
    'aria-controls': `profile-tabpanel-${index}`,
  };
};

const ProfilePage: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  useEffect(() => {
    // Calculate profile completion percentage
    if (user) {
      let completedFields = 0;
      let totalFields = 0;
      
      // Count completed fields (this is a simplified example)
      if (user.firstName) completedFields++;
      if (user.lastName) completedFields++;
      if (user.email) completedFields++;
      if (user.emailVerified) completedFields++;
      if (user.phoneVerified) completedFields++;
      
      // Total fields to complete
      totalFields = 5;
      
      setProfileCompletion(Math.round((completedFields / totalFields) * 100));
    }
  }, [user]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const toggleEditMode = () => {
    setIsEditing(!isEditing);
  };

  if (isLoading) {
    return <LoadingScreen message="Loading profile..." />;
  }

  if (!user) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h5" color="error" align="center">
          Unable to load profile. Please try again later.
        </Typography>
      </Container>
    );
  }

  // Get user profile photo (if available)
  const userPhoto = user.photo || '';

  const getRoleBadge = (role: UserRole) => {
    let color: 'primary' | 'secondary' | 'success' | 'error' | 'warning' | 'info' | 'default' = 'default';
    
    switch (role) {
      case UserRole.ENTREPRENEUR:
        color = 'primary';
        break;
      case UserRole.INVESTOR:
        color = 'success';
        break;
      case UserRole.MENTOR:
        color = 'info';
        break;
      case UserRole.ADMIN:
        color = 'error';
        break;
      case UserRole.SUPER_ADMIN:
        color = 'secondary';
        break;
      default:
        color = 'default';
    }
    
    return (
      <Chip 
        label={role} 
        color={color} 
        size="small" 
        sx={{ ml: 1 }}
      />
    );
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Grid container spacing={3}>
        {/* Profile Header */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Grid container spacing={3} alignItems="center">
              <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-start' }}>
                <Avatar 
                  src={userPhoto} 
                  alt={`${user.firstName || ''} ${user.lastName || ''}`}
                  sx={{ width: 100, height: 100 }}
                />
              </Grid>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', mb: 1 }}>
                  <Typography variant="h4" component="h1">
                    {user.firstName || ''} {user.lastName || ''}
                  </Typography>
                  {user.emailVerified && (
                    <VerifiedIcon color="primary" sx={{ ml: 1 }} titleAccess="Verified Account" />
                  )}
                </Box>
                <Typography variant="body1" color="text.secondary" gutterBottom>
                  {user.email}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                  {user.roles.map((role) => getRoleBadge(role))}
                </Box>
              </Grid>
              <Grid item xs={12} md={2} sx={{ display: 'flex', justifyContent: isMobile ? 'center' : 'flex-end' }}>
                <Button 
                  variant="outlined" 
                  startIcon={<EditIcon />}
                  onClick={toggleEditMode}
                >
                  {isEditing ? 'View Profile' : 'Edit Profile'}
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        {/* Profile Completion */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Completion
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress variant="determinate" value={profileCompletion} />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {`${profileCompletion}%`}
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              {profileCompletion < 100 
                ? 'Complete your profile to improve your experience and visibility.' 
                : 'Your profile is complete! This helps you get better matches and opportunities.'}
            </Typography>
          </Paper>
        </Grid>

        {/* Profile Content */}
        <Grid item xs={12}>
          <Paper sx={{ p: 0 }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={tabValue} 
                onChange={handleTabChange} 
                aria-label="profile tabs"
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : undefined}
              >
                <Tab 
                  label="Personal Information" 
                  icon={<EditIcon />} 
                  iconPosition="start" 
                  {...a11yProps(0)} 
                />
                <Tab 
                  label="Security" 
                  icon={<SecurityIcon />} 
                  iconPosition="start" 
                  {...a11yProps(1)} 
                />
                <Tab 
                  label="Notifications" 
                  icon={<NotificationsIcon />} 
                  iconPosition="start" 
                  {...a11yProps(2)} 
                />
                <Tab 
                  label="Activity History" 
                  icon={<HistoryIcon />} 
                  iconPosition="start" 
                  {...a11yProps(3)} 
                />
              </Tabs>
            </Box>
            
            <TabPanel value={tabValue} index={0}>
              <PersonalInfoForm 
                user={user} 
                isEditing={isEditing} 
                onEditToggle={toggleEditMode} 
              />
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <SecuritySettingsForm user={user} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <NotificationSettingsForm user={user} />
            </TabPanel>
            
            <TabPanel value={tabValue} index={3}>
              <ActivityHistoryList userId={user.id} />
            </TabPanel>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ProfilePage; 