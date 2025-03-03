import { API_BASE_URL } from '../constants';
import { getAuthToken } from '../utils/auth';

export type PaymentStatus = 
  | 'pending'
  | 'processing'
  | 'completed'
  | 'failed'
  | 'refunded'
  | 'cancelled';

export type PaymentMethod = 
  | 'credit_card'
  | 'bank_transfer'
  | 'paypal'
  | 'crypto'
  | 'other';

export interface PaymentDetails {
  id: string;
  amount: number;
  currency: string;
  description: string;
  status: PaymentStatus;
  method: PaymentMethod;
  createdAt: string;
  updatedAt: string;
  metadata?: Record<string, any>;
}

export type EscrowStatus = 
  | 'created'
  | 'funded'
  | 'in_progress'
  | 'completed'
  | 'disputed'
  | 'refunded'
  | 'cancelled';

export interface MilestoneDetails {
  id: string;
  escrowId: string;
  title: string;
  description: string;
  amount: number;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'disputed';
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EscrowDetails {
  id: string;
  title: string;
  description: string;
  senderId: string;
  senderName: string;
  recipientId: string;
  recipientName: string;
  totalAmount: number;
  currency: string;
  status: EscrowStatus;
  documentId?: string;
  milestones: MilestoneDetails[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface CreateEscrowRequest {
  title: string;
  description: string;
  recipientId: string;
  totalAmount: number;
  currency: string;
  documentId?: string;
  milestones: {
    title: string;
    description: string;
    amount: number;
    dueDate: string;
  }[];
}

export interface CreatePaymentRequest {
  amount: number;
  currency: string;
  description: string;
  method: PaymentMethod;
  metadata?: Record<string, any>;
}

class PaymentService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${API_BASE_URL}`;
  }

  private async getHeaders() {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  }

  // Payment Methods

  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payment-methods`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment methods: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      throw error;
    }
  }

  async addPaymentMethod(method: PaymentMethod, details: any): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payment-methods`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ method, details })
      });

      if (!response.ok) {
        throw new Error(`Failed to add payment method: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error adding payment method:', error);
      throw error;
    }
  }

  async removePaymentMethod(methodId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payment-methods/${methodId}`, {
        method: 'DELETE',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to remove payment method: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      throw error;
    }
  }

  // Payments

  async createPayment(paymentRequest: CreatePaymentRequest): Promise<PaymentDetails> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(paymentRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to create payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<PaymentDetails> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payment: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payment:', error);
      throw error;
    }
  }

  async getPayments(page: number = 1, limit: number = 10): Promise<{ payments: PaymentDetails[], total: number }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payments?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch payments: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching payments:', error);
      throw error;
    }
  }

  async cancelPayment(paymentId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/payments/${paymentId}/cancel`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel payment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error cancelling payment:', error);
      throw error;
    }
  }

  // Escrow

  async createEscrow(escrowRequest: CreateEscrowRequest): Promise<EscrowDetails> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow`, {
        method: 'POST',
        headers,
        body: JSON.stringify(escrowRequest)
      });

      if (!response.ok) {
        throw new Error(`Failed to create escrow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating escrow:', error);
      throw error;
    }
  }

  async getEscrow(escrowId: string): Promise<EscrowDetails> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch escrow: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching escrow:', error);
      throw error;
    }
  }

  async getEscrows(page: number = 1, limit: number = 10): Promise<{ escrows: EscrowDetails[], total: number }> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow?page=${page}&limit=${limit}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch escrows: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching escrows:', error);
      throw error;
    }
  }

  async fundEscrow(escrowId: string, paymentMethodId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}/fund`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ paymentMethodId })
      });

      if (!response.ok) {
        throw new Error(`Failed to fund escrow: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error funding escrow:', error);
      throw error;
    }
  }

  async cancelEscrow(escrowId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}/cancel`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel escrow: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error cancelling escrow:', error);
      throw error;
    }
  }

  // Milestones

  async completeMilestone(escrowId: string, milestoneId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}/milestones/${milestoneId}/complete`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to complete milestone: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error completing milestone:', error);
      throw error;
    }
  }

  async disputeMilestone(escrowId: string, milestoneId: string, reason: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}/milestones/${milestoneId}/dispute`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ reason })
      });

      if (!response.ok) {
        throw new Error(`Failed to dispute milestone: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error disputing milestone:', error);
      throw error;
    }
  }

  async releaseMilestonePayment(escrowId: string, milestoneId: string): Promise<void> {
    try {
      const headers = await this.getHeaders();
      const response = await fetch(`${this.baseUrl}/escrow/${escrowId}/milestones/${milestoneId}/release`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`Failed to release milestone payment: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error releasing milestone payment:', error);
      throw error;
    }
  }

  // Mock data for development

  getMockPaymentMethods(): PaymentMethod[] {
    return ['credit_card', 'bank_transfer', 'paypal'];
  }

  getMockPayments(): PaymentDetails[] {
    const now = new Date();
    return [
      {
        id: 'payment-1',
        amount: 5000,
        currency: 'USD',
        description: 'Initial investment payment',
        status: 'completed',
        method: 'bank_transfer',
        createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-2',
        amount: 2500,
        currency: 'USD',
        description: 'Milestone 1 payment',
        status: 'pending',
        method: 'credit_card',
        createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'payment-3',
        amount: 1000,
        currency: 'USD',
        description: 'Consulting fee',
        status: 'processing',
        method: 'paypal',
        createdAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }

  getMockEscrows(): EscrowDetails[] {
    const now = new Date();
    return [
      {
        id: 'escrow-1',
        title: 'Seed Investment',
        description: 'Seed funding for startup development',
        senderId: 'user-investor-1',
        senderName: 'John Investor',
        recipientId: 'user-entrepreneur-1',
        recipientName: 'Jane Founder',
        totalAmount: 50000,
        currency: 'USD',
        status: 'in_progress',
        documentId: 'doc-investment-1',
        milestones: [
          {
            id: 'milestone-1-1',
            escrowId: 'escrow-1',
            title: 'MVP Development',
            description: 'Complete the minimum viable product',
            amount: 20000,
            dueDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'in_progress',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'milestone-1-2',
            escrowId: 'escrow-1',
            title: 'Beta Launch',
            description: 'Launch beta version to initial users',
            amount: 15000,
            dueDate: new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'milestone-1-3',
            escrowId: 'escrow-1',
            title: 'Public Launch',
            description: 'Full public launch with marketing campaign',
            amount: 15000,
            dueDate: new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        createdAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'escrow-2',
        title: 'Angel Investment',
        description: 'Angel investment for marketing and expansion',
        senderId: 'user-investor-2',
        senderName: 'Sarah Angel',
        recipientId: 'user-entrepreneur-2',
        recipientName: 'Mike Startup',
        totalAmount: 100000,
        currency: 'USD',
        status: 'funded',
        documentId: 'doc-investment-2',
        milestones: [
          {
            id: 'milestone-2-1',
            escrowId: 'escrow-2',
            title: 'Market Research',
            description: 'Complete comprehensive market research',
            amount: 25000,
            dueDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'milestone-2-2',
            escrowId: 'escrow-2',
            title: 'Product Enhancement',
            description: 'Enhance product with new features',
            amount: 35000,
            dueDate: new Date(now.getTime() + 45 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: 'milestone-2-3',
            escrowId: 'escrow-2',
            title: 'International Expansion',
            description: 'Launch in international markets',
            amount: 40000,
            dueDate: new Date(now.getTime() + 75 * 24 * 60 * 60 * 1000).toISOString(),
            status: 'pending',
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
          }
        ],
        createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
  }
}

export default new PaymentService(); 