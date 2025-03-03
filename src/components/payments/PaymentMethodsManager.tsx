import React, { useState } from 'react';
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
  DialogContentText,
  DialogTitle,
  Divider,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemSecondaryAction,
  ListItemText,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import {
  Add as AddIcon,
  CreditCard as CreditCardIcon,
  AccountBalance as BankIcon,
  Payment as PayPalIcon,
  CurrencyBitcoin as CryptoIcon,
  Delete as DeleteIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { usePayments } from '../../hooks/usePayments';
import { PaymentMethod } from '../../services/PaymentService';
import { useSnackbar } from '../../hooks/useSnackbar';

interface PaymentMethodFormData {
  type: PaymentMethod;
  cardNumber?: string;
  cardholderName?: string;
  expiryDate?: string;
  cvv?: string;
  accountNumber?: string;
  routingNumber?: string;
  bankName?: string;
  email?: string;
  walletAddress?: string;
}

const initialFormData: PaymentMethodFormData = {
  type: 'credit_card',
  cardNumber: '',
  cardholderName: '',
  expiryDate: '',
  cvv: '',
  accountNumber: '',
  routingNumber: '',
  bankName: '',
  email: '',
  walletAddress: ''
};

const PaymentMethodsManager: React.FC = () => {
  const { 
    paymentMethods, 
    isLoadingPaymentMethods, 
    isProcessingPayment,
    addPaymentMethod, 
    removePaymentMethod 
  } = usePayments();
  
  const { snackbarState, showSnackbar, hideSnackbar } = useSnackbar();
  
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedMethodId, setSelectedMethodId] = useState<string | null>(null);
  const [formData, setFormData] = useState<PaymentMethodFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleOpenAddDialog = () => {
    setFormData(initialFormData);
    setFormErrors({});
    setOpenAddDialog(true);
  };

  const handleCloseAddDialog = () => {
    setOpenAddDialog(false);
  };

  const handleOpenDeleteDialog = (methodId: string) => {
    setSelectedMethodId(methodId);
    setOpenDeleteDialog(true);
  };

  const handleCloseDeleteDialog = () => {
    setOpenDeleteDialog(false);
    setSelectedMethodId(null);
  };

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const { name, value } = e.target;
    if (name) {
      setFormData(prev => ({
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

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    // Validate based on payment method type
    switch (formData.type) {
      case 'credit_card':
        if (!formData.cardNumber) errors.cardNumber = 'Card number is required';
        else if (!/^\d{16}$/.test(formData.cardNumber)) errors.cardNumber = 'Invalid card number format';
        
        if (!formData.cardholderName) errors.cardholderName = 'Cardholder name is required';
        
        if (!formData.expiryDate) errors.expiryDate = 'Expiry date is required';
        else if (!/^(0[1-9]|1[0-2])\/\d{2}$/.test(formData.expiryDate)) 
          errors.expiryDate = 'Invalid format (MM/YY)';
        
        if (!formData.cvv) errors.cvv = 'CVV is required';
        else if (!/^\d{3,4}$/.test(formData.cvv)) errors.cvv = 'Invalid CVV format';
        break;
        
      case 'bank_transfer':
        if (!formData.accountNumber) errors.accountNumber = 'Account number is required';
        if (!formData.routingNumber) errors.routingNumber = 'Routing number is required';
        if (!formData.bankName) errors.bankName = 'Bank name is required';
        break;
        
      case 'paypal':
        if (!formData.email) errors.email = 'Email is required';
        else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) 
          errors.email = 'Invalid email format';
        break;
        
      case 'crypto':
        if (!formData.walletAddress) errors.walletAddress = 'Wallet address is required';
        break;
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleAddPaymentMethod = async () => {
    if (!validateForm()) return;
    
    try {
      // Extract relevant details based on payment method type
      const details: any = {};
      
      switch (formData.type) {
        case 'credit_card':
          details.cardNumber = formData.cardNumber;
          details.cardholderName = formData.cardholderName;
          details.expiryDate = formData.expiryDate;
          details.cvv = formData.cvv;
          break;
          
        case 'bank_transfer':
          details.accountNumber = formData.accountNumber;
          details.routingNumber = formData.routingNumber;
          details.bankName = formData.bankName;
          break;
          
        case 'paypal':
          details.email = formData.email;
          break;
          
        case 'crypto':
          details.walletAddress = formData.walletAddress;
          break;
      }
      
      await addPaymentMethod(formData.type, details);
      handleCloseAddDialog();
    } catch (error) {
      console.error('Error adding payment method:', error);
    }
  };

  const handleDeletePaymentMethod = async () => {
    if (selectedMethodId) {
      try {
        await removePaymentMethod(selectedMethodId);
        handleCloseDeleteDialog();
      } catch (error) {
        console.error('Error removing payment method:', error);
      }
    }
  };

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'credit_card':
        return <CreditCardIcon />;
      case 'bank_transfer':
        return <BankIcon />;
      case 'paypal':
        return <PayPalIcon />;
      case 'crypto':
        return <CryptoIcon />;
      default:
        return <PaymentIcon />;
    }
  };

  const getPaymentMethodLabel = (method: PaymentMethod): string => {
    switch (method) {
      case 'credit_card':
        return 'Credit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'paypal':
        return 'PayPal';
      case 'crypto':
        return 'Cryptocurrency';
      default:
        return 'Other';
    }
  };

  const renderPaymentMethodForm = () => {
    switch (formData.type) {
      case 'credit_card':
        return (
          <>
            <TextField
              margin="dense"
              name="cardNumber"
              label="Card Number"
              type="text"
              fullWidth
              value={formData.cardNumber}
              onChange={handleFormChange}
              error={!!formErrors.cardNumber}
              helperText={formErrors.cardNumber}
              inputProps={{ maxLength: 16 }}
            />
            <TextField
              margin="dense"
              name="cardholderName"
              label="Cardholder Name"
              type="text"
              fullWidth
              value={formData.cardholderName}
              onChange={handleFormChange}
              error={!!formErrors.cardholderName}
              helperText={formErrors.cardholderName}
            />
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="expiryDate"
                  label="Expiry Date (MM/YY)"
                  type="text"
                  fullWidth
                  value={formData.expiryDate}
                  onChange={handleFormChange}
                  error={!!formErrors.expiryDate}
                  helperText={formErrors.expiryDate}
                  inputProps={{ maxLength: 5 }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  margin="dense"
                  name="cvv"
                  label="CVV"
                  type="password"
                  fullWidth
                  value={formData.cvv}
                  onChange={handleFormChange}
                  error={!!formErrors.cvv}
                  helperText={formErrors.cvv}
                  inputProps={{ maxLength: 4 }}
                />
              </Grid>
            </Grid>
          </>
        );
        
      case 'bank_transfer':
        return (
          <>
            <TextField
              margin="dense"
              name="bankName"
              label="Bank Name"
              type="text"
              fullWidth
              value={formData.bankName}
              onChange={handleFormChange}
              error={!!formErrors.bankName}
              helperText={formErrors.bankName}
            />
            <TextField
              margin="dense"
              name="accountNumber"
              label="Account Number"
              type="text"
              fullWidth
              value={formData.accountNumber}
              onChange={handleFormChange}
              error={!!formErrors.accountNumber}
              helperText={formErrors.accountNumber}
            />
            <TextField
              margin="dense"
              name="routingNumber"
              label="Routing Number"
              type="text"
              fullWidth
              value={formData.routingNumber}
              onChange={handleFormChange}
              error={!!formErrors.routingNumber}
              helperText={formErrors.routingNumber}
            />
          </>
        );
        
      case 'paypal':
        return (
          <TextField
            margin="dense"
            name="email"
            label="PayPal Email"
            type="email"
            fullWidth
            value={formData.email}
            onChange={handleFormChange}
            error={!!formErrors.email}
            helperText={formErrors.email}
          />
        );
        
      case 'crypto':
        return (
          <TextField
            margin="dense"
            name="walletAddress"
            label="Wallet Address"
            type="text"
            fullWidth
            value={formData.walletAddress}
            onChange={handleFormChange}
            error={!!formErrors.walletAddress}
            helperText={formErrors.walletAddress}
          />
        );
        
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader 
        title="Payment Methods" 
        action={
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={handleOpenAddDialog}
          >
            Add Method
          </Button>
        }
      />
      <Divider />
      <CardContent>
        {isLoadingPaymentMethods ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress />
          </Box>
        ) : paymentMethods.length === 0 ? (
          <Typography variant="body1" color="textSecondary" align="center" p={2}>
            No payment methods added yet. Click "Add Method" to add your first payment method.
          </Typography>
        ) : (
          <List>
            {paymentMethods.map((method, index) => (
              <React.Fragment key={index}>
                <ListItem>
                  <ListItemIcon>
                    {getPaymentMethodIcon(method)}
                  </ListItemIcon>
                  <ListItemText 
                    primary={getPaymentMethodLabel(method)} 
                    secondary={`Added on ${new Date().toLocaleDateString()}`} 
                  />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="delete"
                      onClick={() => handleOpenDeleteDialog(`method-${index}`)}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
                {index < paymentMethods.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </List>
        )}
      </CardContent>

      {/* Add Payment Method Dialog */}
      <Dialog open={openAddDialog} onClose={handleCloseAddDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Add Payment Method</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="dense">
            <InputLabel id="payment-method-type-label">Payment Method Type</InputLabel>
            <Select
              labelId="payment-method-type-label"
              name="type"
              value={formData.type}
              onChange={handleFormChange}
              label="Payment Method Type"
            >
              <MenuItem value="credit_card">Credit Card</MenuItem>
              <MenuItem value="bank_transfer">Bank Transfer</MenuItem>
              <MenuItem value="paypal">PayPal</MenuItem>
              <MenuItem value="crypto">Cryptocurrency</MenuItem>
            </Select>
          </FormControl>
          
          {renderPaymentMethodForm()}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseAddDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleAddPaymentMethod} 
            color="primary" 
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? <CircularProgress size={24} /> : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Payment Method Dialog */}
      <Dialog open={openDeleteDialog} onClose={handleCloseDeleteDialog}>
        <DialogTitle>Remove Payment Method</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to remove this payment method? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleDeletePaymentMethod} 
            color="error" 
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? <CircularProgress size={24} /> : 'Remove'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbarState.open}
        autoHideDuration={snackbarState.autoHideDuration}
        onClose={hideSnackbar}
      >
        <Alert onClose={hideSnackbar} severity={snackbarState.severity}>
          {snackbarState.message}
        </Alert>
      </Snackbar>
    </Card>
  );
};

export default PaymentMethodsManager; 