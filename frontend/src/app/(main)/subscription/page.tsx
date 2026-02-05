'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  CreditCard,
  Calendar,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Crown,
  Zap,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { billingService, type Subscription } from '@/api/services/billing.service';
import { ROUTES } from '@/config/constants';
import Link from 'next/link';

const tierIcons = {
  FREE: <Sparkles className="h-6 w-6" />,
  PRO: <Zap className="h-6 w-6" />,
  PREMIUM: <Crown className="h-6 w-6" />,
};

const tierColors = {
  FREE: 'bg-gray-100 text-gray-800',
  PRO: 'bg-blue-100 text-blue-800',
  PREMIUM: 'bg-purple-100 text-purple-800',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  TRIALING: 'bg-blue-100 text-blue-800',
  CANCELED: 'bg-red-100 text-red-800',
  PAST_DUE: 'bg-yellow-100 text-yellow-800',
  UNPAID: 'bg-red-100 text-red-800',
  INCOMPLETE: 'bg-yellow-100 text-yellow-800',
  INCOMPLETE_EXPIRED: 'bg-gray-100 text-gray-800',
};

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [loading, setLoading] = useState(true);
  const [portalLoading, setPortalLoading] = useState(false);
  const success = searchParams.get('success');

  useEffect(() => {
    loadSubscription();
  }, []);

  const loadSubscription = async () => {
    try {
      const data = await billingService.getSubscription();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setPortalLoading(true);
    try {
      const { url } = await billingService.createPortalSession(
        window.location.href
      );
      window.location.href = url;
    } catch (error) {
      console.error('Failed to open billing portal:', error);
      setPortalLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Message */}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-3">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-semibold text-green-800">
                    Subscription activated successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Welcome to your new plan. Enjoy all the premium features!
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold mb-2">Subscription</h1>
          <p className="text-muted-foreground">
            Manage your subscription and billing details
          </p>
        </motion.div>

        {subscription ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Current Plan Card */}
            <Card className="p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg ${tierColors[subscription.tier]}`}>
                    {tierIcons[subscription.tier]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{subscription.tier} Plan</h2>
                    <Badge className={statusColors[subscription.status]}>
                      {subscription.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </div>
                {subscription.tier !== 'FREE' && (
                  <Button
                    variant="outline"
                    onClick={handleManageSubscription}
                    disabled={portalLoading}
                  >
                    {portalLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <ExternalLink className="h-4 w-4 mr-2" />
                    )}
                    Manage
                  </Button>
                )}
              </div>

              {subscription.tier !== 'FREE' && (
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Current Period</p>
                      <p className="font-medium">
                        {formatDate(subscription.currentPeriodStart)} -{' '}
                        {formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <CreditCard className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">Next Billing</p>
                      <p className="font-medium">
                        {subscription.cancelAtPeriodEnd
                          ? 'Cancels at period end'
                          : formatDate(subscription.currentPeriodEnd)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {subscription.status === 'TRIALING' && subscription.trialEnd && (
                <div className="mt-4 p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-blue-600" />
                    <p className="text-sm text-blue-800">
                      Your trial ends on {formatDate(subscription.trialEnd)}
                    </p>
                  </div>
                </div>
              )}

              {subscription.cancelAtPeriodEnd && (
                <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-yellow-600" />
                    <p className="text-sm text-yellow-800">
                      Your subscription will be canceled on{' '}
                      {formatDate(subscription.currentPeriodEnd)}
                    </p>
                  </div>
                </div>
              )}
            </Card>

            {/* Upgrade/Downgrade Options */}
            {subscription.tier === 'FREE' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upgrade Your Plan</h3>
                <p className="text-muted-foreground mb-4">
                  Unlock all features and get the most out of The Code of Life.
                </p>
                <Link href={ROUTES.PRICING}>
                  <Button>
                    <Zap className="h-4 w-4 mr-2" />
                    View Plans
                  </Button>
                </Link>
              </Card>
            )}

            {subscription.tier === 'PRO' && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Upgrade to Premium</h3>
                <p className="text-muted-foreground mb-4">
                  Get exclusive puzzles, early access, and premium support.
                </p>
                <Link href={ROUTES.PRICING}>
                  <Button>
                    <Crown className="h-4 w-4 mr-2" />
                    View Premium Benefits
                  </Button>
                </Link>
              </Card>
            )}
          </motion.div>
        ) : (
          <Card className="p-8 text-center">
            <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-xl font-bold mb-2">No Active Subscription</h2>
            <p className="text-muted-foreground mb-6">
              You&apos;re currently on the free plan. Upgrade to unlock all features!
            </p>
            <Link href={ROUTES.PRICING}>
              <Button size="lg">
                <Zap className="h-4 w-4 mr-2" />
                View Plans
              </Button>
            </Link>
          </Card>
        )}
      </div>
    </div>
  );
}

export default function SubscriptionPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SubscriptionContent />
    </Suspense>
  );
}
