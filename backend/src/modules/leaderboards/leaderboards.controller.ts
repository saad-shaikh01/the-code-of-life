import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { LeaderboardsService } from './leaderboards.service';
import { leaderboardQuerySchema, LeaderboardEntry, LeaderboardResponse } from '@code-of-life/shared';
import { ApiResponseDto } from '../../common/dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';

// DTOs for Swagger
class LeaderboardQueryDto extends createZodDto(leaderboardQuerySchema) {}

@ApiTags('leaderboards')
@Controller('leaderboards')
@UseGuards(JwtAuthGuard)
export class LeaderboardsController {
  constructor(private readonly leaderboardsService: LeaderboardsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get score leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of entries (max 100)' })
  @ApiQuery({ name: 'offset', required: false, type: Number, description: 'Offset for pagination' })
  @ApiQuery({ name: 'period', required: false, enum: ['all', 'monthly', 'weekly', 'daily'] })
  @ApiResponse({ status: 200, description: 'Returns leaderboard' })
  async getLeaderboard(
    @Query() query: LeaderboardQueryDto,
    @CurrentUser('id') userId?: string,
  ): Promise<ApiResponseDto<LeaderboardResponse>> {
    const leaderboard = await this.leaderboardsService.getLeaderboard(
      query.limit ?? 10,
      query.offset ?? 0,
      query.period ?? 'all',
      userId,
    );
    return ApiResponseDto.success(leaderboard);
  }

  @Get('rank')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user rank' })
  @ApiQuery({ name: 'period', required: false, enum: ['all', 'monthly', 'weekly', 'daily'] })
  @ApiResponse({ status: 200, description: 'Returns user rank' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserRank(
    @CurrentUser('id') userId: string,
    @Query('period') period: 'all' | 'monthly' | 'weekly' | 'daily' = 'all',
  ): Promise<ApiResponseDto<{ rank: number | null; period: string }>> {
    const rank = await this.leaderboardsService.getUserRank(userId, period);
    return ApiResponseDto.success({ rank, period });
  }

  @Get('top')
  @Public()
  @ApiOperation({ summary: 'Get top 3 players' })
  @ApiResponse({ status: 200, description: 'Returns top 3 players' })
  async getTopPlayers(): Promise<ApiResponseDto<LeaderboardEntry[]>> {
    const top = await this.leaderboardsService.getTopPlayers(3);
    return ApiResponseDto.success(top);
  }

  @Get('stats')
  @Public()
  @ApiOperation({ summary: 'Get global statistics' })
  @ApiResponse({ status: 200, description: 'Returns global stats' })
  async getGlobalStats(): Promise<
    ApiResponseDto<{
      totalPlayers: number;
      totalPuzzlesCompleted: number;
      totalScore: number;
      averageScore: number;
    }>
  > {
    const stats = await this.leaderboardsService.getGlobalStats();
    return ApiResponseDto.success(stats);
  }

  @Get('streaks')
  @Public()
  @ApiOperation({ summary: 'Get streak leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns streak leaderboard' })
  async getStreakLeaderboard(
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<LeaderboardEntry[]>> {
    const leaderboard = await this.leaderboardsService.getStreakLeaderboard(
      Math.min(limit, 100),
    );
    return ApiResponseDto.success(leaderboard);
  }

  @Get('levels')
  @Public()
  @ApiOperation({ summary: 'Get level leaderboard' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Returns level leaderboard' })
  async getLevelLeaderboard(
    @Query('limit') limit: number = 10,
  ): Promise<ApiResponseDto<LeaderboardEntry[]>> {
    const leaderboard = await this.leaderboardsService.getLevelLeaderboard(
      Math.min(limit, 100),
    );
    return ApiResponseDto.success(leaderboard);
  }
}
