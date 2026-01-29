"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "text" | "circular" | "rectangular";
}

const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = "rectangular", ...props }, ref) => {
    const variantStyles = {
      text: "h-4 rounded",
      circular: "rounded-full",
      rectangular: "rounded-xl",
    };

    return (
      <div
        ref={ref}
        className={cn(
          "animate-pulse bg-white/10",
          "relative overflow-hidden",
          variantStyles[variant],
          className
        )}
        {...props}
      >
        <div className="absolute inset-0 animate-shimmer" />
      </div>
    );
  }
);

Skeleton.displayName = "Skeleton";

// Pre-built skeleton components
const CardSkeleton = () => (
  <div className="rounded-xl bg-white/5 p-6 space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
);

const PuzzleCardSkeleton = () => (
  <div className="rounded-xl bg-white/5 p-6 space-y-4 border border-white/10">
    <div className="flex justify-between items-start">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="h-5 w-16 rounded-full" />
    </div>
    <Skeleton className="h-16 w-full" />
    <div className="flex gap-2">
      <Skeleton className="h-5 w-20 rounded-full" />
      <Skeleton className="h-5 w-24 rounded-full" />
    </div>
    <Skeleton className="h-10 w-full rounded-xl" />
  </div>
);

const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-white/5">
    <Skeleton className="h-8 w-8 rounded-full" variant="circular" />
    <Skeleton className="h-4 w-32" />
    <Skeleton className="h-4 w-20 ml-auto" />
  </div>
);

export { Skeleton, CardSkeleton, PuzzleCardSkeleton, TableRowSkeleton };
