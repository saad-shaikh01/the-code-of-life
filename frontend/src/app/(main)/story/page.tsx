"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { BookOpen, Filter } from "lucide-react";
import { usePuzzles, useUserProgress } from "@/hooks";
import { PageHeader } from "@/components/layout";
import { Button, Skeleton, Badge, Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui";
import { PuzzleCard } from "@/modules/puzzles/components/PuzzleCard";
import { cn } from "@/lib/utils";
import type { Difficulty } from "@/types/api.types";

const difficulties: (Difficulty | "ALL")[] = ["ALL", "BEGINNER", "INTERMEDIATE", "ADVANCED", "MASTER"];

export default function StoryPage() {
  const [selectedDifficulty, setSelectedDifficulty] = React.useState<Difficulty | "ALL">("ALL");

  const { data: puzzlesData, isLoading: puzzlesLoading } = usePuzzles({
    gameMode: "STORY",
    limit: 100,
  });

  const { data: progressData, isLoading: progressLoading } = useUserProgress();

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
  const completedPuzzles = puzzlesData?.data?.filter(p => progressMap.get(p.id)?.completed).length || 0;
  const progressPercentage = totalPuzzles > 0 ? Math.round((completedPuzzles / totalPuzzles) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <PageHeader
        title="Story Mode"
        subtitle="Journey through the chapters of wisdom"
        breadcrumbs={[
          { label: "Dashboard", href: "/dashboard" },
          { label: "Story Mode" },
        ]}
        actions={
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10">
              <BookOpen className="h-4 w-4 text-violet-400" />
              <span className="text-sm">
                <span className="font-semibold text-violet-400">{completedPuzzles}</span>
                <span className="text-muted-foreground">/{totalPuzzles} completed</span>
              </span>
            </div>
          </div>
        }
      />

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-muted-foreground">Your Progress</span>
          <span className="text-violet-400 font-medium">{progressPercentage}%</span>
        </div>
        <div className="h-2 rounded-full bg-white/10 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="h-full rounded-full bg-gradient-to-r from-violet-500 to-violet-400"
          />
        </div>
      </div>

      {/* Difficulty filter tabs */}
      <Tabs value={selectedDifficulty} onValueChange={(v) => setSelectedDifficulty(v as Difficulty | "ALL")}>
        <TabsList className="mb-6">
          {difficulties.map((diff) => (
            <TabsTrigger key={diff} value={diff}>
              {diff === "ALL" ? "All Levels" : diff.charAt(0) + diff.slice(1).toLowerCase()}
            </TabsTrigger>
          ))}
        </TabsList>

        {difficulties.map((diff) => (
          <TabsContent key={diff} value={diff}>
            {puzzlesLoading || progressLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="h-64" />
                ))}
              </div>
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
              <div className="text-center py-16">
                <BookOpen className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">No Puzzles Found</h3>
                <p className="text-muted-foreground">
                  {selectedDifficulty === "ALL"
                    ? "Story mode puzzles will appear here once added."
                    : `No ${selectedDifficulty.toLowerCase()} puzzles available yet.`}
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </motion.div>
  );
}
