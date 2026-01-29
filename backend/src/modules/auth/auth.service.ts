import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../prisma';
import { RegisterInput, LoginInput, ChangePasswordInput } from '@code-of-life/shared';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    username: string;
    avatarUrl: string | null;
    currentLevel: number;
    totalScore: number;
    streakDays: number;
  };
  tokens: AuthTokens;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async register(input: RegisterInput): Promise<AuthResponse> {
    // Check if email already exists
    const existingEmail = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existingEmail) {
      throw new ConflictException('Email already registered');
    }

    // Check if username already exists
    const existingUsername = await this.prisma.user.findUnique({
      where: { username: input.username },
    });
    if (existingUsername) {
      throw new ConflictException('Username already taken');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, this.saltRounds);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        username: input.username,
        password: hashedPassword,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.username);

    return { user, tokens };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    // Find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    // Update last played timestamp
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastPlayedAt: new Date() },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.username);

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        currentLevel: user.currentLevel,
        totalScore: user.totalScore,
        streakDays: user.streakDays,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.username);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(input.currentPassword, user.password);
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(input.newPassword, this.saltRounds);

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatarUrl: true,
        currentLevel: true,
        totalScore: true,
        streakDays: true,
        lastPlayedAt: true,
        createdAt: true,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, username };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_SECRET') || 'default-secret-change-in-production',
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET') || 'refresh-secret',
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }
}
