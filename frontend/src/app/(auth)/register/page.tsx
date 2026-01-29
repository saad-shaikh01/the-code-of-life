"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, User, Check, X } from "lucide-react";
import { useAuthStore } from "@/stores";
import { useToast } from "@/components/ui/toast";
import { Button, Input, Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui";
import { cn } from "@/lib/utils";

// Password validation requirements
const passwordRequirements = [
  { id: "length", label: "At least 8 characters", test: (p: string) => p.length >= 8 },
  { id: "uppercase", label: "One uppercase letter", test: (p: string) => /[A-Z]/.test(p) },
  { id: "lowercase", label: "One lowercase letter", test: (p: string) => /[a-z]/.test(p) },
  { id: "number", label: "One number", test: (p: string) => /\d/.test(p) },
];

export default function RegisterPage() {
  const router = useRouter();
  const { register, isLoading, error, clearError } = useAuthStore();
  const { addToast } = useToast();

  const [email, setEmail] = React.useState("");
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [confirmPassword, setConfirmPassword] = React.useState("");
  const [showPassword, setShowPassword] = React.useState(false);
  const [acceptTerms, setAcceptTerms] = React.useState(false);
  const [formErrors, setFormErrors] = React.useState<{
    email?: string;
    username?: string;
    password?: string;
    confirmPassword?: string;
    terms?: string;
  }>({});

  React.useEffect(() => {
    clearError();
  }, [clearError]);

  const validateForm = () => {
    const errors: typeof formErrors = {};

    // Email validation
    if (!email) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format";
    }

    // Username validation
    if (!username) {
      errors.username = "Username is required";
    } else if (username.length < 3 || username.length > 30) {
      errors.username = "Username must be 3-30 characters";
    } else if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      errors.username = "Only letters, numbers, and underscores allowed";
    }

    // Password validation
    if (!password) {
      errors.password = "Password is required";
    } else {
      const failedRequirements = passwordRequirements.filter(
        (req) => !req.test(password)
      );
      if (failedRequirements.length > 0) {
        errors.password = "Password doesn't meet requirements";
      }
    }

    // Confirm password validation
    if (!confirmPassword) {
      errors.confirmPassword = "Please confirm your password";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords don't match";
    }

    // Terms validation
    if (!acceptTerms) {
      errors.terms = "You must accept the terms and conditions";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      await register({ email, username, password });
      addToast({
        type: "success",
        title: "Welcome to Code of Life!",
        description: "Your account has been created successfully.",
      });
      router.push("/dashboard");
    } catch {
      addToast({
        type: "error",
        title: "Registration failed",
        description: error || "Please check your details and try again.",
      });
    }
  };

  return (
    <Card variant="elevated" glow="mystic" hover={false}>
      <CardHeader className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-4 h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-amber-500/20 border border-white/10 flex items-center justify-center"
        >
          <span className="text-3xl animate-glow-pulse">✦</span>
        </motion.div>
        <CardTitle className="text-2xl">Begin Your Journey</CardTitle>
        <CardDescription>
          Create an account to start decoding wisdom
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            label="Email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={formErrors.email}
            icon={<Mail className="h-5 w-5" />}
            autoComplete="email"
          />

          <Input
            type="text"
            label="Username"
            placeholder="Choose a username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            error={formErrors.username}
            icon={<User className="h-5 w-5" />}
            autoComplete="username"
          />

          <div className="relative">
            <Input
              type={showPassword ? "text" : "password"}
              label="Password"
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={formErrors.password}
              icon={<Lock className="h-5 w-5" />}
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 top-[38px] text-muted-foreground hover:text-foreground transition-colors"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5" />
              ) : (
                <Eye className="h-5 w-5" />
              )}
            </button>
          </div>

          {/* Password requirements */}
          {password && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-1"
            >
              {passwordRequirements.map((req) => {
                const passed = req.test(password);
                return (
                  <div
                    key={req.id}
                    className={cn(
                      "flex items-center gap-2 text-xs",
                      passed ? "text-emerald-400" : "text-muted-foreground"
                    )}
                  >
                    {passed ? (
                      <Check className="h-3 w-3" />
                    ) : (
                      <X className="h-3 w-3" />
                    )}
                    {req.label}
                  </div>
                );
              })}
            </motion.div>
          )}

          <Input
            type={showPassword ? "text" : "password"}
            label="Confirm Password"
            placeholder="Confirm your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={formErrors.confirmPassword}
            icon={<Lock className="h-5 w-5" />}
            autoComplete="new-password"
          />

          <div className="space-y-2">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className={cn(
                  "mt-0.5 h-4 w-4 rounded border-white/20 bg-white/5",
                  "checked:bg-amber-500 checked:border-amber-500",
                  "focus:ring-2 focus:ring-amber-500/20 focus:ring-offset-0"
                )}
              />
              <span className="text-sm text-muted-foreground">
                I agree to the{" "}
                <Link href="/terms" className="text-amber-400 hover:text-amber-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/privacy" className="text-amber-400 hover:text-amber-300">
                  Privacy Policy
                </Link>
              </span>
            </label>
            {formErrors.terms && (
              <p className="text-sm text-red-400">{formErrors.terms}</p>
            )}
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm"
            >
              {error}
            </motion.div>
          )}

          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
          >
            Create Account
          </Button>
        </form>
      </CardContent>

      <CardFooter className="justify-center border-t border-white/10 pt-6">
        <p className="text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
          >
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
