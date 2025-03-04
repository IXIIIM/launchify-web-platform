import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Divider,
  Alert,
  Snackbar,
  Grid,
  IconButton,
} from '@mui/material';
import {
  Draw as DrawIcon,
  TextFields as TextFieldsIcon,
  Upload as UploadIcon,
  Clear as ClearIcon,
  Check as CheckIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { SignatureData, SignatureVerification } from '../../services/SignatureService';
import { Document, Signatory } from '../../services/DocumentService';

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
      id={`signature-tabpanel-${index}`}
      aria-labelledby={`signature-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const a11yProps = (index: number) => {
  return {
    id: `signature-tab-${index}`,
    'aria-controls': `signature-tabpanel-${index}`,
  };
};

interface SignaturePanelProps {
  document: Document;
  currentUser: {
    id: string;
    name: string;
    email: string;
  };
  requestId: string;
  onSign: (
    requestId: string,
    signatureData: SignatureData,
    verification?: SignatureVerification
  ) => Promise<Document>;
  onDecline: (requestId: string, reason: string) => Promise<void>;
  onVerify: (
    requestId: string,
    method: 'email' | 'sms',
    contact?: string
  ) => Promise<void>;
  onValidateCode: (
    requestId: string,
    code: string
  ) => Promise<{ valid: boolean; message?: string }>;
  loading: boolean;
}

const SignaturePanel: React.FC<SignaturePanelProps> = ({
  document,
  currentUser,
  requestId,
  onSign,
  onDecline,
  onVerify,
  onValidateCode,
  loading,
}) => {
  const [tabValue, setTabValue] = useState(0);
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [typedSignature, setTypedSignature] = useState('');
  const [uploadedSignature, setUploadedSignature] = useState<string | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [declineDialogOpen, setDeclineDialogOpen] = useState(false);
  const [verificationDialogOpen, setVerificationDialogOpen] = useState(false);
  const [verificationMethod, setVerificationMethod] = useState<'email' | 'sms'>('email');
  const [verificationContact, setVerificationContact] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [verificationSent, setVerificationSent] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'info'>('info');
  
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [canvasContext, setCanvasContext] = useState<CanvasRenderingContext2D | null>(null);
  
  // Initialize canvas
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';
        ctx.strokeStyle = '#000000';
        setCanvasContext(ctx);
      }
    }
  }, [canvasRef]);
  
  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  // Drawing functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    setIsDrawing(true);
    if (canvasContext) {
      canvasContext.beginPath();
      const canvas = canvasRef.current;
      if (canvas) {
        const rect = canvas.getBoundingClientRect();
        const x = e instanceof MouseEvent 
          ? e.clientX - rect.left 
          : e.touches[0].clientX - rect.left;
        const y = e instanceof MouseEvent 
          ? e.clientY - rect.top 
          : e.touches[0].clientY - rect.top;
        canvasContext.moveTo(x, y);
      }
    }
  };
  
  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasContext) return;
    
    const canvas = canvasRef.current;
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      const x = e instanceof MouseEvent 
        ? e.clientX - rect.left 
        : e.touches[0].clientX - rect.left;
      const y = e instanceof MouseEvent 
        ? e.clientY - rect.top 
        : e.touches[0].clientY - rect.top;
      
      canvasContext.lineTo(x, y);
      canvasContext.stroke();
    }
  };
  
  const stopDrawing = () => {
    if (isDrawing && canvasContext) {
      canvasContext.closePath();
      setIsDrawing(false);
      
      // Save the signature
      const canvas = canvasRef.current;
      if (canvas) {
        const dataUrl = canvas.toDataURL('image/png');
        setDrawnSignature(dataUrl);
      }
    }
  };
  
  const clearCanvas = () => {
    if (canvasContext && canvasRef.current) {
      canvasContext.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      setDrawnSignature(null);
    }
  };
  
  // File upload handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setUploadedSignature(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Signature submission
  const handleSignDocument = async () => {
    let signatureContent = '';
    let signatureType: 'drawn' | 'typed' | 'uploaded' = 'drawn';
    
    switch (tabValue) {
      case 0: // Drawn
        if (!drawnSignature) {
          setSnackbarMessage('Please draw your signature');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        signatureContent = drawnSignature;
        signatureType = 'drawn';
        break;
      case 1: // Typed
        if (!typedSignature.trim()) {
          setSnackbarMessage('Please type your signature');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        signatureContent = typedSignature;
        signatureType = 'typed';
        break;
      case 2: // Uploaded
        if (!uploadedSignature) {
          setSnackbarMessage('Please upload your signature');
          setSnackbarSeverity('error');
          setSnackbarOpen(true);
          return;
        }
        signatureContent = uploadedSignature;
        signatureType = 'uploaded';
        break;
    }
    
    // Open verification dialog
    setVerificationDialogOpen(true);
  };
  
  // Verification handlers
  const handleSendVerificationCode = async () => {
    try {
      await onVerify(requestId, verificationMethod, verificationContact);
      setVerificationSent(true);
      setVerificationError(null);
      setSnackbarMessage(`Verification code sent via ${verificationMethod}`);
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setVerificationError(`Failed to send verification code: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarMessage('Failed to send verification code');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  const handleVerifyCode = async () => {
    try {
      const result = await onValidateCode(requestId, verificationCode);
      
      if (result.valid) {
        // Proceed with signing
        let signatureContent = '';
        let signatureType: 'drawn' | 'typed' | 'uploaded' = 'drawn';
        
        switch (tabValue) {
          case 0: // Drawn
            signatureContent = drawnSignature || '';
            signatureType = 'drawn';
            break;
          case 1: // Typed
            signatureContent = typedSignature;
            signatureType = 'typed';
            break;
          case 2: // Uploaded
            signatureContent = uploadedSignature || '';
            signatureType = 'uploaded';
            break;
        }
        
        const signatureData: SignatureData = {
          signatureType,
          signatureContent,
          signaturePosition: {
            pageNumber: 1, // This would be determined by the document viewer
            x: 100,
            y: 100,
            width: 200,
            height: 50,
          },
          signedAt: new Date().toISOString(),
        };
        
        const verification: SignatureVerification = {
          verificationMethod,
          verificationCode,
          verificationStatus: 'verified',
          verificationTime: new Date().toISOString(),
          verificationAttempts: 1,
        };
        
        await onSign(requestId, signatureData, verification);
        setVerificationDialogOpen(false);
        setSnackbarMessage('Document signed successfully');
        setSnackbarSeverity('success');
        setSnackbarOpen(true);
      } else {
        setVerificationError('Invalid verification code. Please try again.');
        setSnackbarMessage('Invalid verification code');
        setSnackbarSeverity('error');
        setSnackbarOpen(true);
      }
    } catch (error) {
      setVerificationError(`Verification failed: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarMessage('Verification failed');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Decline handlers
  const handleOpenDeclineDialog = () => {
    setDeclineDialogOpen(true);
  };
  
  const handleCloseDeclineDialog = () => {
    setDeclineDialogOpen(false);
  };
  
  const handleDeclineSubmit = async () => {
    if (!declineReason.trim()) {
      setSnackbarMessage('Please provide a reason for declining');
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
      return;
    }
    
    try {
      await onDecline(requestId, declineReason);
      setDeclineDialogOpen(false);
      setSnackbarMessage('Document declined successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      setSnackbarMessage(`Failed to decline document: ${error instanceof Error ? error.message : String(error)}`);
      setSnackbarSeverity('error');
      setSnackbarOpen(true);
    }
  };
  
  // Snackbar close handler
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };
  
  // Check if the current user is a signatory
  const currentUserSignatory = document.signatories.find(sig => sig.userId === currentUser.id);
  const canSign = currentUserSignatory && currentUserSignatory.status === 'PENDING';
  
  if (!canSign) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Signature Status
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {currentUserSignatory ? (
          <Alert severity={currentUserSignatory.status === 'SIGNED' ? 'success' : 'info'}>
            {currentUserSignatory.status === 'SIGNED'
              ? `You signed this document on ${new Date(currentUserSignatory.signedAt || '').toLocaleDateString()}`
              : 'You have declined to sign this document'}
          </Alert>
        ) : (
          <Alert severity="info">
            You are not a signatory for this document
          </Alert>
        )}
      </Paper>
    );
  }
  
  return (
    <>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sign Document
        </Typography>
        <Divider sx={{ mb: 2 }} />
        
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="signature tabs">
          <Tab icon={<DrawIcon />} label="Draw" {...a11yProps(0)} />
          <Tab icon={<TextFieldsIcon />} label="Type" {...a11yProps(1)} />
          <Tab icon={<UploadIcon />} label="Upload" {...a11yProps(2)} />
        </Tabs>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Draw your signature below
            </Typography>
            <Box
              sx={{
                border: '1px solid #ccc',
                borderRadius: 1,
                backgroundColor: '#f9f9f9',
                mb: 2,
                width: '100%',
                height: 150,
                overflow: 'hidden',
              }}
            >
              <canvas
                ref={canvasRef}
                width={500}
                height={150}
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
                style={{ width: '100%', height: '100%', touchAction: 'none' }}
              />
            </Box>
            <Button
              variant="outlined"
              startIcon={<ClearIcon />}
              onClick={clearCanvas}
              sx={{ mr: 1 }}
            >
              Clear
            </Button>
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Type your signature below
            </Typography>
            <TextField
              fullWidth
              label="Your Signature"
              variant="outlined"
              value={typedSignature}
              onChange={(e) => setTypedSignature(e.target.value)}
              sx={{ mb: 2 }}
              placeholder="Type your full name"
            />
          </Box>
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Upload your signature image
            </Typography>
            <Box sx={{ mb: 2 }}>
              <input
                accept="image/*"
                style={{ display: 'none' }}
                id="signature-upload"
                type="file"
                onChange={handleFileUpload}
              />
              <label htmlFor="signature-upload">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                  Upload Signature
                </Button>
              </label>
            </Box>
            {uploadedSignature && (
              <Box
                sx={{
                  border: '1px solid #ccc',
                  borderRadius: 1,
                  p: 2,
                  mb: 2,
                  maxWidth: '100%',
                  maxHeight: 150,
                  overflow: 'hidden',
                }}
              >
                <img
                  src={uploadedSignature}
                  alt="Uploaded signature"
                  style={{ maxWidth: '100%', maxHeight: '100%' }}
                />
              </Box>
            )}
          </Box>
        </TabPanel>
        
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between' }}>
          <Button
            variant="outlined"
            color="error"
            onClick={handleOpenDeclineDialog}
            disabled={loading}
          >
            Decline to Sign
          </Button>
          <Button
            variant="contained"
            color="primary"
            onClick={handleSignDocument}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : <CheckIcon />}
          >
            Sign Document
          </Button>
        </Box>
      </Paper>
      
      {/* Verification Dialog */}
      <Dialog open={verificationDialogOpen} onClose={() => setVerificationDialogOpen(false)}>
        <DialogTitle>Verify Your Identity</DialogTitle>
        <DialogContent>
          {!verificationSent ? (
            <>
              <Typography variant="body2" gutterBottom>
                Please select a verification method to confirm your identity before signing.
              </Typography>
              <Tabs
                value={verificationMethod === 'email' ? 0 : 1}
                onChange={(e, value) => setVerificationMethod(value === 0 ? 'email' : 'sms')}
                sx={{ mb: 2 }}
              >
                <Tab label="Email" />
                <Tab label="SMS" />
              </Tabs>
              {verificationMethod === 'email' ? (
                <TextField
                  fullWidth
                  label="Email Address"
                  variant="outlined"
                  value={verificationContact || currentUser.email}
                  onChange={(e) => setVerificationContact(e.target.value)}
                  sx={{ mb: 2 }}
                />
              ) : (
                <TextField
                  fullWidth
                  label="Phone Number"
                  variant="outlined"
                  value={verificationContact}
                  onChange={(e) => setVerificationContact(e.target.value)}
                  sx={{ mb: 2 }}
                  placeholder="Enter your phone number"
                />
              )}
            </>
          ) : (
            <>
              <Typography variant="body2" gutterBottom>
                Please enter the verification code sent to your {verificationMethod === 'email' ? 'email' : 'phone'}.
              </Typography>
              <TextField
                fullWidth
                label="Verification Code"
                variant="outlined"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                sx={{ mb: 2 }}
              />
            </>
          )}
          {verificationError && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {verificationError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVerificationDialogOpen(false)}>Cancel</Button>
          {!verificationSent ? (
            <Button
              onClick={handleSendVerificationCode}
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Send Code'}
            </Button>
          ) : (
            <Button
              onClick={handleVerifyCode}
              variant="contained"
              disabled={loading || !verificationCode}
            >
              {loading ? <CircularProgress size={24} /> : 'Verify & Sign'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      {/* Decline Dialog */}
      <Dialog open={declineDialogOpen} onClose={handleCloseDeclineDialog}>
        <DialogTitle>Decline to Sign</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Please provide a reason for declining to sign this document.
          </Typography>
          <TextField
            fullWidth
            label="Reason"
            variant="outlined"
            multiline
            rows={4}
            value={declineReason}
            onChange={(e) => setDeclineReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeclineDialog}>Cancel</Button>
          <Button
            onClick={handleDeclineSubmit}
            variant="contained"
            color="error"
            disabled={loading || !declineReason.trim()}
          >
            {loading ? <CircularProgress size={24} /> : 'Decline'}
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default SignaturePanel; 