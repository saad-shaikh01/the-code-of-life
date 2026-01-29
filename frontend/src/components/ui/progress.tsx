"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface ProgressProps {
  value?: number;
  max?: number;
  variant?: "default" | "gold" | "mystic" | "insight";
  showValue?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  (
    {
      className,
      value = 0,
      max = 100,
      variant = "default",
      showValue = false,
      size = "md",
    },
    ref
  ) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    const sizeStyles = {
      sm: "h-1.5",
      md: "h-2.5",
      lg: "h-4",
    };

    const variantStyles = {
      default: "from-amber-500 to-amber-600",
      gold: "from-amber-400 to-amber-600",
      mystic: "from-violet-400 to-violet-600",
      insight: "from-cyan-400 to-cyan-600",
    };

    return (
      <div className={cn("w-full", className)}>
        {showValue && (
          <div className="flex justify-between text-sm text-muted-foreground mb-1">
            <span>Progress</span>
            <span>{Math.round(percentage)}%</span>
          </div>
        )}
        <div
          ref={ref}
          className={cn(
            "w-full rounded-full bg-white/10 overflow-hidden",
            sizeStyles[size]
          )}
        >
          <motion.div
            className={cn(
              "h-full rounded-full bg-gradient-to-r",
              variantStyles[variant]
            )}
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
      </div>
    );
  }
);

Progress.displayName = "Progress";

export { Progress };
