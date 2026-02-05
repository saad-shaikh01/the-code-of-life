/**
 * Billing Service
 *
 * @description API service for subscription and billing operations
 */

import { apiClient } from '../client';

export interface Subscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  tier: 'FREE' | 'PRO' | 'PREMIUM';
  status: 'ACTIVE' | 'CANCELED' | 'PAST_DUE' | 'TRIALING' | 'INCOMPLETE' | 'INCOMPLETE_EXPIRED' | 'UNPAID';
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  trialStart: string | null;
  trialEnd: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface PortalSessionResponse {
  url: string;
}

export const billingService = {
  /**
   * Get current user's subscription
   */
  async getSubscription(): Promise<Subscription | null> {
    const response = await apiClient.get<Subscription>('/billing/subscription', true);
    return response.data ?? null;
  },

  /**
   * Create a checkout session for subscription
   */
  async createCheckoutSession(
    priceId: string,
    successUrl: string,
    cancelUrl: string
  ): Promise<CheckoutSessionResponse> {
    const response = await apiClient.post<CheckoutSessionResponse>(
      '/billing/checkout-session',
      { priceId, successUrl, cancelUrl },
      true
    );
    return response.data!;
  },

  /**
   * Create a billing portal session for managing subscription
   */
  async createPortalSession(returnUrl: string): Promise<PortalSessionResponse> {
    const response = await apiClient.post<PortalSessionResponse>(
      '/billing/portal-session',
      { returnUrl },
      true
    );
    return response.data!;
  },
};
