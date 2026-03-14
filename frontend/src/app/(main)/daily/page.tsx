"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertCircle,
  Calendar,
  Flame,
  Clock,
  ChevronRight,
  CheckCircle2,
  History,
} from "lucide-react";
import { useDailyPuzzle, usePuzzles, useUserProgress } from "@/hooks";
import { useAuthStore } from "@/stores";
import { PageHeader } from "@/components/layout";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  Button,
  Badge,
  Skeleton,
} from "@/components/ui";
import { LockedOverlay } from "@/components/zen";
import { getCipherPreviewTokens } from "@/lib/cipher";
import { cn } from "@/lib/utils";
import { CipherTokenCell } from "@/modules/puzzles/components/CipherTokenCell";

export default function DailyPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const {
    data: dailyPuzzle,
    isLoading: dailyLoading,
    error: dailyPuzzleError,
    isLocked: dailyPuzzleLocked,
  } = useDailyPuzzle();
  const { data: puzzlesData, isLoading: puzzlesLoading } = usePuzzles({
    gameMode: "DAILY",
    limit: 7, // Last 7 daily puzzles
  });
  const { data: progressData } = useUserProgress();
  const dailyPreview = dailyPuzzle?.data
    ? getCipherPreviewTokens(dailyPuzzle.data.encryptedPattern, 12)
    : null;

  const handleUpgradeClick = () => {
    router.push("/pricing");
  };

  // Check if today's puzzle is completed
  const todayCompleted = React.useMemo(() => {
    const puzzleData = dailyPuzzle?.data;
    const progress = progressData?.data;
    if (!puzzleData || !progress) return false;
    return progress.some((p) => p.puzzleId === puzzleData.id && p.completed);
  }, [dailyPuzzle, progressData]);

  // Get today's progress
  const todayProgress = React.useMemo(() => {
    const puzzleData = dailyPuzzle?.data;
    const progress = progressData?.data;
    if (!puzzleData || !progress) return null;
    return progress.find((p) => p.puzzleId === puzzleData.id);
  }, [dailyPuzzle, progressData]);

  // Progress map for history
  const progressMap = React.useMemo(() => {
    const map = new Map();
    progressData?.data?.forEach((p) => {
      map.set(p.puzzleId, p);
    });
    return map;
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

      setTimeUntilReset(
        `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`,
      );
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Daily Puzzle"
        subtitle="A new challenge awaits you every day"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Daily Puzzle" },
        ]}
      />

      {/* Streak display */}
      {user && user.streakDays > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <Card variant="glass" className="border-orange-500/20">
            <CardContent className="flex items-center justify-center gap-4 py-6">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-orange-500/20">
                  <Flame className="h-8 w-8 text-orange-400" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-orange-400">
                    {user.streakDays} Day Streak!
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Keep it going!
                  </p>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map((day) => (
                  <div
                    key={day}
                    className={cn(
                      "h-3 w-3 rounded-full",
                      day <= (user.streakDays % 7 || 7)
                        ? "bg-orange-400"
                        : "bg-white/10",
                    )}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      <LockedOverlay
        isLocked={dailyPuzzleLocked}
        featureName="Daily Challenges"
        requiredTier="PRO"
        onUpgradeClick={handleUpgradeClick}
        blur={true}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Puzzle - Main Card */}
          <div className="lg:col-span-2">
            {dailyLoading || dailyPuzzleLocked ? (
              <Skeleton className="h-96" />
            ) : dailyPuzzleError ? (
              <Card variant="default" className="text-center py-16">
                <AlertCircle className="h-16 w-16 mx-auto text-red-400/80 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  Unable to Load Today&apos;s Puzzle
                </h3>
                <p className="text-muted-foreground">
                  {dailyPuzzleError.message || "Please try again in a moment."}
                </p>
              </Card>
            ) : dailyPuzzle?.data ? (
              <Card variant="elevated" glow="gold" className="overflow-hidden">
                <CardHeader className="border-b border-white/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-xl bg-cyan-500/20">
                        <Calendar className="h-5 w-5 text-cyan-400" />
                      </div>
                      <div>
                        <CardTitle>Today&apos;s Challenge</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {new Date().toLocaleDateString("en-US", {
                            weekday: "long",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                    {todayCompleted && (
                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/20">
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                        <span className="text-sm font-medium text-emerald-400">
                          Completed!
                        </span>
                      </div>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="p-6">
                  <h3 className="text-xl font-semibold mb-4">
                    {dailyPuzzle.data.title}
                  </h3>

                  {/* Encrypted pattern display */}
                  <div className="py-8 text-center mb-6 rounded-xl bg-white/5">
                    <div className="flex flex-wrap justify-center gap-3">
                      {dailyPreview?.tokens.map((token, i) =>
                        token === "" ? (
                          <CipherTokenCell
                            key={`gap-${i}`}
                            token={token}
                            gapClassName="w-3 md:w-4"
                          />
                        ) : (
                          <motion.div
                            key={`${token}-${i}`}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.03, type: "spring" }}
                          >
                            <CipherTokenCell
                              token={token}
                              className="min-w-[2.5rem] px-3 py-2 text-lg md:min-w-[3rem] md:text-2xl animate-glow-pulse"
                            />
                          </motion.div>
                        ),
                      )}
                      {dailyPreview?.hasMore && (
                        <span className="text-muted-foreground">...</span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 mb-6">
                    <Badge variant="gameMode" gameMode="DAILY" />
                    <Badge
                      variant="difficulty"
                      difficulty={dailyPuzzle.data.difficulty}
                    />
                  </div>

                  {todayCompleted && todayProgress ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-bold text-amber-400">
                            {todayProgress.score}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Points
                          </p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-bold text-cyan-400">
                            {Math.floor(todayProgress.timeSpent / 60)}:
                            {(todayProgress.timeSpent % 60)
                              .toString()
                              .padStart(2, "0")}
                          </p>
                          <p className="text-xs text-muted-foreground">Time</p>
                        </div>
                        <div className="p-3 rounded-xl bg-white/5">
                          <p className="text-2xl font-bold text-violet-400">
                            {todayProgress.hintsUsed}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Hints Used
                          </p>
                        </div>
                      </div>
                      <Link href={`/puzzle/${dailyPuzzle.data.id}`}>
                        <Button variant="secondary" className="w-full">
                          Play Again
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <Link href={`/puzzle/${dailyPuzzle.data.id}`}>
                      <Button className="w-full group">
                        Solve Today&apos;s Puzzle
                        <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card variant="default" className="text-center py-16">
                <Calendar className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No Daily Puzzle Available
                </h3>
                <p className="text-muted-foreground">
                  There isn&apos;t a daily challenge available right now. Check
                  back later.
                </p>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Countdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-muted-foreground" />
                  Next Puzzle In
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center">
                  <p className="text-4xl font-mono font-bold text-cyan-400">
                    {timeUntilReset}
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    until midnight UTC
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Recent History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5 text-muted-foreground" />
                  Recent Daily Puzzles
                </CardTitle>
              </CardHeader>
              <CardContent>
                {puzzlesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : puzzlesData?.data && puzzlesData.data.length > 0 ? (
                  <div className="space-y-2">
                    {puzzlesData.data.slice(0, 5).map((puzzle) => {
                      const progress = progressMap.get(puzzle.id);
                      const isCompleted = progress?.completed;
                      const isToday = puzzle.id === dailyPuzzle?.data?.id;

                      return (
                        <Link
                          key={puzzle.id}
                          href={`/puzzle/${puzzle.id}`}
                          className={cn(
                            "flex items-center justify-between p-3 rounded-lg",
                            "bg-white/5 hover:bg-white/10 transition-colors",
                            isToday && "border border-cyan-500/30",
                          )}
                        >
                          <div className="flex items-center gap-3">
                            {isCompleted ? (
                              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            ) : (
                              <div className="h-4 w-4 rounded-full border border-white/20" />
                            )}
                            <span
                              className={cn(
                                "text-sm",
                                isCompleted
                                  ? "text-foreground"
                                  : "text-muted-foreground",
                              )}
                            >
                              {puzzle.scheduledDate
                                ? new Date(
                                    puzzle.scheduledDate,
                                  ).toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                  })
                                : "Daily"}
                            </span>
                          </div>
                          {isCompleted && progress && (
                            <span className="text-sm font-medium text-amber-400">
                              {progress.score} pts
                            </span>
                          )}
                        </Link>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No previous daily puzzles
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </LockedOverlay>
    </motion.div>
  );
}
