import React, { useEffect, useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  MenuItem,
  Button,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  Grid,
  CircularProgress,
  Alert,
  Tooltip,
  Divider,
  Card,
  CardContent,
  CardHeader,
  Tabs,
  Tab,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Avatar
} from '@mui/material';
import {
  VerifiedUser as VerifiedUserIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  AttachFile as AttachFileIcon,
  Description as DescriptionIcon,
  Image as ImageIcon,
  Download as DownloadIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { VerificationLevel } from '../../services/VerificationService';

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
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

const VerificationRequests: React.FC = () => {
  const {
    verificationRequests,
    verificationLoading,
    verificationError,
    getVerificationRequests,
    updateVerificationRequest,
    verificationFilters,
    setVerificationFilters,
    verificationPagination,
    setVerificationPagination
  } = useAdmin();

  const navigate = useNavigate();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Request detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [requestStatus, setRequestStatus] = useState('');
  const [documentPreviewUrl, setDocumentPreviewUrl] = useState<string | null>(null);

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | null>(null);
  const [confirmRequestId, setConfirmRequestId] = useState<string | null>(null);

  // Filter expansion state
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load verification requests on component mount
  useEffect(() => {
    getVerificationRequests();
  }, [getVerificationRequests, verificationFilters, verificationPagination]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    
    // Update filters based on tab
    let status;
    switch (newValue) {
      case 0: // All
        status = undefined;
        break;
      case 1: // Pending
        status = 'pending';
        break;
      case 2: // Approved
        status = 'approved';
        break;
      case 3: // Rejected
        status = 'rejected';
        break;
      default:
        status = undefined;
    }
    
    setVerificationFilters({
      ...verificationFilters,
      status
    });
  };

  // Handle pagination change
  const handlePageChange = (event: unknown, newPage: number) => {
    setVerificationPagination({
      ...verificationPagination,
      page: newPage
    });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationPagination({
      ...verificationPagination,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setVerificationFilters({
      ...verificationFilters,
      searchTerm: event.target.value
    });
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setVerificationFilters({
      ...verificationFilters,
      [field]: value
    });
    setVerificationPagination({
      ...verificationPagination,
      page: 0
    });
  };

  // Handle detail dialog open
  const handleViewRequest = (request: any) => {
    setSelectedRequest(request);
    setAdminNotes(request.adminNotes || '');
    setRequestStatus(request.status);
    setDetailDialogOpen(true);
  };

  // Handle detail dialog close
  const handleDetailDialogClose = () => {
    setDetailDialogOpen(false);
    setSelectedRequest(null);
    setAdminNotes('');
    setRequestStatus('');
    setDocumentPreviewUrl(null);
  };

  // Handle document preview
  const handlePreviewDocument = (documentUrl: string) => {
    setDocumentPreviewUrl(documentUrl);
  };

  // Handle close document preview
  const handleClosePreview = () => {
    setDocumentPreviewUrl(null);
  };

  // Handle request update
  const handleUpdateRequest = async () => {
    if (selectedRequest) {
      const updates: any = {};
      
      if (adminNotes !== selectedRequest.adminNotes) {
        updates.adminNotes = adminNotes;
      }
      
      if (requestStatus !== selectedRequest.status) {
        updates.status = requestStatus;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateVerificationRequest(selectedRequest.id, updates);
      }
      
      handleDetailDialogClose();
    }
  };

  // Handle confirmation dialog open
  const handleConfirmAction = (action: 'approve' | 'reject', requestId: string) => {
    setConfirmAction(action);
    setConfirmRequestId(requestId);
    setConfirmDialogOpen(true);
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmRequestId(null);
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (confirmRequestId && confirmAction) {
      let updates: any = {};
      
      switch (confirmAction) {
        case 'approve':
          updates = { 
            status: 'approved',
            adminNotes: 'Verification request approved.'
          };
          break;
        case 'reject':
          updates = { 
            status: 'rejected',
            adminNotes: 'Verification request rejected.'
          };
          break;
      }
      
      await updateVerificationRequest(confirmRequestId, updates);
      handleConfirmDialogClose();
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setVerificationFilters({
      searchTerm: '',
      status: undefined,
      level: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setVerificationPagination({
      page: 0,
      limit: 10
    });
  };

  // Get status chip color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  // Get verification level chip color
  const getVerificationLevelColor = (level: VerificationLevel) => {
    switch (level) {
      case VerificationLevel.PREMIUM:
        return 'success';
      case VerificationLevel.ADVANCED:
        return 'info';
      case VerificationLevel.BASIC:
        return 'primary';
      default:
        return 'default';
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Get document icon based on file type
  const getDocumentIcon = (documentType: string) => {
    if (documentType.includes('image')) {
      return <ImageIcon />;
    } else if (documentType.includes('pdf')) {
      return <DescriptionIcon />;
    } else {
      return <AttachFileIcon />;
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Verification Requests
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and process user verification requests.
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="All Requests" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>
      </Paper>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">Filters</Typography>
          <Box>
            <Button 
              startIcon={<FilterListIcon />} 
              onClick={() => setFiltersExpanded(!filtersExpanded)}
              size="small"
              sx={{ mr: 1 }}
            >
              {filtersExpanded ? 'Hide Filters' : 'Show Filters'}
            </Button>
            <Button 
              startIcon={<RefreshIcon />} 
              onClick={handleResetFilters}
              size="small"
            >
              Reset
            </Button>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <TextField
            label="Search"
            placeholder="Search by user name, email, or ID"
            variant="outlined"
            size="small"
            value={verificationFilters.searchTerm || ''}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button 
            variant="contained" 
            onClick={() => getVerificationRequests()}
            disabled={verificationLoading}
          >
            Search
          </Button>
        </Box>

        {filtersExpanded && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Verification Level</InputLabel>
                <Select
                  value={verificationFilters.level || ''}
                  label="Verification Level"
                  onChange={(e) => handleFilterChange('level', e.target.value || undefined)}
                >
                  <MenuItem value="">All Levels</MenuItem>
                  <MenuItem value={VerificationLevel.BASIC}>Basic</MenuItem>
                  <MenuItem value={VerificationLevel.ADVANCED}>Advanced</MenuItem>
                  <MenuItem value={VerificationLevel.PREMIUM}>Premium</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={verificationFilters.sortBy || 'createdAt'}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Date Submitted</MenuItem>
                  <MenuItem value="updatedAt">Last Updated</MenuItem>
                  <MenuItem value="userName">User Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={verificationFilters.sortOrder || 'desc'}
                  label="Sort Order"
                  onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                >
                  <MenuItem value="asc">Oldest First</MenuItem>
                  <MenuItem value="desc">Newest First</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        )}
      </Paper>

      {/* Verification Requests Table */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {verificationError && (
            <Alert severity="error" sx={{ m: 2 }}>
              {verificationError.message}
            </Alert>
          )}

          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
            {verificationLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : verificationRequests.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">
                  No verification requests found matching the criteria.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader aria-label="verification requests table">
                <TableHead>
                  <TableRow>
                    <TableCell>User</TableCell>
                    <TableCell>Level</TableCell>
                    <TableCell>Documents</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Submitted</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {verificationRequests.map((request) => (
                    <TableRow key={request.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Avatar 
                            src={request.userAvatar} 
                            alt={request.userName}
                            sx={{ mr: 2 }}
                          />
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {request.userName}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {request.userEmail}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              ID: {request.userId.substring(0, 8)}...
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.level} 
                          size="small" 
                          color={getVerificationLevelColor(request.level) as any}
                          icon={<VerifiedUserIcon fontSize="small" />}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {request.documents.length} document(s)
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={request.status} 
                          size="small" 
                          color={getStatusColor(request.status) as any}
                        />
                      </TableCell>
                      <TableCell>{formatDate(request.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewRequest(request)}
                              sx={{ mr: 1 }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {request.status === 'pending' && (
                            <>
                              <Tooltip title="Approve Request">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleConfirmAction('approve', request.id)}
                                  sx={{ mr: 1 }}
                                  color="success"
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject Request">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleConfirmAction('reject', request.id)}
                                  color="error"
                                >
                                  <CancelIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </TableContainer>
          
          <TablePagination
            rowsPerPageOptions={[10, 25, 50, 100]}
            component="div"
            count={verificationPagination.totalItems || 0}
            rowsPerPage={verificationPagination.limit}
            page={verificationPagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Pending Requests - Same table but filtered to pending status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Approved Requests - Same table but filtered to approved status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Rejected Requests - Same table but filtered to rejected status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      {/* Request Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleDetailDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Verification Request Details</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="User Information" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Avatar 
                          src={selectedRequest.userAvatar} 
                          alt={selectedRequest.userName}
                          sx={{ width: 56, height: 56, mr: 2 }}
                        />
                        <Box>
                          <Typography variant="subtitle1">
                            {selectedRequest.userName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {selectedRequest.userEmail}
                          </Typography>
                        </Box>
                      </Box>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>User ID:</strong> {selectedRequest.userId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Current Verification Level:</strong> {selectedRequest.currentLevel || 'None'}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Requested Level:</strong> {selectedRequest.level}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Request Information" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                        <Chip 
                          label={selectedRequest.status} 
                          color={getStatusColor(selectedRequest.status) as any}
                          sx={{ mr: 1 }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          Submitted on {formatDate(selectedRequest.createdAt)}
                        </Typography>
                      </Box>
                      
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>Request ID:</strong> {selectedRequest.id}
                      </Typography>
                      
                      {selectedRequest.updatedAt && selectedRequest.updatedAt !== selectedRequest.createdAt && (
                        <Typography variant="body2">
                          <strong>Last Updated:</strong> {formatDate(selectedRequest.updatedAt)}
                        </Typography>
                      )}
                      
                      {selectedRequest.notes && (
                        <>
                          <Typography variant="body2" sx={{ mt: 2, mb: 1 }}>
                            <strong>User Notes:</strong>
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {selectedRequest.notes}
                            </Typography>
                          </Paper>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Submitted Documents" />
                    <Divider />
                    <CardContent>
                      {selectedRequest.documents.length === 0 ? (
                        <Typography variant="body2" color="text.secondary">
                          No documents submitted.
                        </Typography>
                      ) : (
                        <List>
                          {selectedRequest.documents.map((doc: any, index: number) => (
                            <ListItem key={index} divider={index < selectedRequest.documents.length - 1}>
                              <ListItemIcon>
                                {getDocumentIcon(doc.type)}
                              </ListItemIcon>
                              <ListItemText
                                primary={doc.name || `Document ${index + 1}`}
                                secondary={doc.type}
                              />
                              <Tooltip title="Preview">
                                <IconButton 
                                  edge="end" 
                                  onClick={() => handlePreviewDocument(doc.url)}
                                  sx={{ mr: 1 }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Download">
                                <IconButton 
                                  edge="end" 
                                  component="a"
                                  href={doc.url}
                                  download
                                  target="_blank"
                                >
                                  <DownloadIcon />
                                </IconButton>
                              </Tooltip>
                            </ListItem>
                          ))}
                        </List>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Admin Review" />
                    <Divider />
                    <CardContent>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={requestStatus}
                          label="Status"
                          onChange={(e) => setRequestStatus(e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="approved">Approved</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        label="Admin Notes"
                        multiline
                        rows={4}
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        margin="normal"
                        placeholder="Add notes about this verification request..."
                      />
                      
                      {selectedRequest.reviewedBy && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Last reviewed by {selectedRequest.reviewedBy} on {formatDate(selectedRequest.updatedAt)}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDetailDialogClose}>Cancel</Button>
          <Button 
            onClick={handleUpdateRequest} 
            variant="contained" 
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Document Preview Dialog */}
      <Dialog open={!!documentPreviewUrl} onClose={handleClosePreview} maxWidth="md" fullWidth>
        <DialogTitle>Document Preview</DialogTitle>
        <DialogContent>
          {documentPreviewUrl && (
            documentPreviewUrl.includes('image') ? (
              <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                <img 
                  src={documentPreviewUrl} 
                  alt="Document Preview" 
                  style={{ maxWidth: '100%', maxHeight: '70vh' }}
                />
              </Box>
            ) : documentPreviewUrl.includes('pdf') ? (
              <Box sx={{ height: '70vh' }}>
                <iframe 
                  src={`${documentPreviewUrl}#toolbar=0`} 
                  width="100%" 
                  height="100%" 
                  title="PDF Preview"
                />
              </Box>
            ) : (
              <Typography variant="body1" align="center">
                Preview not available for this file type. Please download the file to view it.
              </Typography>
            )
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClosePreview}>Close</Button>
          <Button 
            component="a"
            href={documentPreviewUrl || '#'}
            download
            target="_blank"
            variant="contained"
            startIcon={<DownloadIcon />}
          >
            Download
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>
          {confirmAction === 'approve' ? 'Approve Verification' : 'Reject Verification'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {confirmAction === 'approve' ? 
              'Are you sure you want to approve this verification request? This will update the user\'s verification level.' : 
              'Are you sure you want to reject this verification request? The user will need to submit a new request.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmedAction} 
            variant="contained" 
            color={confirmAction === 'approve' ? 'success' : 'error'}
          >
            {confirmAction === 'approve' ? 'Approve' : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default VerificationRequests; 