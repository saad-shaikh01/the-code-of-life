"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string | null;
  alt?: string;
  fallback?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeStyles = {
  sm: "h-8 w-8 text-xs",
  md: "h-10 w-10 text-sm",
  lg: "h-12 w-12 text-base",
  xl: "h-16 w-16 text-lg",
};

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, size = "md", ...props }, ref) => {
    const [hasError, setHasError] = React.useState(false);

    const initials = React.useMemo(() => {
      if (fallback) return fallback.slice(0, 2).toUpperCase();
      if (alt) {
        return alt
          .split(" ")
          .map((word) => word[0])
          .join("")
          .slice(0, 2)
          .toUpperCase();
      }
      return "?";
    }, [fallback, alt]);

    return (
      <div
        ref={ref}
        className={cn(
          "relative inline-flex items-center justify-center rounded-full",
          "bg-gradient-to-br from-amber-500/20 to-violet-500/20",
          "border border-white/10",
          "overflow-hidden",
          sizeStyles[size],
          className
        )}
        {...props}
      >
        {src && !hasError ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt={alt || "Avatar"}
            className="h-full w-full object-cover"
            onError={() => setHasError(true)}
          />
        ) : (
          <span className="font-semibold text-amber-400">{initials}</span>
        )}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar };
