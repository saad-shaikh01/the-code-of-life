import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { LeaderboardEntry, LeaderboardResponse } from '@code-of-life/shared';

type Period = 'all' | 'monthly' | 'weekly' | 'daily';

@Injectable()
export class LeaderboardsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLeaderboard(
    limit: number,
    offset: number,
    period: Period,
    currentUserId?: string,
  ): Promise<LeaderboardResponse> {
    const dateFilter = this.getDateFilter(period);

    // Get users with their progress in the period
    const users = await this.prisma.user.findMany({
      where: dateFilter
        ? {
            progress: {
              some: {
                completed: true,
                completedAt: dateFilter,
              },
            },
          }
        : undefined,
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        totalScore: true,
        streakDays: true,
        currentLevel: true,
        _count: {
          select: {
            progress: {
              where: {
                completed: true,
                ...(dateFilter ? { completedAt: dateFilter } : {}),
              },
            },
          },
        },
      },
      orderBy: { totalScore: 'desc' },
    });

    // Calculate period-specific scores if needed
    let rankedUsers = users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      score: user.totalScore,
      puzzlesCompleted: user._count.progress,
      streakDays: user.streakDays,
      currentLevel: user.currentLevel,
    }));

    // For period-based leaderboards, recalculate scores
    if (period !== 'all') {
      const periodScores = await this.calculatePeriodScores(period);
      rankedUsers = rankedUsers
        .map((user) => ({
          ...user,
          score: periodScores.get(user.userId) || 0,
        }))
        .sort((a, b) => b.score - a.score)
        .map((user, index) => ({ ...user, rank: index + 1 }));
    }

    const total = rankedUsers.length;
    const entries = rankedUsers.slice(offset, offset + limit);

    // Find current user's rank
    let userRank: number | null = null;
    if (currentUserId) {
      const userEntry = rankedUsers.find((u) => u.userId === currentUserId);
      userRank = userEntry?.rank || null;
    }

    return {
      entries,
      total,
      userRank,
      period,
    };
  }

  private getDateFilter(period: Period): { gte: Date } | null {
    const now = new Date();

    switch (period) {
      case 'daily':
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        return { gte: today };
      case 'weekly':
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return { gte: weekAgo };
      case 'monthly':
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        return { gte: monthAgo };
      case 'all':
      default:
        return null;
    }
  }

  private async calculatePeriodScores(period: Period): Promise<Map<string, number>> {
    const dateFilter = this.getDateFilter(period);
    if (!dateFilter) return new Map();

    const progress = await this.prisma.userProgress.findMany({
      where: {
        completed: true,
        completedAt: dateFilter,
      },
      select: {
        userId: true,
        score: true,
      },
    });

    const scores = new Map<string, number>();
    for (const p of progress) {
      scores.set(p.userId, (scores.get(p.userId) || 0) + p.score);
    }

    return scores;
  }

  async getUserRank(userId: string, period: Period = 'all'): Promise<number | null> {
    const leaderboard = await this.getLeaderboard(1000, 0, period);
    const entry = leaderboard.entries.find((e) => e.userId === userId);
    return entry?.rank || null;
  }

  async getTopPlayers(limit: number = 3): Promise<LeaderboardEntry[]> {
    const result = await this.getLeaderboard(limit, 0, 'all');
    return result.entries;
  }

  async getGlobalStats(): Promise<{
    totalPlayers: number;
    totalPuzzlesCompleted: number;
    totalScore: number;
    averageScore: number;
  }> {
    const [playerCount, progressStats, scoreStats] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.userProgress.aggregate({
        _count: { id: true },
        where: { completed: true },
      }),
      this.prisma.user.aggregate({
        _sum: { totalScore: true },
        _avg: { totalScore: true },
      }),
    ]);

    return {
      totalPlayers: playerCount,
      totalPuzzlesCompleted: progressStats._count.id,
      totalScore: scoreStats._sum.totalScore || 0,
      averageScore: Math.round(scoreStats._avg.totalScore || 0),
    };
  }

  async getStreakLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      where: { streakDays: { gt: 0 } },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        totalScore: true,
        streakDays: true,
        currentLevel: true,
        _count: {
          select: { progress: { where: { completed: true } } },
        },
      },
      orderBy: { streakDays: 'desc' },
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      score: user.totalScore,
      puzzlesCompleted: user._count.progress,
      streakDays: user.streakDays,
      currentLevel: user.currentLevel,
    }));
  }

  async getLevelLeaderboard(limit: number = 10): Promise<LeaderboardEntry[]> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        totalScore: true,
        streakDays: true,
        currentLevel: true,
        _count: {
          select: { progress: { where: { completed: true } } },
        },
      },
      orderBy: [{ currentLevel: 'desc' }, { totalScore: 'desc' }],
      take: limit,
    });

    return users.map((user, index) => ({
      rank: index + 1,
      userId: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      score: user.totalScore,
      puzzlesCompleted: user._count.progress,
      streakDays: user.streakDays,
      currentLevel: user.currentLevel,
    }));
  }
}
