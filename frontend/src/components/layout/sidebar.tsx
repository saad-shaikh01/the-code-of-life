"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Swords,
  Calendar,
  Trophy,
  Award,
  User,
  Settings,
  ChevronLeft,
  ChevronRight,
  LayoutDashboard,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/stores";
import { Avatar, Progress } from "@/components/ui";

const sidebarLinks = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/story", label: "Story Mode", icon: BookOpen },
  { href: "/challenge", label: "Challenge", icon: Swords },
  { href: "/battle", label: "Battle Mode", icon: Swords },
  { href: "/daily", label: "Daily Puzzle", icon: Calendar },
  { href: "/leaderboards", label: "Leaderboards", icon: Trophy },
  { href: "/achievements", label: "Achievements", icon: Award },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/subscription", label: "Subscription", icon: CreditCard },
  { href: "/settings", label: "Settings", icon: Settings },
];

interface SidebarProps {
  className?: string;
}

export function Sidebar({ className }: SidebarProps) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useAuthStore();
  const [collapsed, setCollapsed] = React.useState(false);

  // Calculate XP progress (for demo - would come from user data)
  const xpForNextLevel = (user?.currentLevel || 1) * 1000;
  const currentXp = (user?.totalScore || 0) % xpForNextLevel;
  const xpProgress = (currentXp / xpForNextLevel) * 100;

  return (
    <aside
      className={cn(
        "fixed left-0 top-16 h-[calc(100vh-4rem)] z-10",
        "bg-card/50 backdrop-blur-lg border-r border-white/10",
        "transition-all duration-300 ease-out",
        collapsed ? "w-20" : "w-64",
        className
      )}
    >
      <div className="flex flex-col h-full p-4">
        {/* Collapse Button */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className={cn(
            "absolute -right-3 top-6 z-20",
            "h-6 w-6 rounded-full",
            "bg-card border border-white/20",
            "flex items-center justify-center",
            "text-muted-foreground hover:text-foreground",
            "transition-colors"
          )}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <ChevronLeft className="h-4 w-4" />
          )}
        </button>

        {/* User Profile Card */}
        {isAuthenticated && user && (
          <div
            className={cn(
              "mb-6 p-4 rounded-xl bg-white/5 border border-white/10",
              "transition-all duration-300",
              collapsed && "p-2"
            )}
          >
            <div className={cn("flex items-center gap-3", collapsed && "justify-center")}>
              <Avatar
                src={user.avatarUrl}
                alt={user.username}
                fallback={user.username}
                size={collapsed ? "sm" : "md"}
              />
              <AnimatePresence mode="wait">
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden"
                  >
                    <p className="font-semibold text-foreground truncate">
                      {user.username}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Level {user.currentLevel}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* XP Progress */}
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>{currentXp.toLocaleString()} XP</span>
                  <span>{xpForNextLevel.toLocaleString()} XP</span>
                </div>
                <Progress value={xpProgress} size="sm" variant="gold" />
              </motion.div>
            )}
          </div>
        )}

        {/* Navigation Links */}
        <nav className="flex-1 space-y-1">
          {sidebarLinks.map((link) => {
            const isActive = pathname === link.href || pathname?.startsWith(link.href + "/");
            const Icon = link.icon;

            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative flex items-center gap-3 px-4 py-3 rounded-xl",
                  "text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  isActive
                    ? "text-foreground bg-white/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="sidebar-indicator"
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-amber-400 to-amber-600"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className={cn("h-5 w-5 shrink-0", isActive && "text-amber-400")} />
                <AnimatePresence mode="wait">
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap"
                    >
                      {link.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </nav>

        {/* Bottom Stats */}
        {isAuthenticated && user && !collapsed && (
          <div className="mt-auto pt-4 border-t border-white/10">
            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-lg font-bold text-amber-400">
                  {user.totalScore.toLocaleString()}
                </p>
                <p className="text-xs text-muted-foreground">Total Score</p>
              </div>
              <div className="p-2 rounded-lg bg-white/5">
                <p className="text-lg font-bold text-orange-400">
                  {user.streakDays}
                </p>
                <p className="text-xs text-muted-foreground">Day Streak</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
