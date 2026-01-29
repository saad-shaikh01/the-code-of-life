import { z } from 'zod';

export const achievementCriteriaSchema = z.object({
  type: z.enum([
    'PUZZLES_COMPLETED',
    'SCORE_REACHED',
    'STREAK_DAYS',
    'MODE_COMPLETED',
    'PERFECT_SCORE',
    'SPEED_RUN',
    'NO_HINTS',
    'FIRST_PUZZLE',
    'DAILY_STREAK',
  ]),
  target: z.number().int().min(1),
  gameMode: z.enum(['STORY', 'CHALLENGE', 'DAILY']).optional(),
});

export const createAchievementSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  iconUrl: z.string().url().optional(),
  points: z.number().int().min(0).default(0),
  criteria: achievementCriteriaSchema,
});

export const achievementResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  iconUrl: z.string().nullable(),
  points: z.number().int(),
  criteria: z.string(),
  createdAt: z.date(),
});

export const userAchievementResponseSchema = z.object({
  id: z.string(),
  unlockedAt: z.date(),
  achievement: achievementResponseSchema,
});

export type AchievementCriteria = z.infer<typeof achievementCriteriaSchema>;
export type CreateAchievementInput = z.infer<typeof createAchievementSchema>;
export type AchievementResponse = z.infer<typeof achievementResponseSchema>;
export type UserAchievementResponse = z.infer<typeof userAchievementResponseSchema>;
