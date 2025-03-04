import { PrismaClient } from '@prisma/client';
import Stripe from 'stripe';
import { WebSocketServer } from './websocket';

const prisma = new PrismaClient();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

interface PriceConfig {
  entrepreneur: number;
  funder: number;
}

const SUBSCRIPTION_PRICES: Record<string, PriceConfig> = {
  Basic: { entrepreneur: 0, funder: 0 },
  Chrome: { entrepreneur: 25, funder: 100 },
  Bronze: { entrepreneur: 50, funder: 200 },
  Silver: { entrepreneur: 75, funder: 300 },
  Gold: { entrepreneur: 100, funder: 500 },
  Platinum: { entrepreneur: 200, funder: 1000 }
};

export class SubscriptionService {
  private wsServer: WebSocketServer;

  constructor(wsServer: WebSocketServer) {
    this.wsServer = wsServer;
  }

  async createCheckoutSession(userId: string, tier: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        entrepreneurProfile: true,
        funderProfile: true
      }
    });

    if (!user) throw new Error('User not found');

    const priceId = await this.getPriceId(tier, user.userType);
    let customer = user.stripeCustomerId;

    if (!customer) {
      const customerData = await stripe.customers.create({
        email: user.email,
        metadata: {
          userId: user.id
        }
      });
      customer = customerData.id;

      await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer }
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer,
      line_items: [
        {
          price: priceId,
          quantity: 1
        }
      ],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        userId: user.id,
        tier
      }
    });

    return session;
  }

  async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const { userId, tier } = subscription.metadata;

    await prisma.subscription.create({
      data: {
        userId,
        tier,
        status: subscription.status,
        stripeId: subscription.id,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { subscriptionTier: tier }
    });

    // Send notification
    this.wsServer.sendNotification(userId, {
      type: 'SUBSCRIPTION_CREATED',
      content: `Your ${tier} subscription has been activated!`
    });
  }

  async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeId: subscription.id }
    });

    if (!dbSubscription) return;

    await prisma.subscription.update({
      where: { id: dbSubscription.id },
      data: {
        status: subscription.status,
        currentPeriodEnd: new Date(subscription.current_period_end * 1000)
      }
    });

    if (subscription.status === 'past_due') {
      this.wsServer.sendNotification(dbSubscription.userId, {
        type: 'PAYMENT_FAILED',
        content: 'Your subscription payment has failed. Please update your payment method.'
      });
    }
  }

  async handleSubscriptionCanceled(subscription: Stripe.Subscription) {
    const dbSubscription = await prisma.subscription.findFirst({
      where: { stripeId: subscription.id }
    });

    if (!dbSubscription) return;

    await Promise.all([
      prisma.subscription.update({
        where: { id: dbSubscription.id },
        data: { 
          status: 'canceled',
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      }),
      prisma.user.update({
        where: { id: dbSubscription.userId },
        data: { subscriptionTier: 'Basic' }
      })
    ]);

    this.wsServer.sendNotification(dbSubscription.userId, {
      type: 'SUBSCRIPTION_CANCELED',
      content: 'Your subscription has been canceled.'
    });
  }

  private async getPriceId(tier: string, userType: 'entrepreneur' | 'funder'): Promise<string> {
    const priceConfig = SUBSCRIPTION_PRICES[tier];
    if (!priceConfig) throw new Error('Invalid subscription tier');

    const amount = userType === 'entrepreneur' ? priceConfig.entrepreneur : priceConfig.funder;
    const priceId = `${tier.toLowerCase()}_${userType}_${amount}`;

    try {
      // Check if price exists
      const existingPrice = await stripe.prices.retrieve(priceId);
      return existingPrice.id;
    } catch {
      // Create new price if it doesn't exist
      const price = await stripe.prices.create({
        id: priceId,
        unit_amount: amount * 100,
        currency: 'usd',
        recurring: {
          interval: 'month'
        },
        product_data: {
          name: `${tier} Plan - ${userType.charAt(0).toUpperCase() + userType.slice(1)}`,
          metadata: {
            tier,
            userType
          }
        }
      });
      return price.id;
    }
  }

  async getSubscriptionUsage(userId: string) {
    const subscription = await prisma.subscription.findFirst({
      where: { userId, status: 'active' },
      include: {
        user: true
      }
    });

    if (!subscription) return null;

    const tier = subscription.tier;
    const limits = await this.getTierLimits(tier);

    // Get current usage
    const [matches, messages, activeChats] = await Promise.all([
      this.getMonthlyMatches(userId),
      this.getMonthlyMessages(userId),
      this.getActiveChats(userId)
    ]);

    return {
      tier,
      limits,
      usage: {
        matches,
        messages,
        activeChats
      }
    };
  }

  private async getTierLimits(tier: string) {
    return {
      Basic: {
        monthlyMatches: 20,
        monthlyMessages: 100,
        maxActiveChats: 5
      },
      Chrome: {
        monthlyMatches: 40,
        monthlyMessages: 300,
        maxActiveChats: 10
      },
      Bronze: {
        monthlyMatches: 80,
        monthlyMessages: 500,
        maxActiveChats: 15
      },
      Silver: {
        monthlyMatches: 150,
        monthlyMessages: 1000,
        maxActiveChats: 25
      },
      Gold: {
        monthlyMatches: 300,
        monthlyMessages: 2000,
        maxActiveChats: 50
      },
      Platinum: {
        monthlyMatches: Infinity,
        monthlyMessages: Infinity,
        maxActiveChats: Infinity
      }
    }[tier];
  }

  private async getMonthlyMatches(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.match.count({
      where: {
        OR: [{ userId }, { matchedWithId: userId }],
        createdAt: { gte: startOfMonth }
      }
    });
  }

  private async getMonthlyMessages(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return prisma.message.count({
      where: {
        OR: [{ senderId: userId }, { receiverId: userId }],
        createdAt: { gte: startOfMonth }
      }
    });
  }

  private async getActiveChats(userId: string) {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return prisma.match.count({
      where: {
        OR: [{ userId }, { matchedWithId: userId }],
        status: 'accepted',
        messages: {
          some: {
            createdAt: { gte: thirtyDaysAgo }
          }
        }
      }
    });
  }
}