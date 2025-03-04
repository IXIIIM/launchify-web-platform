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

    // In a real application, you would fetch this from Stripe
    // For now, we'll return mock data
    const mockPaymentMethods = [
      {
        id: 'pm_123456',
        brand: 'visa',
        last4: '4242',
        expMonth: 12,
        expYear: 2025,
        isDefault: true
      }
    ];

    return res.status(200).json(mockPaymentMethods);
  } catch (error) {
    console.error('Error fetching payment methods:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 