"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores";
import { Button, Skeleton } from "@/components/ui";
import type { ButtonProps } from "@/components/ui";

interface LandingAuthActionsProps {
  mode?: "nav" | "single";
  loggedOutLabel?: string;
  loggedOutHref?: string;
  buttonSize?: ButtonProps["size"];
  className?: string;
}

export function LandingAuthActions({
  mode = "nav",
  loggedOutLabel = "Get Started",
  loggedOutHref = "/register",
  buttonSize = "md",
  className = "",
}: LandingAuthActionsProps) {
  const { user, isAuthenticated, hasHydrated, isAuthReady } = useAuthStore();
  const isAuthPending = !hasHydrated || !isAuthReady;

  if (isAuthPending) {
    return (
      <div className={`flex items-center gap-4 ${className}`.trim()}>
        {mode === "nav" ? (
          <>
            <Skeleton className="h-10 w-20 rounded-xl" />
            <Skeleton className="h-10 w-28 rounded-xl" />
          </>
        ) : (
          <Skeleton className="h-12 w-48 rounded-xl" />
        )}
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className={`flex items-center gap-4 ${className}`.trim()}>
        <Link href="/dashboard">
          <Button variant="primary" size={buttonSize}>
            Go to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  if (mode === "single") {
    return (
      <div className={`flex items-center gap-4 ${className}`.trim()}>
        <Link href={loggedOutHref}>
          <Button variant="primary" size={buttonSize}>
            {loggedOutLabel}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-4 ${className}`.trim()}>
      <Link href="/login">
        <Button variant="ghost" size={buttonSize}>
          Sign In
        </Button>
      </Link>
      <Link href={loggedOutHref}>
        <Button variant="primary" size={buttonSize}>
          {loggedOutLabel}
        </Button>
      </Link>
    </div>
  );
}
