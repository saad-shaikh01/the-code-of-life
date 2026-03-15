"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { getGrowthProgress, getGrowthStageLabel } from "@/lib/growth";

interface GrowthAvatarProps {
  growthPoints: number;
  growthStage: number;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  animated?: boolean;
  className?: string;
}

const sizeMap = {
  sm: { width: 80, height: 100 },
  md: { width: 120, height: 150 },
  lg: { width: 180, height: 225 },
  xl: { width: 240, height: 300 },
};

/**
 * GrowthAvatar - Animated seed-to-tree evolution system
 * Shows user's growth journey through puzzle completion
 */
export function GrowthAvatar({
  growthPoints,
  growthStage,
  size = "md",
  showLabel = true,
  animated = true,
  className = "",
}: GrowthAvatarProps) {
  const dimensions = sizeMap[size];
  const stageName = getGrowthStageLabel(growthStage);
  const progress = getGrowthProgress(growthPoints, growthStage);

  return (
    <div className={`flex flex-col items-center ${className}`}>
      {/* Avatar Container */}
      <div
        className="relative"
        style={{ width: dimensions.width, height: dimensions.height }}
      >
        {/* Background glow */}
        <motion.div
          className="absolute inset-0 rounded-full blur-2xl"
          style={{
            background: `radial-gradient(circle, rgba(34, 197, 94, 0.3) 0%, transparent 70%)`,
          }}
          animate={
            animated
              ? {
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.5, 0.3],
                }
              : {}
          }
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Tree SVG */}
        <svg
          viewBox="0 0 100 125"
          className="w-full h-full"
          style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.3))" }}
        >
          {/* Ground */}
          <ellipse
            cx="50"
            cy="120"
            rx="30"
            ry="5"
            fill="rgba(139, 69, 19, 0.3)"
          />

          {/* Stage-based rendering */}
          {growthStage === 1 && <SeedStage animated={animated} />}
          {growthStage === 2 && <SproutStage animated={animated} />}
          {growthStage === 3 && <SaplingStage animated={animated} />}
          {growthStage === 4 && <YoungTreeStage animated={animated} />}
          {growthStage >= 5 && <MatureTreeStage animated={animated} />}
        </svg>

        {/* Floating particles for higher stages */}
        {growthStage >= 3 && animated && (
          <FloatingLeaves count={growthStage * 2} />
        )}
      </div>

      {/* Label and progress */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 text-center"
        >
          <p className="text-lg font-semibold text-green-400">{stageName}</p>
          <p className="text-sm text-white/60">
            {growthPoints.toLocaleString()} Growth Points
          </p>
          {growthStage < 5 && (
            <div className="mt-2 w-32">
              <div className="flex justify-between text-xs text-white/40 mb-1">
                <span>Next: {getGrowthStageLabel(growthStage + 1)}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                />
              </div>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Stage 1: Seed
function SeedStage({ animated }: { animated: boolean }) {
  return (
    <g>
      <motion.ellipse
        cx="50"
        cy="105"
        rx="8"
        ry="6"
        fill="#8B4513"
        animate={animated ? { scale: [1, 1.05, 1] } : {}}
        transition={{ duration: 2, repeat: Infinity }}
      />
      <motion.path
        d="M 50 105 Q 52 100 50 95"
        stroke="#228B22"
        strokeWidth="2"
        fill="none"
        animate={animated ? { opacity: [0.5, 1, 0.5] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
      />
    </g>
  );
}

// Stage 2: Sprout
function SproutStage({ animated }: { animated: boolean }) {
  return (
    <g>
      {/* Stem */}
      <motion.path
        d="M 50 115 Q 50 90 50 80"
        stroke="#228B22"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
      />
      {/* Leaves */}
      <motion.path
        d="M 50 85 Q 35 80 40 70 Q 50 75 50 85"
        fill="#32CD32"
        animate={animated ? { rotate: [-5, 5, -5] } : {}}
        transition={{ duration: 3, repeat: Infinity }}
        style={{ transformOrigin: "50px 85px" }}
      />
      <motion.path
        d="M 50 85 Q 65 80 60 70 Q 50 75 50 85"
        fill="#32CD32"
        animate={animated ? { rotate: [5, -5, 5] } : {}}
        transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        style={{ transformOrigin: "50px 85px" }}
      />
    </g>
  );
}

// Stage 3: Sapling
function SaplingStage({ animated }: { animated: boolean }) {
  return (
    <g>
      {/* Trunk */}
      <motion.path
        d="M 50 115 Q 50 80 50 60"
        stroke="#8B4513"
        strokeWidth="5"
        fill="none"
        strokeLinecap="round"
      />
      {/* Branches with leaves */}
      <motion.g
        animate={animated ? { rotate: [-2, 2, -2] } : {}}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ transformOrigin: "50px 70px" }}
      >
        <path
          d="M 50 70 Q 30 65 25 55"
          stroke="#8B4513"
          strokeWidth="3"
          fill="none"
        />
        <circle cx="25" cy="50" r="12" fill="#228B22" />
        <circle cx="20" cy="55" r="8" fill="#32CD32" />
      </motion.g>
      <motion.g
        animate={animated ? { rotate: [2, -2, 2] } : {}}
        transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
        style={{ transformOrigin: "50px 70px" }}
      >
        <path
          d="M 50 70 Q 70 65 75 55"
          stroke="#8B4513"
          strokeWidth="3"
          fill="none"
        />
        <circle cx="75" cy="50" r="12" fill="#228B22" />
        <circle cx="80" cy="55" r="8" fill="#32CD32" />
      </motion.g>
      {/* Top */}
      <circle cx="50" cy="55" r="15" fill="#228B22" />
      <circle cx="45" cy="50" r="10" fill="#32CD32" />
    </g>
  );
}

// Stage 4: Young Tree
function YoungTreeStage({ animated }: { animated: boolean }) {
  return (
    <g>
      {/* Trunk */}
      <path
        d="M 50 115 Q 50 70 50 45"
        stroke="#654321"
        strokeWidth="8"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 50 75 Q 30 70 20 60"
        stroke="#654321"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M 50 75 Q 70 70 80 60"
        stroke="#654321"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M 50 55 Q 35 50 30 40"
        stroke="#654321"
        strokeWidth="3"
        fill="none"
      />
      <path
        d="M 50 55 Q 65 50 70 40"
        stroke="#654321"
        strokeWidth="3"
        fill="none"
      />

      {/* Foliage */}
      <motion.g
        animate={animated ? { scale: [1, 1.02, 1] } : {}}
        transition={{ duration: 5, repeat: Infinity }}
      >
        <ellipse cx="50" cy="35" rx="35" ry="30" fill="#228B22" />
        <ellipse cx="35" cy="45" rx="20" ry="18" fill="#2E8B57" />
        <ellipse cx="65" cy="45" rx="20" ry="18" fill="#2E8B57" />
        <ellipse cx="50" cy="25" rx="25" ry="20" fill="#32CD32" />
        <ellipse cx="30" cy="35" rx="15" ry="12" fill="#3CB371" />
        <ellipse cx="70" cy="35" rx="15" ry="12" fill="#3CB371" />
      </motion.g>
    </g>
  );
}

// Stage 5: Mature Tree
function MatureTreeStage({ animated }: { animated: boolean }) {
  return (
    <g>
      {/* Trunk */}
      <path
        d="M 45 115 Q 45 80 48 35"
        stroke="#4a3728"
        strokeWidth="12"
        fill="none"
        strokeLinecap="round"
      />
      <path
        d="M 55 115 Q 55 80 52 35"
        stroke="#5a4738"
        strokeWidth="10"
        fill="none"
        strokeLinecap="round"
      />

      {/* Major branches */}
      <path
        d="M 48 70 Q 20 60 10 45"
        stroke="#4a3728"
        strokeWidth="6"
        fill="none"
      />
      <path
        d="M 52 70 Q 80 60 90 45"
        stroke="#4a3728"
        strokeWidth="6"
        fill="none"
      />
      <path
        d="M 48 50 Q 25 40 15 25"
        stroke="#4a3728"
        strokeWidth="4"
        fill="none"
      />
      <path
        d="M 52 50 Q 75 40 85 25"
        stroke="#4a3728"
        strokeWidth="4"
        fill="none"
      />

      {/* Dense foliage */}
      <motion.g
        animate={animated ? { scale: [1, 1.02, 1], rotate: [-1, 1, -1] } : {}}
        transition={{ duration: 6, repeat: Infinity }}
        style={{ transformOrigin: "50px 40px" }}
      >
        <ellipse cx="50" cy="30" rx="45" ry="35" fill="#1a5c1a" />
        <ellipse cx="25" cy="40" rx="25" ry="22" fill="#228B22" />
        <ellipse cx="75" cy="40" rx="25" ry="22" fill="#228B22" />
        <ellipse cx="50" cy="15" rx="35" ry="25" fill="#2E8B57" />
        <ellipse cx="20" cy="30" rx="18" ry="15" fill="#32CD32" />
        <ellipse cx="80" cy="30" rx="18" ry="15" fill="#32CD32" />
        <ellipse cx="50" cy="5" rx="25" ry="18" fill="#3CB371" />
        <ellipse cx="35" cy="20" rx="12" ry="10" fill="#90EE90" />
        <ellipse cx="65" cy="20" rx="12" ry="10" fill="#90EE90" />
      </motion.g>

      {/* Golden fruits for max level */}
      {animated && (
        <>
          <motion.circle
            cx="30"
            cy="35"
            r="4"
            fill="#FFD700"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <motion.circle
            cx="70"
            cy="35"
            r="4"
            fill="#FFD700"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          />
          <motion.circle
            cx="50"
            cy="20"
            r="4"
            fill="#FFD700"
            animate={{ opacity: [0.8, 1, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: 1 }}
          />
        </>
      )}
    </g>
  );
}

// Floating leaves effect
function FloatingLeaves({ count }: { count: number }) {
  const [leaves, setLeaves] = React.useState<
    Array<{
      id: number;
      x: number;
      delay: number;
      duration: number;
      size: number;
    }>
  >([]);

  React.useEffect(() => {
    setLeaves(
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 5,
        duration: 5 + Math.random() * 5,
        size: 4 + Math.random() * 4,
      })),
    );
  }, [count]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {leaves.map((leaf) => (
        <motion.div
          key={leaf.id}
          className="absolute"
          style={{
            left: `${leaf.x}%`,
            top: "20%",
            width: leaf.size,
            height: leaf.size,
          }}
          animate={{
            y: ["0%", "300%"],
            x: ["-10%", "10%", "-10%"],
            rotate: [0, 180, 360],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: leaf.duration,
            delay: leaf.delay,
            repeat: Infinity,
            ease: "linear",
          }}
        >
          <svg viewBox="0 0 10 10" className="w-full h-full">
            <path d="M 5 0 Q 8 3 5 10 Q 2 3 5 0" fill="#32CD32" opacity="0.6" />
          </svg>
        </motion.div>
      ))}
    </div>
  );
}

/**
 * GrowthAvatarMini - Compact version for headers/sidebars
 */
export function GrowthAvatarMini({
  growthStage,
  growthPoints,
  className = "",
}: {
  growthStage: number;
  growthPoints: number;
  className?: string;
}) {
  const stageName = getGrowthStageLabel(growthStage);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="w-8 h-10 relative">
        <GrowthAvatar
          growthPoints={growthPoints}
          growthStage={growthStage}
          size="sm"
          showLabel={false}
          animated={false}
        />
      </div>
      <div className="text-xs">
        <p className="font-medium text-green-400">{stageName}</p>
        <p className="text-white/50">{growthPoints} pts</p>
      </div>
    </div>
  );
}
