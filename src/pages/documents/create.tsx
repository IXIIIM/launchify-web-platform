import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Paper,
  Stepper,
  Step,
  StepLabel,
  Button,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Grid,
  Divider,
  Chip,
  CircularProgress,
  Alert,
  Autocomplete,
  Card,
  CardContent,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Description as DescriptionIcon,
  Add as AddIcon,
  Remove as RemoveIcon,
  Save as SaveIcon,
  Send as SendIcon,
  Download as DownloadIcon,
  Preview as PreviewIcon
} from '@mui/icons-material';
import useDocuments from '../../hooks/useDocuments';
import { 
  DocumentTemplate, 
  DocumentType, 
  DocumentVisibility, 
  DocumentGenerationOptions 
} from '../../services/DocumentService';

// Steps for document creation
const steps = ['Select Template', 'Fill Details', 'Add Signatories', 'Review & Create'];

// Document creation page component
const DocumentCreate: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const templateIdFromUrl = queryParams.get('templateId');

  const { 
    templates, 
    templatesLoading, 
    templatesError, 
    getTemplates,
    getTemplateById,
    createDocument
  } = useDocuments('https://api.launchify.com', 'mock-token');

  // State for stepper
  const [activeStep, setActiveStep] = useState(templateIdFromUrl ? 1 : 0);
  
  // State for selected template
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [templateLoading, setTemplateLoading] = useState<boolean>(false);
  
  // State for document details
  const [documentName, setDocumentName] = useState<string>('');
  const [documentDescription, setDocumentDescription] = useState<string>('');
  const [documentVisibility, setDocumentVisibility] = useState<DocumentVisibility>(DocumentVisibility.PRIVATE);
  const [documentTags, setDocumentTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [expirationDate, setExpirationDate] = useState<string>('');
  
  // State for template variables
  const [variableValues, setVariableValues] = useState<Record<string, string>>({});
  
  // State for signatories
  const [signatories, setSignatories] = useState<Array<{
    userId: string;
    name: string;
    email: string;
    role: string;
    order: number;
  }>>([
    {
      userId: 'current-user-id', // This would be the current user's ID
      name: 'John Doe', // This would be the current user's name
      email: 'john@example.com', // This would be the current user's email
      role: 'Entrepreneur',
      order: 1
    }
  ]);
  
  // State for form validation
  const [errors, setErrors] = useState<{
    documentName?: string;
    documentDescription?: string;
    template?: string;
    variables?: Record<string, string>;
    signatories?: string;
  }>({});
  
  // State for document creation
  const [creating, setCreating] = useState<boolean>(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Load templates on component mount
  useEffect(() => {
    getTemplates();
  }, [getTemplates]);
  
  // Load template from URL if provided
  useEffect(() => {
    if (templateIdFromUrl) {
      setTemplateLoading(true);
      getTemplateById(templateIdFromUrl)
        .then(template => {
          setSelectedTemplate(template);
          // Initialize variable values
          const initialValues: Record<string, string> = {};
          template.variables.forEach(variable => {
            initialValues[variable] = '';
          });
          setVariableValues(initialValues);
          // Set document name and description based on template
          setDocumentName(`${template.name} - ${new Date().toLocaleDateString()}`);
          setDocumentDescription(template.description);
        })
        .catch(error => {
          console.error('Error loading template:', error);
          setErrors(prev => ({ ...prev, template: 'Failed to load the selected template' }));
        })
        .finally(() => {
          setTemplateLoading(false);
        });
    }
  }, [templateIdFromUrl, getTemplateById]);
  
  // Handle template selection
  const handleTemplateSelect = (template: DocumentTemplate | null) => {
    setSelectedTemplate(template);
    
    if (template) {
      // Initialize variable values
      const initialValues: Record<string, string> = {};
      template.variables.forEach(variable => {
        initialValues[variable] = '';
      });
      setVariableValues(initialValues);
      
      // Set document name and description based on template
      setDocumentName(`${template.name} - ${new Date().toLocaleDateString()}`);
      setDocumentDescription(template.description);
      
      // Clear template error if exists
      if (errors.template) {
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors.template;
          return newErrors;
        });
      }
    } else {
      // Reset variable values
      setVariableValues({});
      setDocumentName('');
      setDocumentDescription('');
    }
  };
  
  // Handle variable value change
  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev => ({
      ...prev,
      [variable]: value
    }));
    
    // Clear variable error if exists
    if (errors.variables && errors.variables[variable]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        if (newErrors.variables) {
          delete newErrors.variables[variable];
          if (Object.keys(newErrors.variables).length === 0) {
            delete newErrors.variables;
          }
        }
        return newErrors;
      });
    }
  };
  
  // Handle adding a signatory
  const handleAddSignatory = () => {
    setSignatories(prev => [
      ...prev,
      {
        userId: '',
        name: '',
        email: '',
        role: '',
        order: prev.length + 1
      }
    ]);
  };
  
  // Handle removing a signatory
  const handleRemoveSignatory = (index: number) => {
    setSignatories(prev => {
      const newSignatories = prev.filter((_, i) => i !== index);
      // Update order for remaining signatories
      return newSignatories.map((signatory, i) => ({
        ...signatory,
        order: i + 1
      }));
    });
  };
  
  // Handle signatory field change
  const handleSignatoryChange = (index: number, field: string, value: string) => {
    setSignatories(prev => {
      const newSignatories = [...prev];
      newSignatories[index] = {
        ...newSignatories[index],
        [field]: value
      };
      return newSignatories;
    });
    
    // Clear signatory error if exists
    if (errors.signatories) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.signatories;
        return newErrors;
      });
    }
  };
  
  // Handle adding a tag
  const handleAddTag = () => {
    if (newTag.trim() && !documentTags.includes(newTag.trim())) {
      setDocumentTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  };
  
  // Handle removing a tag
  const handleRemoveTag = (tag: string) => {
    setDocumentTags(prev => prev.filter(t => t !== tag));
  };
  
  // Validate step 1 (Select Template)
  const validateStep1 = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!selectedTemplate) {
      newErrors.template = 'Please select a template';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate step 2 (Fill Details)
  const validateStep2 = (): boolean => {
    const newErrors: typeof errors = {};
    
    if (!documentName.trim()) {
      newErrors.documentName = 'Document name is required';
    }
    
    if (!documentDescription.trim()) {
      newErrors.documentDescription = 'Document description is required';
    }
    
    // Validate all variables are filled
    if (selectedTemplate) {
      const variableErrors: Record<string, string> = {};
      selectedTemplate.variables.forEach(variable => {
        if (!variableValues[variable] || !variableValues[variable].trim()) {
          variableErrors[variable] = `${variable} is required`;
        }
      });
      
      if (Object.keys(variableErrors).length > 0) {
        newErrors.variables = variableErrors;
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Validate step 3 (Add Signatories)
  const validateStep3 = (): boolean => {
    const newErrors: typeof errors = {};
    
    // Ensure at least one signatory is added
    if (signatories.length === 0) {
      newErrors.signatories = 'At least one signatory is required';
    } else {
      // Ensure all signatories have required fields
      const invalidSignatory = signatories.some(
        signatory => !signatory.name.trim() || !signatory.email.trim() || !signatory.role.trim()
      );
      
      if (invalidSignatory) {
        newErrors.signatories = 'All signatory fields are required';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  // Handle next step
  const handleNext = () => {
    let isValid = false;
    
    switch (activeStep) {
      case 0:
        isValid = validateStep1();
        break;
      case 1:
        isValid = validateStep2();
        break;
      case 2:
        isValid = validateStep3();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };
  
  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };
  
  // Handle document creation
  const handleCreateDocument = async () => {
    if (!selectedTemplate) return;
    
    setCreating(true);
    setCreateError(null);
    
    try {
      const options: DocumentGenerationOptions = {
        templateId: selectedTemplate.id,
        name: documentName,
        description: documentDescription,
        variables: variableValues,
        signatories: signatories.map(({ userId, name, email, role, order }) => ({
          userId,
          name,
          email,
          role,
          order
        })),
        tags: documentTags,
        visibility: documentVisibility,
        expiresAt: expirationDate || undefined
      };
      
      const document = await createDocument(options);
      
      // Navigate to the document view page
      navigate(`/documents/${document.id}`);
    } catch (error) {
      console.error('Error creating document:', error);
      setCreateError('Failed to create document. Please try again.');
    } finally {
      setCreating(false);
    }
  };
  
  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Select a Template
            </Typography>
            
            {templatesLoading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : templatesError ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                Error loading templates. Please try again.
              </Alert>
            ) : (
              <Autocomplete
                options={templates}
                getOptionLabel={(option) => option.name}
                renderOption={(props, option) => (
                  <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Typography variant="body1">{option.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {option.description}
                      </Typography>
                    </Box>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Template"
                    error={!!errors.template}
                    helperText={errors.template}
                    fullWidth
                  />
                )}
                value={selectedTemplate}
                onChange={(_, newValue) => handleTemplateSelect(newValue)}
                sx={{ mb: 2 }}
              />
            )}
            
            {selectedTemplate && (
              <Card variant="outlined" sx={{ mt: 2 }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    {selectedTemplate.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" paragraph>
                    {selectedTemplate.description}
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle2" gutterBottom>
                    Variables:
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {selectedTemplate.variables.map((variable) => (
                      <Chip key={variable} label={variable} size="small" />
                    ))}
                  </Box>
                </CardContent>
              </Card>
            )}
          </Box>
        );
      
      case 1:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Document Details
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  label="Document Name"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  fullWidth
                  required
                  error={!!errors.documentName}
                  helperText={errors.documentName}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  label="Description"
                  value={documentDescription}
                  onChange={(e) => setDocumentDescription(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  required
                  error={!!errors.documentDescription}
                  helperText={errors.documentDescription}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Visibility</InputLabel>
                  <Select
                    value={documentVisibility}
                    onChange={(e) => setDocumentVisibility(e.target.value as DocumentVisibility)}
                    label="Visibility"
                  >
                    <MenuItem value={DocumentVisibility.PRIVATE}>Private</MenuItem>
                    <MenuItem value={DocumentVisibility.SHARED}>Shared</MenuItem>
                    <MenuItem value={DocumentVisibility.PUBLIC}>Public</MenuItem>
                  </Select>
                  <FormHelperText>
                    Who can view this document
                  </FormHelperText>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expiration Date"
                  type="date"
                  value={expirationDate}
                  onChange={(e) => setExpirationDate(e.target.value)}
                  fullWidth
                  InputLabelProps={{
                    shrink: true,
                  }}
                  helperText="Optional: When this document expires"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Tags
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                  <TextField
                    label="Add Tag"
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    size="small"
                    sx={{ mr: 1 }}
                  />
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={handleAddTag}
                    disabled={!newTag.trim()}
                  >
                    Add
                  </Button>
                </Box>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {documentTags.map((tag) => (
                    <Chip
                      key={tag}
                      label={tag}
                      onDelete={() => handleRemoveTag(tag)}
                      size="small"
                    />
                  ))}
                </Box>
              </Grid>
            </Grid>
            
            <Divider sx={{ my: 3 }} />
            
            <Typography variant="h6" gutterBottom>
              Template Variables
            </Typography>
            
            {selectedTemplate && (
              <Grid container spacing={2}>
                {selectedTemplate.variables.map((variable) => (
                  <Grid item xs={12} sm={6} key={variable}>
                    <TextField
                      label={variable}
                      value={variableValues[variable] || ''}
                      onChange={(e) => handleVariableChange(variable, e.target.value)}
                      fullWidth
                      required
                      error={!!(errors.variables && errors.variables[variable])}
                      helperText={errors.variables && errors.variables[variable]}
                    />
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        );
      
      case 2:
        return (
          <Box sx={{ mt: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="h6">
                Signatories
              </Typography>
              <Button
                variant="outlined"
                startIcon={<AddIcon />}
                onClick={handleAddSignatory}
              >
                Add Signatory
              </Button>
            </Box>
            
            {errors.signatories && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {errors.signatories}
              </Alert>
            )}
            
            {signatories.map((signatory, index) => (
              <Paper key={index} sx={{ p: 2, mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1">
                    Signatory #{index + 1}
                  </Typography>
                  {index > 0 && (
                    <IconButton
                      color="error"
                      onClick={() => handleRemoveSignatory(index)}
                      size="small"
                    >
                      <RemoveIcon />
                    </IconButton>
                  )}
                </Box>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Name"
                      value={signatory.name}
                      onChange={(e) => handleSignatoryChange(index, 'name', e.target.value)}
                      fullWidth
                      required
                      disabled={index === 0} // Disable for current user
                    />
                  </Grid>
                  
                  <Grid item xs={12} sm={6}>
                    <TextField
                      label="Email"
                      value={signatory.email}
                      onChange={(e) => handleSignatoryChange(index, 'email', e.target.value)}
                      fullWidth
                      required
                      disabled={index === 0} // Disable for current user
                    />
                  </Grid>
                  
                  <Grid item xs={12}>
                    <TextField
                      label="Role"
                      value={signatory.role}
                      onChange={(e) => handleSignatoryChange(index, 'role', e.target.value)}
                      fullWidth
                      required
                    />
                  </Grid>
                </Grid>
              </Paper>
            ))}
          </Box>
        );
      
      case 3:
        return (
          <Box sx={{ mt: 2 }}>
            <Typography variant="h6" gutterBottom>
              Review Document
            </Typography>
            
            <Paper sx={{ p: 3, mb: 3 }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Template
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedTemplate?.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Document Type
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {selectedTemplate?.documentType}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Document Name
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {documentName}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Description
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {documentDescription}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Visibility
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {documentVisibility}
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Expiration Date
                  </Typography>
                  <Typography variant="body1" gutterBottom>
                    {expirationDate || 'None'}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Tags
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {documentTags.length > 0 ? (
                      documentTags.map((tag) => (
                        <Chip key={tag} label={tag} size="small" />
                      ))
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        No tags
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Template Variables
                  </Typography>
                  <Grid container spacing={2} sx={{ mt: 1 }}>
                    {selectedTemplate?.variables.map((variable) => (
                      <Grid item xs={12} sm={6} key={variable}>
                        <Typography variant="body2" color="text.secondary">
                          {variable}
                        </Typography>
                        <Typography variant="body1" gutterBottom>
                          {variableValues[variable]}
                        </Typography>
                      </Grid>
                    ))}
                  </Grid>
                </Grid>
                
                <Grid item xs={12}>
                  <Divider sx={{ my: 1 }} />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Signatories ({signatories.length})
                  </Typography>
                  {signatories.map((signatory, index) => (
                    <Box key={index} sx={{ mt: 1 }}>
                      <Typography variant="body2">
                        {index + 1}. {signatory.name} ({signatory.email}) - {signatory.role}
                      </Typography>
                    </Box>
                  ))}
                </Grid>
              </Grid>
            </Paper>
            
            {createError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {createError}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                disabled={creating}
              >
                Preview Document
              </Button>
              
              <Box>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleCreateDocument}
                  disabled={creating}
                  startIcon={creating ? <CircularProgress size={20} /> : <SaveIcon />}
                  sx={{ mr: 1 }}
                >
                  {creating ? 'Creating...' : 'Create Document'}
                </Button>
                
                <Button
                  variant="contained"
                  color="success"
                  onClick={handleCreateDocument}
                  disabled={creating}
                  startIcon={creating ? <CircularProgress size={20} /> : <SendIcon />}
                >
                  Create & Send for Signature
                </Button>
              </Box>
            </Box>
          </Box>
        );
      
      default:
        return 'Unknown step';
    }
  };
  
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate('/documents')} sx={{ mr: 1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Typography variant="h4" component="h1">
          Create Document
        </Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box sx={{ mt: 4, mb: 2 }}>
          {getStepContent(activeStep)}
        </Box>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 2 }}>
          <Button
            variant="outlined"
            onClick={handleBack}
            disabled={activeStep === 0 || creating}
          >
            Back
          </Button>
          
          {activeStep < steps.length - 1 && (
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                (activeStep === 0 && !selectedTemplate) ||
                templateLoading ||
                creating
              }
            >
              Next
            </Button>
          )}
        </Box>
      </Paper>
    </Container>
  );
};

export default DocumentCreate; 