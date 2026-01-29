import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  Get,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { createZodDto } from 'nestjs-zod';
import { AuthService, AuthResponse, AuthTokens } from './auth.service';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from '@code-of-life/shared';
import { ApiResponseDto } from '../../common/dto';
import { Public } from '../../common/decorators';
import { CurrentUser, CurrentUserType } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards';

// DTOs for Swagger
class RegisterDto extends createZodDto(registerSchema) {}
class LoginDto extends createZodDto(loginSchema) {}
class RefreshTokenDto extends createZodDto(refreshTokenSchema) {}
class ChangePasswordDto extends createZodDto(changePasswordSchema) {}

@ApiTags('auth')
@Controller('auth')
@UseGuards(JwtAuthGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user' })
  @ApiResponse({ status: 201, description: 'User registered successfully' })
  @ApiResponse({ status: 409, description: 'Email or username already exists' })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  async register(
    @Body() registerDto: RegisterDto,
  ): Promise<ApiResponseDto<AuthResponse>> {
    const result = await this.authService.register(registerDto);
    return ApiResponseDto.success(result, 'Registration successful');
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiResponse({ status: 200, description: 'Login successful' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  async login(@Body() loginDto: LoginDto): Promise<ApiResponseDto<AuthResponse>> {
    const result = await this.authService.login(loginDto);
    return ApiResponseDto.success(result, 'Login successful');
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @ApiResponse({ status: 200, description: 'Token refreshed successfully' })
  @ApiResponse({ status: 401, description: 'Invalid refresh token' })
  async refreshTokens(
    @Body() refreshDto: RefreshTokenDto,
  ): Promise<ApiResponseDto<AuthTokens>> {
    const tokens = await this.authService.refreshTokens(refreshDto.refreshToken);
    return ApiResponseDto.success(tokens, 'Token refreshed successfully');
  }

  @Post('change-password')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change user password' })
  @ApiResponse({ status: 200, description: 'Password changed successfully' })
  @ApiResponse({ status: 400, description: 'Current password is incorrect' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async changePassword(
    @CurrentUser('id') userId: string,
    @Body() changePasswordDto: ChangePasswordDto,
  ): Promise<ApiResponseDto<null>> {
    await this.authService.changePassword(userId, changePasswordDto);
    return ApiResponseDto.success(null, 'Password changed successfully');
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current authenticated user' })
  @ApiResponse({ status: 200, description: 'Returns current user' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getCurrentUser(
    @CurrentUser() user: CurrentUserType,
  ): Promise<ApiResponseDto<CurrentUserType>> {
    return ApiResponseDto.success(user);
  }
}
