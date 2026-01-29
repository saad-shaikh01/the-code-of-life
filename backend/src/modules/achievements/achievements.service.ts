import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { CreateAchievementInput, AchievementCriteria } from '@code-of-life/shared';
import { Achievement, UserAchievement } from '@prisma/client';

export interface AchievementWithUnlock extends Achievement {
  isUnlocked: boolean;
  unlockedAt: Date | null;
}

@Injectable()
export class AchievementsService {
  constructor(private readonly prisma: PrismaService) {}

  async createAchievement(input: CreateAchievementInput): Promise<Achievement> {
    // Check if achievement with same name exists
    const existing = await this.prisma.achievement.findUnique({
      where: { name: input.name },
    });

    if (existing) {
      throw new ConflictException('Achievement with this name already exists');
    }

    return this.prisma.achievement.create({
      data: {
        name: input.name,
        description: input.description,
        iconUrl: input.iconUrl,
        points: input.points,
        criteria: JSON.stringify(input.criteria),
      },
    });
  }

  async getAllAchievements(): Promise<Achievement[]> {
    return this.prisma.achievement.findMany({
      orderBy: { points: 'asc' },
    });
  }

  async getAchievementById(id: string): Promise<Achievement> {
    const achievement = await this.prisma.achievement.findUnique({
      where: { id },
    });

    if (!achievement) {
      throw new NotFoundException('Achievement not found');
    }

    return achievement;
  }

  async getUserAchievements(userId: string): Promise<AchievementWithUnlock[]> {
    const [achievements, userAchievements] = await Promise.all([
      this.prisma.achievement.findMany({
        orderBy: { points: 'asc' },
      }),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true, unlockedAt: true },
      }),
    ]);

    const unlockedMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua.unlockedAt]),
    );

    return achievements.map((achievement) => ({
      ...achievement,
      isUnlocked: unlockedMap.has(achievement.id),
      unlockedAt: unlockedMap.get(achievement.id) || null,
    }));
  }

  async getUnlockedAchievements(userId: string): Promise<UserAchievement[]> {
    return this.prisma.userAchievement.findMany({
      where: { userId },
      include: { achievement: true },
      orderBy: { unlockedAt: 'desc' },
    });
  }

  async checkAndUnlockAchievements(userId: string): Promise<Achievement[]> {
    // Get all achievements and user's current progress
    const [achievements, userAchievements, user, progress] = await Promise.all([
      this.prisma.achievement.findMany(),
      this.prisma.userAchievement.findMany({
        where: { userId },
        select: { achievementId: true },
      }),
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { totalScore: true, streakDays: true },
      }),
      this.prisma.userProgress.findMany({
        where: { userId, completed: true },
        include: { puzzle: { select: { gameMode: true } } },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const unlockedIds = new Set(userAchievements.map((ua) => ua.achievementId));
    const newlyUnlocked: Achievement[] = [];

    // Calculate user stats
    const stats = {
      totalCompleted: progress.length,
      storyCompleted: progress.filter((p) => p.puzzle.gameMode === 'STORY').length,
      challengeCompleted: progress.filter((p) => p.puzzle.gameMode === 'CHALLENGE').length,
      dailyCompleted: progress.filter((p) => p.puzzle.gameMode === 'DAILY').length,
      perfectScores: progress.filter((p) => p.hintsUsed === 0 && p.score >= 100).length,
      noHintCompletions: progress.filter((p) => p.hintsUsed === 0).length,
      speedRuns: progress.filter((p) => p.timeSpent < 60).length,
      totalScore: user.totalScore,
      streakDays: user.streakDays,
    };

    for (const achievement of achievements) {
      if (unlockedIds.has(achievement.id)) continue;

      const criteria = JSON.parse(achievement.criteria) as AchievementCriteria;
      let unlocked = false;

      switch (criteria.type) {
        case 'FIRST_PUZZLE':
          unlocked = stats.totalCompleted >= 1;
          break;
        case 'PUZZLES_COMPLETED':
          if (criteria.gameMode) {
            switch (criteria.gameMode) {
              case 'STORY':
                unlocked = stats.storyCompleted >= criteria.target;
                break;
              case 'CHALLENGE':
                unlocked = stats.challengeCompleted >= criteria.target;
                break;
              case 'DAILY':
                unlocked = stats.dailyCompleted >= criteria.target;
                break;
            }
          } else {
            unlocked = stats.totalCompleted >= criteria.target;
          }
          break;
        case 'SCORE_REACHED':
          unlocked = stats.totalScore >= criteria.target;
          break;
        case 'STREAK_DAYS':
        case 'DAILY_STREAK':
          unlocked = stats.streakDays >= criteria.target;
          break;
        case 'PERFECT_SCORE':
          unlocked = stats.perfectScores >= criteria.target;
          break;
        case 'SPEED_RUN':
          unlocked = stats.speedRuns >= criteria.target;
          break;
        case 'NO_HINTS':
          unlocked = stats.noHintCompletions >= criteria.target;
          break;
        case 'MODE_COMPLETED':
          if (criteria.gameMode === 'STORY') {
            // Check if all story puzzles are completed
            const totalStory = await this.prisma.puzzle.count({
              where: { gameMode: 'STORY' },
            });
            unlocked = stats.storyCompleted >= totalStory;
          }
          break;
      }

      if (unlocked) {
        await this.prisma.userAchievement.create({
          data: {
            userId,
            achievementId: achievement.id,
          },
        });
        newlyUnlocked.push(achievement);
      }
    }

    return newlyUnlocked;
  }

  async getAchievementProgress(
    userId: string,
    achievementId: string,
  ): Promise<{ current: number; target: number; percentage: number }> {
    const achievement = await this.getAchievementById(achievementId);
    const criteria = JSON.parse(achievement.criteria) as AchievementCriteria;

    const [user, progress] = await Promise.all([
      this.prisma.user.findUnique({
        where: { id: userId },
        select: { totalScore: true, streakDays: true },
      }),
      this.prisma.userProgress.findMany({
        where: { userId, completed: true },
        include: { puzzle: { select: { gameMode: true } } },
      }),
    ]);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let current = 0;
    const target = criteria.target;

    switch (criteria.type) {
      case 'FIRST_PUZZLE':
        current = Math.min(progress.length, 1);
        break;
      case 'PUZZLES_COMPLETED':
        if (criteria.gameMode) {
          current = progress.filter((p) => p.puzzle.gameMode === criteria.gameMode).length;
        } else {
          current = progress.length;
        }
        break;
      case 'SCORE_REACHED':
        current = user.totalScore;
        break;
      case 'STREAK_DAYS':
      case 'DAILY_STREAK':
        current = user.streakDays;
        break;
      case 'PERFECT_SCORE':
        current = progress.filter((p) => p.hintsUsed === 0 && p.score >= 100).length;
        break;
      case 'SPEED_RUN':
        current = progress.filter((p) => p.timeSpent < 60).length;
        break;
      case 'NO_HINTS':
        current = progress.filter((p) => p.hintsUsed === 0).length;
        break;
      case 'MODE_COMPLETED':
        if (criteria.gameMode === 'STORY') {
          current = progress.filter((p) => p.puzzle.gameMode === 'STORY').length;
        }
        break;
    }

    const percentage = Math.min(100, Math.round((current / target) * 100));

    return { current: Math.min(current, target), target, percentage };
  }

  async seedDefaultAchievements(): Promise<Achievement[]> {
    const defaultAchievements: CreateAchievementInput[] = [
      {
        name: 'First Steps',
        description: 'Complete your first puzzle',
        points: 10,
        criteria: { type: 'FIRST_PUZZLE', target: 1 },
      },
      {
        name: 'Decoder Apprentice',
        description: 'Complete 5 puzzles',
        points: 25,
        criteria: { type: 'PUZZLES_COMPLETED', target: 5 },
      },
      {
        name: 'Decoder Adept',
        description: 'Complete 10 puzzles',
        points: 50,
        criteria: { type: 'PUZZLES_COMPLETED', target: 10 },
      },
      {
        name: 'Decoder Master',
        description: 'Complete 25 puzzles',
        points: 100,
        criteria: { type: 'PUZZLES_COMPLETED', target: 25 },
      },
      {
        name: 'Story Seeker',
        description: 'Complete all Story mode puzzles',
        points: 200,
        criteria: { type: 'MODE_COMPLETED', target: 1, gameMode: 'STORY' },
      },
      {
        name: 'Daily Dedication',
        description: 'Complete 7 Daily puzzles',
        points: 75,
        criteria: { type: 'PUZZLES_COMPLETED', target: 7, gameMode: 'DAILY' },
      },
      {
        name: 'Challenge Accepted',
        description: 'Complete 5 Challenge puzzles',
        points: 100,
        criteria: { type: 'PUZZLES_COMPLETED', target: 5, gameMode: 'CHALLENGE' },
      },
      {
        name: 'Week Warrior',
        description: 'Maintain a 7-day streak',
        points: 100,
        criteria: { type: 'STREAK_DAYS', target: 7 },
      },
      {
        name: 'Month Master',
        description: 'Maintain a 30-day streak',
        points: 300,
        criteria: { type: 'STREAK_DAYS', target: 30 },
      },
      {
        name: 'Perfectionist',
        description: 'Complete 5 puzzles with perfect score (no hints)',
        points: 150,
        criteria: { type: 'PERFECT_SCORE', target: 5 },
      },
      {
        name: 'Speed Demon',
        description: 'Complete 3 puzzles in under 60 seconds each',
        points: 75,
        criteria: { type: 'SPEED_RUN', target: 3 },
      },
      {
        name: 'Self-Reliant',
        description: 'Complete 10 puzzles without using hints',
        points: 100,
        criteria: { type: 'NO_HINTS', target: 10 },
      },
      {
        name: 'Score Hunter',
        description: 'Reach a total score of 1000',
        points: 50,
        criteria: { type: 'SCORE_REACHED', target: 1000 },
      },
      {
        name: 'High Scorer',
        description: 'Reach a total score of 5000',
        points: 150,
        criteria: { type: 'SCORE_REACHED', target: 5000 },
      },
    ];

    const created: Achievement[] = [];

    for (const achievement of defaultAchievements) {
      try {
        const result = await this.createAchievement(achievement);
        created.push(result);
      } catch (e) {
        // Skip if already exists
        if (e instanceof ConflictException) continue;
        throw e;
      }
    }

    return created;
  }
}
