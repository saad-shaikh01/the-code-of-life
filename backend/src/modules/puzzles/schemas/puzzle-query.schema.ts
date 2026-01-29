import { createZodDto } from 'nestjs-zod';
import { puzzleQuerySchema } from '@code-of-life/shared';

// Re-export schema and type from shared package
export { puzzleQuerySchema } from '@code-of-life/shared';
export type { PuzzleQueryInput } from '@code-of-life/shared';

/**
 * NestJS DTO class for Swagger integration
 */
export class PuzzleQueryDto extends createZodDto(puzzleQuerySchema) {}
