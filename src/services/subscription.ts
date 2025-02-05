import { Stripe } from 'stripe';
import { PrismaClient } from '@prisma/client';
import { WebSocketServer } from './websocket';
import { NotificationService } from './notification';

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
  private notificationService: NotificationService;

  constructor(wsServer: WebSocketServer, notificationService: NotificationService) {
    this.wsServer = wsServer;
    this.notificationService = notificationService;
  }

  async createSubscription(userId: string, tier: string, userType: 'entrepreneur' | 'funder', paymentMethodId: string) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          entrepreneurProfile: true,
          funderProfile: true
        }
      });

      if (!user) throw new Error('User not found');

      // Get or create Stripe customer
      let stripeCustomerId = user.stripeCustomerId;
      if (!stripeCustomerId) {
        const profile = user.entrepreneurProfile || user.funderProfile;
        const customer = await stripe.customers.create({
          email: user.email,
          name: profile?.name || user.email,
          metadata: {
            userId: user.id
          }
        });
        stripeCustomerId = customer.id;

        await prisma.user.update({
          where: { id: userId },
          data: { stripeCustomerId }
        });
      }

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: stripeCustomerId
      });

      // Set as default payment method
      await stripe.customers.update(stripeCustomerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{
          price: await this.getPriceId(tier, userType)
        }],
        payment_settings: {
          payment_method_types: ['card'],
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
          userId,
          tier,
          userType
        }
      });

      // Update user subscription in database
      const dbSubscription = await prisma.subscription.create({
        data: {
          userId,
          tier,
          status: subscription.status,
          stripeId: subscription.id,
          currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        }
      });

      // Schedule renewal notifications
      await this.scheduleRenewalNotifications(dbSubscription);

      return { subscription, dbSubscription };
    } catch (error) {
      console.error('Error creating subscription:', error);
      throw error;
    }
  }

  async cancelSubscription(subscriptionId: string) {
    try {
      const subscription = await prisma.subscription.findUnique({
        where: { id: subscriptionId },
        include: { user: true }
      });

      if (!subscription) throw new Error('Subscription not found');

      // Cancel subscription in Stripe
      await stripe.subscriptions.cancel(subscription.stripeId);

      // Update subscription status in database
      const updatedSubscription = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          status: 'canceled',
          currentPeriodEnd: new Date(subscription.currentPeriodEnd)
        }
      });

      // Send cancellation notification
      await this.notificationService.sendSubscriptionCancelledNotification(
        subscription.userId,
        subscription.tier,
        subscription.currentPeriodEnd
      );

      return updatedSubscription;
    } catch (error) {
      console.error('Error canceling subscription:', error);
      throw error;
    }
  }

  async handlePaymentFailed(subscription: any, invoice: any) {
    try {
      // Update subscription status
      await prisma.subscription.update({
        where: { stripeId: subscription.id },
        data: { status: 'past_due' }
      });

      // Send payment failure notification
      await this.notificationService.sendPaymentFailureNotification(
        subscription.metadata.userId,
        invoice.amount_due,
        invoice.attempt_count
      );
    } catch (error) {
      console.error('Error handling payment failure:', error);
      throw error;
    }
  }

  private async getPriceId(tier: string, userType: 'entrepreneur' | 'funder'): Promise<string> {
    const priceConfig = SUBSCRIPTION_PRICES[tier];
    if (!priceConfig) throw new Error('Invalid subscription tier');

    const amount = userType === 'entrepreneur' ? priceConfig.entrepreneur : priceConfig.funder;
    const priceId = `${tier.toLowerCase()}_${userType}_${amount}`;

    // Check if price exists
    try {
      const existingPrice = await stripe.prices.retrieve(priceId);
      return existingPrice.id;
    } catch {
      // Create new price if it doesn't exist
      const price = await stripe.prices.create({
        id: priceId,
        unit_amount: amount * 100, // Convert to cents
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

  private async scheduleRenewalNotifications(subscription: any) {
    const daysBeforeRenewal = [7, 3, 1];
    for (const days of daysBeforeRenewal) {
      const notificationDate = new Date(subscription.currentPeriodEnd);
      notificationDate.setDate(notificationDate.getDate() - days);

      await prisma.scheduledNotification.create({
        data: {
          userId: subscription.userId,
          type: 'RENEWAL_REMINDER',
          scheduledFor: notificationDate,
          status: 'PENDING',
          metadata: {
            subscriptionId: subscription.id,
            daysBeforeRenewal: days
          }
        }
      });
    }
  }
}
