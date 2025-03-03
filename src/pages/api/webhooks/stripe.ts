import { NextApiRequest, NextApiResponse } from 'next';
import { buffer } from 'micro';
import Stripe from 'stripe';
import { StripeService } from '../../../services/stripe';

// Disable body parsing, need the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;
const stripeService = new StripeService();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).end('Method Not Allowed');
  }

  try {
    // Get the raw body
    const rawBody = await buffer(req);
    const signature = req.headers['stripe-signature'] as string;

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature header' });
    }

    // Process the webhook event
    const event = await stripeService.handleWebhookEvent(rawBody.toString(), signature);

    // Return a response to acknowledge receipt of the event
    return res.status(200).json({ received: true });
  } catch (err) {
    console.error('Error processing webhook:', err);
    return res.status(400).json({ error: 'Webhook error' });
  }
} 