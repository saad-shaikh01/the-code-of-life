"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "sm" | "md" | "lg" | "icon";
  isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      isLoading = false,
      disabled,
      children,
      type = "button",
      ...props
    },
    ref
  ) => {
    const baseStyles = cn(
      "inline-flex items-center justify-center gap-2 font-semibold rounded-xl",
      "transition-all duration-200",
      "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-background",
      "disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none",
      "active:scale-[0.98] hover:scale-[1.02]"
    );

    const variantStyles = {
      primary: cn(
        "bg-gradient-to-r from-amber-500 to-amber-600",
        "text-white",
        "shadow-lg shadow-amber-500/25",
        "hover:shadow-xl hover:shadow-amber-500/40",
        "hover:from-amber-400 hover:to-amber-500",
        "focus:ring-amber-500/50"
      ),
      secondary: cn(
        "bg-white/10 backdrop-blur-sm",
        "text-white",
        "border border-white/20",
        "hover:bg-white/20",
        "hover:border-white/30",
        "focus:ring-white/50"
      ),
      ghost: cn(
        "text-muted-foreground",
        "hover:text-foreground",
        "hover:bg-white/5",
        "focus:ring-white/30"
      ),
      destructive: cn(
        "bg-gradient-to-r from-red-500 to-red-600",
        "text-white",
        "shadow-lg shadow-red-500/25",
        "hover:shadow-xl hover:shadow-red-500/40",
        "hover:from-red-400 hover:to-red-500",
        "focus:ring-red-500/50"
      ),
      outline: cn(
        "border-2 border-amber-500/50",
        "text-amber-400",
        "hover:bg-amber-500/10",
        "hover:border-amber-500",
        "focus:ring-amber-500/50"
      ),
    };

    const sizeStyles = {
      sm: "px-4 py-2 text-sm",
      md: "px-6 py-3 text-base",
      lg: "px-8 py-4 text-lg",
      icon: "p-3",
    };

    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          baseStyles,
          variantStyles[variant],
          sizeStyles[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>Loading...</span>
          </>
        ) : (
          children
        )}
      </button>
    );
  }
);

Button.displayName = "Button";

export { Button };
