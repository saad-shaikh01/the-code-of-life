"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Check, Eye, EyeOff, KeyRound, Lock, X } from "lucide-react";
import { authService } from "@/api/services/auth.service";
import { cn } from "@/lib/utils";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Input,
} from "@/components/ui";

const passwordRequirements = [
  {
    id: "length",
    label: "At least 8 characters",
    test: (value: string) => value.length >= 8,
  },
  {
    id: "uppercase",
    label: "One uppercase letter",
    test: (value: string) => /[A-Z]/.test(value),
  },
  {
    id: "lowercase",
    label: "One lowercase letter",
    test: (value: string) => /[a-z]/.test(value),
  },
  {
    id: "number",
    label: "One number",
    test: (value: string) => /\d/.test(value),
  },
];

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [newPassword, setNewPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isSuccess, setIsSuccess] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<{
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  React.useEffect(() => {
    if (!isSuccess) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      router.push("/login");
    }, 1500);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSuccess, router]);

  const validateForm = () => {
    const nextErrors: typeof formErrors = {};

    if (!token) {
      setError("Link expired or invalid");
      return false;
    }

    if (!newPassword) {
      nextErrors.newPassword = "New password is required";
    } else if (
      passwordRequirements.some((requirement) => !requirement.test(newPassword))
    ) {
      nextErrors.newPassword = "Password doesn't meet requirements";
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your new password";
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = "Passwords don't match";
    }

    setFormErrors(nextErrors);
    setError(null);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await authService.resetPassword({
        token,
        newPassword,
      });
      setIsSuccess(true);
    } catch {
      setError("Link expired or invalid");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" glow="mystic" hover={false}>
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet-500/20 to-amber-500/20"
        >
          <KeyRound className="h-8 w-8 text-violet-300" />
        </motion.div>
        <CardTitle className="text-2xl">Choose a New Password</CardTitle>
        <CardDescription>
          Set a strong password for your account.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {isSuccess ? (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-300">
            Password reset. Redirecting to login...
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Input
                type={showPassword ? "text" : "password"}
                label="New Password"
                placeholder="Enter your new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                error={formErrors.newPassword}
                icon={<Lock className="h-5 w-5" />}
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute right-4 top-[38px] text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5" />
                ) : (
                  <Eye className="h-5 w-5" />
                )}
              </button>
            </div>

            {newPassword && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                className="space-y-1"
              >
                {passwordRequirements.map((requirement) => {
                  const passed = requirement.test(newPassword);
                  return (
                    <div
                      key={requirement.id}
                      className={cn(
                        "flex items-center gap-2 text-xs",
                        passed ? "text-emerald-400" : "text-muted-foreground",
                      )}
                    >
                      {passed ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <X className="h-3 w-3" />
                      )}
                      {requirement.label}
                    </div>
                  );
                })}
              </motion.div>
            )}

            <Input
              type={showPassword ? "text" : "password"}
              label="Confirm Password"
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              error={formErrors.confirmPassword}
              icon={<Lock className="h-5 w-5" />}
              autoComplete="new-password"
            />

            {error && (
              <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-300">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" isLoading={isLoading}>
              Reset Password
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="justify-center border-t border-white/10 pt-6">
        <Link
          href="/login"
          className="inline-flex items-center gap-2 text-sm text-amber-400 transition-colors hover:text-amber-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Sign In
        </Link>
      </CardFooter>
    </Card>
  );
}

function ResetPasswordFallback() {
  return (
    <Card variant="elevated" glow="mystic" hover={false}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Loading Reset Link</CardTitle>
        <CardDescription>Preparing your password reset form.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          Checking your reset token...
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}
