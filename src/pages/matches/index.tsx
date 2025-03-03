import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  useTheme,
  Avatar,
  Chip,
  IconButton,
  LinearProgress,
  Skeleton,
  Alert,
} from '@mui/material';
import {
  Check as CheckIcon,
  Close as CloseIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  CheckCircle as VerifiedIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../../components/layout/Layout';
import { useMatches } from '../../hooks/useMatches';
import { Match, MatchFilters } from '../../services/MatchingService';

const MatchesPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const {
    matches,
    loading,
    error,
    recommendations,
    recommendationsLoading,
    filters,
    setFilters,
    acceptMatch,
    rejectMatch,
    refreshMatches,
  } = useMatches();
  
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update filters based on tab
    let status: MatchFilters['status'] = 'all';
    switch (newValue) {
      case 0: status = 'all'; break;
      case 1: status = 'pending'; break;
      case 2: status = 'accepted'; break;
      case 3: status = 'rejected'; break;
      case 4: status = 'expired'; break;
    }
    
    setFilters({ ...filters, status });
  };
  
  // Handle filter changes
  const handleFilterChange = (field: keyof MatchFilters, value: any) => {
    setFilters({ ...filters, [field]: value });
  };
  
  // Handle match actions
  const handleAcceptMatch = async (matchId: string) => {
    try {
      await acceptMatch(matchId);
    } catch (err) {
      console.error('Error accepting match:', err);
    }
  };
  
  const handleRejectMatch = async (matchId: string) => {
    try {
      await rejectMatch(matchId);
    } catch (err) {
      console.error('Error rejecting match:', err);
    }
  };
  
  const handleViewMatch = (matchId: string) => {
    navigate(`/matches/${matchId}`);
  };
  
  // Filter matches by search term
  const filteredMatches = matches.filter(match => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      match.matchedUser.name.toLowerCase().includes(searchLower) ||
      match.matchedUser.role.toLowerCase().includes(searchLower) ||
      match.matchedUser.industry.toLowerCase().includes(searchLower) ||
      match.matchedUser.location.toLowerCase().includes(searchLower)
    );
  });
  
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
  
  // Render match card
  const renderMatchCard = (match: Match) => {
    return (
      <Card key={match.id} sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={8}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Avatar
                  src={match.matchedUser.profileImage}
                  alt={match.matchedUser.name}
                  sx={{ width: 60, height: 60, mr: 2 }}
                />
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography variant="h6" component="div">
                      {match.matchedUser.name}
                    </Typography>
                    {match.matchedUser.verificationLevel > 0 && (
                      <VerifiedIcon 
                        color="primary" 
                        fontSize="small" 
                        sx={{ ml: 0.5 }} 
                      />
                    )}
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {match.matchedUser.role} • {match.matchedUser.industry}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {match.matchedUser.location}
                  </Typography>
                </Box>
              </Box>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'flex-start', sm: 'flex-end' } }}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <Typography 
                    variant="h6" 
                    component="div" 
                    sx={{ color: getScoreColor(match.score.overall) }}
                  >
                    {match.score.overall}%
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                    Match
                  </Typography>
                </Box>
                
                <Chip 
                  label={match.status.charAt(0).toUpperCase() + match.status.slice(1)} 
                  size="small"
                  sx={{ 
                    bgcolor: `${getStatusColor(match.status)}20`,
                    color: getStatusColor(match.status),
                    mb: 1
                  }}
                />
                
                <Typography variant="caption" color="text.secondary">
                  {match.status === 'pending' 
                    ? `Expires ${formatDistanceToNow(new Date(match.expiresAt), { addSuffix: true })}`
                    : `Created ${formatDistanceToNow(new Date(match.createdAt), { addSuffix: true })}`
                  }
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Match Quality
                </Typography>
                <Grid container spacing={1}>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Industry
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={match.score.industryFit} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(match.score.industryFit)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Role
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={match.score.roleFit} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(match.score.roleFit)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Investment
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={match.score.investmentFit} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(match.score.investmentFit)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Location
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={match.score.locationFit} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(match.score.locationFit)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                  <Grid item xs={6} sm={4} md={2}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Experience
                      </Typography>
                      <LinearProgress 
                        variant="determinate" 
                        value={match.score.experienceFit} 
                        sx={{ 
                          height: 6, 
                          borderRadius: 3,
                          bgcolor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            bgcolor: getScoreColor(match.score.experienceFit)
                          }
                        }} 
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </Grid>
            
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                {match.status === 'pending' && (
                  <>
                    <Button
                      variant="outlined"
                      color="error"
                      size="small"
                      startIcon={<CloseIcon />}
                      onClick={() => handleRejectMatch(match.id)}
                      sx={{ mr: 1 }}
                    >
                      Decline
                    </Button>
                    <Button
                      variant="contained"
                      color="success"
                      size="small"
                      startIcon={<CheckIcon />}
                      onClick={() => handleAcceptMatch(match.id)}
                      sx={{ mr: 1 }}
                    >
                      Accept
                    </Button>
                  </>
                )}
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => handleViewMatch(match.id)}
                >
                  View Details
                </Button>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  };
  
  // Render recommendations section
  const renderRecommendations = () => {
    if (recommendationsLoading) {
      return (
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} sx={{ mb: 2 }} />
          <Skeleton variant="rectangular" height={100} />
        </Box>
      );
    }
    
    if (recommendations.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No recommendations available at this time. Check back later!
        </Alert>
      );
    }
    
    return (
      <Box sx={{ mt: 2 }}>
        {recommendations.map(renderMatchCard)}
      </Box>
    );
  };
  
  return (
    <Layout title="Matches">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ mb: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h4" component="h1">
              Matches
            </Typography>
            <Box>
              <IconButton onClick={() => refreshMatches()} title="Refresh matches">
                <RefreshIcon />
              </IconButton>
              <IconButton onClick={() => setShowFilters(!showFilters)} title="Show filters">
                <FilterIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Typography variant="body1" color="text.secondary">
            Connect with potential partners based on your preferences and profile.
          </Typography>
        </Box>
        
        {/* Recommendations Section */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Recommended Matches
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              These matches are tailored to your profile and preferences.
            </Typography>
            {renderRecommendations()}
          </CardContent>
        </Card>
        
        {/* Filters */}
        {showFilters && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Filters & Sorting
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Search"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    InputProps={{
                      startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                    }}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Industry</InputLabel>
                    <Select
                      value={filters.industry || ''}
                      label="Industry"
                      onChange={(e) => handleFilterChange('industry', e.target.value)}
                    >
                      <MenuItem value="">All Industries</MenuItem>
                      <MenuItem value="Technology">Technology</MenuItem>
                      <MenuItem value="Finance">Finance</MenuItem>
                      <MenuItem value="Healthcare">Healthcare</MenuItem>
                      <MenuItem value="Real Estate">Real Estate</MenuItem>
                      <MenuItem value="Education">Education</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={filters.role || ''}
                      label="Role"
                      onChange={(e) => handleFilterChange('role', e.target.value)}
                    >
                      <MenuItem value="">All Roles</MenuItem>
                      <MenuItem value="Entrepreneur">Entrepreneur</MenuItem>
                      <MenuItem value="Investor">Investor</MenuItem>
                      <MenuItem value="Advisor">Advisor</MenuItem>
                      <MenuItem value="Mentor">Mentor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={filters.sortBy || 'score'}
                      label="Sort By"
                      onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    >
                      <MenuItem value="score">Match Score</MenuItem>
                      <MenuItem value="date">Date Created</MenuItem>
                      <MenuItem value="activity">Last Activity</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Sort Direction</InputLabel>
                    <Select
                      value={filters.sortDirection || 'desc'}
                      label="Sort Direction"
                      onChange={(e) => handleFilterChange('sortDirection', e.target.value)}
                    >
                      <MenuItem value="desc">Highest First</MenuItem>
                      <MenuItem value="asc">Lowest First</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControl fullWidth>
                    <InputLabel>Min Score</InputLabel>
                    <Select
                      value={filters.minScore || ''}
                      label="Min Score"
                      onChange={(e) => handleFilterChange('minScore', e.target.value)}
                    >
                      <MenuItem value="">Any Score</MenuItem>
                      <MenuItem value={90}>90% and above</MenuItem>
                      <MenuItem value={80}>80% and above</MenuItem>
                      <MenuItem value={70}>70% and above</MenuItem>
                      <MenuItem value={60}>60% and above</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        )}
        
        {/* Tabs for filtering by status */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange}
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Matches" />
            <Tab label="Pending" />
            <Tab label="Accepted" />
            <Tab label="Declined" />
            <Tab label="Expired" />
          </Tabs>
        </Box>
        
        {/* Matches List */}
        {loading ? (
          <Box>
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} />
          </Box>
        ) : error ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            Error loading matches: {error.message}
          </Alert>
        ) : filteredMatches.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            No matches found with the current filters.
          </Alert>
        ) : (
          <Box>
            {filteredMatches.map(renderMatchCard)}
          </Box>
        )}
      </Container>
    </Layout>
  );
};

export default MatchesPage; 