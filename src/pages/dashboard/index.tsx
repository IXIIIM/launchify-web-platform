import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useVerification } from '../../hooks/useVerification';
import { useSubscription } from '../../hooks/useSubscription';
import Layout from '../../components/layout/Layout';
import ActivityChart from '../../components/dashboard/ActivityChart';
import UpcomingEvents from '../../components/dashboard/UpcomingEvents';
import AnalyticsSummary from '../../components/dashboard/AnalyticsSummary';
import StatsCard from '../../components/dashboard/StatsCard';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Paper,
  Stack,
  Typography,
  useTheme,
  LinearProgress,
  Container,
  Alert,
} from '@mui/material';
import {
  ArrowForward as ArrowForwardIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  People as PeopleIcon,
  Message as MessageIcon,
  Description as DescriptionIcon,
  AccountBalance as AccountBalanceIcon,
  VerifiedUser as VerifiedUserIcon,
  Notifications as NotificationsIcon,
  TrendingUp as TrendingUpIcon,
  AttachMoney as AttachMoneyIcon,
  Schedule as ScheduleIcon,
  AccountBalanceWallet as AccountBalanceWalletIcon,
  Chat as ChatIcon,
  CreditCard,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import { Link as RouterLink } from 'react-router-dom';
import { VerificationLevel } from '../../services/VerificationService';

// Mock data for development
const MOCK_MATCHES = [
  { id: '1', name: 'John Doe', role: 'Investor', matchScore: 92, status: 'pending' },
  { id: '2', name: 'Jane Smith', role: 'Entrepreneur', matchScore: 88, status: 'accepted' },
  { id: '3', name: 'Alex Johnson', role: 'Investor', matchScore: 85, status: 'accepted' },
];

const MOCK_DOCUMENTS = [
  { id: '1', title: 'NDA Agreement', status: 'signed', date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) },
  { id: '2', title: 'Investment Contract', status: 'pending', date: new Date(Date.now() - 1000 * 60 * 60 * 12) },
];

const MOCK_ESCROW = [
  { id: '1', title: 'Project Alpha Funding', amount: 25000, status: 'active', milestones: 3, completedMilestones: 1 },
  { id: '2', title: 'Seed Investment', amount: 50000, status: 'pending', milestones: 2, completedMilestones: 0 },
];

const MOCK_MESSAGES = [
  { id: '1', sender: 'John Doe', content: 'Looking forward to our meeting tomorrow!', date: new Date(Date.now() - 1000 * 60 * 30) },
  { id: '2', sender: 'Jane Smith', content: "I've reviewed your proposal and have some questions.", date: new Date(Date.now() - 1000 * 60 * 60 * 3) },
];

const MOCK_VERIFICATION = {
  level: 'Advanced',
  identity: true,
  financial: true,
  background: true,
  professional: false,
  nextStep: 'Professional verification',
};

const MOCK_SUBSCRIPTION = {
  plan: 'Premium',
  status: 'active',
  renewalDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
  features: ['Advanced Matching', 'Unlimited Documents', 'Priority Support'],
};

const MOCK_STATS = {
  totalMatches: 15,
  activeEscrow: 2,
  documentsProcessed: 8,
  messagesExchanged: 47,
};

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { notifications, unreadCount } = useNotifications();
  const { verificationStatus } = useVerification();
  const { subscription, usage } = useSubscription();
  const theme = useTheme();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading data
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
          <CircularProgress />
        </Box>
      </Layout>
    );
  }

  return (
    <Layout title="Dashboard">
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome back, {user?.name || 'User'}!
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Here's what's happening with your account today.
        </Typography>
      </Box>

      {/* Analytics Summary */}
      <Box sx={{ mb: 4 }}>
        <AnalyticsSummary />
      </Box>

      {/* Stats Overview */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Total Matches"
            value={MOCK_STATS.totalMatches}
            icon={<PeopleIcon />}
            color="#4caf50"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Active Escrow"
            value={MOCK_STATS.activeEscrow}
            icon={<AccountBalanceWalletIcon />}
            color="#2196f3"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Documents"
            value={MOCK_STATS.documentsProcessed}
            icon={<DescriptionIcon />}
            color="#ff9800"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            title="Messages"
            value={MOCK_STATS.messagesExchanged}
            icon={<ChatIcon />}
            color="#9c27b0"
          />
        </Grid>
      </Grid>

      {/* Activity and Events */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={7}>
          <ActivityChart />
        </Grid>
        <Grid item xs={12} md={5}>
          <UpcomingEvents />
        </Grid>
      </Grid>

      {/* Main Dashboard Content */}
      <Grid container spacing={3}>
        {/* Left Column */}
        <Grid item xs={12} md={8}>
          {/* Recent Matches */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Recent Matches" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  component={RouterLink}
                  to="/matches"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <List>
              {MOCK_MATCHES.map((match) => (
                <ListItem 
                  key={match.id}
                  secondaryAction={
                    <Chip 
                      label={match.status === 'pending' ? 'Pending' : 'Accepted'} 
                      color={match.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                    />
                  }
                  disablePadding
                >
                  <ListItemButton 
                    component={RouterLink} 
                    to={`/matches/${match.id}`}
                  >
                    <ListItemIcon>
                      <PeopleIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={match.name} 
                      secondary={`${match.role} • Match Score: ${match.matchScore}%`} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {MOCK_MATCHES.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No matches found" 
                    secondary="Start browsing potential matches" 
                  />
                </ListItem>
              )}
            </List>
          </Card>

          {/* Recent Messages */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Recent Messages" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  href="/messages"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <List>
              {MOCK_MESSAGES.map((message) => (
                <ListItem key={message.id} disablePadding>
                  <ListItemButton component="a" href={`/messages/${message.id}`}>
                    <ListItemIcon>
                      <MessageIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={message.sender} 
                      secondary={
                        <>
                          {message.content.length > 50 
                            ? `${message.content.substring(0, 50)}...` 
                            : message.content}
                          <Typography variant="caption" display="block" color="text.secondary">
                            {formatDistanceToNow(message.date, { addSuffix: true })}
                          </Typography>
                        </>
                      } 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {MOCK_MESSAGES.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No messages found" 
                    secondary="Your conversations will appear here" 
                  />
                </ListItem>
              )}
            </List>
          </Card>

          {/* Escrow Status */}
          <Card>
            <CardHeader 
              title="Escrow Accounts" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  href="/escrow"
                >
                  View All
                </Button>
              }
            />
            <Divider />
            <List>
              {MOCK_ESCROW.map((escrow) => (
                <ListItem 
                  key={escrow.id}
                  secondaryAction={
                    <Chip 
                      label={escrow.status === 'pending' ? 'Pending' : 'Active'} 
                      color={escrow.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                    />
                  }
                  disablePadding
                >
                  <ListItemButton component="a" href={`/escrow/${escrow.id}`}>
                    <ListItemIcon>
                      <AccountBalanceIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={escrow.title} 
                      secondary={
                        <>
                          ${escrow.amount.toLocaleString()} • 
                          {escrow.completedMilestones}/{escrow.milestones} milestones completed
                        </>
                      } 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {MOCK_ESCROW.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No escrow accounts found" 
                    secondary="Create an escrow account for secure transactions" 
                  />
                </ListItem>
              )}
            </List>
          </Card>
        </Grid>

        {/* Right Column */}
        <Grid item xs={12} md={4}>
          {/* Subscription Status */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Subscription" 
              action={
                <Button 
                  size="small" 
                  component={RouterLink} 
                  to="/subscription"
                >
                  Manage
                </Button>
              }
            />
            <CardContent>
              {subscription ? (
                <>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CreditCard sx={{ color: 'primary.main', mr: 1 }} />
                    <Typography variant="h6">
                      {subscription.tier} Plan
                    </Typography>
                    <Chip 
                      label={subscription.status.toUpperCase()} 
                      color={
                        subscription.status === 'active' ? 'success' : 
                        subscription.status === 'canceled' ? 'error' : 'warning'
                      } 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  </Box>
                  
                  {usage && (
                    <>
                      <Typography variant="body2" gutterBottom>
                        Matches: {usage.matches.used} / {usage.matches.limit}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={usage.matches.percentage} 
                        sx={{ mb: 1 }} 
                      />
                      
                      <Typography variant="body2" gutterBottom>
                        Messages: {usage.messages.used} / {usage.messages.limit}
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={usage.messages.percentage} 
                        sx={{ mb: 1 }} 
                      />
                    </>
                  )}
                  
                  {subscription.cancelAtPeriodEnd && (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                      Your subscription will be canceled on {format(new Date(subscription.currentPeriodEnd), 'MMM d, yyyy')}
                    </Alert>
                  )}
                </>
              ) : (
                <>
                  <Typography variant="body1" gutterBottom>
                    You are currently on the Free plan.
                  </Typography>
                  <Button 
                    variant="contained" 
                    color="primary" 
                    component={RouterLink} 
                    to="/subscription" 
                    sx={{ mt: 2 }}
                  >
                    Upgrade Now
                  </Button>
                </>
              )}
            </CardContent>
          </Card>

          {/* Verification Status */}
          <Card sx={{ mb: 3 }}>
            <CardHeader 
              title="Verification Status" 
              action={
                <Button 
                  size="small" 
                  endIcon={<ArrowForwardIcon />}
                  component={RouterLink}
                  to="/verification"
                >
                  Manage
                </Button>
              }
            />
            <Divider />
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <VerifiedUserIcon 
                  sx={{ 
                    fontSize: 40, 
                    mr: 2,
                    color: verificationStatus?.currentLevel === VerificationLevel.NONE
                      ? theme.palette.text.disabled
                      : verificationStatus?.currentLevel === VerificationLevel.BASIC
                        ? theme.palette.primary.main
                        : verificationStatus?.currentLevel === VerificationLevel.ADVANCED
                          ? theme.palette.secondary.main
                          : theme.palette.success.main
                  }} 
                />
                <Box>
                  <Typography variant="h6">
                    {verificationStatus?.currentLevel === VerificationLevel.NONE
                      ? 'Not Verified'
                      : verificationStatus?.currentLevel === VerificationLevel.BASIC
                        ? 'Basic Verification'
                        : verificationStatus?.currentLevel === VerificationLevel.ADVANCED
                          ? 'Advanced Verification'
                          : 'Premium Verification'
                    }
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {verificationStatus?.nextRequirements && verificationStatus.nextRequirements.length > 0
                      ? `Next step: Complete ${verificationStatus.nextRequirements[0].charAt(0).toUpperCase() + verificationStatus.nextRequirements[0].slice(1)} Verification`
                      : verificationStatus?.currentLevel === VerificationLevel.PREMIUM
                        ? 'All verifications complete'
                        : 'Start verification process'
                    }
                  </Typography>
                </Box>
              </Box>
              
              <LinearProgress 
                variant="determinate" 
                value={verificationStatus 
                  ? (verificationStatus.currentLevel / VerificationLevel.PREMIUM) * 100 
                  : 0
                } 
                sx={{ height: 8, borderRadius: 4, mb: 2 }}
              />
              
              <Button
                variant="outlined"
                fullWidth
                component={RouterLink}
                to={verificationStatus?.nextRequirements && verificationStatus.nextRequirements.length > 0
                  ? `/verification/request/${verificationStatus.nextRequirements[0]}`
                  : '/verification'
                }
              >
                {verificationStatus?.nextRequirements && verificationStatus.nextRequirements.length > 0
                  ? 'Continue Verification'
                  : verificationStatus?.currentLevel === VerificationLevel.PREMIUM
                    ? 'View Verification Status'
                    : 'Start Verification'
                }
              </Button>
            </CardContent>
          </Card>

          {/* Pending Documents */}
          <Card>
            <CardHeader title="Documents" />
            <Divider />
            <List>
              {MOCK_DOCUMENTS.map((doc) => (
                <ListItem 
                  key={doc.id}
                  secondaryAction={
                    <Chip 
                      label={doc.status === 'pending' ? 'Action Required' : 'Signed'} 
                      color={doc.status === 'pending' ? 'warning' : 'success'}
                      size="small"
                    />
                  }
                  disablePadding
                >
                  <ListItemButton component="a" href={`/documents/${doc.id}`}>
                    <ListItemIcon>
                      <DescriptionIcon />
                    </ListItemIcon>
                    <ListItemText 
                      primary={doc.title} 
                      secondary={formatDistanceToNow(doc.date, { addSuffix: true })} 
                    />
                  </ListItemButton>
                </ListItem>
              ))}
              {MOCK_DOCUMENTS.length === 0 && (
                <ListItem>
                  <ListItemText 
                    primary="No documents found" 
                    secondary="Create or request documents" 
                  />
                </ListItem>
              )}
              <Divider />
              <ListItem>
                <Button 
                  fullWidth 
                  variant="outlined" 
                  href="/documents"
                  endIcon={<ArrowForwardIcon />}
                >
                  Manage Documents
                </Button>
              </ListItem>
            </List>
          </Card>

          {/* Profile Completion Card */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Profile Completion" 
                  action={
                    <Button 
                      variant="text" 
                      color="primary" 
                      component={RouterLink} 
                      to="/profile"
                    >
                      Edit Profile
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Complete your profile to improve match quality</Typography>
                      <Typography variant="body2" fontWeight="bold">85%</Typography>
                    </Box>
                    <LinearProgress 
                      variant="determinate" 
                      value={85} 
                      sx={{ height: 8, borderRadius: 4 }}
                    />
                  </Box>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 2 }}>
                    <Chip 
                      label="Add experience" 
                      onClick={() => window.location.href = '/profile'} 
                      clickable 
                      size="small" 
                    />
                    <Chip 
                      label="Set preferences" 
                      onClick={() => window.location.href = '/profile/preferences'} 
                      clickable 
                      size="small" 
                    />
                    <Chip 
                      label="Verify identity" 
                      onClick={() => window.location.href = '/verification'} 
                      clickable 
                      size="small" 
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Card>
                <CardHeader 
                  title="Matching Preferences" 
                  action={
                    <Button 
                      variant="text" 
                      color="primary" 
                      component={RouterLink} 
                      to="/profile/preferences"
                    >
                      Edit Preferences
                    </Button>
                  }
                />
                <Divider />
                <CardContent>
                  <Typography variant="subtitle2" gutterBottom>Looking for</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
                    <Chip label="Investors" size="small" />
                    <Chip label="Advisors" size="small" />
                    <Chip label="Mentors" size="small" />
                  </Box>
                  
                  <Typography variant="subtitle2" gutterBottom>Industries</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    <Chip label="Technology" size="small" />
                    <Chip label="Finance" size="small" />
                    <Chip label="Healthcare" size="small" />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Layout>
  );
};

export default Dashboard; 