import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { HINTS_PER_PUZZLE, SubmitProgressInput } from '@code-of-life/shared';
import { Difficulty, UserProgress, Puzzle } from '@prisma/client';
import { UsersService } from '../users';

export interface ProgressWithPuzzle extends UserProgress {
  puzzle: Puzzle;
}

export interface GameModeProgress {
  total: number;
  completed: number;
  totalScore: number;
  averageTime: number;
}

const GROWTH_POINTS_BY_DIFFICULTY: Record<Difficulty, number> = {
  BEGINNER: 10,
  INTERMEDIATE: 20,
  ADVANCED: 30,
  MASTER: 30,
};

@Injectable()
export class ProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
  ) {}

  async submitProgress(
    userId: string,
    input: SubmitProgressInput,
  ): Promise<UserProgress> {
    this.validateHintsUsed(input.hintsUsed);

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
            completedAt:
              input.completed && !existingProgress.completed
                ? new Date()
                : existingProgress.completedAt,
            score: Math.max(input.score, existingProgress.score),
            timeSpent: input.timeSpent,
            hintsUsed: Math.min(input.hintsUsed, existingProgress.hintsUsed),
          },
        });

        // Update user stats if completing for first time
        if (input.completed && !existingProgress.completed) {
          await this.updateUserStats(userId, input.score, puzzle.difficulty);
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
      await this.updateUserStats(userId, input.score, puzzle.difficulty);
    }

    return progress;
  }

  private async updateUserStats(
    userId: string,
    score: number,
    difficulty?: Difficulty,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        totalScore: true,
        currentLevel: true,
      },
    });

    if (!user) return;

    // Calculate new level based on total puzzles completed
    const completedCount = await this.prisma.userProgress.count({
      where: { userId, completed: true },
    });

    // Level up every 5 puzzles
    const newLevel = Math.floor(completedCount / 5) + 1;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        totalScore: user.totalScore + score,
        currentLevel: Math.max(user.currentLevel, newLevel),
      },
    });

    await this.usersService.updateGrowth(
      userId,
      this.getGrowthPointsForDifficulty(difficulty),
    );
    await this.usersService.updateStreak(userId);
  }

  private getGrowthPointsForDifficulty(difficulty?: Difficulty): number {
    if (!difficulty) {
      return 10;
    }

    return GROWTH_POINTS_BY_DIFFICULTY[difficulty] ?? 10;
  }

  private validateHintsUsed(hintsUsed: number): void {
    if (!Number.isInteger(hintsUsed)) {
      throw new BadRequestException('hintsUsed must be an integer');
    }

    if (hintsUsed < 0) {
      throw new BadRequestException('hintsUsed cannot be negative');
    }

    if (hintsUsed > HINTS_PER_PUZZLE) {
      throw new BadRequestException(
        `hintsUsed cannot exceed ${HINTS_PER_PUZZLE}`,
      );
    }
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
      averageTime:
        completed.length > 0 ? Math.round(totalTime / completed.length) : 0,
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
          growthPoints: 0,
          growthStage: 1,
        },
      });
    }
  }
}
