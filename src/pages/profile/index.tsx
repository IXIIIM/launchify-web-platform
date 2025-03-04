import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Container,
  Divider,
  Grid,
  TextField,
  Typography,
  Avatar,
  Chip,
  LinearProgress,
  Tab,
  Tabs,
  IconButton,
  useTheme,
  Paper,
} from '@mui/material';
import {
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  CloudUpload as CloudUploadIcon,
  LinkedIn as LinkedInIcon,
  Twitter as TwitterIcon,
  Language as WebsiteIcon,
  CheckCircle as VerifiedIcon,
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
  profileCompletion: 85, // Percentage of profile completed
  joinDate: '2022-03-15',
};

// Profile completion calculation
const calculateProfileCompletion = (userData: any) => {
  const requiredFields = [
    'name',
    'email',
    'role',
    'bio',
    'location',
    'industry',
    'interests',
    'skills',
    'experience',
    'education',
  ];
  
  const optionalFields = ['socialLinks'];
  
  let completedRequired = 0;
  requiredFields.forEach(field => {
    if (userData[field] && 
        (typeof userData[field] !== 'object' || 
         (Array.isArray(userData[field]) && userData[field].length > 0) ||
         (Object.keys(userData[field]).length > 0))) {
      completedRequired++;
    }
  });
  
  let completedOptional = 0;
  optionalFields.forEach(field => {
    if (userData[field] && Object.keys(userData[field]).length > 0) {
      completedOptional++;
    }
  });
  
  // Required fields are 80% of the score, optional are 20%
  const requiredScore = (completedRequired / requiredFields.length) * 80;
  const optionalScore = (completedOptional / optionalFields.length) * 20;
  
  return Math.round(requiredScore + optionalScore);
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

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const [userData, setUserData] = useState(MOCK_USER_DATA);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState(MOCK_USER_DATA);
  const [tabValue, setTabValue] = useState(0);
  const [profileCompletion, setProfileCompletion] = useState(MOCK_USER_DATA.profileCompletion);

  useEffect(() => {
    // In a real app, fetch user data from API
    // For now, we'll use the mock data
    setUserData(MOCK_USER_DATA);
    setProfileCompletion(calculateProfileCompletion(MOCK_USER_DATA));
  }, []);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleEditToggle = () => {
    if (isEditing) {
      // Cancel editing
      setEditData(userData);
    } else {
      // Start editing
      setEditData({ ...userData });
    }
    setIsEditing(!isEditing);
  };

  const handleSaveProfile = () => {
    // In a real app, save to API
    setUserData(editData);
    setProfileCompletion(calculateProfileCompletion(editData));
    setIsEditing(false);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleArrayInputChange = (field: string, value: string) => {
    const values = value.split(',').map(item => item.trim());
    setEditData(prev => ({
      ...prev,
      [field]: values,
    }));
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

  return (
    <Layout title="Profile">
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
                  <Box>
                    <Button
                      variant={isEditing ? "outlined" : "contained"}
                      startIcon={isEditing ? <CancelIcon /> : <EditIcon />}
                      onClick={handleEditToggle}
                      sx={{ mr: 1 }}
                    >
                      {isEditing ? 'Cancel' : 'Edit Profile'}
                    </Button>
                    {isEditing && (
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<SaveIcon />}
                        onClick={handleSaveProfile}
                      >
                        Save
                      </Button>
                    )}
                  </Box>
                </Box>
                
                {/* Profile Completion */}
                <Box sx={{ mt: 3 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Profile Completion</Typography>
                    <Typography variant="body2" fontWeight="bold">{profileCompletion}%</Typography>
                  </Box>
                  <LinearProgress 
                    variant="determinate" 
                    value={profileCompletion} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                </Box>
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
                <Tab label="Settings" />
              </Tabs>

              {/* About Tab */}
              <TabPanel value={tabValue} index={0}>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Bio</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        multiline
                        rows={4}
                        name="bio"
                        value={editData.bio}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <Typography variant="body1">{userData.bio}</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Industry</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="industry"
                        value={editData.industry}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <Typography variant="body1">{userData.industry}</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Location</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="location"
                        value={editData.location}
                        onChange={handleInputChange}
                      />
                    ) : (
                      <Typography variant="body1">{userData.location}</Typography>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Interests</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="interests"
                        value={editData.interests.join(', ')}
                        onChange={(e) => handleArrayInputChange('interests', e.target.value)}
                        helperText="Separate with commas"
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {userData.interests.map((interest, index) => (
                          <Chip key={index} label={interest} />
                        ))}
                      </Box>
                    )}
                  </Grid>

                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Skills</Typography>
                    {isEditing ? (
                      <TextField
                        fullWidth
                        name="skills"
                        value={editData.skills.join(', ')}
                        onChange={(e) => handleArrayInputChange('skills', e.target.value)}
                        helperText="Separate with commas"
                      />
                    ) : (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {userData.skills.map((skill, index) => (
                          <Chip key={index} label={skill} variant="outlined" />
                        ))}
                      </Box>
                    )}
                  </Grid>
                </Grid>
              </TabPanel>

              {/* Experience Tab */}
              <TabPanel value={tabValue} index={1}>
                <Box>
                  <Typography variant="h6" gutterBottom>Professional Experience</Typography>
                  
                  {userData.experience.map((exp, index) => (
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
                  
                  {isEditing && (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      sx={{ mt: 2 }}
                    >
                      Add Experience
                    </Button>
                  )}
                </Box>
              </TabPanel>

              {/* Education Tab */}
              <TabPanel value={tabValue} index={2}>
                <Box>
                  <Typography variant="h6" gutterBottom>Education</Typography>
                  
                  {userData.education.map((edu, index) => (
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
                  
                  {isEditing && (
                    <Button
                      variant="outlined"
                      startIcon={<EditIcon />}
                      sx={{ mt: 2 }}
                    >
                      Add Education
                    </Button>
                  )}
                </Box>
              </TabPanel>

              {/* Settings Tab */}
              <TabPanel value={tabValue} index={3}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Account Information</Typography>
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="email"
                          value={editData.email}
                          onChange={handleInputChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1">{userData.email}</Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="role"
                          value={editData.role}
                          onChange={handleInputChange}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1">{userData.role}</Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Member Since</Typography>
                      <Typography variant="body1">
                        {new Date(userData.joinDate).toLocaleDateString()}
                      </Typography>
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12} md={6}>
                    <Typography variant="h6" gutterBottom>Social Links</Typography>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">LinkedIn</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="linkedin"
                          value={editData.socialLinks?.linkedin || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            socialLinks: {
                              ...editData.socialLinks,
                              linkedin: e.target.value
                            }
                          })}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1">
                          {userData.socialLinks?.linkedin || 'Not provided'}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2" color="text.secondary">Twitter</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="twitter"
                          value={editData.socialLinks?.twitter || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            socialLinks: {
                              ...editData.socialLinks,
                              twitter: e.target.value
                            }
                          })}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1">
                          {userData.socialLinks?.twitter || 'Not provided'}
                        </Typography>
                      )}
                    </Box>
                    
                    <Box>
                      <Typography variant="subtitle2" color="text.secondary">Website</Typography>
                      {isEditing ? (
                        <TextField
                          fullWidth
                          name="website"
                          value={editData.socialLinks?.website || ''}
                          onChange={(e) => setEditData({
                            ...editData,
                            socialLinks: {
                              ...editData.socialLinks,
                              website: e.target.value
                            }
                          })}
                          sx={{ mt: 1 }}
                        />
                      ) : (
                        <Typography variant="body1">
                          {userData.socialLinks?.website || 'Not provided'}
                        </Typography>
                      )}
                    </Box>
                  </Grid>
                  
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>Verification Status</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Chip 
                        icon={<VerifiedIcon />} 
                        label={getVerificationLevelText(userData.verificationLevel)} 
                        color={userData.verificationLevel > 0 ? "primary" : "default"}
                      />
                      {userData.verificationLevel < 3 && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          sx={{ ml: 2 }}
                        >
                          Upgrade Verification
                        </Button>
                      )}
                    </Box>
                  </Grid>
                </Grid>
              </TabPanel>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Layout>
  );
};

export default ProfilePage; 