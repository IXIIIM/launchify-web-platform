import Stripe from 'stripe';
import { PrismaClient } from '@prisma/client';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2023-10-16'
});

const prisma = new PrismaClient();

export class StripeService {
  async createCustomer(email: string, userId: string) {
    const customer = await stripe.customers.create({
      email,
      metadata: { userId }
    });

    await prisma.user.update({
      where: { id: userId },
      data: { stripeCustomerId: customer.id }
    });

    return customer;
  }

  async getCustomer(customerId: string) {
    return stripe.customers.retrieve(customerId);
  }

  async createSubscription(customerId: string, priceId: string, metadata: any = {}) {
    return stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      metadata
    });
  }

  async cancelSubscription(subscriptionId: string) {
    return stripe.subscriptions.cancel(subscriptionId);
  }

  async createPrice(productId: string, amount: number, interval: 'month' | 'year' = 'month') {
    return stripe.prices.create({
      product: productId,
      unit_amount: amount * 100, // Convert to cents
      currency: 'usd',
      recurring: { interval }
    });
  }

  async createProduct(name: string, metadata: any = {}) {
    return stripe.products.create({
      name,
      metadata
    });
  }

  async createPaymentIntent(amount: number, currency: string = 'usd', metadata: any = {}) {
    return stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata
    });
  }

  async createTransfer(amount: number, destination: string, metadata: any = {}) {
    return stripe.transfers.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      destination,
      metadata
    });
  }

  async createConnectAccount(email: string, type: 'express' | 'standard' = 'express') {
    return stripe.accounts.create({
      type,
      email,
      capabilities: {
        transfers: { requested: true }
      }
    });
  }

  async createAccountLink(accountId: string, refreshUrl: string, returnUrl: string) {
    return stripe.accountLinks.create({
      account: accountId,
      refresh_url: refreshUrl,
      return_url: returnUrl,
      type: 'account_onboarding'
    });
  }

  async getAccountBalance(accountId: string) {
    return stripe.balance.retrieve({
      stripeAccount: accountId
    });
  }

  async handleWebhookEvent(payload: any, signature: string) {
    try {
      const event = stripe.webhooks.constructEvent(
        payload,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      );

      switch (event.type) {
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(event.data.object);
          break;
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(event.data.object);
          break;
        case 'customer.subscription.deleted':
          await this.handleSubscriptionDeleted(event.data.object);
          break;
        case 'payment_intent.succeeded':
          await this.handlePaymentSucceeded(event.data.object);
          break;
        case 'payment_intent.payment_failed':
          await this.handlePaymentFailed(event.data.object);
          break;
      }

      return { received: true };
    } catch (error) {
      console.error('Webhook error:', error);
      throw error;
    }
  }

  private async handleSubscriptionCreated(subscription: Stripe.Subscription) {
    const { userId, tier } = subscription.metadata;
    
    if (!userId || !tier) return;

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

    // Create notification
    await prisma.notification.create({
      data: {
        userId,
        type: 'SUBSCRIPTION_CREATED',
        content: `Your ${tier} subscription has been activated!`
      }
    });
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription) {
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
      await prisma.notification.create({
        data: {
          userId: dbSubscription.userId,
          type: 'PAYMENT_FAILED',
          content: 'Your subscription payment has failed. Please update your payment method.'
        }
      });
    }
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription) {
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

    await prisma.notification.create({
      data: {
        userId: dbSubscription.userId,
        type: 'SUBSCRIPTION_CANCELED',
        content: 'Your subscription has been canceled.'
      }
    });
  }

  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    // Handle successful payments
    if (paymentIntent.metadata.escrowId) {
      await this.handleEscrowPayment(paymentIntent);
    }
  }

  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    // Handle failed payments
    const { userId } = paymentIntent.metadata;
    
    if (userId) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'PAYMENT_FAILED',
          content: 'Your payment has failed. Please update your payment method.'
        }
      });
    }
  }

  private async handleEscrowPayment(paymentIntent: Stripe.PaymentIntent) {
    const { escrowId } = paymentIntent.metadata;
    
    if (!escrowId) return;

    await prisma.escrowTransaction.create({
      data: {
        escrowAccountId: escrowId,
        amount: paymentIntent.amount / 100, // Convert from cents
        type: 'DEPOSIT',
        status: 'COMPLETED',
        stripePaymentId: paymentIntent.id
      }
    });

    await prisma.escrowAccount.update({
      where: { id: escrowId },
      data: { status: 'ACTIVE' }
    });
  }
}