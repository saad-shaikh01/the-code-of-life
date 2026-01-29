"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "elevated" | "glass";
  glow?: "none" | "gold" | "mystic" | "insight";
  hover?: boolean;
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = "default",
      glow = "none",
      hover = true,
      children,
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "relative rounded-xl p-6",
      "transition-all duration-300 ease-out"
    );

    const variantStyles = {
      default: cn(
        "bg-card/80 backdrop-blur-sm",
        "border border-white/10",
        "shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
        "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]"
      ),
      elevated: cn(
        "bg-gradient-to-br from-gray-900/90 to-gray-800/90",
        "border border-white/10",
        "shadow-xl"
      ),
      glass: cn(
        "bg-white/5 backdrop-blur-lg",
        "border border-white/10"
      ),
    };

    const glowStyles = {
      none: "",
      gold: "shadow-amber-500/10 hover:shadow-amber-500/20",
      mystic: "shadow-violet-500/10 hover:shadow-violet-500/20",
      insight: "shadow-cyan-500/10 hover:shadow-cyan-500/20",
    };

    const hoverStyles = hover
      ? cn(
          "hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)]",
          "hover:-translate-y-1",
          "hover:border-white/20"
        )
      : "";

    return (
      <div
        ref={ref}
        className={cn(
          baseStyles,
          variantStyles[variant],
          glowStyles[glow],
          hoverStyles,
          className
        )}
        {...props}
      >
        {/* Inner glow effect */}
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
        <div className="relative">{children}</div>
      </div>
    );
  }
);

Card.displayName = "Card";

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 pb-4", className)}
    {...props}
  />
));
CardHeader.displayName = "CardHeader";

const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("text-xl font-semibold text-foreground", className)}
    {...props}
  />
));
CardTitle.displayName = "CardTitle";

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
CardDescription.displayName = "CardDescription";

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
));
CardContent.displayName = "CardContent";

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center pt-4", className)}
    {...props}
  />
));
CardFooter.displayName = "CardFooter";

export { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter };
