import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { SubmitProgressInput } from '@code-of-life/shared';
import { UserProgress, Puzzle } from '@prisma/client';

export interface ProgressWithPuzzle extends UserProgress {
  puzzle: Puzzle;
}

export interface GameModeProgress {
  total: number;
  completed: number;
  totalScore: number;
  averageTime: number;
}

@Injectable()
export class ProgressService {
  constructor(private readonly prisma: PrismaService) {}

  async submitProgress(
    userId: string,
    input: SubmitProgressInput,
  ): Promise<UserProgress> {
    // Verify puzzle exists
    const puzzle = await this.prisma.puzzle.findUnique({
      where: { id: input.puzzleId },
    });

    if (!puzzle) {
      throw new NotFoundException('Puzzle not found');
    }

    // Check if progress already exists
    const existingProgress = await this.prisma.userProgress.findUnique({
      where: {
        userId_puzzleId: {
          userId,
          puzzleId: input.puzzleId,
        },
      },
    });

    if (existingProgress) {
      // Update existing progress (only if new score is higher or completing for first time)
      const shouldUpdate =
        (!existingProgress.completed && input.completed) ||
        input.score > existingProgress.score;

      if (shouldUpdate) {
        const updatedProgress = await this.prisma.userProgress.update({
          where: { id: existingProgress.id },
          data: {
            completed: input.completed || existingProgress.completed,
            completedAt: input.completed && !existingProgress.completed ? new Date() : existingProgress.completedAt,
            score: Math.max(input.score, existingProgress.score),
            timeSpent: input.timeSpent,
            hintsUsed: Math.min(input.hintsUsed, existingProgress.hintsUsed),
          },
        });

        // Update user stats if completing for first time
        if (input.completed && !existingProgress.completed) {
          await this.updateUserStats(userId, input.score);
        }

        return updatedProgress;
      }

      return existingProgress;
    }

    // Create new progress
    const progress = await this.prisma.userProgress.create({
      data: {
        userId,
        puzzleId: input.puzzleId,
        completed: input.completed,
        completedAt: input.completed ? new Date() : null,
        score: input.score,
        timeSpent: input.timeSpent,
        hintsUsed: input.hintsUsed,
      },
    });

    // Update user stats if completed
    if (input.completed) {
      await this.updateUserStats(userId, input.score);
    }

    return progress;
  }

  private async updateUserStats(userId: string, score: number): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalScore: true,
        currentLevel: true,
        lastPlayedAt: true,
        streakDays: true,
      },
    });

    if (!user) return;

    // Calculate new level based on total puzzles completed
    const completedCount = await this.prisma.userProgress.count({
      where: { userId, completed: true },
    });

    // Level up every 5 puzzles
    const newLevel = Math.floor(completedCount / 5) + 1;

    // Update streak
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    let newStreakDays = user.streakDays;

    if (user.lastPlayedAt) {
      const lastPlayed = new Date(user.lastPlayedAt);
      const lastPlayedDate = new Date(
        lastPlayed.getFullYear(),
        lastPlayed.getMonth(),
        lastPlayed.getDate(),
      );

      const diffDays = Math.floor(
        (today.getTime() - lastPlayedDate.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (diffDays === 1) {
        newStreakDays = user.streakDays + 1;
      } else if (diffDays > 1) {
        newStreakDays = 1;
      }
    } else {
      newStreakDays = 1;
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalScore: user.totalScore + score,
        currentLevel: Math.max(user.currentLevel, newLevel),
        lastPlayedAt: now,
        streakDays: newStreakDays,
      },
    });
  }

  async getUserProgress(userId: string): Promise<ProgressWithPuzzle[]> {
    return this.prisma.userProgress.findMany({
      where: { userId },
      include: { puzzle: true },
      orderBy: { updatedAt: 'desc' },
    });
  }

  async getPuzzleProgress(
    userId: string,
    puzzleId: string,
  ): Promise<UserProgress | null> {
    return this.prisma.userProgress.findUnique({
      where: {
        userId_puzzleId: {
          userId,
          puzzleId,
        },
      },
    });
  }

  async getProgressByGameMode(
    userId: string,
    gameMode: 'STORY' | 'CHALLENGE' | 'DAILY',
  ): Promise<GameModeProgress> {
    const puzzles = await this.prisma.puzzle.findMany({
      where: { gameMode },
      select: { id: true },
    });

    const puzzleIds = puzzles.map((p) => p.id);

    const progress = await this.prisma.userProgress.findMany({
      where: {
        userId,
        puzzleId: { in: puzzleIds },
      },
    });

    const completed = progress.filter((p) => p.completed);
    const totalScore = completed.reduce((sum, p) => sum + p.score, 0);
    const totalTime = completed.reduce((sum, p) => sum + p.timeSpent, 0);

    return {
      total: puzzles.length,
      completed: completed.length,
      totalScore,
      averageTime: completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
    };
  }

  async getCompletedPuzzleIds(userId: string): Promise<string[]> {
    const progress = await this.prisma.userProgress.findMany({
      where: { userId, completed: true },
      select: { puzzleId: true },
    });

    return progress.map((p) => p.puzzleId);
  }

  async resetProgress(userId: string, puzzleId?: string): Promise<void> {
    if (puzzleId) {
      await this.prisma.userProgress.deleteMany({
        where: { userId, puzzleId },
      });
    } else {
      await this.prisma.userProgress.deleteMany({
        where: { userId },
      });

      // Reset user stats
      await this.prisma.user.update({
        where: { id: userId },
        data: {
          totalScore: 0,
          currentLevel: 1,
          streakDays: 0,
        },
      });
    }
  }
}
