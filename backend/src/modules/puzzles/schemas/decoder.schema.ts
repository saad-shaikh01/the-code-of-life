import { createZodDto } from 'nestjs-zod';
import {
  decodeRequestSchema,
  encodeRequestSchema,
  validateAttemptSchema,
  decodeResultSchema,
  validationResultSchema,
} from '@code-of-life/shared';

// Re-export schemas and types from shared package
export {
  decodeRequestSchema,
  encodeRequestSchema,
  validateAttemptSchema,
  decodeResultSchema,
  validationResultSchema,
  symbolMapSchema,
} from '@code-of-life/shared';

export type {
  DecodeRequestInput,
  EncodeRequestInput,
  ValidateAttemptInput,
  DecodeResult,
  ValidationResult,
} from '@code-of-life/shared';

/**
 * NestJS DTO classes for Swagger integration
 */
export class DecodeRequestDto extends createZodDto(decodeRequestSchema) {}
export class EncodeRequestDto extends createZodDto(encodeRequestSchema) {}
export class ValidateAttemptDto extends createZodDto(validateAttemptSchema) {}
export class DecodeResultDto extends createZodDto(decodeResultSchema) {}
export class ValidationResultDto extends createZodDto(validationResultSchema) {}
