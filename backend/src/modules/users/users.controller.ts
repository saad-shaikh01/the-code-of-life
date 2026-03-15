import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  UseGuards,
  UseInterceptors,
  HttpCode,
  HttpStatus,
  UploadedFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { AvatarService } from './avatar.service';
import { UsersService } from './users.service';
import { updateProfileSchema, UserStats } from '@code-of-life/shared';
import { ApiResponseDto } from '../../common/dto';
import { JwtAuthGuard } from '../../common/guards';
import { CurrentUser } from '../../common/decorators';
import { Public } from '../../common/decorators/public.decorator';

// DTOs for Swagger
class UpdateProfileDto extends createZodDto(updateProfileSchema) {}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private readonly avatarService: AvatarService,
  ) {}

  @Get('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user profile' })
  @ApiResponse({ status: 200, description: 'Returns user profile' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getProfile(@CurrentUser('id') userId: string) {
    const profile = await this.usersService.getProfile(userId);
    return ApiResponseDto.success(profile);
  }

  @Patch('profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user profile' })
  @ApiResponse({ status: 200, description: 'Profile updated successfully' })
  @ApiResponse({ status: 409, description: 'Username already taken' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async updateProfile(
    @CurrentUser('id') userId: string,
    @Body() updateProfileDto: UpdateProfileDto,
  ) {
    const profile = await this.usersService.updateProfile(
      userId,
      updateProfileDto,
    );
    return ApiResponseDto.success(profile, 'Profile updated successfully');
  }

  @Get('stats')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get user statistics' })
  @ApiResponse({ status: 200, description: 'Returns user statistics' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getStats(
    @CurrentUser('id') userId: string,
  ): Promise<ApiResponseDto<UserStats>> {
    const stats = await this.usersService.getStats(userId);
    return ApiResponseDto.success(stats);
  }

  @Post('avatar')
  @UseInterceptors(
    FileInterceptor('avatar', {
      storage: memoryStorage(),
    }),
  )
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @ApiOperation({ summary: 'Upload a user avatar image' })
  @ApiResponse({ status: 200, description: 'Avatar uploaded successfully' })
  @ApiResponse({ status: 400, description: 'Invalid avatar file' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async uploadAvatar(
    @CurrentUser('id') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const avatarUrl = await this.avatarService.saveAvatar(file, userId);
    await this.usersService.updateProfile(userId, { avatarUrl });
    return ApiResponseDto.success(
      { avatarUrl },
      'Avatar uploaded successfully',
    );
  }

  @Get(':username')
  @Public()
  @ApiOperation({ summary: 'Get public user profile by username' })
  @ApiParam({ name: 'username', description: 'Username to look up' })
  @ApiResponse({ status: 200, description: 'Returns public profile' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async getPublicProfile(@Param('username') username: string) {
    const profile = await this.usersService.getPublicProfile(username);
    return ApiResponseDto.success(profile);
  }

  @Delete('account')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user account' })
  @ApiResponse({ status: 200, description: 'Account deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async deleteAccount(@CurrentUser('id') userId: string) {
    await this.usersService.deleteAccount(userId);
    return ApiResponseDto.success(null, 'Account deleted successfully');
  }
}
