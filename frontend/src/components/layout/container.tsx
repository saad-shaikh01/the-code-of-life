"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface ContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
}

const sizeStyles = {
  sm: "max-w-2xl",
  md: "max-w-4xl",
  lg: "max-w-6xl",
  xl: "max-w-7xl",
  full: "max-w-full",
};

export function Container({
  children,
  size = "xl",
  className,
  ...props
}: ContainerProps) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 sm:px-6 lg:px-8",
        sizeStyles[size],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface PageContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  withSidebar?: boolean;
}

export function PageContainer({
  children,
  withSidebar = true,
  className,
  ...props
}: PageContainerProps) {
  return (
    <div
      className={cn(
        "min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950",
        className
      )}
      {...props}
    >
      {/* Ambient background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />

      <div
        className={cn(
          "relative",
          withSidebar && "pl-64 transition-all duration-300"
        )}
      >
        <main className="py-8 px-4 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
