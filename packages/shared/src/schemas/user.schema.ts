import { z } from 'zod';

export const updateProfileSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(30, 'Username must be less than 30 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores')
    .optional(),
  avatarUrl: z.string().url('Invalid avatar URL').nullable().optional(),
});

export const userStatsSchema = z.object({
  totalPuzzlesCompleted: z.number().int().min(0),
  totalScore: z.number().int().min(0),
  currentLevel: z.number().int().min(1),
  streakDays: z.number().int().min(0),
  averageTimePerPuzzle: z.number().min(0),
  hintsUsed: z.number().int().min(0),
  achievementsUnlocked: z.number().int().min(0),
});

export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  currentLevel: z.number().int(),
  totalScore: z.number().int(),
  streakDays: z.number().int(),
  lastPlayedAt: z.date().nullable(),
  createdAt: z.date(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;
export type UserStats = z.infer<typeof userStatsSchema>;
export type UserProfile = z.infer<typeof userProfileSchema>;
