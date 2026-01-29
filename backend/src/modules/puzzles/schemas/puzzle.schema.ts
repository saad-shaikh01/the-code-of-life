import { createZodDto } from 'nestjs-zod';
import {
  createPuzzleSchema,
  updatePuzzleSchema,
  gameModeSchema,
  difficultySchema,
} from '@code-of-life/shared';

// Re-export schemas and types from shared package
export {
  createPuzzleSchema,
  updatePuzzleSchema,
  gameModeSchema,
  difficultySchema,
} from '@code-of-life/shared';

export type {
  CreatePuzzleInput,
  UpdatePuzzleInput,
  GameMode,
  Difficulty,
} from '@code-of-life/shared';

/**
 * NestJS DTO classes for Swagger integration
 * These wrap the shared Zod schemas with NestJS-specific functionality
 */
export class CreatePuzzleDto extends createZodDto(createPuzzleSchema) {}
export class UpdatePuzzleDto extends createZodDto(updatePuzzleSchema) {}
