import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { UpdateProfileInput, UserStats } from '@code-of-life/shared';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
    const totalTimeSpent = completedPuzzles.reduce((sum, p) => sum + p.timeSpent, 0);
    const totalHintsUsed = completedPuzzles.reduce((sum, p) => sum + p.hintsUsed, 0);
    const averageTime =
      completedPuzzles.length > 0 ? totalTimeSpent / completedPuzzles.length : 0;

    return {
      totalPuzzlesCompleted: completedPuzzles.length,
      totalScore: user.totalScore,
      currentLevel: user.currentLevel,
      streakDays: user.streakDays,
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

      if (diffDays === 0) {
        // Same day, keep streak
        return user.streakDays;
      } else if (diffDays === 1) {
        // Consecutive day, increment streak
        newStreakDays = user.streakDays + 1;
      } else {
        // Streak broken, reset to 1
        newStreakDays = 1;
      }
    } else {
      // First time playing
      newStreakDays = 1;
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

  async deleteAccount(userId: string): Promise<void> {
    await this.prisma.user.delete({
      where: { id: userId },
    });
  }
}
