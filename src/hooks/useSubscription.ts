import { useState, useEffect, useCallback } from 'react';
import { SubscriptionService } from '../services/subscription';
import { WebSocketServer } from '../services/websocket';
import { useAuth } from './useAuth';

// Define the subscription tiers
export enum SubscriptionTier {
  BASIC = 'Basic',
  CHROME = 'Chrome',
  BRONZE = 'Bronze',
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum'
}

// Define the subscription status
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'unpaid' | 'trialing' | 'incomplete' | 'incomplete_expired';

// Define the subscription usage
export interface SubscriptionUsage {
  matches: {
    used: number;
    limit: number;
    percentage: number;
  };
  messages: {
    used: number;
    limit: number;
    percentage: number;
  };
  activeChats: {
    count: number;
    limit: number;
    percentage: number;
  };
}

// Define the subscription details
export interface SubscriptionDetails {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}

// Define the billing history item
export interface BillingHistoryItem {
  id: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  date: Date;
  description: string;
  receiptUrl?: string;
}

// Define the payment method
export interface PaymentMethod {
  id: string;
  brand: string;
  last4: string;
  expMonth: number;
  expYear: number;
  isDefault: boolean;
}

// Define the return type of the hook
interface UseSubscriptionReturn {
  subscription: SubscriptionDetails | null;
  usage: SubscriptionUsage | null;
  billingHistory: BillingHistoryItem[];
  paymentMethods: PaymentMethod[];
  loading: boolean;
  error: Error | null;
  createCheckoutSession: (tier: SubscriptionTier) => Promise<string>;
  cancelSubscription: () => Promise<void>;
  createBillingPortalSession: () => Promise<string>;
  refreshSubscription: () => Promise<void>;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionDetails | null>(null);
  const [usage, setUsage] = useState<SubscriptionUsage | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistoryItem[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);

  // Initialize the subscription service
  const subscriptionService = new SubscriptionService(new WebSocketServer());

  // Fetch the subscription details
  const fetchSubscription = useCallback(async () => {
    if (!user) return;
    
    try {
      setLoading(true);
      
      // Fetch subscription details
      const subscriptionData = await fetch(`/api/subscriptions/${user.id}`).then(res => res.json());
      setSubscription(subscriptionData);
      
      // Fetch subscription usage
      const usageData = await subscriptionService.getSubscriptionUsage(user.id);
      setUsage(usageData);
      
      // Fetch billing history
      const billingData = await fetch(`/api/subscriptions/${user.id}/billing-history`).then(res => res.json());
      setBillingHistory(billingData);
      
      // Fetch payment methods
      const paymentData = await fetch(`/api/subscriptions/${user.id}/payment-methods`).then(res => res.json());
      setPaymentMethods(paymentData);
      
      setLoading(false);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch subscription details'));
      setLoading(false);
    }
  }, [user, subscriptionService]);

  // Create a checkout session
  const createCheckoutSession = async (tier: SubscriptionTier): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const session = await subscriptionService.createCheckoutSession(user.id, tier);
      return session.url || '';
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create checkout session'));
      throw err;
    }
  };

  // Cancel the subscription
  const cancelSubscription = async (): Promise<void> => {
    if (!user || !subscription) throw new Error('No active subscription');
    
    try {
      await fetch(`/api/subscriptions/${subscription.id}/cancel`, {
        method: 'POST'
      });
      
      // Refresh the subscription details
      await fetchSubscription();
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to cancel subscription'));
      throw err;
    }
  };

  // Create a billing portal session
  const createBillingPortalSession = async (): Promise<string> => {
    if (!user) throw new Error('User not authenticated');
    
    try {
      const response = await fetch(`/api/subscriptions/${user.id}/billing-portal`, {
        method: 'POST'
      });
      
      const data = await response.json();
      return data.url;
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to create billing portal session'));
      throw err;
    }
  };

  // Refresh the subscription details
  const refreshSubscription = async (): Promise<void> => {
    await fetchSubscription();
  };

  // Fetch the subscription details on mount and when the user changes
  useEffect(() => {
    if (user) {
      fetchSubscription();
    }
  }, [user, fetchSubscription]);

  return {
    subscription,
    usage,
    billingHistory,
    paymentMethods,
    loading,
    error,
    createCheckoutSession,
    cancelSubscription,
    createBillingPortalSession,
    refreshSubscription
  };
}; 