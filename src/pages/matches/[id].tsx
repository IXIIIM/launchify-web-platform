import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  Typography,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Skeleton,
  Alert,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  useTheme,
  Paper,
  Tab,
  Tabs,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  ArrowBack as ArrowBackIcon,
  Message as MessageIcon,
  Business as BusinessIcon,
  LocationOn as LocationIcon,
  School as EducationIcon,
  Work as WorkIcon,
  CheckCircle as VerifiedIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  Notes as NotesIcon,
  Send as SendIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
} from '@mui/icons-material';
import { formatDistanceToNow, format } from 'date-fns';
import Layout from '../../components/layout/Layout';
import { useMatches } from '../../hooks/useMatches';
import { Match } from '../../services/MatchingService';

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
      id={`match-tabpanel-${index}`}
      aria-labelledby={`match-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const MatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { activeMatch, viewMatch, acceptMatch, rejectMatch, clearActiveMatch } = useMatches();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'accept' | 'reject' | null>(null);
  const [notes, setNotes] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch match data
  useEffect(() => {
    const fetchMatchData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        await viewMatch(id);
        setError(null);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMatchData();
    
    // Clear active match on unmount
    return () => {
      clearActiveMatch();
    };
  }, [id, viewMatch, clearActiveMatch]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Handle match actions
  const handleAcceptMatch = async () => {
    if (!activeMatch) return;
    
    try {
      await acceptMatch(activeMatch.id);
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error('Error accepting match:', err);
    }
  };
  
  const handleRejectMatch = async () => {
    if (!activeMatch) return;
    
    try {
      await rejectMatch(activeMatch.id);
      setConfirmDialogOpen(false);
    } catch (err) {
      console.error('Error rejecting match:', err);
    }
  };
  
  const openConfirmDialog = (action: 'accept' | 'reject') => {
    setConfirmAction(action);
    setConfirmDialogOpen(true);
  };
  
  const handleSendMessage = () => {
    // In a real app, this would send a message to the matched user
    console.log('Sending message to', activeMatch?.matchedUser.name);
    navigate(`/messages?userId=${activeMatch?.matchedUserId}`);
  };
  
  // Get status color
  const getStatusColor = (status: Match['status']) => {
    switch (status) {
      case 'pending': return theme.palette.warning.main;
      case 'accepted': return theme.palette.success.main;
      case 'rejected': return theme.palette.error.main;
      case 'expired': return theme.palette.text.disabled;
      default: return theme.palette.text.primary;
    }
  };
  
  // Get score color
  const getScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };
  
  // Get verification level text
  const getVerificationLevelText = (level: number) => {
    switch (level) {
      case 0: return 'Not Verified';
      case 1: return 'Basic Verification';
      case 2: return 'Advanced Verification';
      case 3: return 'Premium Verification';
      default: return 'Unknown';
    }
  };
  
  if (loading) {
    return (
      <Layout title="Match Details">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton onClick={() => navigate('/matches')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Match Details
            </Typography>
          </Box>
          
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Skeleton variant="rectangular" height={200} />
            </Grid>
            <Grid item xs={12} md={8}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
            <Grid item xs={12} md={4}>
              <Skeleton variant="rectangular" height={400} />
            </Grid>
          </Grid>
        </Container>
      </Layout>
    );
  }
  
  if (error || !activeMatch) {
    return (
      <Layout title="Match Details">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
            <IconButton onClick={() => navigate('/matches')} sx={{ mr: 2 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h4" component="h1">
              Match Details
            </Typography>
          </Box>
          
          <Alert severity="error" sx={{ mb: 3 }}>
            {error ? `Error loading match: ${error.message}` : 'Match not found'}
          </Alert>
          
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={() => navigate('/matches')}
          >
            Back to Matches
          </Button>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout title={`Match with ${activeMatch.matchedUser.name}`}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/matches')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Match with {activeMatch.matchedUser.name}
          </Typography>
        </Box>
        
        {/* Match Overview Card */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={8} md={9}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <Avatar
                    src={activeMatch.matchedUser.profileImage}
                    alt={activeMatch.matchedUser.name}
                    sx={{ width: 80, height: 80, mr: 3 }}
                  />
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Typography variant="h5" component="div">
                        {activeMatch.matchedUser.name}
                      </Typography>
                      {activeMatch.matchedUser.verificationLevel > 0 && (
                        <VerifiedIcon 
                          color="primary" 
                          sx={{ ml: 1 }} 
                          titleAccess={getVerificationLevelText(activeMatch.matchedUser.verificationLevel)}
                        />
                      )}
                    </Box>
                    <Typography variant="subtitle1" color="text.secondary">
                      {activeMatch.matchedUser.role} • {activeMatch.matchedUser.industry}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {activeMatch.matchedUser.location}
                    </Typography>
                    <Box sx={{ display: 'flex', mt: 1 }}>
                      <Chip 
                        label={activeMatch.status.charAt(0).toUpperCase() + activeMatch.status.slice(1)} 
                        size="small"
                        sx={{ 
                          bgcolor: `${getStatusColor(activeMatch.status)}20`,
                          color: getStatusColor(activeMatch.status),
                          mr: 1
                        }}
                      />
                      <Chip 
                        label={`${activeMatch.score.overall}% Match`} 
                        size="small"
                        sx={{ 
                          bgcolor: `${getScoreColor(activeMatch.score.overall)}20`,
                          color: getScoreColor(activeMatch.score.overall)
                        }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={4} md={3}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'space-between' }}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {activeMatch.status === 'pending' 
                        ? `Expires ${formatDistanceToNow(new Date(activeMatch.expiresAt), { addSuffix: true })}`
                        : `Created ${formatDistanceToNow(new Date(activeMatch.createdAt), { addSuffix: true })}`
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Last activity: {formatDistanceToNow(new Date(activeMatch.lastActivity), { addSuffix: true })}
                    </Typography>
                  </Box>
                  
                  {activeMatch.status === 'pending' && (
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button
                        variant="outlined"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => openConfirmDialog('reject')}
                        sx={{ mr: 1 }}
                      >
                        Decline
                      </Button>
                      <Button
                        variant="contained"
                        color="success"
                        startIcon={<CheckIcon />}
                        onClick={() => openConfirmDialog('accept')}
                      >
                        Accept
                      </Button>
                    </Box>
                  )}
                  
                  {activeMatch.status === 'accepted' && (
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<MessageIcon />}
                      onClick={handleSendMessage}
                      fullWidth
                    >
                      Message
                    </Button>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Match Details Tabs */}
        <Grid container spacing={4}>
          <Grid item xs={12} md={8}>
            <Paper sx={{ mb: 4 }}>
              <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs 
                  value={tabValue} 
                  onChange={handleTabChange}
                  variant="fullWidth"
                >
                  <Tab label="Profile" />
                  <Tab label="Match Quality" />
                  <Tab label="Notes" />
                </Tabs>
              </Box>
              
              {/* Profile Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      About {activeMatch.matchedUser.name}
                    </Typography>
                    <Typography variant="body1">
                      {/* In a real app, this would come from the user's profile */}
                      {activeMatch.matchedUser.name} is a {activeMatch.matchedUser.role.toLowerCase()} in the {activeMatch.matchedUser.industry.toLowerCase()} industry with a strong track record of success. They are looking to connect with partners who share their vision and can contribute to mutual growth.
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="h6" gutterBottom>
                      Details
                    </Typography>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Industry" 
                          secondary={activeMatch.matchedUser.industry} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <WorkIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Role" 
                          secondary={activeMatch.matchedUser.role} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <LocationIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Location" 
                          secondary={activeMatch.matchedUser.location} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <VerifiedIcon />
                        </ListItemIcon>
                        <ListItemText 
                          primary="Verification Level" 
                          secondary={getVerificationLevelText(activeMatch.matchedUser.verificationLevel)} 
                        />
                      </ListItem>
                    </List>
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Match Quality Tab */}
              <TabPanel value={tabValue} index={1}>
                <Typography variant="h6" gutterBottom>
                  Match Score: {activeMatch.score.overall}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  This score is calculated based on compatibility across multiple factors.
                </Typography>
                
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Industry Fit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ color: getScoreColor(activeMatch.score.industryFit) }}
                          >
                            {activeMatch.score.industryFit}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          How well your industry interests align with this match.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Role Fit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ color: getScoreColor(activeMatch.score.roleFit) }}
                          >
                            {activeMatch.score.roleFit}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          How well this match's role aligns with your preferences.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Investment Fit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ color: getScoreColor(activeMatch.score.investmentFit) }}
                          >
                            {activeMatch.score.investmentFit}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Compatibility of investment expectations and deal types.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined" sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Location Fit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ color: getScoreColor(activeMatch.score.locationFit) }}
                          >
                            {activeMatch.score.locationFit}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          How well the location aligns with your preferences.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <Card variant="outlined">
                      <CardContent>
                        <Typography variant="subtitle1" gutterBottom>
                          Experience Fit
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                          <Typography 
                            variant="h4" 
                            sx={{ color: getScoreColor(activeMatch.score.experienceFit) }}
                          >
                            {activeMatch.score.experienceFit}%
                          </Typography>
                        </Box>
                        <Typography variant="body2" color="text.secondary">
                          Compatibility of experience levels and expertise.
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>
              </TabPanel>
              
              {/* Notes Tab */}
              <TabPanel value={tabValue} index={2}>
                <Typography variant="h6" gutterBottom>
                  Match Notes
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Add private notes about this match for your reference.
                </Typography>
                
                <TextField
                  fullWidth
                  multiline
                  rows={6}
                  label="Notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add your private notes about this match here..."
                  variant="outlined"
                  sx={{ mb: 2 }}
                />
                
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Button
                    variant="contained"
                    startIcon={<SaveIcon />}
                    onClick={() => console.log('Saving notes:', notes)}
                  >
                    Save Notes
                  </Button>
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
          
          {/* Match Timeline */}
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Match Timeline
                </Typography>
                
                <List>
                  <ListItem>
                    <ListItemIcon>
                      <StarIcon color="primary" />
                    </ListItemIcon>
                    <ListItemText 
                      primary="Match Created" 
                      secondary={format(new Date(activeMatch.createdAt), 'PPP')}
                    />
                  </ListItem>
                  
                  {activeMatch.status === 'accepted' && (
                    <ListItem>
                      <ListItemIcon>
                        <CheckIcon color="success" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Match Accepted" 
                        secondary={format(new Date(activeMatch.lastActivity), 'PPP')}
                      />
                    </ListItem>
                  )}
                  
                  {activeMatch.status === 'rejected' && (
                    <ListItem>
                      <ListItemIcon>
                        <CloseIcon color="error" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Match Declined" 
                        secondary={format(new Date(activeMatch.lastActivity), 'PPP')}
                      />
                    </ListItem>
                  )}
                  
                  {activeMatch.status === 'expired' && (
                    <ListItem>
                      <ListItemIcon>
                        <CloseIcon color="action" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Match Expired" 
                        secondary={format(new Date(activeMatch.expiresAt), 'PPP')}
                      />
                    </ListItem>
                  )}
                  
                  {activeMatch.status === 'pending' && (
                    <ListItem>
                      <ListItemIcon>
                        <StarBorderIcon color="warning" />
                      </ListItemIcon>
                      <ListItemText 
                        primary="Expires On" 
                        secondary={format(new Date(activeMatch.expiresAt), 'PPP')}
                      />
                    </ListItem>
                  )}
                </List>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="subtitle2" gutterBottom>
                  Match Initiated By
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {activeMatch.initiatedBy === 'current-user' 
                    ? 'You initiated this match' 
                    : activeMatch.initiatedBy === 'system'
                      ? 'System recommendation'
                      : `${activeMatch.matchedUser.name} initiated this match`
                  }
                </Typography>
                
                {activeMatch.status === 'accepted' && (
                  <>
                    <Divider sx={{ my: 2 }} />
                    <Typography variant="subtitle2" gutterBottom>
                      Next Steps
                    </Typography>
                    <List dense>
                      <ListItem>
                        <ListItemIcon>
                          <MessageIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Send a message to introduce yourself" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Schedule an initial meeting" />
                      </ListItem>
                      <ListItem>
                        <ListItemIcon>
                          <NotesIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText primary="Share relevant documents" />
                      </ListItem>
                    </List>
                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>
        
        {/* Confirmation Dialog */}
        <Dialog
          open={confirmDialogOpen}
          onClose={() => setConfirmDialogOpen(false)}
        >
          <DialogTitle>
            {confirmAction === 'accept' ? 'Accept Match' : 'Decline Match'}
          </DialogTitle>
          <DialogContent>
            <DialogContentText>
              {confirmAction === 'accept'
                ? `Are you sure you want to accept the match with ${activeMatch.matchedUser.name}? This will allow you to message each other and explore potential collaboration.`
                : `Are you sure you want to decline the match with ${activeMatch.matchedUser.name}? This action cannot be undone.`
              }
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setConfirmDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={confirmAction === 'accept' ? handleAcceptMatch : handleRejectMatch}
              color={confirmAction === 'accept' ? 'success' : 'error'}
              variant="contained"
              autoFocus
            >
              {confirmAction === 'accept' ? 'Accept' : 'Decline'}
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Layout>
  );
};

export default MatchDetailPage; 