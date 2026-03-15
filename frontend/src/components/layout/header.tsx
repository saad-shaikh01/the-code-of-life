"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  Menu,
  X,
  BookOpen,
  Swords,
  Calendar,
  Trophy,
  User,
  Settings,
  LogOut,
  Flame,
  Star,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { useSubscriptionStatus } from "@/hooks/use-subscription";
import {
  Button,
  Avatar,
  Dropdown,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
  Skeleton,
} from "@/components/ui";

const navLinks = [
  { href: "/dashboard", label: "Dashboard", icon: BookOpen },
  { href: "/story", label: "Story Mode", icon: BookOpen },
  { href: "/challenge", label: "Challenge", icon: Swords },
  { href: "/daily", label: "Daily", icon: Calendar },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
];

export function Header() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const { user, isAuthenticated, logout, hasHydrated, isAuthReady } =
    useAuthStore();
  const { isFree, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const isAuthPending = !hasHydrated || !isAuthReady;

  return (
    <header className="sticky top-0 z-20 w-full border-b border-white/10 bg-background/80 backdrop-blur-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center">
              <span className="text-lg font-bold text-white">☀</span>
            </div>
            <span className="hidden sm:block font-bold text-lg text-gradient-gold">
              Code of Life
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                pathname === link.href || pathname?.startsWith(link.href + "/");
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "relative px-4 py-2 rounded-lg flex items-center gap-2",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-indicator"
                      className="absolute inset-0 bg-white/10 rounded-lg"
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  )}
                  <Icon className="h-4 w-4 relative z-10" />
                  <span className="relative z-10">{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Menu or Auth Buttons */}
          <div className="flex items-center gap-4">
            {isAuthPending ? (
              <div className="flex items-center gap-2">
                <Skeleton className="h-9 w-20 rounded-lg" />
                <Skeleton className="h-9 w-24 rounded-lg" />
              </div>
            ) : isAuthenticated && user ? (
              <>
                {!subscriptionLoading && isFree && (
                  <Link href="/pricing" className="hidden md:block">
                    <Button variant="outline" size="sm">
                      <Sparkles className="h-3.5 w-3.5" />
                      Upgrade
                    </Button>
                  </Link>
                )}

                {/* Streak Display */}
                {user.streakDays > 0 && (
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                    <Flame className="h-4 w-4 text-orange-400" />
                    <span className="text-sm font-medium text-orange-400">
                      {user.streakDays}
                    </span>
                  </div>
                )}

                {/* Level Display */}
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
                  <Star className="h-4 w-4 text-amber-400" />
                  <span className="text-sm font-medium text-amber-400">
                    Lvl {user.currentLevel}
                  </span>
                </div>

                {/* User Dropdown */}
                <Dropdown>
                  <DropdownTrigger
                    showChevron={false}
                    className="p-0 bg-transparent border-0 hover:bg-transparent"
                  >
                    <Avatar
                      src={user.avatarUrl}
                      alt={user.username}
                      fallback={user.username}
                      size="md"
                    />
                  </DropdownTrigger>
                  <DropdownContent align="end">
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="font-semibold text-foreground">
                        {user.username}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                    <DropdownItem icon={<User className="h-4 w-4" />}>
                      <Link href="/profile">Profile</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Trophy className="h-4 w-4" />}>
                      <Link href="/achievements">Achievements</Link>
                    </DropdownItem>
                    <DropdownItem icon={<Settings className="h-4 w-4" />}>
                      <Link href="/settings">Settings</Link>
                    </DropdownItem>
                    <DropdownSeparator />
                    <DropdownItem
                      icon={<LogOut className="h-4 w-4" />}
                      destructive
                      onClick={logout}
                    >
                      Logout
                    </DropdownItem>
                  </DropdownContent>
                </Dropdown>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login">
                  <Button variant="ghost" size="sm">
                    Login
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="primary" size="sm">
                    Sign Up
                  </Button>
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <motion.div
          initial={false}
          animate={{
            height: mobileMenuOpen ? "auto" : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          className="md:hidden overflow-hidden"
        >
          <nav className="flex flex-col gap-1 py-4 border-t border-white/10">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              const Icon = link.icon;

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg",
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "bg-white/10 text-foreground"
                      : "text-muted-foreground hover:bg-white/5 hover:text-foreground",
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {link.label}
                </Link>
              );
            })}

            {!isAuthPending &&
              isAuthenticated &&
              !subscriptionLoading &&
              isFree && (
                <Link
                  href="/pricing"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-amber-300 hover:bg-amber-500/10 hover:text-amber-200 transition-colors"
                >
                  <Sparkles className="h-5 w-5" />
                  Upgrade to Pro
                </Link>
              )}
          </nav>
        </motion.div>
      </div>
    </header>
  );
}
