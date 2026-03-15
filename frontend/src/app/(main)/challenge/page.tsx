"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { Swords, Trophy, Flame, Target } from "lucide-react";
import { usePuzzles, useUserProgress } from "@/hooks";
import { PageHeader } from "@/components/layout";
import {
  Card,
  EmptyState,
  QueryError,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui";
import { PuzzleCard } from "@/modules/puzzles/components/PuzzleCard";
import type { Difficulty } from "@/types/api.types";

const difficulties: (Difficulty | "ALL")[] = [
  "ALL",
  "BEGINNER",
  "INTERMEDIATE",
  "ADVANCED",
  "MASTER",
];

export default function ChallengePage() {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    Difficulty | "ALL"
  >("ALL");

  const {
    data: puzzlesData,
    isLoading: puzzlesLoading,
    error: puzzlesError,
    refetch: refetchPuzzles,
  } = usePuzzles({
    gameMode: "CHALLENGE",
    limit: 100,
  });

  const {
    data: progressData,
    isLoading: progressLoading,
    error: progressError,
    refetch: refetchProgress,
  } = useUserProgress();

  // Create a map of puzzle progress
  const progressMap = React.useMemo(() => {
    const map = new Map();
    progressData?.data?.forEach((p) => {
      map.set(p.puzzleId, p);
    });
    return map;
  }, [progressData]);

  // Filter puzzles by difficulty
  const filteredPuzzles = React.useMemo(() => {
    if (!puzzlesData?.data) return [];
    if (selectedDifficulty === "ALL") return puzzlesData.data;
    return puzzlesData.data.filter((p) => p.difficulty === selectedDifficulty);
  }, [puzzlesData, selectedDifficulty]);

  // Calculate stats
  const stats = React.useMemo(() => {
    const completed =
      puzzlesData?.data?.filter((p) => progressMap.get(p.id)?.completed) || [];
    const totalScore = completed.reduce(
      (sum, p) => sum + (progressMap.get(p.id)?.score || 0),
      0,
    );
    const bestScore =
      completed.length > 0
        ? Math.max(...completed.map((p) => progressMap.get(p.id)?.score || 0))
        : 0;
    const perfectScores = completed.filter(
      (p) => (progressMap.get(p.id)?.hintsUsed || 0) === 0,
    ).length;

    return {
      completed: completed.length,
      totalScore,
      bestScore,
      perfectScores,
    };
  }, [puzzlesData, progressMap]);
  const isPageLoading = puzzlesLoading || progressLoading;
  const pageError = puzzlesError ?? progressError;

  const handleRetry = () => {
    void refetchPuzzles();
    void refetchProgress();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Challenge Mode"
        subtitle="Test your skills with difficult puzzles"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Challenge Mode" },
        ]}
      />

      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {isPageLoading
          ? [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24" />)
          : [
              {
                label: "Completed",
                value: stats.completed,
                icon: Swords,
                color: "rose",
              },
              {
                label: "Total Score",
                value: stats.totalScore.toLocaleString(),
                icon: Trophy,
                color: "amber",
              },
              {
                label: "Best Score",
                value: stats.bestScore,
                icon: Target,
                color: "violet",
              },
              {
                label: "Perfect Runs",
                value: stats.perfectScores,
                icon: Flame,
                color: "orange",
              },
            ].map((stat) => {
              const Icon = stat.icon;
              return (
                <Card
                  key={stat.label}
                  variant="glass"
                  className="text-center py-4"
                >
                  <Icon
                    className={`h-5 w-5 mx-auto mb-2 text-${stat.color}-400`}
                  />
                  <div className={`text-2xl font-bold text-${stat.color}-400`}>
                    {stat.value}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </Card>
              );
            })}
      </div>

      {/* Difficulty filter tabs */}
      <Tabs
        value={selectedDifficulty}
        onValueChange={(v) => setSelectedDifficulty(v as Difficulty | "ALL")}
      >
        <TabsList className="mb-6">
          {difficulties.map((diff) => (
            <TabsTrigger key={diff} value={diff}>
              {diff === "ALL"
                ? "All Levels"
                : diff.charAt(0) + diff.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {difficulties.map((diff) => (
          <TabsContent key={diff} value={diff}>
            {isPageLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
            ) : pageError ? (
              <QueryError
                message={
                  pageError instanceof Error
                    ? pageError.message
                    : "Failed to load challenge puzzles. Please try again."
                }
                onRetry={handleRetry}
              />
            ) : filteredPuzzles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredPuzzles.map((puzzle, index) => (
                  <PuzzleCard
                    key={puzzle.id}
                    puzzle={puzzle}
                    progress={progressMap.get(puzzle.id)}
                    isLocked={false} // Challenge mode has no locks
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Swords}
                title="No Challenges Found"
                description={
                  selectedDifficulty === "ALL"
                    ? "Challenge mode puzzles will appear here once added."
                    : `No ${selectedDifficulty.toLowerCase()} challenges available yet.`
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
