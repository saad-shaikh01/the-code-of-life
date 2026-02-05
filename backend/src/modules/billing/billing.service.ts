import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma';
import Stripe from 'stripe';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.stripe = new Stripe(
      this.configService.get<string>('STRIPE_SECRET_KEY') || '',
    );
  }

  /**
   * Create or retrieve a Stripe customer for a user
   */
  async getOrCreateStripeCustomer(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // If user already has a subscription with a Stripe customer, return it
    if (user.subscription?.stripeCustomerId) {
      return user.subscription.stripeCustomerId;
    }

    // Create a new Stripe customer
    const customer = await this.stripe.customers.create({
      email: user.email,
      metadata: {
        userId: user.id,
        username: user.username,
      },
    });

    // Create subscription record with FREE tier
    await this.prisma.subscription.create({
      data: {
        userId: user.id,
        stripeCustomerId: customer.id,
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    return customer.id;
  }

  /**
   * Create a Stripe Checkout Session for subscription
   */
  async createCheckoutSession(
    userId: string,
    priceId: string,
    successUrl: string,
    cancelUrl: string,
  ): Promise<{ sessionId: string; url: string }> {
    const customerId = await this.getOrCreateStripeCustomer(userId);

    const session = await this.stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: successUrl,
      cancel_url: cancelUrl,
      subscription_data: {
        trial_period_days: 7, // 7-day trial
      },
      metadata: {
        userId,
      },
    });

    return {
      sessionId: session.id,
      url: session.url || '',
    };
  }

  /**
   * Create a Stripe Billing Portal session for subscription management
   */
  async createPortalSession(
    userId: string,
    returnUrl: string,
  ): Promise<{ url: string }> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription?.stripeCustomerId) {
      throw new BadRequestException('No subscription found for user');
    }

    const session = await this.stripe.billingPortal.sessions.create({
      customer: subscription.stripeCustomerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  /**
   * Handle Stripe webhook events
   */
  async handleWebhookEvent(
    payload: Buffer,
    signature: string,
  ): Promise<{ received: boolean }> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');

    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        payload,
        signature,
        webhookSecret || '',
      );
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed`);
    }

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdate(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(
          event.data.object as Stripe.Subscription,
        );
        break;

      case 'invoice.payment_succeeded':
        await this.handlePaymentSucceeded(event.data.object as Stripe.Invoice);
        break;

      case 'invoice.payment_failed':
        await this.handlePaymentFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return { received: true };
  }

  /**
   * Handle subscription created/updated webhook
   */
  private async handleSubscriptionUpdate(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = stripeSubscription.customer as string;

    const subscription = await this.prisma.subscription.findUnique({
      where: { stripeCustomerId: customerId },
    });

    if (!subscription) {
      console.error(`No subscription found for customer: ${customerId}`);
      return;
    }

    // Map Stripe status to our enum
    const statusMap: Record<string, SubscriptionStatus> = {
      active: SubscriptionStatus.ACTIVE,
      canceled: SubscriptionStatus.CANCELED,
      past_due: SubscriptionStatus.PAST_DUE,
      trialing: SubscriptionStatus.TRIALING,
      incomplete: SubscriptionStatus.INCOMPLETE,
      incomplete_expired: SubscriptionStatus.INCOMPLETE_EXPIRED,
      unpaid: SubscriptionStatus.UNPAID,
    };

    // Determine tier based on price
    const priceId = stripeSubscription.items.data[0]?.price?.id;
    const tier = this.determineTierFromPriceId(priceId);

    const currentPeriodStart = (stripeSubscription as unknown as { current_period_start: number }).current_period_start;
    const currentPeriodEnd = (stripeSubscription as unknown as { current_period_end: number }).current_period_end;

    await this.prisma.subscription.update({
      where: { id: subscription.id },
      data: {
        stripeSubscriptionId: stripeSubscription.id,
        stripePriceId: priceId,
        status: statusMap[stripeSubscription.status] || SubscriptionStatus.ACTIVE,
        tier,
        currentPeriodStart: new Date(currentPeriodStart * 1000),
        currentPeriodEnd: new Date(currentPeriodEnd * 1000),
        cancelAtPeriodEnd: stripeSubscription.cancel_at_period_end,
        trialStart: stripeSubscription.trial_start
          ? new Date(stripeSubscription.trial_start * 1000)
          : null,
        trialEnd: stripeSubscription.trial_end
          ? new Date(stripeSubscription.trial_end * 1000)
          : null,
      },
    });
  }

  /**
   * Handle subscription deleted webhook
   */
  private async handleSubscriptionDeleted(
    stripeSubscription: Stripe.Subscription,
  ): Promise<void> {
    const customerId = stripeSubscription.customer as string;

    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: SubscriptionStatus.CANCELED,
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
  }

  /**
   * Handle successful payment
   */
  private async handlePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Handle failed payment
   */
  private async handlePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    const customerId = invoice.customer as string;

    await this.prisma.subscription.updateMany({
      where: { stripeCustomerId: customerId },
      data: {
        status: SubscriptionStatus.PAST_DUE,
      },
    });
  }

  /**
   * Determine subscription tier from Stripe price ID
   */
  private determineTierFromPriceId(priceId: string | undefined): SubscriptionTier {
    const proPriceId = this.configService.get<string>('STRIPE_PRO_PRICE_ID');
    const premiumPriceId = this.configService.get<string>('STRIPE_PREMIUM_PRICE_ID');

    if (priceId === premiumPriceId) {
      return SubscriptionTier.PREMIUM;
    }
    if (priceId === proPriceId) {
      return SubscriptionTier.PRO;
    }
    return SubscriptionTier.FREE;
  }

  /**
   * Get user's current subscription
   */
  async getSubscription(userId: string) {
    return this.prisma.subscription.findUnique({
      where: { userId },
    });
  }

  /**
   * Check if user has an active premium subscription
   */
  async hasActiveSubscription(userId: string): Promise<boolean> {
    const subscription = await this.prisma.subscription.findUnique({
      where: { userId },
    });

    if (!subscription) return false;

    const isActiveStatus =
      subscription.status === SubscriptionStatus.ACTIVE ||
      subscription.status === SubscriptionStatus.TRIALING;

    return isActiveStatus && subscription.tier !== SubscriptionTier.FREE;
  }
}
