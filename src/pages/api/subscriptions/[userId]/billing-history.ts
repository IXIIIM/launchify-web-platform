import { NextApiRequest, NextApiResponse } from 'next';
import { StripeService } from '../../../../services/stripe';

const stripeService = new StripeService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // Only allow GET requests
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // In a real application, you would fetch this from your database via Stripe
    // For now, we'll return mock data
    const mockBillingHistory = [
      {
        id: 'in_123456',
        amount: 5000, // $50.00
        status: 'paid',
        date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        description: 'Bronze Plan - Monthly Subscription',
        receiptUrl: 'https://example.com/receipt/123456'
      },
      {
        id: 'in_123457',
        amount: 5000, // $50.00
        status: 'paid',
        date: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000), // 60 days ago
        description: 'Bronze Plan - Monthly Subscription',
        receiptUrl: 'https://example.com/receipt/123457'
      },
      {
        id: 'in_123458',
        amount: 5000, // $50.00
        status: 'paid',
        date: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
        description: 'Bronze Plan - Monthly Subscription',
        receiptUrl: 'https://example.com/receipt/123458'
      }
    ];

    return res.status(200).json(mockBillingHistory);
  } catch (error) {
    console.error('Error fetching billing history:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 