import { NextApiRequest, NextApiResponse } from 'next';
import { SubscriptionService } from '../../../services/subscription';
import { WebSocketServer } from '../../../services/websocket';

const subscriptionService = new SubscriptionService(new WebSocketServer());

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { userId } = req.query;

  if (!userId || typeof userId !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' });
  }

  try {
    // GET request to fetch subscription details
    if (req.method === 'GET') {
      // In a real application, you would fetch this from your database
      // For now, we'll return mock data
      const mockSubscription = {
        id: 'sub_123456',
        tier: 'BASIC',
        status: 'active',
        currentPeriodStart: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        cancelAtPeriodEnd: false
      };

      return res.status(200).json(mockSubscription);
    }

    // POST request to create a checkout session
    if (req.method === 'POST') {
      const { tier } = req.body;

      if (!tier) {
        return res.status(400).json({ error: 'Missing tier' });
      }

      const checkoutSession = await subscriptionService.createCheckoutSession(userId, tier);
      return res.status(200).json(checkoutSession);
    }

    // PUT request to update subscription
    if (req.method === 'PUT') {
      const { action } = req.body;

      if (!action) {
        return res.status(400).json({ error: 'Missing action' });
      }

      // Handle different actions (cancel, resume, etc.)
      if (action === 'cancel') {
        // In a real application, you would update the subscription in your database
        return res.status(200).json({ success: true, message: 'Subscription canceled' });
      }

      if (action === 'resume') {
        // In a real application, you would update the subscription in your database
        return res.status(200).json({ success: true, message: 'Subscription resumed' });
      }

      return res.status(400).json({ error: 'Invalid action' });
    }

    // Method not allowed
    res.setHeader('Allow', ['GET', 'POST', 'PUT']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (error) {
    console.error('Error handling subscription request:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 