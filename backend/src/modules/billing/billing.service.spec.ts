import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma';
import { BillingService } from './billing.service';

describe('BillingService', () => {
  let service: BillingService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
    subscription: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn(),
  };

  const mockStripe = {
    customers: {
      create: jest.fn(),
    },
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
    billingPortal: {
      sessions: {
        create: jest.fn(),
      },
    },
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  beforeEach(async () => {
    mockConfigService.get.mockImplementation((key: string) => {
      switch (key) {
        case 'STRIPE_SECRET_KEY':
          return 'sk_test_123';
        case 'STRIPE_WEBHOOK_SECRET':
          return 'whsec_test_123';
        case 'STRIPE_PRO_PRICE_ID':
          return 'price_pro';
        case 'STRIPE_PREMIUM_PRICE_ID':
          return 'price_premium';
        default:
          return undefined;
      }
    });

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BillingService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<BillingService>(BillingService);
    (service as unknown as { stripe: typeof mockStripe }).stripe = mockStripe;

    jest.clearAllMocks();
  });

  it('returns a checkout session URL', async () => {
    jest
      .spyOn(service, 'getOrCreateStripeCustomer')
      .mockResolvedValue('cus_test_123');
    mockStripe.checkout.sessions.create.mockResolvedValue({
      id: 'cs_test_123',
      url: 'https://checkout.stripe.com/test-session',
    });

    const result = await service.createCheckoutSession(
      'user-1',
      'price_pro',
      'https://app.test/success',
      'https://app.test/cancel',
    );

    expect(result).toEqual({
      sessionId: 'cs_test_123',
      url: 'https://checkout.stripe.com/test-session',
    });
    expect(mockStripe.checkout.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test_123',
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: 'price_pro',
          quantity: 1,
        },
      ],
      success_url: 'https://app.test/success',
      cancel_url: 'https://app.test/cancel',
      subscription_data: {
        trial_period_days: 7,
      },
      metadata: {
        userId: 'user-1',
      },
    });
  });

  it('reuses an existing Stripe customer id when the user already has one', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'tester',
      subscription: {
        stripeCustomerId: 'cus_existing_123',
      },
    });

    const customerId = await service.getOrCreateStripeCustomer('user-1');

    expect(customerId).toBe('cus_existing_123');
    expect(mockStripe.customers.create).not.toHaveBeenCalled();
    expect(mockPrismaService.subscription.create).not.toHaveBeenCalled();
  });

  it('creates a Stripe customer and FREE subscription record when one does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'user@example.com',
      username: 'tester',
      subscription: null,
    });
    mockStripe.customers.create.mockResolvedValue({
      id: 'cus_new_123',
    });
    mockPrismaService.subscription.create.mockResolvedValue({});

    const customerId = await service.getOrCreateStripeCustomer('user-1');

    expect(customerId).toBe('cus_new_123');
    expect(mockStripe.customers.create).toHaveBeenCalledWith({
      email: 'user@example.com',
      metadata: {
        userId: 'user-1',
        username: 'tester',
      },
    });
    expect(mockPrismaService.subscription.create).toHaveBeenCalledWith({
      data: {
        userId: 'user-1',
        stripeCustomerId: 'cus_new_123',
        tier: SubscriptionTier.FREE,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  });

  it('returns a billing portal URL for users with a Stripe customer id', async () => {
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      stripeCustomerId: 'cus_test_123',
    });
    mockStripe.billingPortal.sessions.create.mockResolvedValue({
      url: 'https://billing.stripe.com/session',
    });

    const result = await service.createPortalSession(
      'user-1',
      'https://app.test/account',
    );

    expect(result).toEqual({
      url: 'https://billing.stripe.com/session',
    });
    expect(mockStripe.billingPortal.sessions.create).toHaveBeenCalledWith({
      customer: 'cus_test_123',
      return_url: 'https://app.test/account',
    });
  });

  it('updates the subscription record for customer.subscription.updated webhooks', async () => {
    const event = {
      type: 'customer.subscription.updated',
      data: {
        object: {
          id: 'sub_stripe_123',
          customer: 'cus_test_123',
          status: 'active',
          cancel_at_period_end: false,
          trial_start: null,
          trial_end: null,
          items: {
            data: [
              {
                price: {
                  id: 'price_pro',
                },
              },
            ],
          },
          current_period_start: 1735689600,
          current_period_end: 1736294400,
        },
      },
    } as unknown as Stripe.Event;

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      id: 'local-subscription-1',
    });
    mockPrismaService.subscription.update.mockResolvedValue({});

    const result = await service.handleWebhookEvent(
      Buffer.from('payload'),
      'signature',
    );

    expect(result).toEqual({ received: true });
    expect(mockPrismaService.subscription.findUnique).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_test_123' },
    });
    expect(mockPrismaService.subscription.update).toHaveBeenCalledWith({
      where: { id: 'local-subscription-1' },
      data: {
        stripeSubscriptionId: 'sub_stripe_123',
        stripePriceId: 'price_pro',
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.PRO,
        currentPeriodStart: new Date(1735689600 * 1000),
        currentPeriodEnd: new Date(1736294400 * 1000),
        cancelAtPeriodEnd: false,
        trialStart: null,
        trialEnd: null,
      },
    });
  });

  it('downgrades the subscription for customer.subscription.deleted webhooks', async () => {
    const event = {
      type: 'customer.subscription.deleted',
      data: {
        object: {
          customer: 'cus_test_123',
        },
      },
    } as unknown as Stripe.Event;

    mockStripe.webhooks.constructEvent.mockReturnValue(event);
    mockPrismaService.subscription.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.handleWebhookEvent(
      Buffer.from('payload'),
      'signature',
    );

    expect(result).toEqual({ received: true });
    expect(mockPrismaService.subscription.updateMany).toHaveBeenCalledWith({
      where: { stripeCustomerId: 'cus_test_123' },
      data: {
        status: SubscriptionStatus.CANCELED,
        tier: SubscriptionTier.FREE,
        stripeSubscriptionId: null,
        stripePriceId: null,
      },
    });
  });

  it('reports active subscriptions only for active paid tiers', async () => {
    mockPrismaService.subscription.findUnique
      .mockResolvedValueOnce({
        status: SubscriptionStatus.TRIALING,
        tier: SubscriptionTier.PRO,
      })
      .mockResolvedValueOnce({
        status: SubscriptionStatus.ACTIVE,
        tier: SubscriptionTier.FREE,
      })
      .mockResolvedValueOnce(null);

    await expect(service.hasActiveSubscription('user-1')).resolves.toBe(true);
    await expect(service.hasActiveSubscription('user-2')).resolves.toBe(false);
    await expect(service.hasActiveSubscription('user-3')).resolves.toBe(false);
  });
});
