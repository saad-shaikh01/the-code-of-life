'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Sparkles, Quote, BookOpen } from 'lucide-react';

interface WisdomCardProps {
  title?: string;
  wisdom: string;
  source?: string;
  chapter?: number;
  isRevealed?: boolean;
  onReveal?: () => void;
  className?: string;
}

/**
 * WisdomCard - Glassmorphism card for displaying post-puzzle wisdom
 * Features elegant glass effect with animated reveal
 */
export function WisdomCard({
  title = 'Wisdom Unlocked',
  wisdom,
  source,
  chapter,
  isRevealed = true,
  onReveal,
  className = '',
}: WisdomCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.6, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={`relative ${className}`}
    >
      {/* Ambient glow behind card */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          animate={{
            opacity: [0.3, 0.5, 0.3],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute inset-0 bg-gradient-to-br from-amber-500/20 via-orange-500/10 to-purple-500/20 rounded-3xl blur-xl"
        />
      </div>

      {/* Glassmorphism Card */}
      <div className="relative overflow-hidden rounded-2xl">
        {/* Glass background */}
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />

        {/* Glass border effect */}
        <div className="absolute inset-0 rounded-2xl border border-white/10" />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />

        {/* Shine effect */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
          animate={{ x: ['-200%', '200%'] }}
          transition={{
            duration: 3,
            repeat: Infinity,
            repeatDelay: 5,
            ease: 'easeInOut',
          }}
        />

        {/* Content */}
        <div className="relative p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="p-2 rounded-xl bg-amber-500/20 text-amber-400"
            >
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <h3 className="text-lg font-semibold text-white/90">{title}</h3>
          </div>

          {/* Wisdom content */}
          {isRevealed ? (
            <motion.div
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <div className="relative mb-6">
                <Quote className="absolute -top-2 -left-2 w-8 h-8 text-amber-400/30" />
                <p className="text-xl leading-relaxed text-white/80 italic pl-6">
                  {wisdom}
                </p>
              </div>

              {/* Source */}
              {(source || chapter) && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.5 }}
                  className="flex items-center gap-2 text-sm text-white/50"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>
                    {source && source}
                    {chapter && ` - Chapter ${chapter}`}
                  </span>
                </motion.div>
              )}
            </motion.div>
          ) : (
            <motion.button
              onClick={onReveal}
              className="w-full py-6 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex flex-col items-center gap-2">
                <motion.div
                  animate={{ y: [0, -5, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Sparkles className="w-8 h-8 text-amber-400" />
                </motion.div>
                <span className="text-white/70">Tap to reveal wisdom</span>
              </div>
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/**
 * GlassPanel - Reusable glassmorphism panel component
 */
export function GlassPanel({
  children,
  className = '',
  glow = false,
  glowColor = 'amber',
}: {
  children: ReactNode;
  className?: string;
  glow?: boolean;
  glowColor?: 'amber' | 'purple' | 'blue' | 'green';
}) {
  const glowColors = {
    amber: 'from-amber-500/20 to-orange-500/10',
    purple: 'from-purple-500/20 to-pink-500/10',
    blue: 'from-blue-500/20 to-cyan-500/10',
    green: 'from-green-500/20 to-emerald-500/10',
  };

  return (
    <div className={`relative ${className}`}>
      {/* Glow effect */}
      {glow && (
        <motion.div
          animate={{ opacity: [0.3, 0.5, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          className={`absolute inset-0 -z-10 bg-gradient-to-br ${glowColors[glowColor]} rounded-2xl blur-xl`}
        />
      )}

      {/* Glass container */}
      <div className="relative overflow-hidden rounded-2xl">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-xl" />
        <div className="absolute inset-0 rounded-2xl border border-white/10" />
        <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5" />
        <div className="relative">{children}</div>
      </div>
    </div>
  );
}

/**
 * GlassButton - Glassmorphism styled button
 */
export function GlassButton({
  children,
  onClick,
  className = '',
  variant = 'default',
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: 'default' | 'primary' | 'success';
}) {
  const variants = {
    default: 'bg-white/10 hover:bg-white/15 border-white/10',
    primary: 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/30 text-amber-400',
    success: 'bg-green-500/20 hover:bg-green-500/30 border-green-500/30 text-green-400',
  };

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative overflow-hidden px-6 py-3 rounded-xl
        backdrop-blur-sm border transition-colors
        ${variants[variant]} ${className}
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
        initial={{ x: '-200%' }}
        whileHover={{ x: '200%' }}
        transition={{ duration: 0.6 }}
      />
      <span className="relative">{children}</span>
    </motion.button>
  );
}
