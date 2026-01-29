import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import {
  AchievementsService,
  AchievementWithUnlock,
} from './achievements.service';
import { createAchievementSchema } from '@code-of-life/shared';
import { ApiResponseDto } from '../../common/dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';
import { Achievement, UserAchievement } from '@prisma/client';

// DTOs for Swagger
class CreateAchievementDto extends createZodDto(createAchievementSchema) {}

@ApiTags('achievements')
@Controller('achievements')
@UseGuards(JwtAuthGuard)
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: 'Get all achievements' })
  @ApiResponse({ status: 200, description: 'Returns all achievements' })
  async getAllAchievements(): Promise<ApiResponseDto<Achievement[]>> {
    const achievements = await this.achievementsService.getAllAchievements();
    return ApiResponseDto.success(achievements);
  }

  @Get('user')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all achievements with user unlock status' })
  @ApiResponse({ status: 200, description: 'Returns achievements with unlock status' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUserAchievements(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<AchievementWithUnlock[]>> {
    const achievements = await this.achievementsService.getUserAchievements(userId);
    return ApiResponseDto.success(achievements);
  }

  @Get('unlocked')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user unlocked achievements' })
  @ApiResponse({ status: 200, description: 'Returns unlocked achievements' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getUnlockedAchievements(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<UserAchievement[]>> {
    const achievements = await this.achievementsService.getUnlockedAchievements(userId);
    return ApiResponseDto.success(achievements);
  }

  @Post('check')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Check and unlock new achievements' })
  @ApiResponse({ status: 200, description: 'Returns newly unlocked achievements' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async checkAchievements(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<Achievement[]>> {
    const unlocked = await this.achievementsService.checkAndUnlockAchievements(userId);
    const message =
      unlocked.length > 0
        ? `Unlocked ${unlocked.length} new achievement(s)!`
        : 'No new achievements unlocked';
    return ApiResponseDto.success(unlocked, message);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: 'Get achievement by ID' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  @ApiResponse({ status: 200, description: 'Returns achievement details' })
  @ApiResponse({ status: 404, description: 'Achievement not found' })
  async getAchievementById(
    @Param('id') id: string,
  ): Promise<ApiResponseDto<Achievement>> {
    const achievement = await this.achievementsService.getAchievementById(id);
    return ApiResponseDto.success(achievement);
  }

  @Get(':id/progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get progress towards an achievement' })
  @ApiParam({ name: 'id', description: 'Achievement ID' })
  @ApiResponse({ status: 200, description: 'Returns achievement progress' })
  @ApiResponse({ status: 404, description: 'Achievement not found' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAchievementProgress(
    @CurrentUser('id') userId: string,
    @Param('id') achievementId: string,
  ): Promise<ApiResponseDto<{ current: number; target: number; percentage: number }>> {
    const progress = await this.achievementsService.getAchievementProgress(
      userId,
      achievementId,
    );
    return ApiResponseDto.success(progress);
  }

  @Post('seed')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Seed default achievements (admin)' })
  @ApiResponse({ status: 201, description: 'Default achievements created' })
  async seedAchievements(): Promise<ApiResponseDto<Achievement[]>> {
    const achievements = await this.achievementsService.seedDefaultAchievements();
    return ApiResponseDto.success(
      achievements,
      `Created ${achievements.length} achievements`,
    );
  }

  @Post()
  @ApiBearerAuth()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new achievement (admin)' })
  @ApiResponse({ status: 201, description: 'Achievement created' })
  @ApiResponse({ status: 409, description: 'Achievement name already exists' })
  async createAchievement(
    @Body() createAchievementDto: CreateAchievementDto,
  ): Promise<ApiResponseDto<Achievement>> {
    const achievement = await this.achievementsService.createAchievement(
      createAchievementDto,
    );
    return ApiResponseDto.success(achievement, 'Achievement created successfully');
  }
}
