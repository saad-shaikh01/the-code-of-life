"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import ErrorBoundary from "@/components/providers/ErrorBoundary";
import {
  EmailVerificationBanner,
  Header,
  Sidebar,
} from "@/components/layout";
import { Spinner } from "@/components/ui";
import { ROUTES } from "@/config/constants";
import { useAuthStore } from "@/stores";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const hasHydrated = useAuthStore((state) => state.hasHydrated);
  const isAuthReady = useAuthStore((state) => state.isAuthReady);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isAuthPending = !hasHydrated || !isAuthReady;
  const shouldRedirectToLogin = !isAuthPending && !isAuthenticated;

  React.useEffect(() => {
    if (shouldRedirectToLogin) {
      router.replace(ROUTES.LOGIN);
    }
  }, [router, shouldRedirectToLogin]);

  if (isAuthPending || shouldRedirectToLogin) {
    const title = isAuthPending
      ? "Restoring your session..."
      : "Redirecting to sign in...";
    const description = isAuthPending
      ? "Checking your saved login with the server."
      : "This page requires an active account session.";

    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
        <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-4 text-center">
            <Spinner size="lg" variant="gold" />
            <div className="space-y-1">
              <p className="font-semibold text-foreground">{title}</p>
              <p className="text-sm text-muted-foreground">{description}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
      {/* Ambient background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />

      {/* Header */}
      <Header />
      <EmailVerificationBanner />

      {/* Sidebar + Content */}
      <div className="flex">
        <Sidebar className="hidden lg:block" />

        <ErrorBoundary>
          <main className="flex-1 lg:pl-64 transition-all duration-300">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              {children}
            </div>
          </main>
        </ErrorBoundary>
      </div>
    </div>
  );
}
