import { z } from 'zod';

export const leaderboardQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
  period: z.enum(['all', 'monthly', 'weekly', 'daily']).default('all'),
});

export const leaderboardEntrySchema = z.object({
  rank: z.number().int().min(1),
  userId: z.string(),
  username: z.string(),
  avatarUrl: z.string().nullable(),
  score: z.number().int(),
  puzzlesCompleted: z.number().int(),
  streakDays: z.number().int(),
  currentLevel: z.number().int(),
});

export const leaderboardResponseSchema = z.object({
  entries: z.array(leaderboardEntrySchema),
  total: z.number().int(),
  userRank: z.number().int().nullable(),
  period: z.enum(['all', 'monthly', 'weekly', 'daily']),
});

export type LeaderboardQueryInput = z.infer<typeof leaderboardQuerySchema>;
export type LeaderboardEntry = z.infer<typeof leaderboardEntrySchema>;
export type LeaderboardResponse = z.infer<typeof leaderboardResponseSchema>;
