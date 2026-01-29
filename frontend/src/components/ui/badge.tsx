"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "difficulty" | "gameMode";
  difficulty?: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "MASTER";
  gameMode?: "STORY" | "CHALLENGE" | "DAILY";
}

const difficultyStyles = {
  BEGINNER: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-400",
    border: "border-emerald-500/30",
  },
  INTERMEDIATE: {
    bg: "bg-amber-500/20",
    text: "text-amber-400",
    border: "border-amber-500/30",
  },
  ADVANCED: {
    bg: "bg-orange-500/20",
    text: "text-orange-400",
    border: "border-orange-500/30",
  },
  MASTER: {
    bg: "bg-red-500/20",
    text: "text-red-400",
    border: "border-red-500/30",
  },
};

const gameModeStyles = {
  STORY: {
    bg: "bg-violet-500/20",
    text: "text-violet-400",
    border: "border-violet-500/30",
  },
  CHALLENGE: {
    bg: "bg-rose-500/20",
    text: "text-rose-400",
    border: "border-rose-500/30",
  },
  DAILY: {
    bg: "bg-cyan-500/20",
    text: "text-cyan-400",
    border: "border-cyan-500/30",
  },
};

const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = "default", difficulty, gameMode, children, ...props }, ref) => {
    let styles = "bg-white/10 text-foreground border-white/20";

    if (variant === "difficulty" && difficulty) {
      const ds = difficultyStyles[difficulty];
      styles = cn(ds.bg, ds.text, ds.border);
    } else if (variant === "gameMode" && gameMode) {
      const gms = gameModeStyles[gameMode];
      styles = cn(gms.bg, gms.text, gms.border);
    }

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
          "border",
          styles,
          className
        )}
        {...props}
      >
        {children || difficulty || gameMode}
      </span>
    );
  }
);

Badge.displayName = "Badge";

export { Badge };
