"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
  variant?: "default" | "gold" | "mystic";
}

const Spinner = React.forwardRef<HTMLDivElement, SpinnerProps>(
  ({ className, size = "md", variant = "default", ...props }, ref) => {
    const sizeStyles = {
      sm: "h-4 w-4 border-2",
      md: "h-6 w-6 border-2",
      lg: "h-8 w-8 border-3",
    };

    const variantStyles = {
      default: "border-muted-foreground border-t-transparent",
      gold: "border-amber-500 border-t-transparent",
      mystic: "border-violet-500 border-t-transparent",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-spin rounded-full",
          sizeStyles[size],
          variantStyles[variant],
          className
        )}
        {...props}
      />
    );
  }
);

Spinner.displayName = "Spinner";

export { Spinner };
