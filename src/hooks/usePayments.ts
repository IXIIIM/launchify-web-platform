import { useState, useEffect, useCallback } from 'react';
import PaymentService, { 
  PaymentDetails, 
  EscrowDetails, 
  PaymentMethod,
  CreatePaymentRequest,
  CreateEscrowRequest,
  MilestoneDetails
} from '../services/PaymentService';
import { useSnackbar } from './useSnackbar';

interface UsePaymentsState {
  payments: PaymentDetails[];
  escrows: EscrowDetails[];
  paymentMethods: PaymentMethod[];
  totalPayments: number;
  totalEscrows: number;
  isLoadingPayments: boolean;
  isLoadingEscrows: boolean;
  isLoadingPaymentMethods: boolean;
  isProcessingPayment: boolean;
  isProcessingEscrow: boolean;
  selectedPayment: PaymentDetails | null;
  selectedEscrow: EscrowDetails | null;
}

interface UsePaymentsReturn extends UsePaymentsState {
  // Payment methods
  fetchPaymentMethods: () => Promise<void>;
  addPaymentMethod: (method: PaymentMethod, details: any) => Promise<void>;
  removePaymentMethod: (methodId: string) => Promise<void>;
  
  // Payments
  fetchPayments: (page?: number, limit?: number) => Promise<void>;
  fetchPayment: (paymentId: string) => Promise<void>;
  createPayment: (paymentRequest: CreatePaymentRequest) => Promise<PaymentDetails>;
  cancelPayment: (paymentId: string) => Promise<void>;
  
  // Escrow
  fetchEscrows: (page?: number, limit?: number) => Promise<void>;
  fetchEscrow: (escrowId: string) => Promise<void>;
  createEscrow: (escrowRequest: CreateEscrowRequest) => Promise<EscrowDetails>;
  fundEscrow: (escrowId: string, paymentMethodId: string) => Promise<void>;
  cancelEscrow: (escrowId: string) => Promise<void>;
  
  // Milestones
  completeMilestone: (escrowId: string, milestoneId: string) => Promise<void>;
  disputeMilestone: (escrowId: string, milestoneId: string, reason: string) => Promise<void>;
  releaseMilestonePayment: (escrowId: string, milestoneId: string) => Promise<void>;
  
  // Utilities
  resetState: () => void;
}

export const usePayments = (): UsePaymentsReturn => {
  const { showSnackbar } = useSnackbar();
  
  const [state, setState] = useState<UsePaymentsState>({
    payments: [],
    escrows: [],
    paymentMethods: [],
    totalPayments: 0,
    totalEscrows: 0,
    isLoadingPayments: false,
    isLoadingEscrows: false,
    isLoadingPaymentMethods: false,
    isProcessingPayment: false,
    isProcessingEscrow: false,
    selectedPayment: null,
    selectedEscrow: null
  });

  const resetState = useCallback(() => {
    setState({
      payments: [],
      escrows: [],
      paymentMethods: [],
      totalPayments: 0,
      totalEscrows: 0,
      isLoadingPayments: false,
      isLoadingEscrows: false,
      isLoadingPaymentMethods: false,
      isProcessingPayment: false,
      isProcessingEscrow: false,
      selectedPayment: null,
      selectedEscrow: null
    });
  }, []);

  // Payment Methods
  const fetchPaymentMethods = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoadingPaymentMethods: true }));
      
      // For development, use mock data
      // In production, this would use the actual API call
      // const paymentMethods = await PaymentService.getPaymentMethods();
      const paymentMethods = PaymentService.getMockPaymentMethods();
      
      setState(prev => ({
        ...prev,
        paymentMethods,
        isLoadingPaymentMethods: false
      }));
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      showSnackbar('Failed to load payment methods', 'error');
      setState(prev => ({ ...prev, isLoadingPaymentMethods: false }));
    }
  }, [showSnackbar]);

  const addPaymentMethod = useCallback(async (method: PaymentMethod, details: any) => {
    try {
      setState(prev => ({ ...prev, isProcessingPayment: true }));
      await PaymentService.addPaymentMethod(method, details);
      
      // Refresh payment methods
      await fetchPaymentMethods();
      
      showSnackbar('Payment method added successfully', 'success');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    } catch (error) {
      console.error('Error adding payment method:', error);
      showSnackbar('Failed to add payment method', 'error');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    }
  }, [fetchPaymentMethods, showSnackbar]);

  const removePaymentMethod = useCallback(async (methodId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingPayment: true }));
      await PaymentService.removePaymentMethod(methodId);
      
      // Refresh payment methods
      await fetchPaymentMethods();
      
      showSnackbar('Payment method removed successfully', 'success');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    } catch (error) {
      console.error('Error removing payment method:', error);
      showSnackbar('Failed to remove payment method', 'error');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    }
  }, [fetchPaymentMethods, showSnackbar]);

  // Payments
  const fetchPayments = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, isLoadingPayments: true }));
      
      // For development, use mock data
      // In production, this would use the actual API call
      // const { payments, total } = await PaymentService.getPayments(page, limit);
      const payments = PaymentService.getMockPayments();
      const total = payments.length;
      
      setState(prev => ({
        ...prev,
        payments,
        totalPayments: total,
        isLoadingPayments: false
      }));
    } catch (error) {
      console.error('Error fetching payments:', error);
      showSnackbar('Failed to load payments', 'error');
      setState(prev => ({ ...prev, isLoadingPayments: false }));
    }
  }, [showSnackbar]);

  const fetchPayment = useCallback(async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isLoadingPayments: true }));
      
      // For development, find in mock data
      // In production, this would use the actual API call
      // const payment = await PaymentService.getPayment(paymentId);
      const payment = PaymentService.getMockPayments().find(p => p.id === paymentId);
      
      if (payment) {
        setState(prev => ({
          ...prev,
          selectedPayment: payment,
          isLoadingPayments: false
        }));
      } else {
        throw new Error('Payment not found');
      }
    } catch (error) {
      console.error('Error fetching payment:', error);
      showSnackbar('Failed to load payment details', 'error');
      setState(prev => ({ ...prev, isLoadingPayments: false }));
    }
  }, [showSnackbar]);

  const createPayment = useCallback(async (paymentRequest: CreatePaymentRequest): Promise<PaymentDetails> => {
    try {
      setState(prev => ({ ...prev, isProcessingPayment: true }));
      
      // In production, this would use the actual API call
      const payment = await PaymentService.createPayment(paymentRequest);
      
      // Refresh payments list
      await fetchPayments();
      
      showSnackbar('Payment created successfully', 'success');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
      
      return payment;
    } catch (error) {
      console.error('Error creating payment:', error);
      showSnackbar('Failed to create payment', 'error');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
      throw error;
    }
  }, [fetchPayments, showSnackbar]);

  const cancelPayment = useCallback(async (paymentId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingPayment: true }));
      await PaymentService.cancelPayment(paymentId);
      
      // Refresh payments list
      await fetchPayments();
      
      showSnackbar('Payment cancelled successfully', 'success');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    } catch (error) {
      console.error('Error cancelling payment:', error);
      showSnackbar('Failed to cancel payment', 'error');
      setState(prev => ({ ...prev, isProcessingPayment: false }));
    }
  }, [fetchPayments, showSnackbar]);

  // Escrow
  const fetchEscrows = useCallback(async (page: number = 1, limit: number = 10) => {
    try {
      setState(prev => ({ ...prev, isLoadingEscrows: true }));
      
      // For development, use mock data
      // In production, this would use the actual API call
      // const { escrows, total } = await PaymentService.getEscrows(page, limit);
      const escrows = PaymentService.getMockEscrows();
      const total = escrows.length;
      
      setState(prev => ({
        ...prev,
        escrows,
        totalEscrows: total,
        isLoadingEscrows: false
      }));
    } catch (error) {
      console.error('Error fetching escrows:', error);
      showSnackbar('Failed to load escrows', 'error');
      setState(prev => ({ ...prev, isLoadingEscrows: false }));
    }
  }, [showSnackbar]);

  const fetchEscrow = useCallback(async (escrowId: string) => {
    try {
      setState(prev => ({ ...prev, isLoadingEscrows: true }));
      
      // For development, find in mock data
      // In production, this would use the actual API call
      // const escrow = await PaymentService.getEscrow(escrowId);
      const escrow = PaymentService.getMockEscrows().find(e => e.id === escrowId);
      
      if (escrow) {
        setState(prev => ({
          ...prev,
          selectedEscrow: escrow,
          isLoadingEscrows: false
        }));
      } else {
        throw new Error('Escrow not found');
      }
    } catch (error) {
      console.error('Error fetching escrow:', error);
      showSnackbar('Failed to load escrow details', 'error');
      setState(prev => ({ ...prev, isLoadingEscrows: false }));
    }
  }, [showSnackbar]);

  const createEscrow = useCallback(async (escrowRequest: CreateEscrowRequest): Promise<EscrowDetails> => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      
      // In production, this would use the actual API call
      const escrow = await PaymentService.createEscrow(escrowRequest);
      
      // Refresh escrows list
      await fetchEscrows();
      
      showSnackbar('Escrow created successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
      
      return escrow;
    } catch (error) {
      console.error('Error creating escrow:', error);
      showSnackbar('Failed to create escrow', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
      throw error;
    }
  }, [fetchEscrows, showSnackbar]);

  const fundEscrow = useCallback(async (escrowId: string, paymentMethodId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      await PaymentService.fundEscrow(escrowId, paymentMethodId);
      
      // Refresh escrow details
      await fetchEscrow(escrowId);
      
      showSnackbar('Escrow funded successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    } catch (error) {
      console.error('Error funding escrow:', error);
      showSnackbar('Failed to fund escrow', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    }
  }, [fetchEscrow, showSnackbar]);

  const cancelEscrow = useCallback(async (escrowId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      await PaymentService.cancelEscrow(escrowId);
      
      // Refresh escrows list
      await fetchEscrows();
      
      showSnackbar('Escrow cancelled successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      showSnackbar('Failed to cancel escrow', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    }
  }, [fetchEscrows, showSnackbar]);

  // Milestones
  const completeMilestone = useCallback(async (escrowId: string, milestoneId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      await PaymentService.completeMilestone(escrowId, milestoneId);
      
      // Refresh escrow details
      await fetchEscrow(escrowId);
      
      showSnackbar('Milestone completed successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    } catch (error) {
      console.error('Error completing milestone:', error);
      showSnackbar('Failed to complete milestone', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    }
  }, [fetchEscrow, showSnackbar]);

  const disputeMilestone = useCallback(async (escrowId: string, milestoneId: string, reason: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      await PaymentService.disputeMilestone(escrowId, milestoneId, reason);
      
      // Refresh escrow details
      await fetchEscrow(escrowId);
      
      showSnackbar('Milestone disputed successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    } catch (error) {
      console.error('Error disputing milestone:', error);
      showSnackbar('Failed to dispute milestone', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    }
  }, [fetchEscrow, showSnackbar]);

  const releaseMilestonePayment = useCallback(async (escrowId: string, milestoneId: string) => {
    try {
      setState(prev => ({ ...prev, isProcessingEscrow: true }));
      await PaymentService.releaseMilestonePayment(escrowId, milestoneId);
      
      // Refresh escrow details
      await fetchEscrow(escrowId);
      
      showSnackbar('Milestone payment released successfully', 'success');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    } catch (error) {
      console.error('Error releasing milestone payment:', error);
      showSnackbar('Failed to release milestone payment', 'error');
      setState(prev => ({ ...prev, isProcessingEscrow: false }));
    }
  }, [fetchEscrow, showSnackbar]);

  // Load initial data
  useEffect(() => {
    fetchPaymentMethods();
    fetchPayments();
    fetchEscrows();
  }, [fetchPaymentMethods, fetchPayments, fetchEscrows]);

  return {
    ...state,
    fetchPaymentMethods,
    addPaymentMethod,
    removePaymentMethod,
    fetchPayments,
    fetchPayment,
    createPayment,
    cancelPayment,
    fetchEscrows,
    fetchEscrow,
    createEscrow,
    fundEscrow,
    cancelEscrow,
    completeMilestone,
    disputeMilestone,
    releaseMilestonePayment,
    resetState
  };
}; 