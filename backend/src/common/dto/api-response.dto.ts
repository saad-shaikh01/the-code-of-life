import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaginationMetaDto } from './pagination.dto';

/**
 * Standard API response wrapper
 */
export class ApiResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiPropertyOptional({
    description: 'The response data',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Optional message describing the result',
    example: 'Operation completed successfully',
  })
  message?: string;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  constructor(partial: Partial<ApiResponseDto<T>>) {
    Object.assign(this, partial);
    this.timestamp = new Date().toISOString();
  }

  static success<T>(data: T, message?: string): ApiResponseDto<T> {
    return new ApiResponseDto({
      success: true,
      data,
      message,
    });
  }

  static error(message: string): ApiResponseDto<null> {
    return new ApiResponseDto({
      success: false,
      message,
    });
  }
}

/**
 * Paginated response wrapper
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({
    description: 'Indicates if the request was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Array of items for the current page',
    isArray: true,
  })
  data: T[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiProperty({
    description: 'ISO 8601 timestamp of the response',
    example: '2024-01-15T10:30:00.000Z',
  })
  timestamp: string;

  constructor(data: T[], total: number, page: number, limit: number) {
    this.success = true;
    this.data = data;
    this.meta = {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
    this.timestamp = new Date().toISOString();
  }
}
