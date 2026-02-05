'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { ReactNode } from 'react';

interface LockedOverlayProps {
  isLocked: boolean;
  children: ReactNode;
  featureName?: string;
  requiredTier?: 'PRO' | 'PREMIUM';
  onUpgradeClick?: () => void;
  className?: string;
  blur?: boolean;
}

/**
 * LockedOverlay - Elegant glassmorphism overlay for premium features
 * Shows a beautiful lock state for non-subscribers with upgrade prompt
 */
export function LockedOverlay({
  isLocked,
  children,
  featureName = 'This feature',
  requiredTier = 'PRO',
  onUpgradeClick,
  className = '',
  blur = true,
}: LockedOverlayProps) {
  return (
    <div className={`relative ${className}`}>
      {/* Content */}
      <div
        className={`transition-all duration-500 ${
          isLocked && blur ? 'filter blur-sm pointer-events-none select-none' : ''
        }`}
      >
        {children}
      </div>

      {/* Lock Overlay */}
      <AnimatePresence>
        {isLocked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-20"
          >
            {/* Glassmorphism backdrop */}
            <div className="absolute inset-0 bg-gradient-to-br from-black/40 via-black/30 to-black/50 backdrop-blur-[2px]" />

            {/* Lock card */}
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', damping: 20, stiffness: 300 }}
              className="relative z-10 max-w-sm mx-4"
            >
              <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl shadow-2xl">
                {/* Glow effect */}
                <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

                <div className="relative p-8 text-center">
                  {/* Icon */}
                  <motion.div
                    animate={{
                      scale: [1, 1.1, 1],
                      rotate: [0, 5, -5, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: 'easeInOut',
                    }}
                    className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 mb-6"
                  >
                    <Lock className="w-8 h-8 text-amber-400" />
                  </motion.div>

                  {/* Title */}
                  <h3 className="text-xl font-bold text-white mb-2">
                    {requiredTier} Feature
                  </h3>

                  {/* Description */}
                  <p className="text-white/60 mb-6">
                    {featureName} is available for {requiredTier} members.
                    Upgrade to unlock this and other premium features.
                  </p>

                  {/* Tier badge */}
                  <div className="flex justify-center mb-6">
                    <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/20 to-purple-500/20 border border-amber-500/30">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium text-amber-300">
                        {requiredTier} Members Only
                      </span>
                    </div>
                  </div>

                  {/* Upgrade button */}
                  {onUpgradeClick && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onUpgradeClick}
                      className="w-full group relative overflow-hidden rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-3 font-semibold text-white shadow-lg shadow-amber-500/25 transition-all hover:shadow-xl hover:shadow-amber-500/40"
                    >
                      <span className="relative z-10 flex items-center justify-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Upgrade to {requiredTier}
                        <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                      </span>
                      {/* Shimmer effect */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                        animate={{ x: ['-100%', '100%'] }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          ease: 'linear',
                        }}
                      />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/**
 * LockedBadge - Small inline badge indicating locked content
 */
export function LockedBadge({
  tier = 'PRO',
  className = '',
}: {
  tier?: 'PRO' | 'PREMIUM';
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 ${className}`}
    >
      <Lock className="w-3 h-3" />
      {tier}
    </span>
  );
}

/**
 * LockedFeatureCard - Card wrapper for locked features in lists
 */
export function LockedFeatureCard({
  title,
  description,
  icon: Icon,
  requiredTier = 'PRO',
  onUpgradeClick,
  className = '',
}: {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  requiredTier?: 'PRO' | 'PREMIUM';
  onUpgradeClick?: () => void;
  className?: string;
}) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className={`relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm ${className}`}
    >
      {/* Locked gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-purple-500/5" />

      <div className="relative p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/10">
            <Icon className="w-6 h-6 text-white/50" />
          </div>
          <LockedBadge tier={requiredTier} />
        </div>

        <h3 className="text-lg font-semibold text-white/70 mb-2">{title}</h3>
        <p className="text-sm text-white/40 mb-4">{description}</p>

        {onUpgradeClick && (
          <button
            onClick={onUpgradeClick}
            className="text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors flex items-center gap-1"
          >
            Unlock with {requiredTier}
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </motion.div>
  );
}
