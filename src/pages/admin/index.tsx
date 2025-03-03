import React, { useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader, 
  Divider, 
  List, 
  ListItem, 
  ListItemText, 
  ListItemIcon, 
  Button, 
  CircularProgress, 
  Alert, 
  Chip,
  useTheme
} from '@mui/material';
import { 
  People as PeopleIcon, 
  PersonAdd as PersonAddIcon, 
  Handshake as HandshakeIcon, 
  VerifiedUser as VerifiedUserIcon, 
  CreditCard as CreditCardIcon, 
  Report as ReportIcon, 
  Settings as SettingsIcon, 
  TrendingUp as TrendingUpIcon,
  Warning as WarningIcon,
  Check as CheckIcon
} from '@mui/icons-material';
import { Link as RouterLink } from 'react-router-dom';
import { useAdmin } from '../../hooks/useAdmin';
import { SubscriptionTier } from '../../hooks/useSubscription';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const AdminDashboard: React.FC = () => {
  const { 
    stats, 
    statsLoading, 
    statsError, 
    getStats,
    settings,
    settingsLoading,
    settingsError,
    getSettings,
    reports,
    reportLoading,
    getReports
  } = useAdmin();
  
  const theme = useTheme();
  
  useEffect(() => {
    getStats();
    getSettings();
    getReports({ status: 'pending', limit: 5 });
  }, [getStats, getSettings, getReports]);
  
  // Prepare subscription data for pie chart
  const subscriptionData = stats ? Object.entries(stats.totalSubscriptions).map(([tier, count]) => ({
    name: tier,
    value: count
  })) : [];
  
  // Prepare revenue data for bar chart
  const revenueData = stats ? [
    { name: 'Daily', revenue: stats.revenue.daily },
    { name: 'Weekly', revenue: stats.revenue.weekly },
    { name: 'Monthly', revenue: stats.revenue.monthly },
    { name: 'Annual', revenue: stats.revenue.annual / 12 } // Normalized to monthly for comparison
  ] : [];
  
  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#FF6B6B'];
  
  // If loading, show loading indicator
  if (statsLoading || settingsLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }
  
  // If error, show error message
  if (statsError || settingsError) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {statsError?.message || settingsError?.message}
        </Alert>
      </Container>
    );
  }
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Admin Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to the admin dashboard. Here you can manage users, view statistics, and configure system settings.
        </Typography>
      </Box>
      
      {/* System Status */}
      {settings && (
        <Paper sx={{ p: 2, mb: 4 }}>
          <Typography variant="h6" gutterBottom>
            System Status
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Chip 
                  label={settings.maintenanceMode ? 'Maintenance Mode' : 'Operational'} 
                  color={settings.maintenanceMode ? 'warning' : 'success'} 
                  icon={settings.maintenanceMode ? <WarningIcon /> : <CheckIcon />}
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Registration:</Typography>
                <Chip 
                  label={settings.registrationOpen ? 'Open' : 'Closed'} 
                  color={settings.registrationOpen ? 'success' : 'error'} 
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Matching:</Typography>
                <Chip 
                  label={settings.matchingEnabled ? 'Enabled' : 'Disabled'} 
                  color={settings.matchingEnabled ? 'success' : 'error'} 
                  size="small"
                />
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography variant="body2" sx={{ mr: 1 }}>Verification:</Typography>
                <Chip 
                  label={settings.verificationEnabled ? 'Enabled' : 'Disabled'} 
                  color={settings.verificationEnabled ? 'success' : 'error'} 
                  size="small"
                />
              </Box>
            </Grid>
          </Grid>
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              component={RouterLink} 
              to="/admin/settings" 
              startIcon={<SettingsIcon />}
              variant="outlined"
              size="small"
            >
              Manage Settings
            </Button>
          </Box>
        </Paper>
      )}
      
      {/* Quick Stats */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <PeopleIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Users
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.totalUsers.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stats.activeUsers.toLocaleString()} active users
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{stats.newUsersToday} today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <HandshakeIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Matches
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.totalMatches.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="success.main">
                  +{stats.newMatchesToday} today
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <VerifiedUserIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Verifications
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  {stats.totalVerifications.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="warning.main">
                  {stats.pendingVerifications} pending
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid item xs={12} sm={6} md={3}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <CreditCardIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" component="div">
                    Revenue
                  </Typography>
                </Box>
                <Typography variant="h4" component="div">
                  ${stats.revenue.monthly.toLocaleString()}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}
      
      {/* Charts */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Revenue Overview
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={revenueData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value}`, 'Revenue']} />
                  <Legend />
                  <Bar dataKey="revenue" name="Revenue" fill={theme.palette.primary.main} />
                </BarChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Subscription Distribution
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={subscriptionData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {subscriptionData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                </PieChart>
              </ResponsiveContainer>
            </Paper>
          </Grid>
        </Grid>
      )}
      
      {/* Admin Actions */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader title="Quick Actions" />
            <Divider />
            <CardContent>
              <List>
                <ListItem 
                  component={RouterLink} 
                  to="/admin/users"
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <PeopleIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Manage Users" 
                    secondary="View, edit, and manage user accounts" 
                  />
                </ListItem>
                
                <ListItem 
                  component={RouterLink} 
                  to="/admin/reports"
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <ReportIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Content Reports" 
                    secondary="Review and resolve reported content" 
                  />
                </ListItem>
                
                <ListItem 
                  component={RouterLink} 
                  to="/admin/verifications"
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <VerifiedUserIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Verification Requests" 
                    secondary="Review and approve verification requests" 
                  />
                </ListItem>
                
                <ListItem 
                  component={RouterLink} 
                  to="/admin/settings"
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <SettingsIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="System Settings" 
                    secondary="Configure platform settings and features" 
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Card>
            <CardHeader 
              title="Pending Reports" 
              action={
                <Button 
                  component={RouterLink} 
                  to="/admin/reports" 
                  size="small"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <CardContent>
              {reportLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                  <CircularProgress size={24} />
                </Box>
              ) : reports.length === 0 ? (
                <Typography variant="body2" color="text.secondary" sx={{ p: 2 }}>
                  No pending reports.
                </Typography>
              ) : (
                <List dense>
                  {reports.map((report) => (
                    <ListItem key={report.id}>
                      <ListItemIcon>
                        <ReportIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary={report.reason} 
                        secondary={`${report.targetType} reported by ${report.reporterName}`} 
                      />
                      <Button 
                        component={RouterLink} 
                        to={`/admin/reports/${report.id}`} 
                        size="small"
                      >
                        Review
                      </Button>
                    </ListItem>
                  ))}
                </List>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard; 