// src/pages/dashboard/DashboardPage.tsx

import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Box, 
  Button, 
  Card, 
  CardContent, 
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  ListItemButton,
  Avatar,
  Chip,
  IconButton,
  CircularProgress,
  useTheme,
  useMediaQuery,
  Tabs,
  Tab
} from '@mui/material';
import { 
  Dashboard as DashboardIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  Message as MessageIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon,
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types/user';

// Mock data interfaces
interface DashboardSummary {
  connections: number;
  messages: number;
  documents: number;
  notifications: number;
  completedTasks: number;
  pendingTasks: number;
}

interface RecentActivity {
  id: string;
  type: 'message' | 'connection' | 'document' | 'notification' | 'task';
  title: string;
  description: string;
  timestamp: string;
  status?: 'pending' | 'completed' | 'urgent';
  user?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  path: string;
  color: string;
}

const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const isTablet = useMediaQuery(theme.breakpoints.down('lg'));
  
  const [isLoading, setIsLoading] = useState(true);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentActivities, setRecentActivities] = useState<RecentActivity[]>([]);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Mock data
        const mockSummary: DashboardSummary = {
          connections: 24,
          messages: 8,
          documents: 15,
          notifications: 3,
          completedTasks: 12,
          pendingTasks: 5
        };
        
        const mockActivities: RecentActivity[] = generateMockActivities(10);
        
        setSummary(mockSummary);
        setRecentActivities(mockActivities);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const handleQuickActionClick = (path: string) => {
    navigate(path);
  };

  // Generate mock activities
  const generateMockActivities = (count: number): RecentActivity[] => {
    const types: Array<RecentActivity['type']> = ['message', 'connection', 'document', 'notification', 'task'];
    const statuses: Array<RecentActivity['status']> = ['pending', 'completed', 'urgent'];
    const activities: RecentActivity[] = [];
    
    for (let i = 0; i < count; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      
      let title = '';
      let description = '';
      
      switch (type) {
        case 'message':
          title = 'New message received';
          description = 'You have a new message from John Doe';
          break;
        case 'connection':
          title = 'New connection request';
          description = 'Sarah Smith wants to connect with you';
          break;
        case 'document':
          title = 'Document shared with you';
          description = 'Investment proposal has been shared with you';
          break;
        case 'notification':
          title = 'Meeting reminder';
          description = 'You have a meeting scheduled in 1 hour';
          break;
        case 'task':
          title = 'Task update';
          description = status === 'completed' 
            ? 'You completed the task: Update profile information' 
            : 'Task due soon: Complete investment questionnaire';
          break;
      }
      
      // Generate a random date within the last 7 days
      const date = new Date();
      date.setDate(date.getDate() - Math.floor(Math.random() * 7));
      
      activities.push({
        id: `activity-${i}`,
        type,
        title,
        description,
        timestamp: date.toISOString(),
        status: type === 'task' ? status : undefined,
        user: type === 'message' || type === 'connection' ? {
          id: `user-${i}`,
          name: type === 'message' ? 'John Doe' : 'Sarah Smith',
          avatar: undefined
        } : undefined
      });
    }
    
    // Sort by timestamp (newest first)
    return activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  };

  // Quick actions
  const quickActions: QuickAction[] = [
    {
      id: 'action-1',
      title: 'Complete Profile',
      description: 'Update your profile information',
      icon: <PersonIcon />,
      path: '/profile',
      color: theme.palette.primary.main
    },
    {
      id: 'action-2',
      title: 'Check Messages',
      description: 'View your recent messages',
      icon: <MessageIcon />,
      path: '/messages',
      color: theme.palette.info.main
    },
    {
      id: 'action-3',
      title: 'View Documents',
      description: 'Access your documents',
      icon: <AssignmentIcon />,
      path: '/documents',
      color: theme.palette.warning.main
    },
    {
      id: 'action-4',
      title: 'Explore Connections',
      description: 'Find new connections',
      icon: <TrendingUpIcon />,
      path: '/connections',
      color: theme.palette.success.main
    },
    {
      id: 'action-5',
      title: 'Notification Demo',
      description: 'Try out the notification system',
      icon: <NotificationsIcon />,
      path: '/demo/notifications',
      color: theme.palette.secondary.main
    }
  ];

  // Get activity icon based on type
  const getActivityIcon = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'message':
        return <MessageIcon color="primary" />;
      case 'connection':
        return <PersonIcon color="success" />;
      case 'document':
        return <AssignmentIcon color="warning" />;
      case 'notification':
        return <NotificationsIcon color="info" />;
      case 'task':
        return activity.status === 'completed' 
          ? <CheckCircleIcon color="success" /> 
          : activity.status === 'urgent' 
            ? <WarningIcon color="error" /> 
            : <InfoIcon color="action" />;
    }
  };

  // Format timestamp to relative time
  const formatRelativeTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) {
      return 'Just now';
    }
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
      return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
      return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    }
    
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Welcome Section */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.firstName || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's an overview of your account and recent activities.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Summary Cards */}
        <Grid item xs={12}>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <PersonIcon color="primary" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.connections || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Connections
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <MessageIcon color="info" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.messages || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Messages
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <AssignmentIcon color="warning" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.documents || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Documents
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <NotificationsIcon color="error" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.notifications || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Notifications
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <CheckCircleIcon color="success" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.completedTasks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Completed Tasks
                </Typography>
              </Paper>
            </Grid>
            <Grid item xs={6} sm={4} md={2}>
              <Paper 
                elevation={2} 
                sx={{ 
                  p: 2, 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  height: '100%'
                }}
              >
                <InfoIcon color="action" sx={{ fontSize: 40, mb: 1 }} />
                <Typography variant="h5" component="div">
                  {summary?.pendingTasks || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pending Tasks
                </Typography>
              </Paper>
            </Grid>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 0, height: '100%' }}>
            <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6" component="h2">
                Quick Actions
              </Typography>
            </Box>
            <List sx={{ p: 0 }}>
              {quickActions.map((action, index) => (
                <React.Fragment key={action.id}>
                  {index > 0 && <Divider component="li" />}
                  <ListItemButton
                    onClick={() => handleQuickActionClick(action.path)}
                    sx={{ py: 2 }}
                  >
                    <ListItemIcon sx={{ color: action.color }}>
                      {action.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={action.title} 
                      secondary={action.description} 
                    />
                    <ArrowForwardIcon color="action" />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          </Paper>
        </Grid>

        {/* Recent Activity */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 0, height: '100%' }}>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs 
                value={activeTab} 
                onChange={handleTabChange} 
                aria-label="activity tabs"
                variant={isMobile ? "scrollable" : "standard"}
                scrollButtons={isMobile ? "auto" : undefined}
              >
                <Tab label="All Activity" />
                <Tab label="Messages" />
                <Tab label="Connections" />
                <Tab label="Documents" />
                <Tab label="Tasks" />
              </Tabs>
            </Box>
            <List sx={{ p: 0 }}>
              {recentActivities
                .filter(activity => {
                  if (activeTab === 0) return true;
                  if (activeTab === 1) return activity.type === 'message';
                  if (activeTab === 2) return activity.type === 'connection';
                  if (activeTab === 3) return activity.type === 'document';
                  if (activeTab === 4) return activity.type === 'task';
                  return false;
                })
                .slice(0, 5)
                .map((activity, index) => (
                  <React.Fragment key={activity.id}>
                    {index > 0 && <Divider component="li" />}
                    <ListItem 
                      alignItems="flex-start"
                      secondaryAction={
                        <IconButton edge="end" aria-label="more">
                          <MoreVertIcon />
                        </IconButton>
                      }
                      sx={{ py: 2 }}
                    >
                      {activity.user ? (
                        <ListItemAvatar>
                          <Avatar alt={activity.user.name} src={activity.user.avatar} />
                        </ListItemAvatar>
                      ) : (
                        <ListItemIcon>
                          {getActivityIcon(activity)}
                        </ListItemIcon>
                      )}
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1 }}>
                            {activity.title}
                            {activity.status && (
                              <Chip 
                                label={activity.status.charAt(0).toUpperCase() + activity.status.slice(1)} 
                                color={
                                  activity.status === 'completed' ? 'success' : 
                                  activity.status === 'urgent' ? 'error' : 'default'
                                }
                                size="small"
                              />
                            )}
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.primary"
                            >
                              {activity.description}
                            </Typography>
                            <Typography
                              component="span"
                              variant="body2"
                              color="text.secondary"
                              sx={{ display: 'block' }}
                            >
                              {formatRelativeTime(activity.timestamp)}
                            </Typography>
                          </>
                        }
                      />
                    </ListItem>
                  </React.Fragment>
                ))}
            </List>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
              <Button 
                variant="outlined" 
                endIcon={<ArrowForwardIcon />}
                onClick={() => navigate('/activities')}
              >
                View All Activities
              </Button>
            </Box>
          </Paper>
        </Grid>

        {/* Role-Specific Section */}
        {user?.roles.includes(UserRole.ENTREPRENEUR) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Entrepreneur Resources
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Business Plan Template
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Download our comprehensive business plan template to help structure your ideas.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Download</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Pitch Deck Guide
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Learn how to create a compelling pitch deck that attracts investors.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">View Guide</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Funding Opportunities
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Explore current funding opportunities that match your business profile.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Explore</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Mentor Connect
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connect with experienced mentors who can guide your business journey.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Find Mentors</Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}

        {user?.roles.includes(UserRole.INVESTOR) && (
          <Grid item xs={12}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" component="h2" gutterBottom>
                Investor Opportunities
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Top Startups
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Discover high-potential startups that match your investment criteria.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Explore</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Due Diligence Tools
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Access our suite of due diligence tools to evaluate potential investments.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Access Tools</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Investment Analytics
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Review analytics and insights about your investment portfolio.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">View Analytics</Button>
                    </CardActions>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6" component="div">
                        Co-Investment Network
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Connect with other investors for co-investment opportunities.
                      </Typography>
                    </CardContent>
                    <CardActions>
                      <Button size="small">Join Network</Button>
                    </CardActions>
                  </Card>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        )}
      </Grid>
    </Container>
  );
};

export default DashboardPage;