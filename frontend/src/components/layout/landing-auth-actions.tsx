"use client";

import Link from "next/link";
import { useAuthStore } from "@/stores";
import { Button, Skeleton } from "@/components/ui";

export function LandingAuthActions() {
  const { user, isAuthenticated, hasHydrated, isAuthReady } = useAuthStore();
  const isAuthPending = !hasHydrated || !isAuthReady;

  if (isAuthPending) {
    return (
      <div className="flex items-center gap-4">
        <Skeleton className="h-10 w-20 rounded-xl" />
        <Skeleton className="h-10 w-28 rounded-xl" />
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex items-center gap-4">
        <Link href="/dashboard">
          <Button variant="ghost">Dashboard</Button>
        </Link>
        <Link href="/profile">
          <Button variant="primary">{user.username}</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <Link href="/login">
        <Button variant="ghost">Sign In</Button>
      </Link>
      <Link href="/register">
        <Button variant="primary">Get Started</Button>
      </Link>
    </div>
  );
}
