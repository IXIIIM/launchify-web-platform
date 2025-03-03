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
  Tab
} from '@mui/material';
import {
  Flag as FlagIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Block as BlockIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  FilterList as FilterListIcon,
  MoreVert as MoreVertIcon,
  Person as PersonIcon,
  Comment as CommentIcon,
  Image as ImageIcon,
  Message as MessageIcon
} from '@mui/icons-material';
import { useAdmin } from '../../hooks/useAdmin';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

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
      id={`reports-tabpanel-${index}`}
      aria-labelledby={`reports-tab-${index}`}
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

const ContentReports: React.FC = () => {
  const {
    reports,
    reportLoading,
    reportError,
    getReports,
    updateReport,
    reportFilters,
    setReportFilters,
    reportsPagination,
    setReportsPagination
  } = useAdmin();

  const navigate = useNavigate();

  // Tab state
  const [tabValue, setTabValue] = useState(0);

  // Report detail dialog state
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [moderatorNotes, setModeratorNotes] = useState('');
  const [reportStatus, setReportStatus] = useState('');

  // Confirmation dialog state
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'delete' | null>(null);
  const [confirmReportId, setConfirmReportId] = useState<string | null>(null);

  // Filter expansion state
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  // Load reports on component mount
  useEffect(() => {
    getReports();
  }, [getReports, reportFilters, reportsPagination]);

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
    
    setReportFilters({
      ...reportFilters,
      status
    });
  };

  // Handle pagination change
  const handlePageChange = (event: unknown, newPage: number) => {
    setReportsPagination({
      ...reportsPagination,
      page: newPage
    });
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReportsPagination({
      ...reportsPagination,
      limit: parseInt(event.target.value, 10),
      page: 0
    });
  };

  // Handle search input change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setReportFilters({
      ...reportFilters,
      searchTerm: event.target.value
    });
  };

  // Handle filter change
  const handleFilterChange = (field: string, value: any) => {
    setReportFilters({
      ...reportFilters,
      [field]: value
    });
    setReportsPagination({
      ...reportsPagination,
      page: 0
    });
  };

  // Handle detail dialog open
  const handleViewReport = (report: any) => {
    setSelectedReport(report);
    setModeratorNotes(report.moderatorNotes || '');
    setReportStatus(report.status);
    setDetailDialogOpen(true);
  };

  // Handle detail dialog close
  const handleDetailDialogClose = () => {
    setDetailDialogOpen(false);
    setSelectedReport(null);
    setModeratorNotes('');
    setReportStatus('');
  };

  // Handle report update
  const handleUpdateReport = async () => {
    if (selectedReport) {
      const updates: any = {};
      
      if (moderatorNotes !== selectedReport.moderatorNotes) {
        updates.moderatorNotes = moderatorNotes;
      }
      
      if (reportStatus !== selectedReport.status) {
        updates.status = reportStatus;
      }
      
      if (Object.keys(updates).length > 0) {
        await updateReport(selectedReport.id, updates);
      }
      
      handleDetailDialogClose();
    }
  };

  // Handle confirmation dialog open
  const handleConfirmAction = (action: 'approve' | 'reject' | 'delete', reportId: string) => {
    setConfirmAction(action);
    setConfirmReportId(reportId);
    setConfirmDialogOpen(true);
  };

  // Handle confirmation dialog close
  const handleConfirmDialogClose = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
    setConfirmReportId(null);
  };

  // Handle confirmed action
  const handleConfirmedAction = async () => {
    if (confirmReportId && confirmAction) {
      let updates: any = {};
      
      switch (confirmAction) {
        case 'approve':
          updates = { status: 'approved' };
          break;
        case 'reject':
          updates = { status: 'rejected' };
          break;
        case 'delete':
          // In a real application, you might want to implement a soft delete
          // or have a separate API endpoint for deletion
          updates = { isDeleted: true };
          break;
      }
      
      await updateReport(confirmReportId, updates);
      handleConfirmDialogClose();
    }
  };

  // Reset filters
  const handleResetFilters = () => {
    setReportFilters({
      searchTerm: '',
      status: undefined,
      targetType: undefined,
      reason: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc'
    });
    setReportsPagination({
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

  // Get target type icon
  const getTargetTypeIcon = (targetType: string) => {
    switch (targetType) {
      case 'user':
        return <PersonIcon />;
      case 'message':
        return <MessageIcon />;
      case 'comment':
        return <CommentIcon />;
      case 'image':
        return <ImageIcon />;
      default:
        return <FlagIcon />;
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

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Content Reports
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Review and manage reported content from users.
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
          <Tab label="All Reports" />
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
            placeholder="Search by reporter, reason, or content"
            variant="outlined"
            size="small"
            value={reportFilters.searchTerm || ''}
            onChange={handleSearchChange}
            sx={{ flexGrow: 1, mr: 2 }}
            InputProps={{
              startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
            }}
          />
          <Button 
            variant="contained" 
            onClick={() => getReports()}
            disabled={reportLoading}
          >
            Search
          </Button>
        </Box>

        {filtersExpanded && (
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Target Type</InputLabel>
                <Select
                  value={reportFilters.targetType || ''}
                  label="Target Type"
                  onChange={(e) => handleFilterChange('targetType', e.target.value || undefined)}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="user">User</MenuItem>
                  <MenuItem value="message">Message</MenuItem>
                  <MenuItem value="comment">Comment</MenuItem>
                  <MenuItem value="image">Image</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Reason</InputLabel>
                <Select
                  value={reportFilters.reason || ''}
                  label="Reason"
                  onChange={(e) => handleFilterChange('reason', e.target.value || undefined)}
                >
                  <MenuItem value="">All Reasons</MenuItem>
                  <MenuItem value="harassment">Harassment</MenuItem>
                  <MenuItem value="inappropriate_content">Inappropriate Content</MenuItem>
                  <MenuItem value="spam">Spam</MenuItem>
                  <MenuItem value="fake_profile">Fake Profile</MenuItem>
                  <MenuItem value="other">Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort By</InputLabel>
                <Select
                  value={reportFilters.sortBy || 'createdAt'}
                  label="Sort By"
                  onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                >
                  <MenuItem value="createdAt">Date Reported</MenuItem>
                  <MenuItem value="updatedAt">Last Updated</MenuItem>
                  <MenuItem value="reporterName">Reporter Name</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Sort Order</InputLabel>
                <Select
                  value={reportFilters.sortOrder || 'desc'}
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

      {/* Reports Table */}
      <TabPanel value={tabValue} index={0}>
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {reportError && (
            <Alert severity="error" sx={{ m: 2 }}>
              {reportError.message}
            </Alert>
          )}

          <TableContainer sx={{ maxHeight: 'calc(100vh - 350px)' }}>
            {reportLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <CircularProgress />
              </Box>
            ) : reports.length === 0 ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 200 }}>
                <Typography variant="body1" color="text.secondary">
                  No reports found matching the criteria.
                </Typography>
              </Box>
            ) : (
              <Table stickyHeader aria-label="reports table">
                <TableHead>
                  <TableRow>
                    <TableCell>Report Details</TableCell>
                    <TableCell>Target</TableCell>
                    <TableCell>Reason</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Reported</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {reports.map((report) => (
                    <TableRow key={report.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                          <Typography variant="body2" fontWeight="bold">
                            {report.reporterName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {report.reporterEmail}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {report.id.substring(0, 8)}...
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                          <Tooltip title={report.targetType}>
                            <Box sx={{ mr: 1 }}>
                              {getTargetTypeIcon(report.targetType)}
                            </Box>
                          </Tooltip>
                          <Typography variant="body2">
                            {report.targetName}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={report.reason} 
                          size="small" 
                          color={report.reason === 'harassment' || report.reason === 'inappropriate_content' ? 'error' : 'default'}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={report.status} 
                          size="small" 
                          color={getStatusColor(report.status) as any}
                        />
                      </TableCell>
                      <TableCell>{formatDate(report.createdAt)}</TableCell>
                      <TableCell align="right">
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                          <Tooltip title="View Details">
                            <IconButton 
                              size="small" 
                              onClick={() => handleViewReport(report)}
                              sx={{ mr: 1 }}
                            >
                              <MoreVertIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          
                          {report.status === 'pending' && (
                            <>
                              <Tooltip title="Approve Report">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleConfirmAction('approve', report.id)}
                                  sx={{ mr: 1 }}
                                  color="success"
                                >
                                  <CheckCircleIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              
                              <Tooltip title="Reject Report">
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleConfirmAction('reject', report.id)}
                                  color="error"
                                >
                                  <BlockIcon fontSize="small" />
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
            count={reportsPagination.totalItems || 0}
            rowsPerPage={reportsPagination.limit}
            page={reportsPagination.page}
            onPageChange={handlePageChange}
            onRowsPerPageChange={handleRowsPerPageChange}
          />
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        {/* Pending Reports - Same table but filtered to pending status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        {/* Approved Reports - Same table but filtered to approved status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        {/* Rejected Reports - Same table but filtered to rejected status */}
        <Paper sx={{ width: '100%', overflow: 'hidden' }}>
          {/* Table content same as above, filtered by status */}
        </Paper>
      </TabPanel>

      {/* Report Detail Dialog */}
      <Dialog open={detailDialogOpen} onClose={handleDetailDialogClose} maxWidth="md" fullWidth>
        <DialogTitle>Report Details</DialogTitle>
        <DialogContent>
          {selectedReport && (
            <Box sx={{ pt: 1 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Reporter Information" />
                    <Divider />
                    <CardContent>
                      <Typography variant="subtitle1">
                        {selectedReport.reporterName}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        {selectedReport.reporterEmail}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>User ID:</strong> {selectedReport.reporterId}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Reported on:</strong> {formatDate(selectedReport.createdAt)}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Card variant="outlined">
                    <CardHeader title="Target Information" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Box sx={{ mr: 1 }}>
                          {getTargetTypeIcon(selectedReport.targetType)}
                        </Box>
                        <Typography variant="subtitle1">
                          {selectedReport.targetName}
                        </Typography>
                      </Box>
                      <Chip 
                        label={selectedReport.targetType} 
                        size="small" 
                        sx={{ mb: 2 }}
                      />
                      <Typography variant="body2" sx={{ mt: 2 }}>
                        <strong>Target ID:</strong> {selectedReport.targetId}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Report Details" />
                    <Divider />
                    <CardContent>
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Reason:
                        </Typography>
                        <Chip 
                          label={selectedReport.reason} 
                          color={selectedReport.reason === 'harassment' || selectedReport.reason === 'inappropriate_content' ? 'error' : 'default'}
                        />
                      </Box>
                      
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Description:
                      </Typography>
                      <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                        <Typography variant="body2">
                          {selectedReport.description || 'No description provided.'}
                        </Typography>
                      </Paper>
                      
                      {selectedReport.contentSnapshot && (
                        <>
                          <Typography variant="body2" color="text.secondary" gutterBottom>
                            Content Snapshot:
                          </Typography>
                          <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: 'background.default' }}>
                            <Typography variant="body2">
                              {selectedReport.contentSnapshot}
                            </Typography>
                          </Paper>
                        </>
                      )}
                    </CardContent>
                  </Card>
                </Grid>
                
                <Grid item xs={12}>
                  <Card variant="outlined">
                    <CardHeader title="Moderation" />
                    <Divider />
                    <CardContent>
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Status</InputLabel>
                        <Select
                          value={reportStatus}
                          label="Status"
                          onChange={(e) => setReportStatus(e.target.value)}
                        >
                          <MenuItem value="pending">Pending</MenuItem>
                          <MenuItem value="approved">Approved</MenuItem>
                          <MenuItem value="rejected">Rejected</MenuItem>
                        </Select>
                      </FormControl>
                      
                      <TextField
                        fullWidth
                        label="Moderator Notes"
                        multiline
                        rows={4}
                        value={moderatorNotes}
                        onChange={(e) => setModeratorNotes(e.target.value)}
                        margin="normal"
                        placeholder="Add notes about this report and any actions taken..."
                      />
                      
                      {selectedReport.moderatedBy && (
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                          Last moderated by {selectedReport.moderatedBy} on {formatDate(selectedReport.updatedAt)}
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
            onClick={handleUpdateReport} 
            variant="contained" 
            color="primary"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirmation Dialog */}
      <Dialog open={confirmDialogOpen} onClose={handleConfirmDialogClose}>
        <DialogTitle>
          {confirmAction === 'approve' ? 'Approve Report' : 
           confirmAction === 'reject' ? 'Reject Report' : 
           'Delete Report'}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1">
            {confirmAction === 'approve' ? 
              'Are you sure you want to approve this report? This may trigger actions against the reported content or user.' : 
             confirmAction === 'reject' ? 
              'Are you sure you want to reject this report? No action will be taken against the reported content or user.' : 
              'Are you sure you want to delete this report? This action cannot be undone.'}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleConfirmDialogClose}>Cancel</Button>
          <Button 
            onClick={handleConfirmedAction} 
            variant="contained" 
            color={confirmAction === 'approve' ? 'success' : confirmAction === 'reject' ? 'error' : 'error'}
          >
            {confirmAction === 'approve' ? 'Approve' : 
             confirmAction === 'reject' ? 'Reject' : 
             'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ContentReports; 