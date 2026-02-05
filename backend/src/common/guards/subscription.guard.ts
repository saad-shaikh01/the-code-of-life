import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaService } from '../../prisma';
import { SubscriptionStatus, SubscriptionTier } from '@prisma/client';

export const REQUIRED_TIER_KEY = 'requiredTier';

/**
 * Decorator to specify required subscription tier for a route
 */
export const RequireSubscription = (tier: SubscriptionTier = SubscriptionTier.PRO) =>
  (target: object, propertyKey?: string | symbol, descriptor?: PropertyDescriptor) => {
    if (propertyKey && descriptor) {
      Reflect.defineMetadata(REQUIRED_TIER_KEY, tier, descriptor.value);
    } else {
      Reflect.defineMetadata(REQUIRED_TIER_KEY, tier, target);
    }
    return descriptor ?? target;
  };

@Injectable()
export class SubscriptionGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredTier = this.reflector.getAllAndOverride<SubscriptionTier>(
      REQUIRED_TIER_KEY,
      [context.getHandler(), context.getClass()],
    );

    // If no tier requirement, allow access
    if (!requiredTier) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user?.userId) {
      throw new ForbiddenException('Authentication required');
    }

    const subscription = await this.prisma.subscription.findUnique({
      where: { userId: user.userId },
    });

    // Check if user has an active subscription
    const isActiveStatus =
      subscription?.status === SubscriptionStatus.ACTIVE ||
      subscription?.status === SubscriptionStatus.TRIALING;

    if (!subscription || !isActiveStatus) {
      throw new ForbiddenException(
        'An active subscription is required to access this feature',
      );
    }

    // Check if user's tier meets the requirement
    const tierHierarchy = {
      [SubscriptionTier.FREE]: 0,
      [SubscriptionTier.PRO]: 1,
      [SubscriptionTier.PREMIUM]: 2,
    };

    if (tierHierarchy[subscription.tier] < tierHierarchy[requiredTier]) {
      throw new ForbiddenException(
        `A ${requiredTier} subscription or higher is required to access this feature`,
      );
    }

    return true;
  }
}
