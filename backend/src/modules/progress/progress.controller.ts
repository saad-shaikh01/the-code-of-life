import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { ProgressService, ProgressWithPuzzle, GameModeProgress } from './progress.service';
import { submitProgressSchema } from '@code-of-life/shared';
import { ApiResponseDto } from '../../common/dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { UserProgress } from '@prisma/client';

// DTOs for Swagger
class SubmitProgressDto extends createZodDto(submitProgressSchema) {}

@ApiTags('progress')
@Controller('progress')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProgressController {
  constructor(private readonly progressService: ProgressService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Submit or update puzzle progress' })
  @ApiResponse({ status: 200, description: 'Progress saved successfully' })
  @ApiResponse({ status: 404, description: 'Puzzle not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async submitProgress(
    @CurrentUser('id') userId: string,
    @Body() submitProgressDto: SubmitProgressDto,
  ): Promise<ApiResponseDto<UserProgress>> {
    const progress = await this.progressService.submitProgress(
      userId,
      submitProgressDto,
    );
    return ApiResponseDto.success(progress, 'Progress saved successfully');
  }

  @Get()
  @ApiOperation({ summary: 'Get all progress for current user' })
  @ApiResponse({ status: 200, description: 'Returns all user progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserProgress(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<ProgressWithPuzzle[]>> {
    const progress = await this.progressService.getUserProgress(userId);
    return ApiResponseDto.success(progress);
  }

  @Get('puzzle/:puzzleId')
  @ApiOperation({ summary: 'Get progress for a specific puzzle' })
  @ApiParam({ name: 'puzzleId', description: 'Puzzle ID' })
  @ApiResponse({ status: 200, description: 'Returns puzzle progress' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getPuzzleProgress(
    @CurrentUser('id') userId: string,
    @Param('puzzleId') puzzleId: string,
  ): Promise<ApiResponseDto<UserProgress | null>> {
    const progress = await this.progressService.getPuzzleProgress(userId, puzzleId);
    return ApiResponseDto.success(progress);
  }

  @Get('mode/:gameMode')
  @ApiOperation({ summary: 'Get progress summary by game mode' })
  @ApiParam({
    name: 'gameMode',
    enum: ['STORY', 'CHALLENGE', 'DAILY'],
    description: 'Game mode to filter by',
  })
  @ApiResponse({ status: 200, description: 'Returns game mode progress summary' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProgressByGameMode(
    @CurrentUser('id') userId: string,
    @Param('gameMode') gameMode: 'STORY' | 'CHALLENGE' | 'DAILY',
  ): Promise<ApiResponseDto<GameModeProgress>> {
    const progress = await this.progressService.getProgressByGameMode(
      userId,
      gameMode,
    );
    return ApiResponseDto.success(progress);
  }

  @Get('completed')
  @ApiOperation({ summary: 'Get list of completed puzzle IDs' })
  @ApiResponse({ status: 200, description: 'Returns completed puzzle IDs' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCompletedPuzzles(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<string[]>> {
    const puzzleIds = await this.progressService.getCompletedPuzzleIds(userId);
    return ApiResponseDto.success(puzzleIds);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset all progress' })
  @ApiResponse({ status: 200, description: 'Progress reset successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetAllProgress(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.progressService.resetProgress(userId);
    return ApiResponseDto.success(null, 'All progress reset successfully');
  }

  @Delete('puzzle/:puzzleId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reset progress for a specific puzzle' })
  @ApiParam({ name: 'puzzleId', description: 'Puzzle ID' })
  @ApiResponse({ status: 200, description: 'Puzzle progress reset successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async resetPuzzleProgress(
    @CurrentUser('id') userId: string,
    @Param('puzzleId') puzzleId: string,
  ): Promise<ApiResponseDto<null>> {
    await this.progressService.resetProgress(userId, puzzleId);
    return ApiResponseDto.success(null, 'Puzzle progress reset successfully');
  }
}
