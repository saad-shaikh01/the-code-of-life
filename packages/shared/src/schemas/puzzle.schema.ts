import { z } from 'zod';
import { paginationSchema } from './common.schema';

/**
 * Game Mode Enum Schema - matches Prisma enum
 */
export const gameModeSchema = z.enum(['STORY', 'CHALLENGE', 'DAILY']);
export type GameMode = z.infer<typeof gameModeSchema>;

/**
 * Difficulty Enum Schema - matches Prisma enum
 */
export const difficultySchema = z.enum([
  'BEGINNER',
  'INTERMEDIATE',
  'ADVANCED',
  'MASTER',
]);
export type Difficulty = z.infer<typeof difficultySchema>;

/**
 * Create Puzzle Schema
 */
export const createPuzzleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters'),

  encryptedPattern: z
    .string()
    .min(1, 'Encrypted pattern is required')
    .describe('The encrypted pattern using symbols, numbers, and punctuation'),

  originalReflection: z
    .string()
    .min(1, 'Original reflection is required')
    .describe('The decoded life lesson from the book'),

  gameMode: gameModeSchema.describe('Game mode for the puzzle'),

  difficulty: difficultySchema.describe('Difficulty level of the puzzle'),

  bookChapter: z
    .number()
    .int()
    .min(1, 'Book chapter must be at least 1')
    .optional()
    .describe('Chapter number from the book'),

  bookSection: z
    .string()
    .max(100)
    .optional()
    .describe('Section name within the chapter'),

  bookPageRef: z
    .string()
    .max(50)
    .optional()
    .describe('Page reference in the book'),

  orderIndex: z
    .number()
    .int()
    .min(0)
    .default(0)
    .describe('Order index for puzzle sequencing'),

  scheduledDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .optional()
    .describe('Scheduled date for DAILY mode puzzles'),

  hints: z
    .array(z.string().min(1))
    .default([])
    .describe('Array of hints to help players'),
});

/**
 * Update Puzzle Schema - all fields optional
 */
export const updatePuzzleSchema = createPuzzleSchema.partial();

/**
 * Puzzle Query Schema - extends pagination with filters
 */
export const puzzleQuerySchema = paginationSchema.extend({
  gameMode: gameModeSchema.optional().describe('Filter by game mode'),
  difficulty: difficultySchema.optional().describe('Filter by difficulty level'),
});

/**
 * Inferred types from schemas
 */
export type CreatePuzzleInput = z.infer<typeof createPuzzleSchema>;
export type UpdatePuzzleInput = z.infer<typeof updatePuzzleSchema>;
export type PuzzleQueryInput = z.infer<typeof puzzleQuerySchema>;
