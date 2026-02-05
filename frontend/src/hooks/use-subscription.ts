/**
 * Subscription Hooks
 *
 * @description React Query hooks for subscription/billing data
 * @author Lead Engineer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { billingService, type Subscription } from '@/api/services/billing.service';

// Query keys
export const subscriptionKeys = {
  all: ['subscription'] as const,
  detail: () => [...subscriptionKeys.all, 'detail'] as const,
};

/**
 * Hook to fetch current user's subscription
 */
export function useSubscription() {
  return useQuery({
    queryKey: subscriptionKeys.detail(),
    queryFn: () => billingService.getSubscription(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });
}

/**
 * Hook to create checkout session
 */
export function useCreateCheckoutSession() {
  return useMutation({
    mutationFn: ({
      priceId,
      successUrl,
      cancelUrl,
    }: {
      priceId: string;
      successUrl: string;
      cancelUrl: string;
    }) => billingService.createCheckoutSession(priceId, successUrl, cancelUrl),
  });
}

/**
 * Hook to create portal session
 */
export function useCreatePortalSession() {
  return useMutation({
    mutationFn: (returnUrl: string) => billingService.createPortalSession(returnUrl),
  });
}

/**
 * Helper to check if user has active premium subscription
 */
export function isPremiumTier(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  return (
    subscription.tier === 'PREMIUM' &&
    (subscription.status === 'ACTIVE' || subscription.status === 'TRIALING')
  );
}

/**
 * Helper to check if user has active pro or premium subscription
 */
export function isProOrAbove(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  const activeTiers = ['PRO', 'PREMIUM'] as const;
  const activeStatuses = ['ACTIVE', 'TRIALING'] as const;
  return (
    activeTiers.includes(subscription.tier as 'PRO' | 'PREMIUM') &&
    activeStatuses.includes(subscription.status as 'ACTIVE' | 'TRIALING')
  );
}

/**
 * Hook that returns subscription status helpers
 */
export function useSubscriptionStatus() {
  const { data: subscription, isLoading, error } = useSubscription();

  return {
    subscription,
    isLoading,
    error,
    isPro: isProOrAbove(subscription ?? null),
    isPremium: isPremiumTier(subscription ?? null),
    isFree: !subscription || subscription.tier === 'FREE',
    tier: subscription?.tier ?? 'FREE',
    status: subscription?.status ?? null,
  };
}
