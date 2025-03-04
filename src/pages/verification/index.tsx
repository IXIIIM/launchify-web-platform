import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  Chip,
  Container,
  Divider,
  Grid,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  Paper,
  Step,
  StepContent,
  StepLabel,
  Stepper,
  Tab,
  Tabs,
  Typography,
  useTheme,
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as PendingIcon,
  VerifiedUser as VerifiedUserIcon,
  Business as BusinessIcon,
  AccountBalance as FinancialIcon,
  Person as IdentityIcon,
  Work as ProfessionalIcon,
  Security as SecurityIcon,
  ArrowForward as ArrowForwardIcon,
  Add as AddIcon,
  Refresh as RefreshIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { formatDistanceToNow } from 'date-fns';
import Layout from '../../components/layout/Layout';
import { useVerification } from '../../hooks/useVerification';
import { 
  VerificationLevel, 
  VerificationType, 
  VerificationStatus as VerificationStatusType 
} from '../../services/VerificationService';

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
      id={`verification-tabpanel-${index}`}
      aria-labelledby={`verification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { 
    verificationStatus, 
    verificationRequests, 
    documents, 
    loading, 
    error,
    refreshVerificationStatus
  } = useVerification();
  
  const [tabValue, setTabValue] = useState(0);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Get status color
  const getStatusColor = (status: VerificationStatusType) => {
    switch (status) {
      case 'approved': return theme.palette.success.main;
      case 'pending': return theme.palette.warning.main;
      case 'rejected': return theme.palette.error.main;
      case 'expired': return theme.palette.text.disabled;
      default: return theme.palette.text.primary;
    }
  };
  
  // Get status icon
  const getStatusIcon = (status: VerificationStatusType) => {
    switch (status) {
      case 'approved': return <CheckCircleIcon color="success" />;
      case 'pending': return <PendingIcon color="warning" />;
      case 'rejected': return <ErrorIcon color="error" />;
      case 'expired': return <ErrorIcon color="disabled" />;
      default: return <PendingIcon />;
    }
  };
  
  // Get verification type icon
  const getVerificationTypeIcon = (type: VerificationType) => {
    switch (type) {
      case VerificationType.IDENTITY: return <IdentityIcon />;
      case VerificationType.BUSINESS: return <BusinessIcon />;
      case VerificationType.FINANCIAL: return <FinancialIcon />;
      case VerificationType.BACKGROUND: return <SecurityIcon />;
      case VerificationType.PROFESSIONAL: return <ProfessionalIcon />;
      default: return <VerifiedUserIcon />;
    }
  };
  
  // Calculate verification progress
  const calculateProgress = () => {
    if (!verificationStatus) return 0;
    
    const totalTypes = Object.values(VerificationType).length;
    const completedTypes = Object.values(verificationStatus.verifications).filter(
      v => v.status === 'approved'
    ).length;
    
    return (completedTypes / totalTypes) * 100;
  };
  
  // Handle refresh
  const handleRefresh = () => {
    refreshVerificationStatus();
  };
  
  // Handle new verification request
  const handleNewRequest = (type: VerificationType) => {
    navigate(`/verification/request/${type}`);
  };
  
  // Handle view request
  const handleViewRequest = (requestId: string) => {
    navigate(`/verification/request/${requestId}`);
  };
  
  // Loading state
  if (loading && !verificationStatus) {
    return (
      <Layout title="Verification Status">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Verification Status
          </Typography>
          <LinearProgress />
          <Box sx={{ mt: 4 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Paper sx={{ p: 3 }}>
                  <Typography>Loading verification status...</Typography>
                </Paper>
              </Grid>
            </Grid>
          </Box>
        </Container>
      </Layout>
    );
  }
  
  // Error state
  if (error) {
    return (
      <Layout title="Verification Status">
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom>
            Verification Status
          </Typography>
          <Paper sx={{ p: 3, bgcolor: theme.palette.error.light }}>
            <Typography color="error">
              Error loading verification status: {error.message}
            </Typography>
            <Button 
              variant="contained" 
              onClick={handleRefresh}
              startIcon={<RefreshIcon />}
              sx={{ mt: 2 }}
            >
              Retry
            </Button>
          </Paper>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout title="Verification Status">
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" component="h1">
            Verification Status
          </Typography>
          <Button 
            variant="outlined" 
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
          >
            Refresh
          </Button>
        </Box>
        
        {/* Verification Status Overview */}
        <Card sx={{ mb: 4 }}>
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={8}>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <VerifiedUserIcon 
                    sx={{ 
                      fontSize: 48, 
                      mr: 2,
                      color: verificationStatus?.currentLevel === VerificationLevel.NONE
                        ? theme.palette.text.disabled
                        : theme.palette.primary.main
                    }} 
                  />
                  <Box>
                    <Typography variant="h5">
                      {verificationStatus?.currentLevel === VerificationLevel.NONE
                        ? 'Not Verified'
                        : `Level ${verificationStatus?.currentLevel}: ${
                            verificationStatus?.currentLevel === VerificationLevel.BASIC
                              ? 'Basic Verification'
                              : verificationStatus?.currentLevel === VerificationLevel.ADVANCED
                                ? 'Advanced Verification'
                                : 'Premium Verification'
                          }`
                      }
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {verificationStatus?.currentLevel === VerificationLevel.NONE
                        ? 'Complete identity verification to unlock platform features'
                        : verificationStatus?.currentLevel === VerificationLevel.BASIC
                          ? 'Basic features unlocked. Verify your business for more'
                          : verificationStatus?.currentLevel === VerificationLevel.ADVANCED
                            ? 'Advanced features unlocked. Complete financial verification for premium access'
                            : 'All verification levels complete. You have full platform access'
                      }
                    </Typography>
                  </Box>
                </Box>
                
                <Box sx={{ mt: 3, mb: 1 }}>
                  <Typography variant="body2" color="text.secondary" gutterBottom>
                    Verification Progress
                  </Typography>
                  <LinearProgress 
                    variant="determinate" 
                    value={calculateProgress()} 
                    sx={{ height: 8, borderRadius: 4 }}
                  />
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    {Math.round(calculateProgress())}% Complete
                  </Typography>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', justifyContent: 'center' }}>
                  {verificationStatus?.nextRequirements && verificationStatus.nextRequirements.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Next Steps:
                      </Typography>
                      <List dense>
                        {verificationStatus.nextRequirements.map((type) => (
                          <ListItem key={type} disablePadding>
                            <ListItemIcon sx={{ minWidth: 36 }}>
                              {getVerificationTypeIcon(type)}
                            </ListItemIcon>
                            <ListItemText 
                              primary={`Complete ${type.charAt(0).toUpperCase() + type.slice(1)} Verification`} 
                            />
                            <ListItemSecondaryAction>
                              <IconButton 
                                edge="end" 
                                size="small"
                                onClick={() => handleNewRequest(type)}
                              >
                                <ArrowForwardIcon />
                              </IconButton>
                            </ListItemSecondaryAction>
                          </ListItem>
                        ))}
                      </List>
                      <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => handleNewRequest(verificationStatus?.nextRequirements?.[0] || VerificationType.IDENTITY)}
                        sx={{ mt: 2 }}
                        fullWidth
                      >
                        Start Next Verification
                      </Button>
                    </Box>
                  )}
                  
                  {(!verificationStatus?.nextRequirements || verificationStatus.nextRequirements.length === 0) && 
                   verificationStatus?.currentLevel === VerificationLevel.PREMIUM && (
                    <Box sx={{ textAlign: 'center', p: 2 }}>
                      <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                      <Typography variant="h6" gutterBottom>
                        All Verifications Complete
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        You have completed all required verifications and have full access to the platform.
                      </Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
        
        {/* Verification Details Tabs */}
        <Paper sx={{ mb: 4 }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={tabValue} 
              onChange={handleTabChange}
              variant="fullWidth"
            >
              <Tab label="Verification Status" />
              <Tab label="Verification History" />
              <Tab label="Documents" />
            </Tabs>
          </Box>
          
          {/* Verification Status Tab */}
          <TabPanel value={tabValue} index={0}>
            <Typography variant="h6" gutterBottom>
              Verification Types
            </Typography>
            
            <Stepper orientation="vertical" sx={{ mt: 3 }}>
              {Object.values(VerificationType).map((type) => {
                const verification = verificationStatus?.verifications[type];
                const isCompleted = verification?.status === 'approved';
                const isPending = verification?.status === 'pending';
                const isRejected = verification?.status === 'rejected';
                const isExpired = verification?.status === 'expired';
                const notStarted = !verification;
                
                return (
                  <Step key={type} active={isPending} completed={isCompleted}>
                    <StepLabel
                      StepIconComponent={() => getVerificationTypeIcon(type)}
                      error={isRejected || isExpired}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Typography variant="subtitle1">
                          {type.charAt(0).toUpperCase() + type.slice(1)} Verification
                        </Typography>
                        {verification && (
                          <Chip 
                            label={verification.status.charAt(0).toUpperCase() + verification.status.slice(1)} 
                            size="small"
                            sx={{ 
                              ml: 2,
                              bgcolor: `${getStatusColor(verification.status)}20`,
                              color: getStatusColor(verification.status)
                            }}
                          />
                        )}
                      </Box>
                    </StepLabel>
                    <StepContent>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                        {isCompleted
                          ? `Completed ${formatDistanceToNow(new Date(verification.lastUpdated), { addSuffix: true })}`
                          : isPending
                            ? `Submitted ${formatDistanceToNow(new Date(verification.lastUpdated), { addSuffix: true })}`
                            : isRejected
                              ? 'Your verification was rejected. Please submit a new request.'
                              : isExpired
                                ? 'Your verification has expired. Please submit a new request.'
                                : 'Not started yet. Submit verification documents to proceed.'
                        }
                      </Typography>
                      
                      {!isCompleted && (
                        <Button
                          variant={notStarted || isRejected || isExpired ? 'contained' : 'outlined'}
                          color={isRejected || isExpired ? 'error' : 'primary'}
                          onClick={() => handleNewRequest(type)}
                          size="small"
                        >
                          {notStarted ? 'Start Verification' : isPending ? 'View Status' : 'Resubmit'}
                        </Button>
                      )}
                    </StepContent>
                  </Step>
                );
              })}
            </Stepper>
          </TabPanel>
          
          {/* Verification History Tab */}
          <TabPanel value={tabValue} index={1}>
            <Typography variant="h6" gutterBottom>
              Verification Request History
            </Typography>
            
            {verificationRequests.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No verification requests found.
              </Typography>
            ) : (
              <List>
                {verificationRequests
                  .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
                  .map((request) => (
                    <ListItem 
                      key={request.id}
                      onClick={() => handleViewRequest(request.id)}
                      sx={{ 
                        mb: 1, 
                        border: 1, 
                        borderColor: 'divider', 
                        borderRadius: 1,
                        '&:hover': {
                          bgcolor: 'action.hover'
                        },
                        cursor: 'pointer'
                      }}
                    >
                      <ListItemIcon>
                        {getVerificationTypeIcon(request.type)}
                      </ListItemIcon>
                      <ListItemText 
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Typography variant="subtitle1">
                              {request.type.charAt(0).toUpperCase() + request.type.slice(1)} Verification
                            </Typography>
                            <Chip 
                              label={request.status.charAt(0).toUpperCase() + request.status.slice(1)} 
                              size="small"
                              sx={{ 
                                ml: 2,
                                bgcolor: `${getStatusColor(request.status)}20`,
                                color: getStatusColor(request.status)
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <>
                            <Typography variant="body2" component="span">
                              Submitted {formatDistanceToNow(new Date(request.submittedAt), { addSuffix: true })}
                            </Typography>
                            {request.status === 'rejected' && request.rejectionReason && (
                              <Typography variant="body2" color="error" sx={{ mt: 0.5 }}>
                                Reason: {request.rejectionReason}
                              </Typography>
                            )}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton edge="end" onClick={() => handleViewRequest(request.id)}>
                          <ArrowForwardIcon />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
              </List>
            )}
            
            <Button
              variant="outlined"
              startIcon={<HistoryIcon />}
              sx={{ mt: 2 }}
              fullWidth
            >
              View All History
            </Button>
          </TabPanel>
          
          {/* Documents Tab */}
          <TabPanel value={tabValue} index={2}>
            <Typography variant="h6" gutterBottom>
              Uploaded Documents
            </Typography>
            
            {documents.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No documents found.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {Object.values(VerificationType).map((type) => {
                  const typeDocuments = documents.filter(doc => doc.verificationType === type);
                  
                  if (typeDocuments.length === 0) return null;
                  
                  return (
                    <Grid item xs={12} key={type}>
                      <Typography variant="subtitle1" gutterBottom>
                        {type.charAt(0).toUpperCase() + type.slice(1)} Documents
                      </Typography>
                      <Divider sx={{ mb: 2 }} />
                      
                      <Grid container spacing={2}>
                        {typeDocuments.map((doc) => (
                          <Grid item xs={12} sm={6} md={4} key={doc.id}>
                            <Card variant="outlined">
                              <CardHeader
                                title={doc.filename}
                                subheader={`Uploaded ${formatDistanceToNow(new Date(doc.uploadedAt), { addSuffix: true })}`}
                                action={
                                  <Chip 
                                    label={doc.status.charAt(0).toUpperCase() + doc.status.slice(1)} 
                                    size="small"
                                    sx={{ 
                                      bgcolor: `${getStatusColor(doc.status as VerificationStatusType)}20`,
                                      color: getStatusColor(doc.status as VerificationStatusType)
                                    }}
                                  />
                                }
                              />
                              <CardContent>
                                <Typography variant="body2" color="text.secondary">
                                  {doc.fileType}
                                </Typography>
                                {doc.notes && (
                                  <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                    {doc.notes}
                                  </Typography>
                                )}
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>
                    </Grid>
                  );
                })}
              </Grid>
            )}
            
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{ mt: 3 }}
              onClick={() => navigate('/verification/upload')}
            >
              Upload New Document
            </Button>
          </TabPanel>
        </Paper>
        
        {/* Verification Benefits */}
        <Card>
          <CardHeader title="Verification Benefits" />
          <Divider />
          <CardContent>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <VerifiedUserIcon 
                    sx={{ 
                      fontSize: 48, 
                      mb: 1,
                      color: theme.palette.primary.main
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    Basic Verification
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Access to basic matching" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Create a public profile" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Message verified users" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <BusinessIcon 
                    sx={{ 
                      fontSize: 48, 
                      mb: 1,
                      color: theme.palette.secondary.main
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    Advanced Verification
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Enhanced matching algorithm" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Access to document generation" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Increased trust score" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <FinancialIcon 
                    sx={{ 
                      fontSize: 48, 
                      mb: 1,
                      color: theme.palette.success.main
                    }} 
                  />
                  <Typography variant="h6" gutterBottom>
                    Premium Verification
                  </Typography>
                  <List dense>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Access to escrow services" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Premium matching features" />
                    </ListItem>
                    <ListItem>
                      <ListItemIcon>
                        <CheckCircleIcon color="success" fontSize="small" />
                      </ListItemIcon>
                      <ListItemText primary="Highest trust rating" />
                    </ListItem>
                  </List>
                </Box>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Container>
    </Layout>
  );
};

export default VerificationPage; 