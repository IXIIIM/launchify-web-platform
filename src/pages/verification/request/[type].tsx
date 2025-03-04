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
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Paper,
  Step,
  StepLabel,
  Stepper,
  Typography,
  Alert,
  AlertTitle,
  TextField,
  useTheme,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  CloudUpload as CloudUploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Description as DescriptionIcon,
  Send as SendIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import Layout from '../../../components/layout/Layout';
import { useVerification } from '../../../hooks/useVerification';
import VerificationService, { 
  VerificationType, 
  VerificationDocument 
} from '../../../services/VerificationService';

const VerificationRequestPage: React.FC = () => {
  const { type } = useParams<{ type: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const { uploadDocument, submitVerificationRequest, documents } = useVerification();
  
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedDocuments, setUploadedDocuments] = useState<VerificationDocument[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  
  // Verify that the type parameter is valid
  const verificationType = Object.values(VerificationType).includes(type as VerificationType)
    ? type as VerificationType
    : VerificationType.IDENTITY;
  
  // Get verification requirements
  const requirements = VerificationService.getVerificationRequirements(verificationType);
  
  // Get verification type name
  const verificationTypeName = VerificationService.getVerificationTypeName(verificationType);
  
  // Steps for the verification process
  const steps = [
    'Upload Documents',
    'Review Information',
    'Submit Request'
  ];
  
  // Filter documents for this verification type
  useEffect(() => {
    const filteredDocs = documents.filter(doc => doc.verificationType === verificationType);
    setUploadedDocuments(filteredDocs);
  }, [documents, verificationType]);
  
  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    setIsUploading(true);
    setError(null);
    
    try {
      const uploadPromises = Array.from(files).map(file => 
        uploadDocument(verificationType, file)
      );
      
      await Promise.all(uploadPromises);
    } catch (err) {
      console.error('Error uploading documents:', err);
      setError('Failed to upload documents. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };
  
  // Handle document deletion
  const handleDeleteDocument = (documentId: string) => {
    // In a real app, this would call an API to delete the document
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };
  
  // Handle next step
  const handleNext = () => {
    setActiveStep(prevStep => prevStep + 1);
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle submit verification request
  const handleSubmit = async () => {
    if (uploadedDocuments.length === 0) {
      setError('Please upload at least one document before submitting.');
      return;
    }
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      await submitVerificationRequest(
        verificationType, 
        uploadedDocuments.map(doc => doc.id)
      );
      
      setIsSubmitted(true);
    } catch (err) {
      console.error('Error submitting verification request:', err);
      setError('Failed to submit verification request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Render content based on active step
  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Upload Required Documents
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Required Documents</AlertTitle>
              <List dense>
                {requirements.map((req, index) => (
                  <ListItem key={index}>
                    <ListItemIcon>
                      <InfoIcon color="info" />
                    </ListItemIcon>
                    <ListItemText primary={req} />
                  </ListItem>
                ))}
              </List>
            </Alert>
            
            <Box sx={{ mb: 3 }}>
              <input
                accept="image/*,application/pdf"
                style={{ display: 'none' }}
                id="document-upload"
                type="file"
                multiple
                onChange={handleFileUpload}
                disabled={isUploading}
              />
              <label htmlFor="document-upload">
                <Button
                  variant="contained"
                  component="span"
                  startIcon={<CloudUploadIcon />}
                  disabled={isUploading}
                  fullWidth
                  sx={{ py: 2 }}
                >
                  {isUploading ? 'Uploading...' : 'Upload Documents'}
                </Button>
              </label>
              {isUploading && (
                <LinearProgress sx={{ mt: 1 }} />
              )}
            </Box>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Typography variant="h6" gutterBottom>
              Uploaded Documents
            </Typography>
            
            {uploadedDocuments.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No documents uploaded yet.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {uploadedDocuments.map((doc) => (
                  <Grid item xs={12} key={doc.id}>
                    <Card variant="outlined">
                      <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <DescriptionIcon sx={{ mr: 2 }} />
                          <Box>
                            <Typography variant="subtitle1">
                              {doc.filename}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {doc.fileType}
                            </Typography>
                          </Box>
                        </Box>
                        <IconButton 
                          color="error" 
                          onClick={() => handleDeleteDocument(doc.id)}
                          disabled={doc.status === 'approved'}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button
                variant="contained"
                onClick={handleNext}
                disabled={uploadedDocuments.length === 0 || isUploading}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 1:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Review Information
            </Typography>
            
            <Alert severity="info" sx={{ mb: 3 }}>
              <AlertTitle>Verification Process</AlertTitle>
              <Typography variant="body2">
                Your documents will be reviewed by our team. This process typically takes 1-3 business days.
                You will be notified once the verification is complete.
              </Typography>
            </Alert>
            
            <Typography variant="subtitle1" gutterBottom>
              Verification Type
            </Typography>
            <Typography variant="body1" sx={{ mb: 2 }}>
              {verificationTypeName}
            </Typography>
            
            <Typography variant="subtitle1" gutterBottom>
              Uploaded Documents
            </Typography>
            <List>
              {uploadedDocuments.map((doc) => (
                <ListItem key={doc.id}>
                  <ListItemIcon>
                    <DescriptionIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary={doc.filename} 
                    secondary={doc.fileType} 
                  />
                </ListItem>
              ))}
            </List>
            
            <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>
              Additional Notes (Optional)
            </Typography>
            <TextField
              fullWidth
              multiline
              rows={4}
              placeholder="Add any additional information that might help with the verification process..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              sx={{ mb: 3 }}
            />
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
              >
                Back
              </Button>
              <Button
                variant="contained"
                onClick={handleNext}
              >
                Next
              </Button>
            </Box>
          </Box>
        );
      
      case 2:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>
              Submit Verification Request
            </Typography>
            
            <Alert severity="warning" sx={{ mb: 3 }}>
              <AlertTitle>Important</AlertTitle>
              <Typography variant="body2">
                By submitting this verification request, you confirm that all provided documents are authentic and accurate.
                Submitting false information may result in account suspension.
              </Typography>
            </Alert>
            
            <Typography variant="body1" sx={{ mb: 3 }}>
              You are about to submit a verification request for {verificationTypeName.toLowerCase()} with {uploadedDocuments.length} document(s).
              Our team will review your submission and update your verification status accordingly.
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ mb: 3 }}>
                {error}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
              <Button
                onClick={handleBack}
                disabled={isSubmitting}
              >
                Back
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SendIcon />}
                onClick={handleSubmit}
                disabled={isSubmitting || isSubmitted}
              >
                {isSubmitting ? 'Submitting...' : 'Submit Verification Request'}
              </Button>
            </Box>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  // Success state after submission
  if (isSubmitted) {
    return (
      <Layout title={`${verificationTypeName} Request`}>
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
          <Paper sx={{ p: 4 }}>
            <Box sx={{ textAlign: 'center', mb: 4 }}>
              <CheckCircleIcon color="success" sx={{ fontSize: 64, mb: 2 }} />
              <Typography variant="h4" gutterBottom>
                Verification Request Submitted
              </Typography>
              <Typography variant="body1">
                Your {verificationTypeName.toLowerCase()} request has been submitted successfully.
                Our team will review your documents and update your verification status.
                This process typically takes 1-3 business days.
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => navigate('/verification')}
                startIcon={<ArrowBackIcon />}
              >
                Back to Verification Status
              </Button>
              <Button
                variant="contained"
                onClick={() => navigate('/dashboard')}
              >
                Go to Dashboard
              </Button>
            </Box>
          </Paper>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout title={`${verificationTypeName} Request`}>
      <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <IconButton onClick={() => navigate('/verification')} sx={{ mr: 2 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            {verificationTypeName} Request
          </Typography>
        </Box>
        
        <Paper sx={{ p: 3, mb: 4 }}>
          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>
          
          <Divider sx={{ mb: 4 }} />
          
          {renderStepContent()}
        </Paper>
      </Container>
    </Layout>
  );
};

export default VerificationRequestPage; 