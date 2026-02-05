'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';

interface BreathingContainerProps {
  children: ReactNode;
  className?: string;
}

/**
 * BreathingContainer - Wraps content with Zen-like breathing transitions
 * Creates a meditative feel with smooth fade-in/out and subtle scale animations
 */
export function BreathingContainer({ children, className = '' }: BreathingContainerProps) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, scale: 0.98, filter: 'blur(8px)' }}
        animate={{
          opacity: 1,
          scale: 1,
          filter: 'blur(0px)',
        }}
        exit={{ opacity: 0, scale: 1.02, filter: 'blur(4px)' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className={className}
      >
        <motion.div
          animate={{ y: [0, -4, 0] }}
          transition={{
            duration: 6,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          {children}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/**
 * BreathingText - Individual text elements with staggered breathing animation
 */
export function BreathingText({
  children,
  delay = 0,
  className = ''
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: 'easeOut' }}
      className={className}
    >
      {children}
    </motion.span>
  );
}

/**
 * PulsingGlow - Ambient background glow effect
 */
export function PulsingGlow({ color = 'amber', intensity = 'medium' }: { color?: string; intensity?: 'low' | 'medium' | 'high' }) {
  const opacityMap = { low: 0.1, medium: 0.2, high: 0.3 };

  return (
    <motion.div
      className="absolute inset-0 pointer-events-none"
      animate={{
        opacity: [opacityMap[intensity] * 0.5, opacityMap[intensity], opacityMap[intensity] * 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      <div
        className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[120px] bg-${color}-500/20`}
      />
    </motion.div>
  );
}
