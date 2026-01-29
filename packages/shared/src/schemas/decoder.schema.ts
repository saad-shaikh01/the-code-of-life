import { z } from 'zod';

/**
 * Custom symbol map schema
 */
export const symbolMapSchema = z.record(z.string(), z.string()).optional();

/**
 * Decode Request Schema
 */
export const decodeRequestSchema = z.object({
  encryptedPattern: z
    .string()
    .min(1, 'Encrypted pattern is required')
    .describe('The encrypted pattern containing symbols to decode'),

  customMap: symbolMapSchema.describe(
    'Custom symbol map to override default mappings',
  ),
});

/**
 * Encode Request Schema
 */
export const encodeRequestSchema = z.object({
  text: z
    .string()
    .min(1, 'Text is required')
    .describe('Plain text to encode into symbols'),

  customMap: symbolMapSchema.describe(
    'Custom symbol map to override default mappings',
  ),
});

/**
 * Validate Attempt Schema
 */
export const validateAttemptSchema = z.object({
  attempt: z
    .string()
    .min(1, 'Attempt is required')
    .describe("User's decoded attempt"),

  puzzleId: z
    .string()
    .min(1, 'Puzzle ID is required')
    .describe('The puzzle ID to validate against'),

  caseSensitive: z
    .boolean()
    .default(false)
    .describe('Whether the validation should be case-sensitive'),
});

/**
 * Decode Result Schema (for response typing)
 */
export const decodeResultSchema = z.object({
  output: z.string().describe('The decoded/encoded output'),
  unmappedSymbols: z
    .array(z.string())
    .describe('Symbols that could not be mapped'),
  mappedCount: z
    .number()
    .int()
    .describe('Number of symbols successfully mapped'),
  totalSymbols: z.number().int().describe('Total number of symbols processed'),
});

/**
 * Validation Result Schema (for response typing)
 */
export const validationResultSchema = z.object({
  isCorrect: z.boolean().describe('Whether the attempt is correct'),
  similarity: z
    .number()
    .min(0)
    .max(1)
    .describe('Similarity score between 0 and 1'),
  hint: z.string().optional().describe('Hint for the user if incorrect'),
});

/**
 * Inferred types from schemas
 */
export type DecodeRequestInput = z.infer<typeof decodeRequestSchema>;
export type EncodeRequestInput = z.infer<typeof encodeRequestSchema>;
export type ValidateAttemptInput = z.infer<typeof validateAttemptSchema>;
export type DecodeResult = z.infer<typeof decodeResultSchema>;
export type ValidationResult = z.infer<typeof validationResultSchema>;
