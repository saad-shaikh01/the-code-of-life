import { z } from 'zod';

export const submitProgressSchema = z.object({
  puzzleId: z.string().min(1, 'Puzzle ID is required'),
  completed: z.boolean().default(false),
  score: z.number().int().min(0).default(0),
  timeSpent: z.number().int().min(0).describe('Time spent in seconds'),
  hintsUsed: z.number().int().min(0).default(0),
});

export const progressQuerySchema = z.object({
  puzzleId: z.string().optional(),
  completed: z.coerce.boolean().optional(),
  gameMode: z.enum(['STORY', 'CHALLENGE', 'DAILY']).optional(),
});

export const progressResponseSchema = z.object({
  id: z.string(),
  puzzleId: z.string(),
  completed: z.boolean(),
  completedAt: z.date().nullable(),
  score: z.number().int(),
  timeSpent: z.number().int(),
  hintsUsed: z.number().int(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type SubmitProgressInput = z.infer<typeof submitProgressSchema>;
export type ProgressQueryInput = z.infer<typeof progressQuerySchema>;
export type ProgressResponse = z.infer<typeof progressResponseSchema>;
