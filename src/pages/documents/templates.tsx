import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions,
  Button,
  Chip,
  TextField,
  InputAdornment,
  CircularProgress,
  Tabs,
  Tab,
  Divider,
  Paper,
  IconButton,
  Menu,
  MenuItem,
  ListItemIcon,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterListIcon,
  Add as AddIcon,
  Description as DescriptionIcon,
  Handshake as HandshakeIcon,
  Assignment as AssignmentIcon,
  Business as BusinessIcon,
  AttachMoney as AttachMoneyIcon,
  MoreVert as MoreVertIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  FileCopy as FileCopyIcon,
  Visibility as VisibilityIcon
} from '@mui/icons-material';
import useDocuments from '../../hooks/useDocuments';
import { DocumentTemplate, DocumentType } from '../../services/DocumentService';

// Interface for tab panel props
interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

// Tab panel component
const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`template-tabpanel-${index}`}
      aria-labelledby={`template-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
};

// Function to get props for tabs
const a11yProps = (index: number) => {
  return {
    id: `template-tab-${index}`,
    'aria-controls': `template-tabpanel-${index}`,
  };
};

// Document templates page component
const DocumentTemplates: React.FC = () => {
  const navigate = useNavigate();
  const { 
    templates, 
    templatesLoading, 
    templatesError, 
    getTemplates 
  } = useDocuments('https://api.launchify.com', 'mock-token');

  // State for tabs
  const [tabValue, setTabValue] = useState(0);
  
  // State for search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State for template menu
  const [menuAnchorEl, setMenuAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  
  // State for delete confirmation dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  
  // State for template preview dialog
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  // Load templates on component mount
  useEffect(() => {
    getTemplates();
  }, [getTemplates]);

  // Handle tab change
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // Handle search change
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  // Handle template menu open
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, templateId: string) => {
    setMenuAnchorEl(event.currentTarget);
    setSelectedTemplateId(templateId);
  };

  // Handle template menu close
  const handleMenuClose = () => {
    setMenuAnchorEl(null);
    setSelectedTemplateId(null);
  };

  // Handle use template
  const handleUseTemplate = (templateId: string) => {
    navigate(`/documents/create?templateId=${templateId}`);
  };

  // Handle edit template
  const handleEditTemplate = (templateId: string) => {
    navigate(`/documents/templates/edit/${templateId}`);
    handleMenuClose();
  };

  // Handle delete template
  const handleDeleteTemplate = () => {
    handleMenuClose();
    setDeleteDialogOpen(true);
  };

  // Handle delete confirmation
  const handleConfirmDelete = () => {
    // Delete template logic would go here
    setDeleteDialogOpen(false);
  };

  // Handle delete dialog close
  const handleDeleteDialogClose = () => {
    setDeleteDialogOpen(false);
  };

  // Handle duplicate template
  const handleDuplicateTemplate = (templateId: string) => {
    // Duplicate template logic would go here
    handleMenuClose();
  };

  // Handle preview template
  const handlePreviewTemplate = (template: DocumentTemplate) => {
    setPreviewTemplate(template);
    setPreviewDialogOpen(true);
    handleMenuClose();
  };

  // Handle preview dialog close
  const handlePreviewDialogClose = () => {
    setPreviewDialogOpen(false);
    setPreviewTemplate(null);
  };

  // Filter templates based on search query and tab
  const filteredTemplates = templates.filter(template => {
    // Filter by search query
    const matchesSearch = 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by tab (category)
    let matchesTab = true;
    if (tabValue === 1) {
      matchesTab = template.category === 'Legal';
    } else if (tabValue === 2) {
      matchesTab = template.category === 'Investment';
    } else if (tabValue === 3) {
      matchesTab = template.category === 'Business';
    }
    
    return matchesSearch && matchesTab;
  });

  // Get icon for document type
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

  // Get color for document type
  const getDocumentTypeColor = (documentType: DocumentType) => {
    switch (documentType) {
      case DocumentType.NDA:
        return 'primary';
      case DocumentType.INVESTMENT_AGREEMENT:
        return 'success';
      case DocumentType.TERM_SHEET:
        return 'info';
      case DocumentType.BUSINESS_PLAN:
        return 'warning';
      case DocumentType.FINANCIAL_STATEMENT:
        return 'error';
      default:
        return 'default';
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Document Templates
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => navigate('/documents/templates/create')}
        >
          Create Template
        </Button>
      </Box>

      <Paper sx={{ mb: 3 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="document template tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Templates" {...a11yProps(0)} />
            <Tab label="Legal" {...a11yProps(1)} />
            <Tab label="Investment" {...a11yProps(2)} />
            <Tab label="Business" {...a11yProps(3)} />
          </Tabs>
        </Box>

        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton>
                    <FilterListIcon />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{ mb: 2 }}
          />

          {templatesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : templatesError ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography color="error">
                Error loading templates. Please try again.
              </Typography>
              <Button 
                variant="outlined" 
                sx={{ mt: 2 }}
                onClick={() => getTemplates()}
              >
                Retry
              </Button>
            </Box>
          ) : (
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                {filteredTemplates.length > 0 ? (
                  filteredTemplates.map((template) => (
                    <Grid item xs={12} sm={6} md={4} key={template.id}>
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
                              icon={getDocumentTypeIcon(template.documentType)}
                              label={template.documentType}
                              color={getDocumentTypeColor(template.documentType) as any}
                              size="small"
                              sx={{ mb: 1 }}
                            />
                            <IconButton 
                              size="small"
                              onClick={(e) => handleMenuOpen(e, template.id)}
                            >
                              <MoreVertIcon />
                            </IconButton>
                          </Box>
                          <Typography variant="h6" component="h2" gutterBottom>
                            {template.name}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {template.description}
                          </Typography>
                          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {template.variables.slice(0, 3).map((variable) => (
                              <Chip
                                key={variable}
                                label={variable}
                                size="small"
                                variant="outlined"
                              />
                            ))}
                            {template.variables.length > 3 && (
                              <Chip
                                label={`+${template.variables.length - 3} more`}
                                size="small"
                                variant="outlined"
                              />
                            )}
                          </Box>
                        </CardContent>
                        <Divider />
                        <CardActions>
                          <Button 
                            size="small" 
                            onClick={() => handleUseTemplate(template.id)}
                            fullWidth
                          >
                            Use Template
                          </Button>
                        </CardActions>
                      </Card>
                    </Grid>
                  ))
                ) : (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                      <Typography variant="h6">
                        No templates found
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Try adjusting your search or create a new template
                      </Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </TabPanel>
          )}

          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
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
                            icon={getDocumentTypeIcon(template.documentType)}
                            label={template.documentType}
                            color={getDocumentTypeColor(template.documentType) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuOpen(e, template.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {template.variables.slice(0, 3).map((variable) => (
                            <Chip
                              key={variable}
                              label={variable}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {template.variables.length > 3 && (
                            <Chip
                              label={`+${template.variables.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => handleUseTemplate(template.id)}
                          fullWidth
                        >
                          Use Template
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6">
                      No legal templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or create a new template
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
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
                            icon={getDocumentTypeIcon(template.documentType)}
                            label={template.documentType}
                            color={getDocumentTypeColor(template.documentType) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuOpen(e, template.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {template.variables.slice(0, 3).map((variable) => (
                            <Chip
                              key={variable}
                              label={variable}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {template.variables.length > 3 && (
                            <Chip
                              label={`+${template.variables.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => handleUseTemplate(template.id)}
                          fullWidth
                        >
                          Use Template
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6">
                      No investment templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or create a new template
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </TabPanel>

          <TabPanel value={tabValue} index={3}>
            <Grid container spacing={3}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <Grid item xs={12} sm={6} md={4} key={template.id}>
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
                            icon={getDocumentTypeIcon(template.documentType)}
                            label={template.documentType}
                            color={getDocumentTypeColor(template.documentType) as any}
                            size="small"
                            sx={{ mb: 1 }}
                          />
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuOpen(e, template.id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </Box>
                        <Typography variant="h6" component="h2" gutterBottom>
                          {template.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          {template.description}
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {template.variables.slice(0, 3).map((variable) => (
                            <Chip
                              key={variable}
                              label={variable}
                              size="small"
                              variant="outlined"
                            />
                          ))}
                          {template.variables.length > 3 && (
                            <Chip
                              label={`+${template.variables.length - 3} more`}
                              size="small"
                              variant="outlined"
                            />
                          )}
                        </Box>
                      </CardContent>
                      <Divider />
                      <CardActions>
                        <Button 
                          size="small" 
                          onClick={() => handleUseTemplate(template.id)}
                          fullWidth
                        >
                          Use Template
                        </Button>
                      </CardActions>
                    </Card>
                  </Grid>
                ))
              ) : (
                <Grid item xs={12}>
                  <Box sx={{ textAlign: 'center', p: 4 }}>
                    <Typography variant="h6">
                      No business templates found
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Try adjusting your search or create a new template
                    </Typography>
                  </Box>
                </Grid>
              )}
            </Grid>
          </TabPanel>
        </Box>
      </Paper>

      {/* Template actions menu */}
      <Menu
        anchorEl={menuAnchorEl}
        open={Boolean(menuAnchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={() => selectedTemplateId && handleUseTemplate(selectedTemplateId)}>
          <ListItemIcon>
            <DescriptionIcon fontSize="small" />
          </ListItemIcon>
          Use Template
        </MenuItem>
        <MenuItem onClick={() => selectedTemplateId && handleEditTemplate(selectedTemplateId)}>
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          Edit
        </MenuItem>
        <MenuItem onClick={() => selectedTemplateId && handleDuplicateTemplate(selectedTemplateId)}>
          <ListItemIcon>
            <FileCopyIcon fontSize="small" />
          </ListItemIcon>
          Duplicate
        </MenuItem>
        <MenuItem onClick={() => {
          const template = templates.find(t => t.id === selectedTemplateId);
          if (template) handlePreviewTemplate(template);
        }}>
          <ListItemIcon>
            <VisibilityIcon fontSize="small" />
          </ListItemIcon>
          Preview
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleDeleteTemplate} sx={{ color: 'error.main' }}>
          <ListItemIcon>
            <DeleteIcon fontSize="small" color="error" />
          </ListItemIcon>
          Delete
        </MenuItem>
      </Menu>

      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteDialogClose}
      >
        <DialogTitle>Delete Template</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this template? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteDialogClose}>Cancel</Button>
          <Button onClick={handleConfirmDelete} color="error">Delete</Button>
        </DialogActions>
      </Dialog>

      {/* Template preview dialog */}
      <Dialog
        open={previewDialogOpen}
        onClose={handlePreviewDialogClose}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {previewTemplate?.name}
          <Typography variant="subtitle2" color="text.secondary">
            {previewTemplate?.documentType}
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Typography variant="subtitle1" gutterBottom>
            Description
          </Typography>
          <Typography paragraph>
            {previewTemplate?.description}
          </Typography>
          
          <Typography variant="subtitle1" gutterBottom>
            Variables
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
            {previewTemplate?.variables.map((variable) => (
              <Chip
                key={variable}
                label={variable}
                variant="outlined"
              />
            ))}
          </Box>
          
          <Typography variant="subtitle1" gutterBottom>
            Template Content
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, backgroundColor: '#f5f5f5', fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
            {previewTemplate?.content}
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button onClick={handlePreviewDialogClose}>Close</Button>
          <Button 
            variant="contained" 
            onClick={() => {
              if (previewTemplate) {
                handleUseTemplate(previewTemplate.id);
                handlePreviewDialogClose();
              }
            }}
          >
            Use Template
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default DocumentTemplates; 