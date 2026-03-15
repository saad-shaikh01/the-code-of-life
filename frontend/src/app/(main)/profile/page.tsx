"use client";

import * as React from "react";
import { motion } from "framer-motion";
import {
  User,
  Trophy,
  Star,
  Flame,
  Target,
  Clock,
  Lightbulb,
  Award,
  Calendar,
  ChevronRight,
  Settings,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/stores";
import {
  useUserProgress,
  useUserAchievements,
  useSubscriptionStatus,
} from "@/hooks";
import { usersService } from "@/api";
import { useQuery } from "@tanstack/react-query";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Avatar,
  Button,
  Progress,
  Skeleton,
} from "@/components/ui";
import { GrowthAvatar, LockedOverlay, LockedBadge } from "@/components/zen";
import {
  getGrowthProgress,
  getGrowthStageLabel,
  getGrowthThresholdRange,
  MAX_GROWTH_POINTS,
  MAX_GROWTH_STAGE,
} from "@/lib/growth";
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

export default function ProfilePage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { isPro, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const { data: profileData, isLoading: profileLoading } = useQuery({
    queryKey: ["user-profile"],
    queryFn: () => usersService.getProfile(),
    enabled: !!user,
  });

  const { data: progressData, isLoading: progressLoading } = useUserProgress();
  const { data: achievementsData, isLoading: achievementsLoading } =
    useUserAchievements();

  const handleUpgradeClick = () => {
    router.push("/pricing");
  };

  const profile = profileData?.data ?? user;
  const currentLevel = profile?.currentLevel || 1;
  const totalScore = profile?.totalScore || 0;
  const growthPoints = profile?.growthPoints || 0;
  const growthStage = profile?.growthStage || 1;
  const growthLabel = getGrowthStageLabel(growthStage);
  const growthProgress = getGrowthProgress(growthPoints, growthStage);
  const { nextThreshold } = getGrowthThresholdRange(growthStage);
  const nextGrowthLabel =
    growthStage < MAX_GROWTH_STAGE
      ? getGrowthStageLabel(growthStage + 1)
      : null;

  // Calculate level progress
  const xpForNextLevel = currentLevel * 1000;
  const currentXp = totalScore % xpForNextLevel;
  const xpProgress = (currentXp / xpForNextLevel) * 100;

  // Calculate stats from progress data
  const progressStats = React.useMemo(() => {
    if (!progressData?.data) return null;
    const completed = progressData.data.filter((p) => p.completed);
    return {
      totalCompleted: completed.length,
      totalScore: completed.reduce((sum, p) => sum + p.score, 0),
      totalTime: completed.reduce((sum, p) => sum + p.timeSpent, 0),
      totalHints: completed.reduce((sum, p) => sum + p.hintsUsed, 0),
      averageTime:
        completed.length > 0
          ? Math.round(
              completed.reduce((sum, p) => sum + p.timeSpent, 0) /
                completed.length,
            )
          : 0,
      perfectRuns: completed.filter((p) => p.hintsUsed === 0).length,
    };
  }, [progressData]);

  if (!user) {
    return (
      <div className="text-center py-20">
        <User className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
        <h2 className="text-xl font-semibold text-foreground mb-2">
          Not Logged In
        </h2>
        <p className="text-muted-foreground mb-4">
          Please log in to view your profile.
        </p>
        <Link href="/login">
          <Button>Sign In</Button>
        </Link>
      </div>
    );
  }

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="show">
      <PageHeader
        title="Your Profile"
        subtitle="Track your progress and achievements"
        actions={
          <Link href="/settings">
            <Button variant="secondary">
              <Settings className="h-4 w-4 mr-2" />
              Settings
            </Button>
          </Link>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card - Left */}
        <motion.div variants={itemVariants}>
          <Card variant="elevated" glow="gold">
            <CardContent className="text-center py-8">
              <Avatar
                src={profile?.avatarUrl || null}
                alt={profile?.username || user.username}
                fallback={profile?.username || user.username}
                size="xl"
                className="mx-auto mb-4"
              />
              <h2 className="text-2xl font-bold text-foreground mb-1">
                {profile?.username || user.username}
              </h2>
              <p className="text-muted-foreground mb-4">
                {profile?.email || user.email}
              </p>

              {/* Level Badge */}
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/20 border border-amber-500/20 mb-6">
                <Star className="h-5 w-5 text-amber-400" />
                <span className="font-semibold text-amber-400">
                  Level {currentLevel}
                </span>
              </div>

              {/* XP Progress */}
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">
                    Progress to Level {currentLevel + 1}
                  </span>
                  <span className="text-amber-400">
                    {Math.round(xpProgress)}%
                  </span>
                </div>
                <Progress value={xpProgress} variant="gold" size="md" />
                <p className="text-xs text-muted-foreground mt-2">
                  {currentXp.toLocaleString()} /{" "}
                  {xpForNextLevel.toLocaleString()} XP
                </p>
              </div>

              {/* Member since */}
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Member since{" "}
                  {new Date(
                    profile?.createdAt || user.createdAt,
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Growth Avatar Section */}
          <Card className="mt-6">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-green-400" />
                Growth Journey
              </CardTitle>
              {!isPro && !subscriptionLoading && <LockedBadge tier="PRO" />}
            </CardHeader>
            <CardContent>
              {profileLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full rounded-xl" />
                  <Skeleton className="h-[220px] w-full rounded-2xl" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ) : (
                <LockedOverlay
                  isLocked={!isPro && !subscriptionLoading}
                  featureName="Growth Avatar"
                  requiredTier="PRO"
                  onUpgradeClick={handleUpgradeClick}
                  blur={true}
                  className="min-h-[200px]"
                >
                  <div className="space-y-6">
                    <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3">
                      <div>
                        <p className="text-xs uppercase tracking-[0.2em] text-emerald-300/80">
                          Stage {growthStage} of {MAX_GROWTH_STAGE}
                        </p>
                        <p className="text-xl font-semibold text-foreground">
                          {growthLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-emerald-300">
                          {growthPoints.toLocaleString()} pts
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {growthStage >= MAX_GROWTH_STAGE
                            ? "Maximum growth reached"
                            : `Next: ${nextGrowthLabel}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-center">
                      <GrowthAvatar
                        growthPoints={growthPoints}
                        growthStage={growthStage}
                        size="lg"
                        showLabel={false}
                        animated={true}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {growthStage >= MAX_GROWTH_STAGE
                            ? "Growth complete"
                            : "Progress to next stage"}
                        </span>
                        <span className="font-medium text-emerald-300">
                          {growthPoints.toLocaleString()} /{" "}
                          {(growthStage >= MAX_GROWTH_STAGE
                            ? MAX_GROWTH_POINTS
                            : nextThreshold
                          ).toLocaleString()}{" "}
                          pts
                        </span>
                      </div>
                      <Progress
                        value={growthProgress}
                        variant="insight"
                        size="md"
                      />
                    </div>
                  </div>
                </LockedOverlay>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Stats Grid - Right */}
        <div className="lg:col-span-2 space-y-6">
          {/* Quick Stats */}
          <motion.div variants={itemVariants}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Score",
                  value: totalScore.toLocaleString(),
                  icon: Trophy,
                  color: "amber",
                },
                {
                  label: "Streak Days",
                  value: profile?.streakDays || 0,
                  icon: Flame,
                  color: "orange",
                },
                {
                  label: "Puzzles Solved",
                  value: progressStats?.totalCompleted || 0,
                  icon: Target,
                  color: "emerald",
                },
                {
                  label: "Perfect Runs",
                  value: progressStats?.perfectRuns || 0,
                  icon: Award,
                  color: "violet",
                },
              ].map((stat) => {
                const Icon = stat.icon;
                return (
                  <Card key={stat.label} variant="glass">
                    <CardContent className="text-center py-4">
                      <Icon
                        className={cn(
                          "h-5 w-5 mx-auto mb-2",
                          `text-${stat.color}-400`,
                        )}
                      />
                      <div
                        className={cn(
                          "text-2xl font-bold",
                          `text-${stat.color}-400`,
                        )}
                      >
                        {profileLoading || progressLoading ? (
                          <Skeleton className="h-7 w-16 mx-auto" />
                        ) : (
                          stat.value
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {stat.label}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </motion.div>

          {/* Detailed Stats */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Statistics</CardTitle>
              </CardHeader>
              <CardContent>
                {progressLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-cyan-400" />
                        <span className="text-muted-foreground">
                          Total Time Played
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {Math.floor((progressStats?.totalTime || 0) / 60)} min
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-cyan-400" />
                        <span className="text-muted-foreground">
                          Average Time per Puzzle
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {Math.floor((progressStats?.averageTime || 0) / 60)}:
                        {((progressStats?.averageTime || 0) % 60)
                          .toString()
                          .padStart(2, "0")}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                      <div className="flex items-center gap-3">
                        <Lightbulb className="h-5 w-5 text-amber-400" />
                        <span className="text-muted-foreground">
                          Total Hints Used
                        </span>
                      </div>
                      <span className="font-semibold text-foreground">
                        {progressStats?.totalHints || 0}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Achievements Preview */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-muted-foreground" />
                  Recent Achievements
                </CardTitle>
                <Link href="/achievements">
                  <Button variant="ghost" size="sm">
                    View All
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent>
                {achievementsLoading ? (
                  <div className="grid grid-cols-4 gap-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="aspect-square rounded-xl" />
                    ))}
                  </div>
                ) : achievementsData?.data &&
                  achievementsData.data.filter((a) => a.isUnlocked).length >
                    0 ? (
                  <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
                    {achievementsData.data
                      .filter((a) => a.isUnlocked)
                      .slice(0, 6)
                      .map((achievement) => (
                        <div
                          key={achievement.id}
                          className="aspect-square rounded-xl bg-gradient-to-br from-amber-500/20 to-violet-500/20 border border-white/10 flex items-center justify-center text-2xl"
                          title={achievement.name}
                        >
                          {achievement.iconUrl || "🏆"}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No achievements unlocked yet. Start solving puzzles!
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
