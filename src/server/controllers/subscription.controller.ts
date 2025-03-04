import { Request, Response } from 'express';
import { StripeService } from '../services/stripe';
import { PrismaClient } from '@prisma/client';
import { SubscriptionService } from '../services/subscription';

const prisma = new PrismaClient();
const stripeService = new StripeService();
const subscriptionService = new SubscriptionService();

interface AuthRequest extends Request {
  user: {
    id: string;
    email: string;
    userType: 'entrepreneur' | 'funder';
    subscriptionTier: string;
  };
}

// Subscription tier pricing configuration
const SUBSCRIPTION_PRICES = {
  Basic: {
    entrepreneur: 0,
    funder: 0
  },
  Chrome: {
    entrepreneur: 25,
    funder: 100
  },
  Bronze: {
    entrepreneur: 50,
    funder: 200
  },
  Silver: {
    entrepreneur: 75,
    funder: 300
  },
  Gold: {
    entrepreneur: 100,
    funder: 500
  },
  Platinum: {
    entrepreneur: 200,
    funder: 1000
  }
};

export const createSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    const { id: userId, email, userType } = req.user;

    // Validate tier
    if (!Object.keys(SUBSCRIPTION_PRICES).includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Get user
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Create or get Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(email, userId);
      customerId = customer.id;
    }

    // Create checkout session
    const session = await subscriptionService.createCheckoutSession(userId, tier);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription creation error:', error);
    res.status(500).json({ error: 'Failed to create subscription' });
  }
};

export const cancelSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Cancel subscription in Stripe
    await stripeService.cancelSubscription(subscription.stripeId);

    // Update subscription in database
    await prisma.subscription.update({
      where: { id: subscription.id },
      data: { status: 'canceled' }
    });

    // Update user subscription tier to Basic
    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: 'Basic' }
    });

    res.json({ message: 'Subscription canceled successfully' });
  } catch (error) {
    console.error('Subscription cancellation error:', error);
    res.status(500).json({ error: 'Failed to cancel subscription' });
  }
};

export const updateSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { tier } = req.body;
    const { id: userId } = req.user;

    // Validate tier
    if (!Object.keys(SUBSCRIPTION_PRICES).includes(tier)) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Get active subscription
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing'] }
      }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'No active subscription found' });
    }

    // Create checkout session for upgrade/downgrade
    const session = await subscriptionService.createCheckoutSession(userId, tier);

    res.json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Subscription update error:', error);
    res.status(500).json({ error: 'Failed to update subscription' });
  }
};

export const getSubscription = async (req: AuthRequest, res: Response) => {
  try {
    const { id: userId } = req.user;

    // Get subscription details
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId,
        status: { in: ['active', 'trialing', 'past_due'] }
      }
    });

    if (!subscription) {
      return res.json({ 
        active: false,
        tier: 'Basic',
        features: getSubscriptionFeatures('Basic', req.user.userType)
      });
    }

    res.json({
      active: true,
      tier: subscription.tier,
      status: subscription.status,
      currentPeriodEnd: subscription.currentPeriodEnd,
      features: getSubscriptionFeatures(subscription.tier, req.user.userType)
    });
  } catch (error) {
    console.error('Get subscription error:', error);
    res.status(500).json({ error: 'Failed to get subscription details' });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const signature = req.headers['stripe-signature'] as string;

  if (!signature) {
    return res.status(400).json({ error: 'Missing Stripe signature' });
  }

  try {
    const result = await stripeService.handleWebhookEvent(
      req.body,
      signature
    );

    res.json(result);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).json({ error: 'Webhook error' });
  }
};

// Helper function to get subscription features
function getSubscriptionFeatures(tier: string, userType: 'entrepreneur' | 'funder') {
  const baseFeatures = {
    Basic: {
      entrepreneur: [
        'Basic profile visibility',
        'Connect with other Basic entrepreneurs',
        'Limited to 5 matches per day'
      ],
      funder: [
        'Basic profile visibility',
        'Connect with other Basic funders',
        'Limited to 5 matches per day'
      ]
    },
    Chrome: {
      entrepreneur: [
        'Enhanced profile visibility',
        'Connect with Chrome and Basic entrepreneurs',
        'Connect with Chrome and Basic funders',
        'Basic analytics'
      ],
      funder: [
        'Enhanced profile visibility',
        'Connect with Chrome and Basic entrepreneurs',
        'Connect with Chrome and Basic funders',
        'Basic analytics',
        'Funds verification up to $10,000'
      ]
    },
    Bronze: {
      entrepreneur: [
        'Priority profile visibility',
        'Connect with Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Bronze, Chrome, and Basic funders',
        'Advanced analytics',
        'Priority support'
      ],
      funder: [
        'Priority profile visibility',
        'Connect with Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Bronze, Chrome, and Basic funders',
        'Advanced analytics',
        'Priority support',
        'Funds verification up to $50,000'
      ]
    },
    Silver: {
      entrepreneur: [
        'Premium profile visibility',
        'Connect with Silver, Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Silver, Bronze, Chrome, and Basic funders',
        'Custom analytics dashboard',
        '24/7 support'
      ],
      funder: [
        'Premium profile visibility',
        'Connect with Silver, Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Silver, Bronze, Chrome, and Basic funders',
        'Custom analytics dashboard',
        '24/7 support',
        'Funds verification up to $100,000'
      ]
    },
    Gold: {
      entrepreneur: [
        'Featured profile placement',
        'Connect with Gold, Silver, Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Gold, Silver, Bronze, Chrome, and Basic funders',
        'Advanced matching algorithms',
        'Premium support',
        'Unlimited matches'
      ],
      funder: [
        'Featured profile placement',
        'Connect with Gold, Silver, Bronze, Chrome, and Basic entrepreneurs',
        'Connect with Gold, Silver, Bronze, Chrome, and Basic funders',
        'Advanced matching algorithms',
        'Premium support',
        'Unlimited matches',
        'Funds verification up to $500,000'
      ]
    },
    Platinum: {
      entrepreneur: [
        'Top featured profile placement',
        'Connect with all subscription tiers',
        'White glove service with curated matching',
        'Priority verification processing',
        'Unlimited matches',
        'VIP support'
      ],
      funder: [
        'Top featured profile placement',
        'Connect with all subscription tiers',
        'White glove service with curated matching',
        'Priority verification processing',
        'Unlimited matches',
        'VIP support',
        'Funds verification up to $1,000,000'
      ]
    }
  };

  return baseFeatures[tier][userType];
}