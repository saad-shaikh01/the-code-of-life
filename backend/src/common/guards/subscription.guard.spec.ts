import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';
import { PrismaService } from '../../prisma';
import { SubscriptionGuard } from './subscription.guard';

describe('SubscriptionGuard', () => {
  let guard: SubscriptionGuard;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrismaService = {
    subscription: {
      findUnique: jest.fn(),
    },
  };

  const createContext = (user?: { userId?: string }): ExecutionContext =>
    ({
      getHandler: jest.fn(),
      getClass: jest.fn(),
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
    }) as unknown as ExecutionContext;

  beforeEach(() => {
    guard = new SubscriptionGuard(
      mockReflector as unknown as Reflector,
      mockPrismaService as unknown as PrismaService,
    );
    jest.clearAllMocks();
  });

  it('allows routes without subscription metadata', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(undefined);

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).resolves.toBe(true);
    expect(mockPrismaService.subscription.findUnique).not.toHaveBeenCalled();
  });

  it('allows active PRO users on PRO routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.ACTIVE,
    });

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).resolves.toBe(true);
    expect(mockPrismaService.subscription.findUnique).toHaveBeenCalledWith({
      where: { userId: 'user-1' },
    });
  });

  it('allows active PREMIUM users on PRO routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      tier: SubscriptionTier.PREMIUM,
      status: SubscriptionStatus.TRIALING,
    });

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).resolves.toBe(true);
  });

  it('blocks active FREE users on PRO routes', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      tier: SubscriptionTier.FREE,
      status: SubscriptionStatus.ACTIVE,
    });

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).rejects.toThrow(ForbiddenException);
  });

  it('blocks unauthenticated requests before checking the database', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);

    await expect(guard.canActivate(createContext())).rejects.toThrow(
      'Authentication required',
    );
    expect(mockPrismaService.subscription.findUnique).not.toHaveBeenCalled();
  });

  it('blocks missing subscription records', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);
    mockPrismaService.subscription.findUnique.mockResolvedValue(null);

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).rejects.toThrow(
      'An active subscription is required to access this feature',
    );
  });

  it('blocks expired subscriptions', async () => {
    mockReflector.getAllAndOverride.mockReturnValue(SubscriptionTier.PRO);
    mockPrismaService.subscription.findUnique.mockResolvedValue({
      tier: SubscriptionTier.PRO,
      status: SubscriptionStatus.CANCELED,
    });

    await expect(
      guard.canActivate(createContext({ userId: 'user-1' })),
    ).rejects.toThrow(
      'An active subscription is required to access this feature',
    );
  });
});
