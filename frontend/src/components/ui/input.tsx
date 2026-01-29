"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: string;
  label?: string;
  icon?: React.ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, label, icon, ...props }, ref) => {
    return (
      <div className="w-full space-y-2">
        {label && (
          <label className="block text-sm font-medium text-foreground">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            type={type}
            className={cn(
              "w-full px-4 py-3 rounded-xl",
              "bg-white/5 backdrop-blur-sm",
              "border border-white/10",
              "text-foreground placeholder:text-muted-foreground",
              "focus:outline-none",
              "focus:border-amber-500/50",
              "focus:ring-2 focus:ring-amber-500/20",
              "focus:shadow-[0_0_20px_rgba(251,191,36,0.15)]",
              "transition-all duration-200",
              icon && "pl-12",
              error && "border-red-500/50 focus:border-red-500 focus:ring-red-500/20",
              className
            )}
            ref={ref}
            {...props}
          />
        </div>
        {error && (
          <p className="text-sm text-red-400">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

export { Input };
