"use client";

import * as React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Calendar,
  BookOpen,
  Swords,
  Trophy,
  Flame,
  Clock,
  Award,
  ChevronRight,
  Star,
  Target,
  TrendingUp,
  Lock,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/stores";
import { useDailyPuzzle, useUserProgress, useUserAchievements } from "@/hooks";
import { PageHeader } from "@/components/layout";
import { Button, Card, CardHeader, CardTitle, CardContent, Badge, Progress, Skeleton } from "@/components/ui";
import { cn } from "@/lib/utils";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

export default function DashboardPage() {
  const { user } = useAuthStore();
  const { data: dailyPuzzle, isLoading: dailyLoading } = useDailyPuzzle();
  const { data: progressData, isLoading: progressLoading } = useUserProgress();

  // Calculate stats from progress data
  const stats = React.useMemo(() => {
    if (!progressData?.data) return null;
    const completed = progressData.data.filter(p => p.completed);
    return {
      totalCompleted: completed.length,
      totalScore: completed.reduce((sum, p) => sum + p.score, 0),
      averageTime: completed.length > 0
        ? Math.round(completed.reduce((sum, p) => sum + p.timeSpent, 0) / completed.length)
        : 0,
    };
  }, [progressData]);

  // Calculate time until next daily puzzle (midnight UTC)
  const [timeUntilReset, setTimeUntilReset] = React.useState("");
  React.useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeUntilReset(`${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  const greeting = React.useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  }, []);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <PageHeader
        title={`${greeting}, ${user?.username || "Explorer"}!`}
        subtitle="Ready to decode some wisdom today?"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content - Left 2 columns */}
        <div className="lg:col-span-2 space-y-6">
          {/* Daily Puzzle Card */}
          <motion.div variants={itemVariants}>
            <Card variant="elevated" glow="gold" className="overflow-hidden">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-cyan-500/20">
                      <Calendar className="h-5 w-5 text-cyan-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-foreground">Today&apos;s Puzzle</h3>
                      <p className="text-sm text-muted-foreground">
                        Resets in {timeUntilReset}
                      </p>
                    </div>
                  </div>
                  {user?.streakDays && user.streakDays > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/20">
                      <Flame className="h-4 w-4 text-orange-400" />
                      <span className="text-sm font-medium text-orange-400">
                        {user.streakDays} day streak!
                      </span>
                    </div>
                  )}
                </div>

                {dailyLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-10 w-40" />
                  </div>
                ) : dailyPuzzle?.data ? (
                  <>
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-4 mb-4 text-4xl font-mono justify-center py-4">
                        {dailyPuzzle.data.encryptedPattern.slice(0, 20).split("").map((char, i) => (
                          <span
                            key={i}
                            className={char === " " ? "w-2" : "symbol-gold animate-glow-pulse"}
                          >
                            {char}
                          </span>
                        ))}
                        {dailyPuzzle.data.encryptedPattern.length > 20 && (
                          <span className="text-muted-foreground">...</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 justify-center">
                        <Badge variant="gameMode" gameMode="DAILY" />
                        <Badge variant="difficulty" difficulty={dailyPuzzle.data.difficulty} />
                      </div>
                    </div>
                    <Link href={`/puzzle/${dailyPuzzle.data.id}`}>
                      <Button className="w-full sm:w-auto">
                        Solve Today&apos;s Puzzle
                        <ChevronRight className="h-4 w-4 ml-2" />
                      </Button>
                    </Link>
                  </>
                ) : (
                  <div className="text-center py-12">
                    <div className="max-w-md mx-auto">
                      <motion.div
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="relative overflow-hidden rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/10 to-purple-500/10 backdrop-blur-sm p-8"
                      >
                        {/* Glow effects */}
                        <div className="absolute -top-20 -right-20 w-40 h-40 bg-amber-500/20 rounded-full blur-3xl" />
                        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl" />

                        <div className="relative z-10">
                          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-amber-500/20 to-purple-500/20 mb-4">
                            <Lock className="h-8 w-8 text-amber-400" />
                          </div>

                          <h3 className="text-xl font-bold mb-2">Unlock Daily Puzzles</h3>
                          <p className="text-muted-foreground mb-6">
                            Upgrade to PRO to access daily challenges and maintain your streak!
                          </p>

                          {/* Benefits */}
                          <div className="space-y-2 mb-6 text-left">
                            {[
                              'Unlimited daily puzzles',
                              'Priority hints system',
                              'Track your streak',
                              '7-day free trial'
                            ].map((benefit, i) => (
                              <div key={i} className="flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                                <span className="text-sm text-foreground">{benefit}</span>
                              </div>
                            ))}
                          </div>

                          <Link href="/pricing">
                            <Button className="w-full group">
                              <Sparkles className="h-4 w-4 mr-2" />
                              Upgrade to PRO
                              <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                            </Button>
                          </Link>

                          <p className="text-xs text-muted-foreground mt-4">
                            Starting at $9.99/month
                          </p>
                        </div>
                      </motion.div>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </motion.div>

          {/* Quick Actions */}
          <motion.div variants={itemVariants}>
            <h3 className="text-lg font-semibold mb-4">Quick Play</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { href: "/story", icon: BookOpen, label: "Story Mode", desc: "Continue your journey", color: "violet" },
                { href: "/challenge", icon: Swords, label: "Challenge", desc: "Test your skills", color: "rose" },
                { href: "/leaderboards", icon: Trophy, label: "Leaderboards", desc: "See rankings", color: "amber" },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link key={action.href} href={action.href}>
                    <Card className="group cursor-pointer h-full">
                      <CardContent className="p-4">
                        <div
                          className={cn(
                            "p-2 rounded-lg w-fit mb-3",
                            action.color === "violet" && "bg-violet-500/20 text-violet-400",
                            action.color === "rose" && "bg-rose-500/20 text-rose-400",
                            action.color === "amber" && "bg-amber-500/20 text-amber-400"
                          )}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <p className="font-medium text-foreground group-hover:text-amber-400 transition-colors">
                          {action.label}
                        </p>
                        <p className="text-sm text-muted-foreground">{action.desc}</p>
                      </CardContent>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </motion.div>

          {/* Recent Activity */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : progressData?.data && progressData.data.length > 0 ? (
                  <div className="space-y-3">
                    {progressData.data.slice(0, 5).map((progress, i) => (
                      <div
                        key={progress.id}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg",
                          "bg-white/5 border border-white/5"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            "h-8 w-8 rounded-lg flex items-center justify-center text-sm font-medium",
                            progress.completed ? "bg-emerald-500/20 text-emerald-400" : "bg-white/10 text-muted-foreground"
                          )}>
                            {progress.completed ? "✓" : i + 1}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">Puzzle #{progress.puzzleId.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">
                              {progress.completed ? `Completed · ${progress.score} points` : "In progress"}
                            </p>
                          </div>
                        </div>
                        <Link href={`/puzzle/${progress.puzzleId}`}>
                          <Button variant="ghost" size="sm">
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </Link>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground">No activity yet. Start solving puzzles!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Sidebar - Right column */}
        <div className="space-y-6">
          {/* Stats Overview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                  Your Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {progressLoading ? (
                  <>
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                    <Skeleton className="h-16 w-full" />
                  </>
                ) : (
                  <>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-amber-400" />
                        <span className="text-muted-foreground">Total Score</span>
                      </div>
                      <span className="font-bold text-amber-400">{user?.totalScore?.toLocaleString() || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-violet-500/10 border border-violet-500/20">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-violet-400" />
                        <span className="text-muted-foreground">Level</span>
                      </div>
                      <span className="font-bold text-violet-400">{user?.currentLevel || 1}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                      <div className="flex items-center gap-3">
                        <Target className="h-5 w-5 text-emerald-400" />
                        <span className="text-muted-foreground">Puzzles Solved</span>
                      </div>
                      <span className="font-bold text-emerald-400">{stats?.totalCompleted || 0}</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Level Progress */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400" />
                  Level Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-4">
                  <span className="text-4xl font-bold text-gradient-gold">
                    Level {user?.currentLevel || 1}
                  </span>
                </div>
                <Progress
                  value={((user?.totalScore || 0) % 1000)}
                  max={1000}
                  variant="gold"
                  size="md"
                />
                <p className="text-sm text-muted-foreground text-center mt-2">
                  {1000 - ((user?.totalScore || 0) % 1000)} XP to next level
                </p>
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  Achievements
                </CardTitle>
                <Link href="/achievements">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {["🏆", "⭐", "🔥", "💎", "🎯", "🌟"].map((emoji, i) => (
                    <div
                      key={i}
                      className={cn(
                        "aspect-square rounded-lg flex items-center justify-center text-2xl",
                        i < 3 ? "bg-white/10" : "bg-white/5 grayscale opacity-50"
                      )}
                    >
                      {emoji}
                    </div>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground text-center mt-4">
                  3 of 20 unlocked
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
