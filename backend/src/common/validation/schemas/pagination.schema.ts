import { createZodDto } from 'nestjs-zod';
import { paginationSchema } from '@code-of-life/shared';

// Re-export schema and type from shared package
export { paginationSchema } from '@code-of-life/shared';
export type { PaginationInput } from '@code-of-life/shared';

/**
 * NestJS DTO class for Swagger integration
 */
export class PaginationDto extends createZodDto(paginationSchema) {}
