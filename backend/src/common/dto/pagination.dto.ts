import { ApiProperty } from '@nestjs/swagger';

/**
 * Pagination DTO for response metadata
 * For input validation, use the Zod schema from common/validation
 */
export class PaginationMetaDto {
  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 10 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 10 })
  totalPages: number;
}
