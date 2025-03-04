import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  TextField,
  InputAdornment,
  Menu,
  MenuItem,
  ListItemIcon,
  Divider,
  FormControl,
  InputLabel,
  Select,
  Tooltip,
  CircularProgress,
  Alert,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Sort as SortIcon,
  MoreVert as MoreVertIcon,
  Visibility as VisibilityIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Download as DownloadIcon,
  Send as SendIcon,
  Archive as ArchiveIcon,
  Description as DescriptionIcon,
  Handshake as HandshakeIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  CheckCircle as CheckCircleIcon,
  Pending as PendingIcon,
  Cancel as CancelIcon,
  Lock as LockIcon,
  Public as PublicIcon,
  Share as ShareIcon
} from '@mui/icons-material';
import useDocuments from '../../hooks/useDocuments';
import { 
  Document, 
  DocumentType, 
  DocumentStatus, 
  DocumentVisibility,
  DocumentFilter
} from '../../services/DocumentService';

// Document list page component
const DocumentList: React.FC = () => {
  const navigate = useNavigate();
  const { 
    documents, 
    documentsLoading, 
    documentsError, 
    documentsPagination,
    getDocuments,
    downloadDocument,
    archiveDocument,
    deleteDocument,
    sendForSignature,
    filters,
    setFilters,
    statistics,
    statisticsLoading,
    getStatistics
  } = useDocuments('https://api.launchify.com', 'mock-token');

  // State for search
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // State for menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedDocumentId, setSelectedDocumentId] = useState<string | null>(null);
  
  // State for filter menu
  const [filterAnchorEl, setFilterAnchorEl] = useState<null | HTMLElement>(null);
  
  // State for sort menu
  const [sortAnchorEl, setSortAnchorEl] = useState<null | HTMLElement>(null);
  
  // State for view mode
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  // Load documents and statistics on component mount
  useEffect(() => {
    getDocuments();
    getStatistics();
  }, [getDocuments, getStatistics]);

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle search submit
  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const newFilters = { ...filters, search: searchQuery };
    setFilters(newFilters);
    getDocuments(newFilters);
  };

  // Handle menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, documentId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedDocumentId(documentId);
  };

  // Handle menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedDocumentId(null);
  };

  // Handle filter menu open
  const handleFilterMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setFilterAnchorEl(event.currentTarget);
  };

  // Handle filter menu close
  const handleFilterMenuClose = () => {
    setFilterAnchorEl(null);
  };

  // Handle sort menu open
  const handleSortMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setSortAnchorEl(event.currentTarget);
  };

  // Handle sort menu close
  const handleSortMenuClose = () => {
    setSortAnchorEl(null);
  };

  // Handle view document
  const handleViewDocument = (documentId: string) => {
    navigate(`/documents/${documentId}`);
    handleMenuClose();
  };

  // Handle edit document
  const handleEditDocument = (documentId: string) => {
    navigate(`/documents/edit/${documentId}`);
    handleMenuClose();
  };

  // Handle download document
  const handleDownloadDocument = async (documentId: string) => {
    try {
      await downloadDocument(documentId);
    } catch (error) {
      console.error('Error downloading document:', error);
    }
    handleMenuClose();
  };

  // Handle send for signature
  const handleSendForSignature = async (documentId: string) => {
    try {
      await sendForSignature(documentId);
      getDocuments(filters);
    } catch (error) {
      console.error('Error sending document for signature:', error);
    }
    handleMenuClose();
  };

  // Handle archive document
  const handleArchiveDocument = async (documentId: string) => {
    try {
      await archiveDocument(documentId);
      getDocuments(filters);
    } catch (error) {
      console.error('Error archiving document:', error);
    }
    handleMenuClose();
  };

  // Handle delete document
  const handleDeleteDocument = async (documentId: string) => {
    try {
      await deleteDocument(documentId);
      getDocuments(filters);
    } catch (error) {
      console.error('Error deleting document:', error);
    }
    handleMenuClose();
  };

  // Handle filter change
  const handleFilterChange = (filterName: string, value: any) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    getDocuments(newFilters);
    handleFilterMenuClose();
  };

  // Handle sort change
  const handleSortChange = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    const newFilters = { ...filters, sortBy, sortOrder };
    setFilters(newFilters);
    getDocuments(newFilters);
    handleSortMenuClose();
  };

  // Handle page change
  const handlePageChange = (event: unknown, newPage: number) => {
    const newPagination = { page: newPage + 1, limit: documentsPagination.limit };
    getDocuments(filters, newPagination);
  };

  // Handle rows per page change
  const handleRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPagination = { page: 1, limit: parseInt(event.target.value, 10) };
    getDocuments(filters, newPagination);
  };

  // Handle reset filters
  const handleResetFilters = () => {
    setFilters({});
    setSearchQuery('');
    getDocuments({});
    handleFilterMenuClose();
  };

  // Get document type icon
  const getDocumentTypeIcon = (documentType: DocumentType) => {
    switch (documentType) {
      case DocumentType.NDA:
        return <DescriptionIcon />;
      case DocumentType.INVESTMENT_AGREEMENT:
        return <HandshakeIcon />;
      case DocumentType.TERM_SHEET:
        return <AssignmentIcon />;
      case DocumentType.BUSINESS_PLAN:
        return <BusinessIcon />;
      case DocumentType.FINANCIAL_STATEMENT:
        return <AttachMoneyIcon />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Get document status icon
  const getDocumentStatusIcon = (status: DocumentStatus) => {
    switch (status) {
      case DocumentStatus.SIGNED:
        return <CheckCircleIcon color="success" />;
      case DocumentStatus.PENDING_SIGNATURE:
        return <PendingIcon color="warning" />;
      case DocumentStatus.REJECTED:
        return <CancelIcon color="error" />;
      case DocumentStatus.EXPIRED:
        return <CancelIcon color="error" />;
      case DocumentStatus.ARCHIVED:
        return <ArchiveIcon color="disabled" />;
      default:
        return <DescriptionIcon />;
    }
  };

  // Get document visibility icon
  const getDocumentVisibilityIcon = (visibility: DocumentVisibility) => {
    switch (visibility) {
      case DocumentVisibility.PRIVATE:
        return <LockIcon fontSize="small" />;
      case DocumentVisibility.SHARED:
        return <ShareIcon fontSize="small" />;
      case DocumentVisibility.PUBLIC:
        return <PublicIcon fontSize="small" />;
      default:
        return <LockIcon fontSize="small" />;
    }
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString();
  };

  // Render document list view
  const renderListView = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Type</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell>Signatories</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {documents.map((document) => (
            <TableRow key={document.id} hover>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getDocumentTypeIcon(document.documentType)}
                  <Box sx={{ ml: 2 }}>
                    <Typography variant="body1">
                      {document.name}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {document.description.length > 50
                        ? `${document.description.substring(0, 50)}...`
                        : document.description}
                    </Typography>
                  </Box>
                </Box>
              </TableCell>
              <TableCell>
                <Chip
                  label={document.documentType}
                  size="small"
                  color={document.documentType === DocumentType.NDA ? 'primary' : 
                         document.documentType === DocumentType.INVESTMENT_AGREEMENT ? 'success' : 
                         document.documentType === DocumentType.TERM_SHEET ? 'info' : 
                         document.documentType === DocumentType.BUSINESS_PLAN ? 'warning' : 
                         'default'}
                />
              </TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  {getDocumentStatusIcon(document.status)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {document.status}
                  </Typography>
                </Box>
              </TableCell>
              <TableCell>{formatDate(document.createdAt)}</TableCell>
              <TableCell>
                {document.signatories.length > 0 ? (
                  <Box>
                    <Typography variant="body2">
                      {document.signatories.length} {document.signatories.length === 1 ? 'signatory' : 'signatories'}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {document.signatories.filter(s => s.status === 'SIGNED').length} signed
                    </Typography>
                  </Box>
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No signatories
                  </Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Tooltip title="View">
                  <IconButton onClick={() => handleViewDocument(document.id)}>
                    <VisibilityIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="More actions">
                  <IconButton onClick={(e) => handleMenuOpen(e, document.id)}>
                    <MoreVertIcon />
                  </IconButton>
                </Tooltip>
              </TableCell>
            </TableRow>
          ))}
          {documents.length === 0 && !documentsLoading && (
            <TableRow>
              <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                <Typography variant="body1">
                  No documents found
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Try adjusting your filters or create a new document
                </Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      <TablePagination
        component="div"
        count={documentsPagination.total}
        page={documentsPagination.page - 1}
        onPageChange={handlePageChange}
        rowsPerPage={documentsPagination.limit}
        onRowsPerPageChange={handleRowsPerPageChange}
        rowsPerPageOptions={[5, 10, 25, 50]}
      />
    </TableContainer>
  );

  // Render document grid view
  const renderGridView = () => (
    <Box>
      <Grid container spacing={3}>
        {documents.map((document) => (
          <Grid item xs={12} sm={6} md={4} key={document.id}>
            <Card 
              sx={{ 
                height: '100%', 
                display: 'flex', 
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 4
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Chip
                    icon={getDocumentTypeIcon(document.documentType)}
                    label={document.documentType}
                    color={document.documentType === DocumentType.NDA ? 'primary' : 
                           document.documentType === DocumentType.INVESTMENT_AGREEMENT ? 'success' : 
                           document.documentType === DocumentType.TERM_SHEET ? 'info' : 
                           document.documentType === DocumentType.BUSINESS_PLAN ? 'warning' : 
                           'default'}
                    size="small"
                    sx={{ mb: 1 }}
                  />
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <Tooltip title={document.visibility}>
                      {getDocumentVisibilityIcon(document.visibility)}
                    </Tooltip>
                    <IconButton 
                      size="small"
                      onClick={(e) => handleMenuOpen(e, document.id)}
                      sx={{ ml: 0.5 }}
                    >
                      <MoreVertIcon />
                    </IconButton>
                  </Box>
                </Box>
                <Typography variant="h6" component="h2" gutterBottom>
                  {document.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {document.description.length > 100
                    ? `${document.description.substring(0, 100)}...`
                    : document.description}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  {getDocumentStatusIcon(document.status)}
                  <Typography variant="body2" sx={{ ml: 1 }}>
                    {document.status}
                  </Typography>
                </Box>
                <Typography variant="body2" color="text.secondary">
                  Created: {formatDate(document.createdAt)}
                </Typography>
                {document.signatories.length > 0 && (
                  <Typography variant="body2" color="text.secondary">
                    {document.signatories.filter(s => s.status === 'SIGNED').length} of {document.signatories.length} signed
                  </Typography>
                )}
              </CardContent>
              <Divider />
              <CardActions>
                <Button 
                  size="small" 
                  startIcon={<VisibilityIcon />}
                  onClick={() => handleViewDocument(document.id)}
                  fullWidth
                >
                  View Document
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
        {documents.length === 0 && !documentsLoading && (
          <Grid item xs={12}>
            <Box sx={{ textAlign: 'center', p: 4 }}>
              <Typography variant="h6">
                No documents found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your filters or create a new document
              </Typography>
            </Box>
          </Grid>
        )}
      </Grid>
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
        <TablePagination
          component="div"
          count={documentsPagination.total}
          page={documentsPagination.page - 1}
          onPageChange={handlePageChange}
          rowsPerPage={documentsPagination.limit}
          onRowsPerPageChange={handleRowsPerPageChange}
          rowsPerPageOptions={[6, 12, 24, 48]}
        />
      </Box>
    </Box>
  );

  // Render document statistics
  const renderStatistics = () => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Total Documents
          </Typography>
          <Typography variant="h4">
            {statisticsLoading ? <CircularProgress size={24} /> : statistics?.totalDocuments || 0}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Pending Signatures
          </Typography>
          <Typography variant="h4">
            {statisticsLoading ? (
              <CircularProgress size={24} />
            ) : (
              statistics?.documentsByStatus[DocumentStatus.PENDING_SIGNATURE] || 0
            )}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Signed Documents
          </Typography>
          <Typography variant="h4">
            {statisticsLoading ? (
              <CircularProgress size={24} />
            ) : (
              statistics?.documentsByStatus[DocumentStatus.SIGNED] || 0
            )}
          </Typography>
        </Paper>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="subtitle2" color="text.secondary">
            Recent Activity
          </Typography>
          <Typography variant="body2">
            {statisticsLoading ? (
              <CircularProgress size={24} />
            ) : (
              statistics?.recentActivity.length || 0
            )} actions in the last 7 days
          </Typography>
        </Paper>
      </Grid>
    </Grid>
  );

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Documents
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/documents/create')}
        >
          Create Document
        </Button>
      </Box>

      {renderStatistics()}

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <form onSubmit={handleSearchSubmit}>
              <TextField
                placeholder="Search documents..."
                value={searchQuery}
                onChange={handleSearchChange}
                variant="outlined"
                size="small"
                sx={{ width: 250 }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  ),
                }}
              />
            </form>
            <Box sx={{ ml: 2 }}>
              <Button
                startIcon={<FilterListIcon />}
                onClick={handleFilterMenuOpen}
                variant="outlined"
                size="small"
              >
                Filter
              </Button>
              <Menu
                anchorEl={filterAnchorEl}
                open={Boolean(filterAnchorEl)}
                onClose={handleFilterMenuClose}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle2">Filter by Type</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('documentType', DocumentType.NDA)}>
                  NDA
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('documentType', DocumentType.INVESTMENT_AGREEMENT)}>
                  Investment Agreement
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('documentType', DocumentType.TERM_SHEET)}>
                  Term Sheet
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('documentType', DocumentType.BUSINESS_PLAN)}>
                  Business Plan
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('documentType', DocumentType.FINANCIAL_STATEMENT)}>
                  Financial Statement
                </MenuItem>
                <Divider />
                <MenuItem disabled>
                  <Typography variant="subtitle2">Filter by Status</Typography>
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.DRAFT)}>
                  Draft
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.PENDING_SIGNATURE)}>
                  Pending Signature
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.SIGNED)}>
                  Signed
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.EXPIRED)}>
                  Expired
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.REJECTED)}>
                  Rejected
                </MenuItem>
                <MenuItem onClick={() => handleFilterChange('status', DocumentStatus.ARCHIVED)}>
                  Archived
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleResetFilters}>
                  <Typography color="primary">Reset Filters</Typography>
                </MenuItem>
              </Menu>
            </Box>
            <Box sx={{ ml: 1 }}>
              <Button
                startIcon={<SortIcon />}
                onClick={handleSortMenuOpen}
                variant="outlined"
                size="small"
              >
                Sort
              </Button>
              <Menu
                anchorEl={sortAnchorEl}
                open={Boolean(sortAnchorEl)}
                onClose={handleSortMenuClose}
              >
                <MenuItem onClick={() => handleSortChange('createdAt', 'desc')}>
                  Newest First
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('createdAt', 'asc')}>
                  Oldest First
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('name', 'asc')}>
                  Name (A-Z)
                </MenuItem>
                <MenuItem onClick={() => handleSortChange('name', 'desc')}>
                  Name (Z-A)
                </MenuItem>
              </Menu>
            </Box>
          </Box>
          <Box>
            <Button
              variant={viewMode === 'list' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('list')}
              sx={{ mr: 1 }}
            >
              List
            </Button>
            <Button
              variant={viewMode === 'grid' ? 'contained' : 'outlined'}
              size="small"
              onClick={() => setViewMode('grid')}
            >
              Grid
            </Button>
          </Box>
        </Box>

        <Divider />

        <Box sx={{ p: 2 }}>
          {documentsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : documentsError ? (
            <Alert severity="error" sx={{ mb: 2 }}>
              Error loading documents. Please try again.
            </Alert>
          ) : (
            viewMode === 'list' ? renderListView() : renderGridView()
          )}
        </Box>
      </Paper>

      {/* Document actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedDocumentId && handleViewDocument(selectedDocumentId)}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          View
        </MenuItem>
        <MenuItem onClick={() => selectedDocumentId && handleEditDocument(selectedDocumentId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedDocumentId && handleDownloadDocument(selectedDocumentId)}>
          <ListItemIcon>
            <DownloadIcon fontSize="small" />
          </ListItemIcon>
          Download
        </MenuItem>
        <MenuItem onClick={() => selectedDocumentId && handleSendForSignature(selectedDocumentId)}>
          <ListItemIcon>
            <SendIcon fontSize="small" />
          </ListItemIcon>
          Send for Signature
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => selectedDocumentId && handleArchiveDocument(selectedDocumentId)}>
          <ListItemIcon>
            <ArchiveIcon fontSize="small" />
          </ListItemIcon>
          Archive
        </MenuItem>
        <MenuItem onClick={() => selectedDocumentId && handleDeleteDocument(selectedDocumentId)} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>
    </Container>
  );
};

export default DocumentList; 