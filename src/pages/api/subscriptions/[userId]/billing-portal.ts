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
    // Only allow POST requests
    if (req.method !== 'POST') {
      res.setHeader('Allow', ['POST']);
      return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // In a real application, you would create a Stripe billing portal session
    // For now, we'll return mock data
    const mockBillingPortalSession = {
      url: 'https://billing.stripe.com/p/session/test_123456'
    };

    return res.status(200).json(mockBillingPortalSession);
  } catch (error) {
    console.error('Error creating billing portal session:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 