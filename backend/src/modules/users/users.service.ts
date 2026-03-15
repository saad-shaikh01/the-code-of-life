import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateProfileInput, UserStats } from '@code-of-life/shared';

const MILLISECONDS_IN_DAY = 24 * 60 * 60 * 1000;
export const GROWTH_THRESHOLDS = [0, 50, 100, 250, 500, 1000] as const;
const MAX_GROWTH_POINTS = GROWTH_THRESHOLDS[GROWTH_THRESHOLDS.length - 1];

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  private getUtcDayStart(date: Date): number {
    return Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
    );
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
        growthPoints: true,
        growthStage: true,
        lastPlayedAt: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, input: UpdateProfileInput) {
    // Check if username is being changed and if it's already taken
    if (input.username) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          username: input.username,
          NOT: { id: userId },
        },
      });

      if (existingUser) {
        throw new ConflictException('Username already taken');
      }
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: input,
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
        growthPoints: true,
        growthStage: true,
        lastPlayedAt: true,
        createdAt: true,
      },
    });
  }

  async getStats(userId: string): Promise<UserStats> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        progress: {
          where: { completed: true },
        },
        achievements: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const completedPuzzles = user.progress.filter((p) => p.completed);
    const totalTimeSpent = completedPuzzles.reduce(
      (sum, p) => sum + p.timeSpent,
      0,
    );
    const totalHintsUsed = completedPuzzles.reduce(
      (sum, p) => sum + p.hintsUsed,
      0,
    );
    const averageTime =
      completedPuzzles.length > 0
        ? totalTimeSpent / completedPuzzles.length
        : 0;

    return {
      totalPuzzlesCompleted: completedPuzzles.length,
      totalScore: user.totalScore,
      currentLevel: user.currentLevel,
      streakDays: user.streakDays,
      growthPoints: user.growthPoints,
      growthStage: user.growthStage,
      averageTimePerPuzzle: Math.round(averageTime),
      hintsUsed: totalHintsUsed,
      achievementsUnlocked: user.achievements.length,
    };
  }

  async getPublicProfile(username: string) {
    const user = await this.prisma.user.findUnique({
      where: { username },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
        createdAt: true,
        _count: {
          select: {
            progress: { where: { completed: true } },
            achievements: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return {
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      currentLevel: user.currentLevel,
      totalScore: user.totalScore,
      streakDays: user.streakDays,
      createdAt: user.createdAt,
      puzzlesCompleted: user._count.progress,
      achievementsUnlocked: user._count.achievements,
    };
  }

  async updateStreak(userId: string): Promise<number> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { lastPlayedAt: true, streakDays: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const now = new Date();
    const today = this.getUtcDayStart(now);
    const lastPlayedDate = user.lastPlayedAt
      ? this.getUtcDayStart(new Date(user.lastPlayedAt))
      : null;

    let newStreakDays = 1;

    if (lastPlayedDate !== null) {
      const diffDays = Math.floor(
        (today - lastPlayedDate) / MILLISECONDS_IN_DAY,
      );

      if (diffDays <= 0) {
        newStreakDays = user.streakDays;
      } else if (diffDays === 1) {
        newStreakDays = user.streakDays + 1;
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        streakDays: newStreakDays,
        lastPlayedAt: now,
      },
    });

    return newStreakDays;
  }

  async updateGrowth(
    userId: string,
    pointsToAdd: number,
  ): Promise<{ growthPoints: number; growthStage: number }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { growthPoints: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const growthPoints = Math.min(
      MAX_GROWTH_POINTS,
      user.growthPoints + Math.max(0, pointsToAdd),
    );
    const growthStage = this.getGrowthStage(growthPoints);

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        growthPoints,
        growthStage,
      },
      select: {
        growthPoints: true,
        growthStage: true,
      },
    });

    return updatedUser;
  }

  private getGrowthStage(totalPoints: number): number {
    let stage = 1;

    for (let index = 1; index < GROWTH_THRESHOLDS.length - 1; index++) {
      if (totalPoints >= GROWTH_THRESHOLDS[index]) {
        stage = index + 1;
      }
    }

    return stage;
  }

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
