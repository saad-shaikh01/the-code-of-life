"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown, Star, Flame } from "lucide-react";
import {
  useLeaderboard,
  useUserRank,
  useGlobalStats,
  useStreakLeaderboard,
  useLevelLeaderboard,
} from "@/hooks";
import { useAuthStore } from "@/stores";
import { PageHeader } from "@/components/layout";
import {
  Avatar,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  EmptyState,
  QueryError,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, LeaderboardPeriod } from "@/types/api.types";

const periods: { value: LeaderboardPeriod; label: string }[] = [
  { value: "all", label: "All Time" },
  { value: "monthly", label: "Monthly" },
  { value: "weekly", label: "Weekly" },
  { value: "daily", label: "Today" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -20 },
  show: { opacity: 1, x: 0 },
};

function LeaderboardRow({
  entry,
  currentUserId,
}: {
  entry: LeaderboardEntry;
  currentUserId?: string;
}) {
  const isCurrentUser = entry.userId === currentUserId;
  const isTopThree = entry.rank <= 3;

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-amber-400" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return (
          <span className="text-muted-foreground font-medium">{rank}</span>
        );
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={cn(
        "flex items-center gap-4 p-4 rounded-xl",
        isCurrentUser
          ? "bg-amber-500/10 border border-amber-500/20"
          : "bg-white/5",
        isTopThree &&
          !isCurrentUser &&
          "bg-gradient-to-r from-white/5 to-transparent",
      )}
    >
      {/* Rank */}
      <div className="w-10 h-10 flex items-center justify-center">
        {getRankIcon(entry.rank)}
      </div>

      {/* User Info */}
      <Avatar
        src={entry.avatarUrl}
        alt={entry.username}
        fallback={entry.username}
        size="md"
      />
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            "font-medium truncate",
            isCurrentUser ? "text-amber-400" : "text-foreground",
          )}
        >
          {entry.username}
          {isCurrentUser && <span className="text-xs ml-2">(You)</span>}
        </p>
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Star className="h-3 w-3" />
            Lvl {entry.currentLevel}
          </span>
          <span className="flex items-center gap-1">
            <Flame className="h-3 w-3" />
            {entry.streakDays} days
          </span>
        </div>
      </div>

      {/* Score */}
      <div className="text-right">
        <p
          className={cn(
            "text-lg font-bold",
            isTopThree ? "text-amber-400" : "text-foreground",
          )}
        >
          {entry.score.toLocaleString()}
        </p>
        <p className="text-xs text-muted-foreground">
          {entry.puzzlesCompleted} puzzles
        </p>
      </div>
    </motion.div>
  );
}

export default function LeaderboardsPage() {
  const [period, setPeriod] = React.useState<LeaderboardPeriod>("all");
  const { user } = useAuthStore();

  const {
    data: leaderboardData,
    isLoading: leaderboardLoading,
    error: leaderboardError,
    refetch: refetchLeaderboard,
  } = useLeaderboard({ period, limit: 50 });
  const {
    data: userRankData,
    error: userRankError,
    refetch: refetchUserRank,
  } = useUserRank();
  const {
    data: globalStatsData,
    isLoading: statsLoading,
    error: globalStatsError,
    refetch: refetchGlobalStats,
  } = useGlobalStats();
  const {
    data: streakData,
    isLoading: streakLoading,
    error: streakError,
    refetch: refetchStreak,
  } = useStreakLeaderboard();
  const {
    data: levelData,
    isLoading: levelLoading,
    error: levelError,
    refetch: refetchLevel,
  } = useLevelLeaderboard();

  const leaderboard = leaderboardData?.data;
  const userRank = userRankData?.data?.rank;
  const globalStats = globalStatsData?.data;
  const statsError = globalStatsError ?? userRankError;

  const handleStatsRetry = () => {
    void refetchGlobalStats();
    void refetchUserRank();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Leaderboards"
        subtitle="Compete with players worldwide"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Leaderboards" },
        ]}
      />

      {/* Global Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {statsLoading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
        ) : statsError ? (
          <div className="col-span-full">
            <QueryError
              message={
                statsError instanceof Error
                  ? statsError.message
                  : "Failed to load leaderboard stats. Please try again."
              }
              onRetry={handleStatsRetry}
            />
          </div>
        ) : (
          <>
            <Card variant="glass">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-amber-400">
                  {globalStats?.totalPlayers?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Players
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-violet-400">
                  {globalStats?.totalPuzzlesCompleted?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">
                  Puzzles Solved
                </div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-cyan-400">
                  {globalStats?.totalScore?.toLocaleString() || 0}
                </div>
                <div className="text-xs text-muted-foreground">Total Score</div>
              </CardContent>
            </Card>
            <Card variant="glass">
              <CardContent className="text-center py-4">
                <div className="text-2xl font-bold text-emerald-400">
                  {userRank || "-"}
                </div>
                <div className="text-xs text-muted-foreground">Your Rank</div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Leaderboard */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-amber-400" />
                  Score Leaderboard
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs
                value={period}
                onValueChange={(v) => setPeriod(v as LeaderboardPeriod)}
              >
                <TabsList className="mb-4">
                  {periods.map((p) => (
                    <TabsTrigger key={p.value} value={p.value}>
                      {p.label}
                    </TabsTrigger>
                  ))}
                </TabsList>

                {periods.map((p) => (
                  <TabsContent key={p.value} value={p.value}>
                    {leaderboardLoading ? (
                      <div className="space-y-3">
                        {[1, 2, 3, 4, 5].map((i) => (
                          <Skeleton key={i} className="h-16" />
                        ))}
                      </div>
                    ) : leaderboardError ? (
                      <QueryError
                        message={
                          leaderboardError instanceof Error
                            ? leaderboardError.message
                            : "Failed to load leaderboard data. Please try again."
                        }
                        onRetry={() => {
                          void refetchLeaderboard();
                        }}
                      />
                    ) : leaderboard?.entries &&
                      leaderboard.entries.length > 0 ? (
                      <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        animate="show"
                        className="space-y-2"
                      >
                        {leaderboard.entries.map((entry) => (
                          <LeaderboardRow
                            key={entry.userId}
                            entry={entry}
                            currentUserId={user?.id}
                          />
                        ))}
                      </motion.div>
                    ) : (
                      <EmptyState
                        icon={Trophy}
                        title="No leaderboard data yet"
                        description="No entries are available for this period yet. Check back after more players post scores."
                      />
                    )}
                  </TabsContent>
                ))}
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Side Leaderboards */}
        <div className="space-y-6">
          {/* Streak Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-5 w-5 text-orange-400" />
                Top Streaks
              </CardTitle>
            </CardHeader>
            <CardContent>
              {streakLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : streakError ? (
                <QueryError
                  message={
                    streakError instanceof Error
                      ? streakError.message
                      : "Failed to load streak leaderboard. Please try again."
                  }
                  onRetry={() => {
                    void refetchStreak();
                  }}
                />
              ) : streakData?.data &&
                Array.isArray(streakData.data) &&
                streakData.data.length > 0 ? (
                <div className="space-y-2">
                  {(streakData.data as LeaderboardEntry[])
                    .slice(0, 5)
                    .map((entry, i) => (
                      <div
                        key={entry.userId}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg",
                          entry.userId === user?.id
                            ? "bg-orange-500/10"
                            : "bg-white/5",
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 text-center font-medium",
                            i < 3 ? "text-orange-400" : "text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <Avatar
                          src={entry.avatarUrl}
                          alt={entry.username}
                          size="sm"
                        />
                        <span className="flex-1 truncate text-sm">
                          {entry.username}
                        </span>
                        <span className="text-sm font-semibold text-orange-400">
                          {entry.streakDays}
                          <Flame className="h-3 w-3 inline ml-1" />
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={Flame}
                  title="No streak data yet"
                  description="No streak leaderboard entries are available yet."
                />
              )}
            </CardContent>
          </Card>

          {/* Level Leaderboard */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Star className="h-5 w-5 text-violet-400" />
                Highest Levels
              </CardTitle>
            </CardHeader>
            <CardContent>
              {levelLoading ? (
                <div className="space-y-2">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-10" />
                  ))}
                </div>
              ) : levelError ? (
                <QueryError
                  message={
                    levelError instanceof Error
                      ? levelError.message
                      : "Failed to load level leaderboard. Please try again."
                  }
                  onRetry={() => {
                    void refetchLevel();
                  }}
                />
              ) : levelData?.data &&
                Array.isArray(levelData.data) &&
                levelData.data.length > 0 ? (
                <div className="space-y-2">
                  {(levelData.data as LeaderboardEntry[])
                    .slice(0, 5)
                    .map((entry, i) => (
                      <div
                        key={entry.userId}
                        className={cn(
                          "flex items-center gap-3 p-2 rounded-lg",
                          entry.userId === user?.id
                            ? "bg-violet-500/10"
                            : "bg-white/5",
                        )}
                      >
                        <span
                          className={cn(
                            "w-6 text-center font-medium",
                            i < 3 ? "text-violet-400" : "text-muted-foreground",
                          )}
                        >
                          {i + 1}
                        </span>
                        <Avatar
                          src={entry.avatarUrl}
                          alt={entry.username}
                          size="sm"
                        />
                        <span className="flex-1 truncate text-sm">
                          {entry.username}
                        </span>
                        <span className="text-sm font-semibold text-violet-400">
                          Lvl {entry.currentLevel}
                        </span>
                      </div>
                    ))}
                </div>
              ) : (
                <EmptyState
                  icon={Star}
                  title="No level data yet"
                  description="No level leaderboard entries are available yet."
                />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </motion.div>
  );
}
