"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, MailCheck } from "lucide-react";
import { authService } from "@/api/services/auth.service";
import { useAuthStore } from "@/stores";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui";

function VerifyEmailPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const refreshUser = useAuthStore((state) => state.refreshUser);
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = React.useState<
    "verifying" | "success" | "error"
  >("verifying");

  React.useEffect(() => {
    if (!token) {
      setStatus("error");
      return;
    }

    let isActive = true;

    const verify = async () => {
      try {
        await authService.verifyEmail(token);
        await refreshUser();

        if (!isActive) {
          return;
        }

        setStatus("success");

        window.setTimeout(() => {
          router.push("/login");
        }, 1500);
      } catch {
        if (isActive) {
          setStatus("error");
        }
      }
    };

    void verify();

    return () => {
      isActive = false;
    };
  }, [refreshUser, router, token]);

  const content = {
    verifying: {
      title: "Verifying...",
      description: "Checking your verification link.",
      body: "Verifying your email address now.",
      tone:
        "border-white/10 bg-white/5 text-muted-foreground" as const,
    },
    success: {
      title: "Email verified!",
      description: "Your account is ready to use.",
      body: "Email verified! Redirecting to login...",
      tone:
        "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" as const,
    },
    error: {
      title: "Verification failed",
      description: "This link is no longer valid.",
      body: "Invalid or expired verification link",
      tone: "border-red-500/20 bg-red-500/10 text-red-300" as const,
    },
  }[status];

  return (
    <Card variant="elevated" glow="gold" hover={false}>
      <CardHeader className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-amber-500/20 to-emerald-500/20">
          <MailCheck className="h-8 w-8 text-amber-300" />
        </div>
        <CardTitle className="text-2xl">{content.title}</CardTitle>
        <CardDescription>{content.description}</CardDescription>
      </CardHeader>

      <CardContent>
        <div className={`rounded-xl border p-4 text-sm ${content.tone}`}>
          {content.body}
        </div>
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

function VerifyEmailFallback() {
  return (
    <Card variant="elevated" glow="gold" hover={false}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Loading Verification Link</CardTitle>
        <CardDescription>Preparing email verification.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-muted-foreground">
          Loading verification details...
        </div>
      </CardContent>
    </Card>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<VerifyEmailFallback />}>
      <VerifyEmailPageContent />
    </Suspense>
  );
}
