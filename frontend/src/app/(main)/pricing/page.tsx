'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Sparkles, Zap, Crown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billingService } from '@/api/services/billing.service';
import { STRIPE_CONFIG, ROUTES } from '@/config/constants';

interface PricingTier {
  id: string;
  name: string;
  description: string;
  price: number;
  priceId: string | null;
  interval: string;
  features: string[];
  highlighted?: boolean;
  icon: React.ReactNode;
  badge?: string;
}

const pricingTiers: PricingTier[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Perfect for getting started',
    price: 0,
    priceId: null,
    interval: 'forever',
    icon: <Sparkles className="h-6 w-6" />,
    features: [
      'Access to Story Mode (first 5 levels)',
      'Daily Code puzzle (limited)',
      'Basic achievements',
      'Cloud save progress',
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    description: 'For dedicated puzzlers',
    price: 9.99,
    priceId: STRIPE_CONFIG.PRO_PRICE_ID,
    interval: 'month',
    icon: <Zap className="h-6 w-6" />,
    highlighted: true,
    badge: 'Most Popular',
    features: [
      'Full Story Mode access',
      'Unlimited Daily Codes',
      'Challenge Mode unlocked',
      'Priority hints system',
      'All achievements',
      '7-day free trial',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    description: 'The ultimate experience',
    price: 19.99,
    priceId: STRIPE_CONFIG.PREMIUM_PRICE_ID,
    interval: 'month',
    icon: <Crown className="h-6 w-6" />,
    features: [
      'Everything in Pro',
      'Exclusive premium puzzles',
      'Early access to new content',
      'Profile customization',
      'Leaderboard badges',
      'Direct support channel',
      '7-day free trial',
    ],
  },
];

export default function PricingPage() {
  const [loading, setLoading] = useState<string | null>(null);

  const handleSubscribe = async (tier: PricingTier) => {
    if (!tier.priceId) return;

    setLoading(tier.id);
    try {
      const baseUrl = window.location.origin;
      const { url } = await billingService.createCheckoutSession(
        tier.priceId,
        `${baseUrl}${ROUTES.SUBSCRIPTION}?success=true`,
        `${baseUrl}${ROUTES.PRICING}?canceled=true`
      );

      // Redirect to Stripe Checkout
      window.location.href = url;
    } catch (error) {
      console.error('Failed to create checkout session:', error);
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            Choose Your Path
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Unlock the full potential of The Code of Life. Start with a 7-day free trial
            on any paid plan.
          </p>
        </motion.div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <motion.div
              key={tier.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={`relative p-6 h-full flex flex-col ${
                  tier.highlighted
                    ? 'border-2 border-primary shadow-lg scale-105'
                    : ''
                }`}
              >
                {tier.badge && (
                  <Badge
                    className="absolute -top-3 left-1/2 -translate-x-1/2"
                    variant="default"
                  >
                    {tier.badge}
                  </Badge>
                )}

                <div className="mb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10 text-primary">
                      {tier.icon}
                    </div>
                    <h2 className="text-2xl font-bold">{tier.name}</h2>
                  </div>
                  <p className="text-muted-foreground">{tier.description}</p>
                </div>

                <div className="mb-6">
                  <span className="text-4xl font-bold">
                    ${tier.price.toFixed(2)}
                  </span>
                  <span className="text-muted-foreground">/{tier.interval}</span>
                </div>

                <ul className="space-y-3 mb-8 flex-grow">
                  {tier.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-500 shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full"
                  variant={tier.highlighted ? 'primary' : 'outline'}
                  size="lg"
                  onClick={() => handleSubscribe(tier)}
                  disabled={!tier.priceId || loading === tier.id}
                >
                  {loading === tier.id ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : tier.priceId ? (
                    'Start Free Trial'
                  ) : (
                    'Current Plan'
                  )}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* FAQ Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-16 max-w-3xl mx-auto"
        >
          <h2 className="text-2xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold mb-2">Can I cancel anytime?</h3>
              <p className="text-muted-foreground">
                Yes! You can cancel your subscription at any time. You&apos;ll continue
                to have access until the end of your billing period.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">What happens after my trial ends?</h3>
              <p className="text-muted-foreground">
                After your 7-day free trial, you&apos;ll be charged for your selected
                plan. Cancel before the trial ends to avoid charges.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Can I switch plans?</h3>
              <p className="text-muted-foreground">
                Absolutely! You can upgrade or downgrade your plan at any time.
                Changes will be prorated automatically.
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
