"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Award, Lock, CheckCircle2, Trophy, Flame, Target, Star } from "lucide-react";
import { useUserAchievements, useAchievementProgress } from "@/hooks";
import { PageHeader } from "@/components/layout";
import { Card, CardContent, Badge, Progress, Skeleton, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { AchievementWithUnlock } from "@/types/api.types";

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9 },
  show: { opacity: 1, scale: 1 },
};

// Get icon based on achievement criteria type
const getAchievementIcon = (criteriaType: string) => {
  switch (criteriaType) {
    case "PUZZLES_COMPLETED":
    case "FIRST_PUZZLE":
      return Target;
    case "SCORE_REACHED":
    case "PERFECT_SCORE":
      return Trophy;
    case "STREAK_DAYS":
    case "DAILY_STREAK":
      return Flame;
    case "SPEED_RUN":
      return Star;
    default:
      return Award;
  }
};

function AchievementCard({ achievement }: { achievement: AchievementWithUnlock }) {
  // Parse criteria
  let criteria: { type: string; target: number } = { type: "UNKNOWN", target: 0 };
  try {
    criteria = JSON.parse(achievement.criteria);
  } catch {
    // Keep default
  }

  const Icon = getAchievementIcon(criteria.type);
  const isUnlocked = achievement.isUnlocked;

  return (
    <motion.div variants={itemVariants}>
      <Card
        variant={isUnlocked ? "elevated" : "default"}
        glow={isUnlocked ? "gold" : "none"}
        className={cn(!isUnlocked && "opacity-60")}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div
              className={cn(
                "p-3 rounded-xl shrink-0",
                isUnlocked
                  ? "bg-gradient-to-br from-amber-500/20 to-violet-500/20"
                  : "bg-white/5"
              )}
            >
              {isUnlocked ? (
                <Icon className="h-6 w-6 text-amber-400" />
              ) : (
                <Lock className="h-6 w-6 text-muted-foreground" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <h3
                  className={cn(
                    "font-semibold truncate",
                    isUnlocked ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {achievement.name}
                </h3>
                {isUnlocked && (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                )}
              </div>
              <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                {achievement.description}
              </p>

              <div className="flex items-center gap-3">
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
                  +{achievement.points} XP
                </Badge>
                {isUnlocked && achievement.unlockedAt && (
                  <span className="text-xs text-muted-foreground">
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Progress bar for locked achievements */}
          {!isUnlocked && criteria.target > 0 && (
            <AchievementProgressBar achievementId={achievement.id} target={criteria.target} />
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function AchievementProgressBar({ achievementId, target }: { achievementId: string; target: number }) {
  const { data: progressData } = useAchievementProgress(achievementId);
  const progress = progressData?.data;

  if (!progress) return null;

  return (
    <div className="mt-3 pt-3 border-t border-white/10">
      <div className="flex justify-between text-xs text-muted-foreground mb-1">
        <span>Progress</span>
        <span>{progress.current} / {progress.target}</span>
      </div>
      <Progress value={progress.percentage} size="sm" variant="mystic" />
    </div>
  );
}

export default function AchievementsPage() {
  const [filter, setFilter] = React.useState<"all" | "unlocked" | "locked">("all");
  const { data: achievementsData, isLoading } = useUserAchievements();

  const achievements = achievementsData?.data || [];

  // Filter achievements
  const filteredAchievements = React.useMemo(() => {
    switch (filter) {
      case "unlocked":
        return achievements.filter((a) => a.isUnlocked);
      case "locked":
        return achievements.filter((a) => !a.isUnlocked);
      default:
        return achievements;
    }
  }, [achievements, filter]);

  // Stats
  const unlockedCount = achievements.filter((a) => a.isUnlocked).length;
  const totalPoints = achievements
    .filter((a) => a.isUnlocked)
    .reduce((sum, a) => sum + a.points, 0);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title="Achievements"
        subtitle="Unlock rewards by completing challenges"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Achievements" },
        ]}
      />

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card variant="glass">
          <CardContent className="text-center py-4">
            <Award className="h-6 w-6 mx-auto mb-2 text-amber-400" />
            <div className="text-2xl font-bold text-amber-400">{unlockedCount}</div>
            <div className="text-xs text-muted-foreground">Unlocked</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="text-center py-4">
            <Lock className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
            <div className="text-2xl font-bold text-foreground">{achievements.length - unlockedCount}</div>
            <div className="text-xs text-muted-foreground">Locked</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="text-center py-4">
            <Trophy className="h-6 w-6 mx-auto mb-2 text-violet-400" />
            <div className="text-2xl font-bold text-violet-400">{totalPoints}</div>
            <div className="text-xs text-muted-foreground">XP Earned</div>
          </CardContent>
        </Card>
        <Card variant="glass">
          <CardContent className="text-center py-4">
            <Target className="h-6 w-6 mx-auto mb-2 text-cyan-400" />
            <div className="text-2xl font-bold text-cyan-400">
              {achievements.length > 0 ? Math.round((unlockedCount / achievements.length) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Complete</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Overall Progress</span>
          <span className="text-amber-400">{unlockedCount} / {achievements.length}</span>
        </div>
        <Progress
          value={achievements.length > 0 ? (unlockedCount / achievements.length) * 100 : 0}
          variant="gold"
          size="md"
        />
      </div>

      {/* Filter Tabs */}
      <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({achievements.length})</TabsTrigger>
          <TabsTrigger value="unlocked">Unlocked ({unlockedCount})</TabsTrigger>
          <TabsTrigger value="locked">Locked ({achievements.length - unlockedCount})</TabsTrigger>
        </TabsList>

        {["all", "unlocked", "locked"].map((tab) => (
          <TabsContent key={tab} value={tab}>
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-36" />
                ))}
              </div>
            ) : filteredAchievements.length > 0 ? (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filteredAchievements.map((achievement) => (
                  <AchievementCard key={achievement.id} achievement={achievement} />
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-16">
                <Award className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {filter === "unlocked" ? "No Achievements Unlocked Yet" : "No Locked Achievements"}
                </h3>
                <p className="text-muted-foreground">
                  {filter === "unlocked"
                    ? "Start solving puzzles to unlock achievements!"
                    : "You've unlocked all available achievements!"}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
