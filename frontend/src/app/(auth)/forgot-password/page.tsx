"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, KeyRound, Mail } from "lucide-react";
import { authService } from "@/api/services/auth.service";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [isSubmitted, setIsSubmitted] = React.useState(false);
  const [resetToken, setResetToken] = React.useState<string | null>(null);

  const validateEmail = () => {
    if (!email) {
      setError("Email is required");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Invalid email format");
      return false;
    }

    setError(null);
    return true;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!validateEmail()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await authService.forgotPassword({ email });
      setIsSubmitted(true);
      setResetToken(response.data.token);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to request a reset link right now.",
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card variant="elevated" glow="gold" hover={false}>
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-cyan-500/20"
        >
          <KeyRound className="h-8 w-8 text-amber-300" />
        </motion.div>
        <CardTitle className="text-2xl">Reset Your Password</CardTitle>
        <CardDescription>
          Enter your account email and we&apos;ll generate a reset link.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your account email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            error={error ?? undefined}
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />

          {isSubmitted && (
            <div className="space-y-3 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm">
              <p className="text-emerald-300">
                If an account exists with this email, a reset link has been
                sent.
              </p>
              {resetToken && (
                <Link
                  href={`/reset-password?token=${resetToken}`}
                  className="inline-flex items-center gap-2 font-medium text-amber-300 transition-colors hover:text-amber-200"
                >
                  Open dev reset link
                </Link>
              )}
            </div>
          )}

          <Button type="submit" className="w-full" isLoading={isLoading}>
            Send Reset Link
          </Button>
        </form>
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
