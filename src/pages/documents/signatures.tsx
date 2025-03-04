import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
  Divider,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Send as SendIcon,
  Cancel as CancelIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
  History as HistoryIcon,
} from '@mui/icons-material';
import { useSignatures } from '../../hooks/useSignatures';
import { SignatureRequest } from '../../services/SignatureService';

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

const SignatureRequests: React.FC = () => {
  const navigate = useNavigate();
  const { 
    signatureRequests, 
    signatureRequestsLoading, 
    signatureRequestsError, 
    signatureRequestsTotal,
    getSignatureRequests,
    cancelSignatureRequest,
    sendSignatureReminder,
    downloadSignedDocument,
  } = useSignatures({ apiUrl: '/api' });

  const [tabValue, setTabValue] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedSignatories, setSelectedSignatories] = useState<string[]>([]);

  // Load signature requests on component mount and tab change
  useEffect(() => {
    const status = tabValue === 0 ? undefined : tabValue === 1 ? 'pending' : tabValue === 2 ? 'completed' : 'expired';
    getSignatureRequests(status, page + 1, rowsPerPage);
  }, [getSignatureRequests, tabValue, page, rowsPerPage]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    setPage(0);
  };

  // Handle page change
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  // Handle rows per page change
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  // View document details
  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
  };

  // Cancel signature request
  const handleOpenCancelDialog = (requestId: string) => {
    setSelectedRequestId(requestId);
    setCancelDialogOpen(true);
  };

  const handleCloseCancelDialog = () => {
    setCancelDialogOpen(false);
    setSelectedRequestId(null);
    setCancelReason('');
  };

  const handleCancelRequest = async () => {
    if (selectedRequestId) {
      try {
        await cancelSignatureRequest(selectedRequestId, cancelReason);
        handleCloseCancelDialog();
        // Refresh the list
        const status = tabValue === 0 ? undefined : tabValue === 1 ? 'pending' : tabValue === 2 ? 'completed' : 'expired';
        getSignatureRequests(status, page + 1, rowsPerPage);
      } catch (error) {
        console.error('Error canceling signature request:', error);
      }
    }
  };

  // Send reminder
  const handleOpenReminderDialog = (requestId: string, signatories: any[]) => {
    setSelectedRequestId(requestId);
    setSelectedSignatories(signatories.filter(sig => sig.status === 'PENDING').map(sig => sig.userId));
    setReminderDialogOpen(true);
  };

  const handleCloseReminderDialog = () => {
    setReminderDialogOpen(false);
    setSelectedRequestId(null);
    setSelectedSignatories([]);
  };

  const handleSendReminder = async () => {
    if (selectedRequestId) {
      try {
        await sendSignatureReminder(
          selectedRequestId, 
          selectedSignatories.length > 0 ? selectedSignatories : undefined
        );
        handleCloseReminderDialog();
        // Refresh the list
        const status = tabValue === 0 ? undefined : tabValue === 1 ? 'pending' : tabValue === 2 ? 'completed' : 'expired';
        getSignatureRequests(status, page + 1, rowsPerPage);
      } catch (error) {
        console.error('Error sending reminder:', error);
      }
    }
  };

  // Download signed document
  const handleDownloadDocument = async (documentId: string) => {
    try {
      await downloadSignedDocument(documentId);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
  };

  // View audit trail
  const handleViewAuditTrail = (documentId: string) => {
    navigate(`/documents/${documentId}/audit`);
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  // Get status chip color
  const getStatusColor = (request: SignatureRequest) => {
    if (request.completed) {
      return 'success';
    }
    
    const expiryDate = new Date(request.expiresAt);
    if (expiryDate < new Date()) {
      return 'error';
    }
    
    const pendingSignatories = request.signatories.filter(sig => sig.status === 'PENDING').length;
    if (pendingSignatories === 0) {
      return 'success';
    }
    
    return 'warning';
  };

  // Get status text
  const getStatusText = (request: SignatureRequest) => {
    if (request.completed) {
      return 'Completed';
    }
    
    const expiryDate = new Date(request.expiresAt);
    if (expiryDate < new Date()) {
      return 'Expired';
    }
    
    const pendingSignatories = request.signatories.filter(sig => sig.status === 'PENDING').length;
    if (pendingSignatories === 0) {
      return 'Completed';
    }
    
    return `Awaiting ${pendingSignatories} signature${pendingSignatories > 1 ? 's' : ''}`;
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          Signature Requests
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="signature request tabs">
          <Tab label="All Requests" {...a11yProps(0)} />
          <Tab label="Pending" {...a11yProps(1)} />
          <Tab label="Completed" {...a11yProps(2)} />
          <Tab label="Expired" {...a11yProps(3)} />
        </Tabs>
        
        {signatureRequestsError && (
          <Alert severity="error" sx={{ mt: 2 }}>
            Error loading signature requests: {signatureRequestsError.message}
          </Alert>
        )}
        
        <TabPanel value={tabValue} index={0}>
          {renderRequestsTable()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          {renderRequestsTable()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          {renderRequestsTable()}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          {renderRequestsTable()}
        </TabPanel>
      </Paper>
      
      {/* Cancel Dialog */}
      <Dialog open={cancelDialogOpen} onClose={handleCloseCancelDialog}>
        <DialogTitle>Cancel Signature Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Are you sure you want to cancel this signature request? This action cannot be undone.
          </Typography>
          <TextField
            fullWidth
            label="Reason for Cancellation"
            variant="outlined"
            multiline
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelDialog}>No, Keep Request</Button>
          <Button onClick={handleCancelRequest} variant="contained" color="error">
            Yes, Cancel Request
          </Button>
        </DialogActions>
      </Dialog>
      
      {/* Reminder Dialog */}
      <Dialog open={reminderDialogOpen} onClose={handleCloseReminderDialog}>
        <DialogTitle>Send Reminder</DialogTitle>
        <DialogContent>
          <Typography variant="body2" gutterBottom>
            Send a reminder to signatories who haven't signed the document yet.
          </Typography>
          {selectedRequestId && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2" gutterBottom>
                Pending Signatories:
              </Typography>
              {signatureRequests
                .find(req => req.id === selectedRequestId)
                ?.signatories
                .filter(sig => sig.status === 'PENDING')
                .map(sig => (
                  <Chip
                    key={sig.userId}
                    label={`${sig.name} (${sig.email})`}
                    sx={{ m: 0.5 }}
                  />
                ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseReminderDialog}>Cancel</Button>
          <Button onClick={handleSendReminder} variant="contained" color="primary">
            Send Reminder
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );

  function renderRequestsTable() {
    if (signatureRequestsLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      );
    }

    if (signatureRequests.length === 0) {
      return (
        <Alert severity="info" sx={{ mt: 2 }}>
          No signature requests found.
        </Alert>
      );
    }

    return (
      <>
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead>
              <TableRow>
                <TableCell>Document</TableCell>
                <TableCell>Sent Date</TableCell>
                <TableCell>Expires</TableCell>
                <TableCell>Signatories</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signatureRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>
                    <Typography variant="body2" fontWeight="medium">
                      {request.documentId}
                    </Typography>
                    {request.message && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {request.message.length > 50
                          ? `${request.message.substring(0, 50)}...`
                          : request.message}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(request.requestedAt)}</TableCell>
                  <TableCell>{formatDate(request.expiresAt)}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {request.signatories.map((sig, index) => (
                        <Tooltip
                          key={index}
                          title={`${sig.name} (${sig.email}) - ${sig.status}`}
                        >
                          <Chip
                            size="small"
                            label={sig.name.split(' ').map(n => n[0]).join('')}
                            color={
                              sig.status === 'SIGNED'
                                ? 'success'
                                : sig.status === 'REJECTED'
                                ? 'error'
                                : 'default'
                            }
                            sx={{ minWidth: 32 }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getStatusText(request)}
                      color={getStatusColor(request) as 'success' | 'warning' | 'error' | 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="View Document">
                      <IconButton
                        size="small"
                        onClick={() => handleViewDocument(request.documentId)}
                      >
                        <VisibilityIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    
                    {!request.completed && new Date(request.expiresAt) > new Date() && (
                      <Tooltip title="Send Reminder">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenReminderDialog(request.id, request.signatories)}
                        >
                          <SendIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {!request.completed && new Date(request.expiresAt) > new Date() && (
                      <Tooltip title="Cancel Request">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenCancelDialog(request.id)}
                        >
                          <CancelIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    {request.completed && (
                      <Tooltip title="Download Signed Document">
                        <IconButton
                          size="small"
                          onClick={() => handleDownloadDocument(request.documentId)}
                        >
                          <DownloadIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                    
                    <Tooltip title="View Audit Trail">
                      <IconButton
                        size="small"
                        onClick={() => handleViewAuditTrail(request.documentId)}
                      >
                        <HistoryIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={signatureRequestsTotal}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </>
    );
  }
};

export default SignatureRequests; 