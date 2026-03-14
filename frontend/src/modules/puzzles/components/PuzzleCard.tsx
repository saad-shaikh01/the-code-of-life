"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Lock, CheckCircle2, ChevronRight, Clock, Lightbulb } from "lucide-react";
import { Card, Badge, Button } from "@/components/ui";
import { getCipherPreviewTokens } from "@/lib/cipher";
import { cn } from "@/lib/utils";
import type { Puzzle, UserProgress } from "@/types/api.types";
import { CipherTokenCell } from "./CipherTokenCell";

interface PuzzleCardProps {
  puzzle: Puzzle;
  progress?: UserProgress;
  isLocked?: boolean;
  index?: number;
}

export function PuzzleCard({ puzzle, progress, isLocked = false, index = 0 }: PuzzleCardProps) {
  const isCompleted = progress?.completed;
  const preview = getCipherPreviewTokens(puzzle.encryptedPattern, 8);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card
        variant="elevated"
        glow={isCompleted ? "insight" : isLocked ? "none" : "gold"}
        className={cn(
          "relative overflow-hidden",
          isLocked && "opacity-60 grayscale"
        )}
        hover={!isLocked}
      >
        {/* Status indicator */}
        <div className="absolute top-4 right-4">
          {isLocked ? (
            <div className="p-2 rounded-lg bg-white/10">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
          ) : isCompleted ? (
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
          ) : null}
        </div>

        {/* Content */}
        <div className="space-y-4">
          {/* Title */}
          <h3 className="text-lg font-semibold text-foreground pr-10">
            {puzzle.title}
          </h3>

          {/* Encrypted preview */}
          <div className={cn(
            "py-3 text-center",
            isLocked ? "blur-sm" : ""
          )}>
            <div className="flex flex-wrap justify-center gap-2">
              {preview.tokens.map((token, i) => (
                <CipherTokenCell
                  key={`${token || "gap"}-${i}`}
                  token={token}
                  hidden={isLocked}
                  className="min-w-[2rem]"
                  gapClassName="w-2"
                />
              ))}
              {preview.hasMore && (
                <span className="text-muted-foreground">...</span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="gameMode" gameMode={puzzle.gameMode} />
            <Badge variant="difficulty" difficulty={puzzle.difficulty} />
          </div>

          {/* Progress info for completed puzzles */}
          {isCompleted && progress && (
            <div className="flex items-center gap-4 text-sm text-muted-foreground pt-2 border-t border-white/10">
              <div className="flex items-center gap-1.5">
                <span className="text-amber-400 font-semibold">{progress.score}</span>
                <span>pts</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Clock className="h-4 w-4" />
                <span>{Math.floor(progress.timeSpent / 60)}:{(progress.timeSpent % 60).toString().padStart(2, "0")}</span>
              </div>
              {progress.hintsUsed > 0 && (
                <div className="flex items-center gap-1.5">
                  <Lightbulb className="h-4 w-4" />
                  <span>{progress.hintsUsed}</span>
                </div>
              )}
            </div>
          )}

          {/* Action button */}
          {isLocked ? (
            <div className="text-center text-sm text-muted-foreground">
              Complete previous puzzle to unlock
            </div>
          ) : (
            <Link href={`/puzzle/${puzzle.id}`}>
              <Button className="w-full group">
                {isCompleted ? "Play Again" : "Start Puzzle"}
                <ChevronRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
