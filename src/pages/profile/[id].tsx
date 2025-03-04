import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
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
  Paper,
  Skeleton,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import {
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon,
  CheckCircle as VerifiedIcon,
  Message as MessageIcon,
  Handshake as HandshakeIcon,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
} from '@mui/icons-material';
import Layout from '../../components/layout/Layout';
import { useAuth } from '../../hooks/useAuth';

// Mock user data for development
const MOCK_USER_DATA = {
  id: '123456',
  name: 'Alex Johnson',
  email: 'alex.johnson@example.com',
  role: 'Entrepreneur',
  bio: 'Serial entrepreneur with 10+ years of experience in SaaS and fintech. Founded two successful startups with exits. Looking for investment opportunities in emerging technologies.',
  location: 'San Francisco, CA',
  industry: 'Technology',
  interests: ['AI/ML', 'Fintech', 'SaaS', 'Blockchain'],
  skills: ['Business Development', 'Product Strategy', 'Fundraising', 'Team Building'],
  experience: [
    {
      id: '1',
      title: 'CEO & Founder',
      company: 'TechVenture Inc.',
      startDate: '2018-01',
      endDate: 'Present',
      description: 'Founded a SaaS platform for small businesses. Raised $5M in Series A funding.',
    },
    {
      id: '2',
      title: 'CTO',
      company: 'FinanceAI',
      startDate: '2015-03',
      endDate: '2017-12',
      description: 'Led the technical team in developing AI-powered financial analysis tools.',
    },
  ],
  education: [
    {
      id: '1',
      degree: 'MBA',
      institution: 'Stanford University',
      year: '2014',
    },
    {
      id: '2',
      degree: 'BS Computer Science',
      institution: 'MIT',
      year: '2010',
    },
  ],
  socialLinks: {
    linkedin: 'https://linkedin.com/in/alexjohnson',
    twitter: 'https://twitter.com/alexjohnson',
    website: 'https://alexjohnson.com',
  },
  verificationLevel: 2, // 0: None, 1: Basic, 2: Advanced, 3: Premium
  matchScore: 85, // How well this user matches with the current user
  isBookmarked: false,
  joinDate: '2022-03-15',
};

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
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const PublicProfilePage: React.FC = () => {
  const router = useRouter();
  const { id } = router.query;
  const { user } = useAuth();
  const theme = useTheme();
  const [userData, setUserData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tabValue, setTabValue] = useState(0);
  const [isBookmarked, setIsBookmarked] = useState(false);

  useEffect(() => {
    // In a real app, fetch user data from API based on ID
    // For now, we'll use the mock data after a short delay to simulate loading
    const timer = setTimeout(() => {
      setUserData(MOCK_USER_DATA);
      setIsBookmarked(MOCK_USER_DATA.isBookmarked);
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [id]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleBookmarkToggle = () => {
    // In a real app, call API to toggle bookmark status
    setIsBookmarked(!isBookmarked);
  };

  const handleInitiateContact = () => {
    // In a real app, navigate to messaging or initiate contact flow
    console.log('Initiating contact with user:', id);
  };

  const handleProposeMatch = () => {
    // In a real app, initiate match proposal flow
    console.log('Proposing match with user:', id);
  };

  const getVerificationLevelText = (level: number) => {
    switch (level) {
      case 0: return 'Not Verified';
      case 1: return 'Basic Verification';
      case 2: return 'Advanced Verification';
      case 3: return 'Premium Verification';
      default: return 'Unknown';
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return theme.palette.success.main;
    if (score >= 60) return theme.palette.warning.main;
    return theme.palette.error.main;
  };

  if (loading) {
    return (
      <Layout title="User Profile">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Skeleton variant="circular" width={100} height={100} sx={{ mr: 3 }} />
                    <Box sx={{ width: '100%' }}>
                      <Skeleton variant="text" width="40%" height={60} />
                      <Skeleton variant="text" width="30%" height={30} />
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Paper>
                <Skeleton variant="rectangular" width="100%" height={400} />
              </Paper>
            </Grid>
          </Grid>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout title={`${userData.name}'s Profile`}>
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={4}>
          {/* Profile Header */}
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, alignItems: { md: 'center' }, justifyContent: 'space-between' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: { xs: 2, md: 0 } }}>
                    <Avatar
                      src="/avatar-placeholder.jpg"
                      sx={{ width: 100, height: 100, mr: 3 }}
                    />
                    <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="h4" component="h1">
                          {userData.name}
                        </Typography>
                        {userData.verificationLevel > 0 && (
                          <VerifiedIcon 
                            color="primary" 
                            sx={{ ml: 1 }} 
                            titleAccess={getVerificationLevelText(userData.verificationLevel)}
                          />
                        )}
                      </Box>
                      <Typography variant="subtitle1" color="text.secondary">
                        {userData.role} • {userData.location}
                      </Typography>
                      <Box sx={{ display: 'flex', mt: 1 }}>
                        {userData.socialLinks?.linkedin && (
                          <IconButton 
                            href={userData.socialLinks.linkedin} 
                            target="_blank" 
                            size="small"
                            aria-label="LinkedIn profile"
                          >
                            <LinkedInIcon />
                          </IconButton>
                        )}
                        {userData.socialLinks?.twitter && (
                          <IconButton 
                            href={userData.socialLinks.twitter} 
                            target="_blank" 
                            size="small"
                            aria-label="Twitter profile"
                          >
                            <TwitterIcon />
                          </IconButton>
                        )}
                        {userData.socialLinks?.website && (
                          <IconButton 
                            href={userData.socialLinks.website} 
                            target="_blank" 
                            size="small"
                            aria-label="Personal website"
                          >
                            <WebsiteIcon />
                          </IconButton>
                        )}
                      </Box>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
                    <Button
                      variant="outlined"
                      startIcon={<MessageIcon />}
                      onClick={handleInitiateContact}
                    >
                      Message
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      startIcon={<HandshakeIcon />}
                      onClick={handleProposeMatch}
                    >
                      Propose Match
                    </Button>
                    <IconButton 
                      onClick={handleBookmarkToggle}
                      color={isBookmarked ? "primary" : "default"}
                      aria-label={isBookmarked ? "Remove bookmark" : "Bookmark profile"}
                    >
                      {isBookmarked ? <StarIcon /> : <StarBorderIcon />}
                    </IconButton>
                  </Box>
                </Box>
                
                {/* Match Score */}
                {userData.matchScore && (
                  <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="subtitle2">Match Score</Typography>
                      <Typography 
                        variant="h6" 
                        sx={{ 
                          color: getMatchScoreColor(userData.matchScore),
                          fontWeight: 'bold'
                        }}
                      >
                        {userData.matchScore}%
                      </Typography>
                    </Box>
                    <Box 
                      sx={{ 
                        mt: 1, 
                        height: 8, 
                        borderRadius: 4, 
                        bgcolor: 'background.paper',
                        position: 'relative',
                        overflow: 'hidden'
                      }}
                    >
                      <Box 
                        sx={{ 
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          height: '100%',
                          width: `${userData.matchScore}%`,
                          bgcolor: getMatchScoreColor(userData.matchScore),
                          borderRadius: 4
                        }}
                      />
                    </Box>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* Profile Content */}
          <Grid item xs={12}>
            <Paper sx={{ width: '100%' }}>
              <Tabs
                value={tabValue}
                onChange={handleTabChange}
                indicatorColor="primary"
                textColor="primary"
                variant="fullWidth"
              >
                <Tab label="About" />
                <Tab label="Experience" />
                <Tab label="Education" />
              </Tabs>

              {/* About Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Bio</Typography>
                    <Typography variant="body1">{userData.bio}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Industry</Typography>
                    <Typography variant="body1">{userData.industry}</Typography>
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Location</Typography>
                    <Typography variant="body1">{userData.location}</Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Interests</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {userData.interests.map((interest: string, index: number) => (
                        <Chip key={index} label={interest} />
                      ))}
                    </Box>
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Skills</Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {userData.skills.map((skill: string, index: number) => (
                        <Chip key={index} label={skill} variant="outlined" />
                      ))}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Experience Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>Professional Experience</Typography>
                  
                  {userData.experience.map((exp: any, index: number) => (
                    <Box key={exp.id} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {exp.title} at {exp.company}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {exp.startDate} - {exp.endDate}
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 1 }}>
                        {exp.description}
                      </Typography>
                      {index < userData.experience.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </TabPanel>

              {/* Education Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>Education</Typography>
                  
                  {userData.education.map((edu: any, index: number) => (
                    <Box key={edu.id} sx={{ mb: 3 }}>
                      <Typography variant="subtitle1" fontWeight="bold">
                        {edu.degree}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {edu.institution}, {edu.year}
                      </Typography>
                      {index < userData.education.length - 1 && (
                        <Divider sx={{ mt: 2 }} />
                      )}
                    </Box>
                  ))}
                </Box>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default PublicProfilePage; 