import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Chip,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Cancel as CancelIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Error as ErrorIcon,
  Payment as PaymentIcon
} from '@mui/icons-material';
import { usePayments } from '../../hooks/usePayments';
import { PaymentStatus, EscrowStatus } from '../../services/PaymentService';
import PaymentMethodsManager from '../../components/payments/PaymentMethodsManager';
import EscrowCreator from '../../components/payments/EscrowCreator';

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
      id={`payments-tabpanel-${index}`}
      aria-labelledby={`payments-tab-${index}`}
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

const a11yProps = (index: number) => {
  return {
    id: `payments-tab-${index}`,
    'aria-controls': `payments-tabpanel-${index}`,
  };
};

const getPaymentStatusChip = (status: PaymentStatus) => {
  switch (status) {
    case 'completed':
      return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" />;
    case 'pending':
      return <Chip icon={<ScheduleIcon />} label="Pending" color="warning" size="small" />;
    case 'processing':
      return <Chip icon={<ScheduleIcon />} label="Processing" color="info" size="small" />;
    case 'failed':
      return <Chip icon={<ErrorIcon />} label="Failed" color="error" size="small" />;
    case 'refunded':
      return <Chip icon={<PaymentIcon />} label="Refunded" color="secondary" size="small" />;
    case 'cancelled':
      return <Chip icon={<CancelIcon />} label="Cancelled" color="default" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

const getEscrowStatusChip = (status: EscrowStatus) => {
  switch (status) {
    case 'completed':
      return <Chip icon={<CheckCircleIcon />} label="Completed" color="success" size="small" />;
    case 'created':
      return <Chip icon={<ScheduleIcon />} label="Created" color="default" size="small" />;
    case 'funded':
      return <Chip icon={<PaymentIcon />} label="Funded" color="primary" size="small" />;
    case 'in_progress':
      return <Chip icon={<ScheduleIcon />} label="In Progress" color="info" size="small" />;
    case 'disputed':
      return <Chip icon={<ErrorIcon />} label="Disputed" color="error" size="small" />;
    case 'refunded':
      return <Chip icon={<PaymentIcon />} label="Refunded" color="secondary" size="small" />;
    case 'cancelled':
      return <Chip icon={<CancelIcon />} label="Cancelled" color="default" size="small" />;
    default:
      return <Chip label={status} size="small" />;
  }
};

const PaymentsPage: React.FC = () => {
  const {
    payments,
    escrows,
    isLoadingPayments,
    isLoadingEscrows,
    isProcessingPayment,
    isProcessingEscrow,
    totalPayments,
    totalEscrows,
    fetchPayments,
    fetchEscrows,
    cancelPayment,
    cancelEscrow
  } = usePayments();

  const [tabValue, setTabValue] = useState(0);
  const [paymentsPage, setPaymentsPage] = useState(0);
  const [paymentsRowsPerPage, setPaymentsRowsPerPage] = useState(10);
  const [escrowsPage, setEscrowsPage] = useState(0);
  const [escrowsRowsPerPage, setEscrowsRowsPerPage] = useState(10);
  const [cancelPaymentDialogOpen, setCancelPaymentDialogOpen] = useState(false);
  const [cancelEscrowDialogOpen, setCancelEscrowDialogOpen] = useState(false);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);
  const [selectedEscrowId, setSelectedEscrowId] = useState<string | null>(null);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handlePaymentsPageChange = (event: unknown, newPage: number) => {
    setPaymentsPage(newPage);
    fetchPayments(newPage + 1, paymentsRowsPerPage);
  };

  const handlePaymentsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setPaymentsRowsPerPage(newRowsPerPage);
    setPaymentsPage(0);
    fetchPayments(1, newRowsPerPage);
  };

  const handleEscrowsPageChange = (event: unknown, newPage: number) => {
    setEscrowsPage(newPage);
    fetchEscrows(newPage + 1, escrowsRowsPerPage);
  };

  const handleEscrowsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRowsPerPage = parseInt(event.target.value, 10);
    setEscrowsRowsPerPage(newRowsPerPage);
    setEscrowsPage(0);
    fetchEscrows(1, newRowsPerPage);
  };

  const handleOpenCancelPaymentDialog = (paymentId: string) => {
    setSelectedPaymentId(paymentId);
    setCancelPaymentDialogOpen(true);
  };

  const handleCloseCancelPaymentDialog = () => {
    setCancelPaymentDialogOpen(false);
    setSelectedPaymentId(null);
  };

  const handleCancelPayment = async () => {
    if (selectedPaymentId) {
      await cancelPayment(selectedPaymentId);
      handleCloseCancelPaymentDialog();
    }
  };

  const handleOpenCancelEscrowDialog = (escrowId: string) => {
    setSelectedEscrowId(escrowId);
    setCancelEscrowDialogOpen(true);
  };

  const handleCloseCancelEscrowDialog = () => {
    setCancelEscrowDialogOpen(false);
    setSelectedEscrowId(null);
  };

  const handleCancelEscrow = async () => {
    if (selectedEscrowId) {
      await cancelEscrow(selectedEscrowId);
      handleCloseCancelEscrowDialog();
    }
  };

  const handleViewPayment = (paymentId: string) => {
    // Navigate to payment details page
    console.log('View payment:', paymentId);
  };

  const handleViewEscrow = (escrowId: string) => {
    // Navigate to escrow details page
    console.log('View escrow:', escrowId);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom>
        Payments & Escrow
      </Typography>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label="Payments" {...a11yProps(0)} />
          <Tab label="Payment Methods" {...a11yProps(1)} />
          <Tab label="Escrow Agreements" {...a11yProps(2)} />
          <Tab label="Create Escrow" {...a11yProps(3)} />
        </Tabs>
        
        {/* Payments Tab */}
        <TabPanel value={tabValue} index={0}>
          <Card>
            <CardHeader title="Payment History" />
            <Divider />
            <CardContent>
              {isLoadingPayments ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : payments.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center" p={2}>
                  No payments found.
                </Typography>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Description</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Method</TableCell>
                          <TableCell>Date</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{payment.id}</TableCell>
                            <TableCell>{payment.description}</TableCell>
                            <TableCell align="right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: payment.currency
                              }).format(payment.amount)}
                            </TableCell>
                            <TableCell>{payment.method}</TableCell>
                            <TableCell>
                              {new Date(payment.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getPaymentStatusChip(payment.status)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleViewPayment(payment.id)}
                                aria-label="view"
                              >
                                <VisibilityIcon />
                              </IconButton>
                              {payment.status === 'pending' && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCancelPaymentDialog(payment.id)}
                                  aria-label="cancel"
                                >
                                  <CancelIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalPayments}
                    rowsPerPage={paymentsRowsPerPage}
                    page={paymentsPage}
                    onPageChange={handlePaymentsPageChange}
                    onRowsPerPageChange={handlePaymentsRowsPerPageChange}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabPanel>
        
        {/* Payment Methods Tab */}
        <TabPanel value={tabValue} index={1}>
          <PaymentMethodsManager />
        </TabPanel>
        
        {/* Escrow Agreements Tab */}
        <TabPanel value={tabValue} index={2}>
          <Card>
            <CardHeader title="Escrow Agreements" />
            <Divider />
            <CardContent>
              {isLoadingEscrows ? (
                <Box display="flex" justifyContent="center" p={2}>
                  <CircularProgress />
                </Box>
              ) : escrows.length === 0 ? (
                <Typography variant="body1" color="textSecondary" align="center" p={2}>
                  No escrow agreements found.
                </Typography>
              ) : (
                <>
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell>ID</TableCell>
                          <TableCell>Title</TableCell>
                          <TableCell>Recipient</TableCell>
                          <TableCell align="right">Amount</TableCell>
                          <TableCell>Created</TableCell>
                          <TableCell>Status</TableCell>
                          <TableCell align="center">Actions</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {escrows.map((escrow) => (
                          <TableRow key={escrow.id}>
                            <TableCell>{escrow.id}</TableCell>
                            <TableCell>{escrow.title}</TableCell>
                            <TableCell>{escrow.recipientName}</TableCell>
                            <TableCell align="right">
                              {new Intl.NumberFormat('en-US', {
                                style: 'currency',
                                currency: escrow.currency
                              }).format(escrow.totalAmount)}
                            </TableCell>
                            <TableCell>
                              {new Date(escrow.createdAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                              {getEscrowStatusChip(escrow.status)}
                            </TableCell>
                            <TableCell align="center">
                              <IconButton
                                size="small"
                                onClick={() => handleViewEscrow(escrow.id)}
                                aria-label="view"
                              >
                                <VisibilityIcon />
                              </IconButton>
                              {(escrow.status === 'created' || escrow.status === 'funded') && (
                                <IconButton
                                  size="small"
                                  onClick={() => handleOpenCancelEscrowDialog(escrow.id)}
                                  aria-label="cancel"
                                >
                                  <CancelIcon />
                                </IconButton>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={totalEscrows}
                    rowsPerPage={escrowsRowsPerPage}
                    page={escrowsPage}
                    onPageChange={handleEscrowsPageChange}
                    onRowsPerPageChange={handleEscrowsRowsPerPageChange}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabPanel>
        
        {/* Create Escrow Tab */}
        <TabPanel value={tabValue} index={3}>
          <EscrowCreator />
        </TabPanel>
      </Paper>

      {/* Cancel Payment Dialog */}
      <Dialog
        open={cancelPaymentDialogOpen}
        onClose={handleCloseCancelPaymentDialog}
      >
        <DialogTitle>Cancel Payment</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this payment? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelPaymentDialog} color="primary">
            No, Keep It
          </Button>
          <Button 
            onClick={handleCancelPayment} 
            color="error" 
            disabled={isProcessingPayment}
          >
            {isProcessingPayment ? <CircularProgress size={24} /> : 'Yes, Cancel Payment'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Cancel Escrow Dialog */}
      <Dialog
        open={cancelEscrowDialogOpen}
        onClose={handleCloseCancelEscrowDialog}
      >
        <DialogTitle>Cancel Escrow Agreement</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to cancel this escrow agreement? This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCancelEscrowDialog} color="primary">
            No, Keep It
          </Button>
          <Button 
            onClick={handleCancelEscrow} 
            color="error" 
            disabled={isProcessingEscrow}
          >
            {isProcessingEscrow ? <CircularProgress size={24} /> : 'Yes, Cancel Escrow'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default PaymentsPage; 