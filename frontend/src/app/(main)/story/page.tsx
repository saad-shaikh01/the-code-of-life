"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";
import { usePuzzles, useUserProgress } from "@/hooks";
import { PageHeader } from "@/components/layout";
import {
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

export default function StoryPage() {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<
    Difficulty | "ALL"
  >("ALL");

  const {
    data: puzzlesData,
    isLoading: puzzlesLoading,
    error: puzzlesError,
    refetch: refetchPuzzles,
  } = usePuzzles({
    gameMode: "STORY",
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

  // Calculate which puzzles are locked (in story mode, must complete in order)
  const getIsLocked = (index: number) => {
    if (index === 0) return false;
    const previousPuzzle = filteredPuzzles[index - 1];
    if (!previousPuzzle) return false;
    const previousProgress = progressMap.get(previousPuzzle.id);
    return !previousProgress?.completed;
  };

  // Calculate overall progress
  const totalPuzzles = puzzlesData?.data?.length || 0;
  const completedPuzzles =
    puzzlesData?.data?.filter((p) => progressMap.get(p.id)?.completed).length ||
    0;
  const progressPercentage =
    totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;
  const isPageLoading = puzzlesLoading || progressLoading;
  const pageError = puzzlesError ?? progressError;

  const handleRetry = () => {
    void refetchPuzzles();
    void refetchProgress();
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <PageHeader
        title="Story Mode"
        subtitle="Journey through the chapters of wisdom"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Story Mode" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            {isPageLoading ? (
              <Skeleton className="hidden h-10 w-40 rounded-xl sm:block" />
            ) : (
              <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
                <BookOpen className="h-4 w-4 text-violet-400" />
                <span className="text-sm">
                  <span className="font-semibold text-violet-400">
                    {completedPuzzles}
                  </span>
                  <span className="text-muted-foreground">
                    /{totalPuzzles} completed
                  </span>
                </span>
              </div>
            )}
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-8">
        {isPageLoading ? (
          <div className="space-y-3">
            <div className="flex justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-2 w-full rounded-full" />
          </div>
        ) : (
          <>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Your Progress</span>
              <span className="text-violet-400 font-medium">
                {progressPercentage}%
              </span>
            </div>
            <div className="h-2 rounded-full bg-white/10 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
              />
            </div>
          </>
        )}
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
                    : "Failed to load story puzzles. Please try again."
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
                    isLocked={getIsLocked(index)}
                    index={index}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                icon={BookOpen}
                title="No Puzzles Found"
                description={
                  selectedDifficulty === "ALL"
                    ? "Story mode puzzles will appear here once added."
                    : `No ${selectedDifficulty.toLowerCase()} puzzles available yet.`
                }
              />
            )}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
