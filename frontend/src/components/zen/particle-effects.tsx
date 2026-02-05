'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface Particle {
  id: number;
  x: number;
  y: number;
  size: number;
  color: string;
  duration: number;
  delay: number;
}

interface ParticleEffectsProps {
  trigger?: boolean;
  type?: 'success' | 'celebration' | 'ambient';
  intensity?: number;
  colors?: string[];
}

const defaultColors = {
  success: ['#fbbf24', '#f59e0b', '#d97706', '#fcd34d'],
  celebration: ['#818cf8', '#a78bfa', '#c4b5fd', '#e879f9', '#fbbf24'],
  ambient: ['#fbbf24', '#f59e0b', '#ffffff'],
};

/**
 * ParticleEffects - Creates beautiful particle animations for correct answers
 */
export function ParticleEffects({
  trigger = false,
  type = 'success',
  intensity = 20,
  colors,
}: ParticleEffectsProps) {
  const [particles, setParticles] = useState<Particle[]>([]);
  const particleId = useRef(0);

  const createParticles = useCallback(() => {
    const particleColors = colors || defaultColors[type];
    const newParticles: Particle[] = [];

    for (let i = 0; i < intensity; i++) {
      newParticles.push({
        id: particleId.current++,
        x: 50 + (Math.random() - 0.5) * 40, // Center with spread
        y: 50 + (Math.random() - 0.5) * 40,
        size: Math.random() * 8 + 4,
        color: particleColors[Math.floor(Math.random() * particleColors.length)],
        duration: Math.random() * 1.5 + 1,
        delay: Math.random() * 0.3,
      });
    }

    setParticles(prev => [...prev, ...newParticles]);

    // Clean up particles after animation
    setTimeout(() => {
      setParticles(prev => prev.filter(p => !newParticles.find(np => np.id === p.id)));
    }, 3000);
  }, [type, intensity, colors]);

  useEffect(() => {
    if (trigger) {
      createParticles();
    }
  }, [trigger, createParticles]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
      <AnimatePresence>
        {particles.map((particle) => (
          <motion.div
            key={particle.id}
            initial={{
              opacity: 0,
              scale: 0,
              x: `${particle.x}vw`,
              y: `${particle.y}vh`,
            }}
            animate={{
              opacity: [0, 1, 1, 0],
              scale: [0, 1.2, 1, 0.5],
              x: `${particle.x + (Math.random() - 0.5) * 30}vw`,
              y: `${particle.y - 20 - Math.random() * 30}vh`,
            }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{
              duration: particle.duration,
              delay: particle.delay,
              ease: 'easeOut',
            }}
            style={{
              position: 'absolute',
              width: particle.size,
              height: particle.size,
              borderRadius: '50%',
              backgroundColor: particle.color,
              boxShadow: `0 0 ${particle.size * 2}px ${particle.color}`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

/**
 * GlowBurst - Creates a radial glow effect on success
 */
export function GlowBurst({
  trigger = false,
  color = '#fbbf24',
}: {
  trigger?: boolean;
  color?: string;
}) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (trigger) {
      setShow(true);
      setTimeout(() => setShow(false), 1000);
    }
  }, [trigger]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 pointer-events-none z-40 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0, opacity: 0.8 }}
            animate={{ scale: 3, opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            style={{
              width: 100,
              height: 100,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${color}40 0%, transparent 70%)`,
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/**
 * FloatingParticles - Ambient floating particles for background atmosphere
 */
export function FloatingParticles({ count = 15 }: { count?: number }) {
  const particles = Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 4 + 2,
    duration: Math.random() * 10 + 15,
    delay: Math.random() * 5,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {particles.map((particle) => (
        <motion.div
          key={particle.id}
          className="absolute rounded-full bg-amber-400/20"
          style={{
            width: particle.size,
            height: particle.size,
            left: `${particle.x}%`,
            top: `${particle.y}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
          }}
          transition={{
            duration: particle.duration,
            delay: particle.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

/**
 * SuccessRipple - Ripple effect emanating from a point
 */
export function SuccessRipple({
  trigger = false,
  x = 50,
  y = 50,
}: {
  trigger?: boolean;
  x?: number;
  y?: number;
}) {
  const [ripples, setRipples] = useState<number[]>([]);
  const rippleId = useRef(0);

  useEffect(() => {
    if (trigger) {
      const id = rippleId.current++;
      setRipples(prev => [...prev, id]);
      setTimeout(() => {
        setRipples(prev => prev.filter(r => r !== id));
      }, 1500);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <AnimatePresence>
        {ripples.map((id) => (
          <motion.div
            key={id}
            className="absolute border-2 border-amber-400/50 rounded-full"
            style={{
              left: `${x}%`,
              top: `${y}%`,
              transform: 'translate(-50%, -50%)',
            }}
            initial={{ width: 0, height: 0, opacity: 1 }}
            animate={{
              width: 400,
              height: 400,
              opacity: 0,
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: 'easeOut' }}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
