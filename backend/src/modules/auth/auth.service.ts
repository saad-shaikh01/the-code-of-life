import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma';
import {
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ResetPasswordInput,
  VerifyEmailInput,
} from '@code-of-life/shared';
import { MailService } from '../mail/mail.service';

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
    emailVerified: boolean;
    growthPoints?: number;
    growthStage?: number;
    role?: Role;
  };
  tokens: AuthTokens;
}

export interface ForgotPasswordResponse {
  token: string | null;
}

interface RefreshTokenPayload {
  sub: string;
  email: string;
  username: string;
  role: Role;
}

@Injectable()
export class AuthService {
  private readonly saltRounds = 12;
  private readonly passwordResetTokenRounds = 10;
  private readonly emailVerificationTokenRounds = 10;
  private readonly passwordResetExpiryMs = 60 * 60 * 1000;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
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
        emailVerified: true,
        growthPoints: true,
        growthStage: true,
        role: true,
      },
    });

    const verificationToken = await this.generateEmailVerificationToken(
      user.id,
    );
    const verificationUrl = this.buildVerifyEmailUrl(verificationToken);

    await this.mailService.sendVerificationEmail(user.email, verificationUrl);

    if (this.isDevMode()) {
      console.log(
        `Email verification link for ${user.email}: ${verificationUrl}`,
      );
    }

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      user.role,
    );

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

    // Generate tokens
    const tokens = await this.generateTokens(
      user.id,
      user.email,
      user.username,
      user.role,
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        avatarUrl: user.avatarUrl,
        currentLevel: user.currentLevel,
        totalScore: user.totalScore,
        streakDays: user.streakDays,
        emailVerified: user.emailVerified,
        growthPoints: user.growthPoints,
        growthStage: user.growthStage,
        role: user.role,
      },
      tokens,
    };
  }

  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const refreshSecret = this.getJwtRefreshSecret();

    try {
      const payload = this.jwtService.verify<RefreshTokenPayload>(
        refreshToken,
        {
          secret: refreshSecret,
        },
      );

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { id: true, email: true, username: true, role: true },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      return this.generateTokens(user.id, user.email, user.username, user.role);
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async changePassword(
    userId: string,
    input: ChangePasswordInput,
  ): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(
      input.currentPassword,
      user.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      input.newPassword,
      this.saltRounds,
    );

    // Update password
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  async forgotPassword(
    input: ForgotPasswordInput,
  ): Promise<ForgotPasswordResponse> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
      select: { id: true, email: true },
    });

    if (!user) {
      return { token: null };
    }

    const token = crypto.randomBytes(32).toString('hex');
    const passwordResetToken = await bcrypt.hash(
      token,
      this.passwordResetTokenRounds,
    );
    const passwordResetExpiry = new Date(
      Date.now() + this.passwordResetExpiryMs,
    );

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken,
        passwordResetExpiry,
      },
    });

    const resetUrl = this.buildResetPasswordUrl(token);

    await this.mailService.sendPasswordResetEmail(user.email, resetUrl);

    if (this.isDevMode()) {
      console.log(`Password reset link for ${user.email}: ${resetUrl}`);
    }

    return { token: null };
  }

  async resetPassword(input: ResetPasswordInput): Promise<void> {
    const candidates = await this.prisma.user.findMany({
      where: {
        passwordResetToken: { not: null },
        passwordResetExpiry: { gt: new Date() },
      },
      select: {
        id: true,
        passwordResetToken: true,
      },
    });

    for (const candidate of candidates) {
      if (!candidate.passwordResetToken) {
        continue;
      }

      const isValidToken = await bcrypt.compare(
        input.token,
        candidate.passwordResetToken,
      );

      if (!isValidToken) {
        continue;
      }

      const password = await bcrypt.hash(input.newPassword, this.saltRounds);

      await this.prisma.user.update({
        where: { id: candidate.id },
        data: {
          password,
          passwordResetToken: null,
          passwordResetExpiry: null,
        },
      });

      return;
    }

    throw new UnauthorizedException('Invalid or expired reset link');
  }

  async verifyEmail(input: VerifyEmailInput): Promise<{ message: string }> {
    const candidates = await this.prisma.user.findMany({
      where: {
        emailVerificationToken: { not: null },
      },
      select: {
        id: true,
        emailVerificationToken: true,
      },
    });

    for (const candidate of candidates) {
      if (!candidate.emailVerificationToken) {
        continue;
      }

      const isValidToken = await bcrypt.compare(
        input.token,
        candidate.emailVerificationToken,
      );

      if (!isValidToken) {
        continue;
      }

      await this.prisma.user.update({
        where: { id: candidate.id },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });

      return { message: 'Email verified successfully' };
    }

    throw new BadRequestException('Invalid or expired verification link');
  }

  async resendVerification(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        emailVerified: true,
      },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.emailVerified) {
      throw new BadRequestException('Email is already verified');
    }

    const verificationToken = await this.generateEmailVerificationToken(
      user.id,
    );
    const verificationUrl = this.buildVerifyEmailUrl(verificationToken);

    await this.mailService.sendVerificationEmail(user.email, verificationUrl);

    if (this.isDevMode()) {
      console.log(
        `Email verification link for ${user.email}: ${verificationUrl}`,
      );
    }

    return { message: 'Verification email sent successfully' };
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
        emailVerified: true,
        growthPoints: true,
        growthStage: true,
        lastPlayedAt: true,
        createdAt: true,
        role: true,
      },
    });
  }

  private async generateTokens(
    userId: string,
    email: string,
    username: string,
    role: Role,
  ): Promise<AuthTokens> {
    const payload = { sub: userId, email, username, role };
    const jwtSecret = this.getJwtSecret();
    const refreshSecret = this.getJwtRefreshSecret();

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: jwtSecret,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: '7d',
      }),
    ]);

    return { accessToken, refreshToken };
  }

  private isDevMode(): boolean {
    return this.configService.get<string>('NODE_ENV') !== 'production';
  }

  private buildResetPasswordUrl(token: string): string {
    return `${this.getFrontendUrl()}/reset-password?token=${token}`;
  }

  private buildVerifyEmailUrl(token: string): string {
    return `${this.getFrontendUrl()}/verify-email?token=${token}`;
  }

  private getFrontendUrl(): string {
    return this.configService.getOrThrow<string>('FRONTEND_URL');
  }

  private async generateEmailVerificationToken(
    userId: string,
  ): Promise<string> {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const emailVerificationToken = await bcrypt.hash(
      rawToken,
      this.emailVerificationTokenRounds,
    );

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        emailVerified: false,
        emailVerificationToken,
      },
    });

    return rawToken;
  }

  private getJwtSecret(): string {
    return this.configService.getOrThrow<string>('JWT_SECRET');
  }

  private getJwtRefreshSecret(): string {
    return this.configService.getOrThrow<string>('JWT_REFRESH_SECRET');
  }
}
