import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  SelectChangeEvent,
  Stepper,
  Step,
  StepLabel,
  TextField,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon
} from '@mui/icons-material';
import { usePayments } from '../../hooks/usePayments';
import { CreateEscrowRequest, MilestoneDetails } from '../../services/PaymentService';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, addDays } from 'date-fns';

interface MilestoneFormData {
  title: string;
  description: string;
  amount: number;
  dueDate: Date;
}

interface EscrowFormData {
  title: string;
  description: string;
  recipientId: string;
  totalAmount: number;
  currency: string;
  documentId?: string;
  milestones: MilestoneFormData[];
}

const initialMilestoneData: MilestoneFormData = {
  title: '',
  description: '',
  amount: 0,
  dueDate: addDays(new Date(), 30)
};

const initialEscrowData: EscrowFormData = {
  title: '',
  description: '',
  recipientId: '',
  totalAmount: 0,
  currency: 'USD',
  documentId: '',
  milestones: []
};

// Mock recipient data for development
const mockRecipients = [
  { id: 'user-entrepreneur-1', name: 'Jane Founder' },
  { id: 'user-entrepreneur-2', name: 'Mike Startup' },
  { id: 'user-entrepreneur-3', name: 'Sarah Tech' }
];

// Mock document data for development
const mockDocuments = [
  { id: 'doc-investment-1', title: 'Seed Investment Agreement' },
  { id: 'doc-investment-2', title: 'Angel Investment Contract' },
  { id: 'doc-investment-3', title: 'Series A Term Sheet' }
];

const EscrowCreator: React.FC = () => {
  const { createEscrow, isProcessingEscrow } = usePayments();
  
  const [activeStep, setActiveStep] = useState(0);
  const [escrowData, setEscrowData] = useState<EscrowFormData>(initialEscrowData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [openMilestoneDialog, setOpenMilestoneDialog] = useState(false);
  const [currentMilestone, setCurrentMilestone] = useState<MilestoneFormData>(initialMilestoneData);
  const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successDialogOpen, setSuccessDialogOpen] = useState(false);
  const [createdEscrowId, setCreatedEscrowId] = useState<string | null>(null);

  const steps = ['Basic Information', 'Milestones', 'Review & Create'];

  // Handle form field changes
  const handleEscrowDataChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setEscrowData(prev => ({
        ...prev,
        [name]: value
      }));
      
      // Clear error when field is updated
      if (formErrors[name]) {
        setFormErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[name];
          return newErrors;
        });
      }
    }
  };

  // Handle currency and recipient selection
  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    const { name, value } = e.target;
    setEscrowData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Open milestone dialog for adding a new milestone
  const handleAddMilestone = () => {
    setCurrentMilestone({
      ...initialMilestoneData,
      dueDate: addDays(new Date(), 30)
    });
    setEditingMilestoneIndex(null);
    setOpenMilestoneDialog(true);
  };

  // Open milestone dialog for editing an existing milestone
  const handleEditMilestone = (index: number) => {
    setCurrentMilestone(escrowData.milestones[index]);
    setEditingMilestoneIndex(index);
    setOpenMilestoneDialog(true);
  };

  // Delete a milestone
  const handleDeleteMilestone = (index: number) => {
    const updatedMilestones = [...escrowData.milestones];
    updatedMilestones.splice(index, 1);
    
    setEscrowData(prev => ({
      ...prev,
      milestones: updatedMilestones
    }));
    
    // Recalculate total amount
    const newTotalAmount = updatedMilestones.reduce((sum, milestone) => sum + milestone.amount, 0);
    setEscrowData(prev => ({
      ...prev,
      totalAmount: newTotalAmount
    }));
  };

  // Handle milestone form field changes
  const handleMilestoneChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setCurrentMilestone(prev => ({
        ...prev,
        [name]: name === 'amount' ? Number(value) : value
      }));
    }
  };

  // Handle milestone due date change
  const handleDueDateChange = (date: Date | null) => {
    if (date) {
      setCurrentMilestone(prev => ({
        ...prev,
        dueDate: date
      }));
    }
  };

  // Save milestone data
  const handleSaveMilestone = () => {
    // Validate milestone data
    const errors: Record<string, string> = {};
    if (!currentMilestone.title) errors.milestoneTitle = 'Title is required';
    if (!currentMilestone.description) errors.milestoneDescription = 'Description is required';
    if (currentMilestone.amount <= 0) errors.milestoneAmount = 'Amount must be greater than 0';
    
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    let updatedMilestones: MilestoneFormData[];
    
    if (editingMilestoneIndex !== null) {
      // Update existing milestone
      updatedMilestones = [...escrowData.milestones];
      updatedMilestones[editingMilestoneIndex] = currentMilestone;
    } else {
      // Add new milestone
      updatedMilestones = [...escrowData.milestones, currentMilestone];
    }
    
    // Update escrow data with new milestones
    setEscrowData(prev => ({
      ...prev,
      milestones: updatedMilestones
    }));
    
    // Recalculate total amount
    const newTotalAmount = updatedMilestones.reduce((sum, milestone) => sum + milestone.amount, 0);
    setEscrowData(prev => ({
      ...prev,
      totalAmount: newTotalAmount
    }));
    
    // Close dialog
    setOpenMilestoneDialog(false);
    setFormErrors({});
  };

  // Validate current step
  const validateStep = (): boolean => {
    const errors: Record<string, string> = {};
    
    switch (activeStep) {
      case 0: // Basic Information
        if (!escrowData.title) errors.title = 'Title is required';
        if (!escrowData.description) errors.description = 'Description is required';
        if (!escrowData.recipientId) errors.recipientId = 'Recipient is required';
        break;
        
      case 1: // Milestones
        if (escrowData.milestones.length === 0) {
          errors.milestones = 'At least one milestone is required';
        }
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle next step
  const handleNext = () => {
    if (validateStep()) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  // Handle back step
  const handleBack = () => {
    setActiveStep(prevStep => prevStep - 1);
  };

  // Handle escrow creation
  const handleCreateEscrow = async () => {
    try {
      setIsSubmitting(true);
      
      // Prepare escrow request data
      const escrowRequest: CreateEscrowRequest = {
        title: escrowData.title,
        description: escrowData.description,
        recipientId: escrowData.recipientId,
        totalAmount: escrowData.totalAmount,
        currency: escrowData.currency,
        documentId: escrowData.documentId || undefined,
        milestones: escrowData.milestones.map(milestone => ({
          title: milestone.title,
          description: milestone.description,
          amount: milestone.amount,
          dueDate: milestone.dueDate.toISOString()
        }))
      };
      
      // Create escrow
      const result = await createEscrow(escrowRequest);
      
      // Show success dialog
      setCreatedEscrowId(result.id);
      setSuccessDialogOpen(true);
      setIsSubmitting(false);
    } catch (error) {
      console.error('Error creating escrow:', error);
      setIsSubmitting(false);
    }
  };

  // Handle reset form
  const handleReset = () => {
    setEscrowData(initialEscrowData);
    setActiveStep(0);
    setFormErrors({});
    setSuccessDialogOpen(false);
    setCreatedEscrowId(null);
  };

  // Render step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Escrow Title"
                fullWidth
                value={escrowData.title}
                onChange={handleEscrowDataChange}
                error={!!formErrors.title}
                helperText={formErrors.title}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={4}
                value={escrowData.description}
                onChange={handleEscrowDataChange}
                error={!!formErrors.description}
                helperText={formErrors.description}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth error={!!formErrors.recipientId}>
                <InputLabel id="recipient-label">Recipient</InputLabel>
                <Select
                  labelId="recipient-label"
                  name="recipientId"
                  value={escrowData.recipientId}
                  onChange={handleSelectChange}
                  label="Recipient"
                  required
                >
                  {mockRecipients.map(recipient => (
                    <MenuItem key={recipient.id} value={recipient.id}>
                      {recipient.name}
                    </MenuItem>
                  ))}
                </Select>
                {formErrors.recipientId && (
                  <Typography variant="caption" color="error">
                    {formErrors.recipientId}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel id="currency-label">Currency</InputLabel>
                <Select
                  labelId="currency-label"
                  name="currency"
                  value={escrowData.currency}
                  onChange={handleSelectChange}
                  label="Currency"
                >
                  <MenuItem value="USD">USD - US Dollar</MenuItem>
                  <MenuItem value="EUR">EUR - Euro</MenuItem>
                  <MenuItem value="GBP">GBP - British Pound</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel id="document-label">Associated Document (Optional)</InputLabel>
                <Select
                  labelId="document-label"
                  name="documentId"
                  value={escrowData.documentId || ''}
                  onChange={handleSelectChange}
                  label="Associated Document (Optional)"
                >
                  <MenuItem value="">None</MenuItem>
                  {mockDocuments.map(document => (
                    <MenuItem key={document.id} value={document.id}>
                      {document.title}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        );
        
      case 1:
        return (
          <>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h6">Milestones</Typography>
              <Button
                variant="contained"
                color="primary"
                startIcon={<AddIcon />}
                onClick={handleAddMilestone}
              >
                Add Milestone
              </Button>
            </Box>
            
            {formErrors.milestones && (
              <Typography variant="body2" color="error" mb={2}>
                {formErrors.milestones}
              </Typography>
            )}
            
            {escrowData.milestones.length === 0 ? (
              <Paper elevation={0} sx={{ p: 3, textAlign: 'center', bgcolor: 'background.default' }}>
                <Typography variant="body1" color="textSecondary">
                  No milestones added yet. Click "Add Milestone" to create your first milestone.
                </Typography>
              </Paper>
            ) : (
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                      <TableCell align="center">Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {escrowData.milestones.map((milestone, index) => (
                      <TableRow key={index}>
                        <TableCell>{milestone.title}</TableCell>
                        <TableCell>{milestone.description}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: escrowData.currency
                          }).format(milestone.amount)}
                        </TableCell>
                        <TableCell>{format(milestone.dueDate, 'MMM dd, yyyy')}</TableCell>
                        <TableCell align="center">
                          <IconButton
                            size="small"
                            onClick={() => handleEditMilestone(index)}
                            aria-label="edit"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteMilestone(index)}
                            aria-label="delete"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))}
                    <TableRow>
                      <TableCell colSpan={2} align="right">
                        <Typography variant="subtitle1" fontWeight="bold">
                          Total:
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="subtitle1" fontWeight="bold">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: escrowData.currency
                          }).format(escrowData.totalAmount)}
                        </Typography>
                      </TableCell>
                      <TableCell colSpan={2} />
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </>
        );
        
      case 2:
        return (
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Escrow Details
              </Typography>
              <Paper variant="outlined" sx={{ p: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Title:</Typography>
                    <Typography variant="body1">{escrowData.title}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Recipient:</Typography>
                    <Typography variant="body1">
                      {mockRecipients.find(r => r.id === escrowData.recipientId)?.name || 'Unknown'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2">Description:</Typography>
                    <Typography variant="body1">{escrowData.description}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Total Amount:</Typography>
                    <Typography variant="body1" fontWeight="bold">
                      {new Intl.NumberFormat('en-US', {
                        style: 'currency',
                        currency: escrowData.currency
                      }).format(escrowData.totalAmount)}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle2">Associated Document:</Typography>
                    <Typography variant="body1">
                      {escrowData.documentId
                        ? mockDocuments.find(d => d.id === escrowData.documentId)?.title || 'Unknown'
                        : 'None'}
                    </Typography>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
            
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Milestones
              </Typography>
              <TableContainer component={Paper} variant="outlined">
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Description</TableCell>
                      <TableCell align="right">Amount</TableCell>
                      <TableCell>Due Date</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {escrowData.milestones.map((milestone, index) => (
                      <TableRow key={index}>
                        <TableCell>{milestone.title}</TableCell>
                        <TableCell>{milestone.description}</TableCell>
                        <TableCell align="right">
                          {new Intl.NumberFormat('en-US', {
                            style: 'currency',
                            currency: escrowData.currency
                          }).format(milestone.amount)}
                        </TableCell>
                        <TableCell>{format(milestone.dueDate, 'MMM dd, yyyy')}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Grid>
          </Grid>
        );
        
      default:
        return 'Unknown step';
    }
  };

  return (
    <Card>
      <CardHeader title="Create Escrow Agreement" />
      <Divider />
      <CardContent>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map(label => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <Box>
          {getStepContent(activeStep)}
        </Box>
        
        <Box mt={4} display="flex" justifyContent="space-between">
          <Button
            disabled={activeStep === 0}
            onClick={handleBack}
          >
            Back
          </Button>
          <Box>
            {activeStep === steps.length - 1 ? (
              <Button
                variant="contained"
                color="primary"
                onClick={handleCreateEscrow}
                disabled={isSubmitting || isProcessingEscrow}
              >
                {isSubmitting || isProcessingEscrow ? (
                  <CircularProgress size={24} />
                ) : (
                  'Create Escrow'
                )}
              </Button>
            ) : (
              <Button
                variant="contained"
                color="primary"
                onClick={handleNext}
              >
                Next
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>

      {/* Milestone Dialog */}
      <Dialog open={openMilestoneDialog} onClose={() => setOpenMilestoneDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {editingMilestoneIndex !== null ? 'Edit Milestone' : 'Add Milestone'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={3} sx={{ mt: 0 }}>
            <Grid item xs={12}>
              <TextField
                name="title"
                label="Milestone Title"
                fullWidth
                value={currentMilestone.title}
                onChange={handleMilestoneChange}
                error={!!formErrors.milestoneTitle}
                helperText={formErrors.milestoneTitle}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                rows={3}
                value={currentMilestone.description}
                onChange={handleMilestoneChange}
                error={!!formErrors.milestoneDescription}
                helperText={formErrors.milestoneDescription}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                name="amount"
                label="Amount"
                type="number"
                fullWidth
                value={currentMilestone.amount}
                onChange={handleMilestoneChange}
                error={!!formErrors.milestoneAmount}
                helperText={formErrors.milestoneAmount}
                required
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      {escrowData.currency === 'USD' ? '$' : 
                       escrowData.currency === 'EUR' ? '€' : 
                       escrowData.currency === 'GBP' ? '£' : ''}
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker
                  label="Due Date"
                  value={currentMilestone.dueDate}
                  onChange={handleDueDateChange}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true
                    }
                  }}
                />
              </LocalizationProvider>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenMilestoneDialog(false)}>
            Cancel
          </Button>
          <Button onClick={handleSaveMilestone} variant="contained" color="primary">
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Success Dialog */}
      <Dialog open={successDialogOpen} onClose={() => setSuccessDialogOpen(false)}>
        <DialogTitle>Escrow Created Successfully</DialogTitle>
        <DialogContent>
          <Typography variant="body1" gutterBottom>
            Your escrow agreement has been created successfully.
          </Typography>
          <Typography variant="body2">
            Escrow ID: {createdEscrowId}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleReset} color="primary">
            Create Another
          </Button>
          <Button onClick={() => setSuccessDialogOpen(false)} variant="contained" color="primary">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Card>
  );
};

export default EscrowCreator; 