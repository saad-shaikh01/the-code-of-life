"use client";

import * as React from "react";
import { MailWarning, X } from "lucide-react";
import { authService } from "@/api/services/auth.service";
import { ApiClientError } from "@/api/client";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui";
import { useAuthStore } from "@/stores";

export function EmailVerificationBanner() {
  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const { addToast } = useToast();

  const [isDismissed, setIsDismissed] = React.useState(false);
  const [isResending, setIsResending] = React.useState(false);

  React.useEffect(() => {
    setIsDismissed(false);
  }, [user?.id]);

  if (!isAuthenticated || !user || user.emailVerified || isDismissed) {
    return null;
  }

  const handleResend = async () => {
    setIsResending(true);

    try {
      const response = await authService.resendVerification();
      addToast({
        type: "success",
        title: "Verification email sent",
        description:
          response.data.message ||
          "Check your inbox for the new verification link.",
      });
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 400) {
        await refreshUser();
      }

      addToast({
        type: "error",
        title: "Unable to resend email",
        description:
          error instanceof Error
            ? error.message
            : "Please try again in a moment.",
      });
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="border-b border-amber-500/20 bg-amber-500/10">
      <div className="mx-auto flex max-w-7xl items-start gap-3 px-4 py-3 text-sm sm:px-6 lg:px-8">
        <MailWarning className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
        <div className="min-w-0 flex-1 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:justify-between sm:gap-4">
          <p className="text-amber-100">
            Please verify your email address. Check your inbox or resend the
            verification email.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              isLoading={isResending}
              onClick={() => void handleResend()}
              className="h-8 px-3 text-amber-200 hover:bg-amber-400/10 hover:text-amber-100"
            >
              Resend
            </Button>
            <button
              type="button"
              onClick={() => setIsDismissed(true)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-amber-200 transition-colors hover:bg-amber-400/10 hover:text-amber-100"
              aria-label="Dismiss verification banner"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
