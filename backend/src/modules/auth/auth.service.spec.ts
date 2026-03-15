import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma';
import { MailService } from '../mail/mail.service';
import { AuthService } from './auth.service';

interface PasswordResetUpdateArgs {
  where: { id: string };
  data: {
    passwordResetToken: string;
    passwordResetExpiry: Date;
  };
}

interface EmailVerificationUpdateArgs {
  where: { id: string };
  data: {
    emailVerified: boolean;
    emailVerificationToken: string;
  };
}

interface EmailVerificationSuccessArgs {
  where: { id: string };
  data: {
    emailVerified: true;
    emailVerificationToken: null;
  };
}

interface PasswordChangeUpdateArgs {
  where: { id: string };
  data: {
    password: string;
    passwordResetToken: null;
    passwordResetExpiry: null;
  };
}

interface ResetPasswordFindManyArgs {
  where: {
    passwordResetToken: { not: null };
    passwordResetExpiry: { gt: Date };
  };
  select: {
    id: true;
    passwordResetToken: true;
  };
}

describe('AuthService', () => {
  let service: AuthService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwtService = {
    signAsync: jest.fn(),
    verify: jest.fn(),
  };

  const mockConfigService = {
    get: jest.fn((key: string) => {
      if (key === 'NODE_ENV') {
        return 'development';
      }

      return undefined;
    }),
    getOrThrow: jest.fn((key: string) => {
      if (key === 'JWT_SECRET') {
        return 'jwt-secret';
      }

      if (key === 'JWT_REFRESH_SECRET') {
        return 'refresh-secret';
      }

      if (key === 'FRONTEND_URL') {
        return 'http://localhost:3000';
      }

      throw new Error(`Unexpected config key: ${key}`);
    }),
  };

  const mockMailService = {
    sendPasswordResetEmail: jest.fn(),
    sendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('register', () => {
    it('creates an unverified user, stores a hashed verification token, and sends email', async () => {
      const rawToken = 'c'.repeat(64);
      const password = 'SecurePass1';
      const hashedPassword = 'hashed-password';
      const hashedVerificationToken = 'hashed-verification-token';

      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from(rawToken, 'hex'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValueOnce(hashedPassword as never)
        .mockResolvedValueOnce(hashedVerificationToken as never);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      mockPrismaService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      mockPrismaService.user.create.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        username: 'NewUser',
        avatarUrl: null,
        currentLevel: 1,
        totalScore: 0,
        streakDays: 0,
        emailVerified: false,
        growthPoints: 0,
        growthStage: 1,
        role: 'USER',
      });
      mockPrismaService.user.update.mockResolvedValue({});
      mockJwtService.signAsync
        .mockResolvedValueOnce('access-token')
        .mockResolvedValueOnce('refresh-token');

      const result = await service.register({
        email: 'user@example.com',
        username: 'NewUser',
        password,
      });

      expect(result.user.emailVerified).toBe(false);
      expect(result.tokens).toEqual({
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      });
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        `http://localhost:3000/verify-email?token=${rawToken}`,
      );
      expect(console.log).toHaveBeenCalledWith(
        `Email verification link for user@example.com: http://localhost:3000/verify-email?token=${rawToken}`,
      );

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [EmailVerificationUpdateArgs]
      >;
      const updatePayload = updateCalls[0][0];
      expect(updatePayload.where).toEqual({ id: 'user-1' });
      expect(updatePayload.data.emailVerified).toBe(false);
      expect(updatePayload.data.emailVerificationToken).toBe(
        hashedVerificationToken,
      );
    });

    it('throws ConflictException when the email is already in use', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'existing-user',
      });

      await expect(
        service.register({
          email: 'user@example.com',
          username: 'NewUser',
          password: 'SecurePass1',
        }),
      ).rejects.toThrow(ConflictException);
      expect(mockPrismaService.user.create).not.toHaveBeenCalled();
    });
  });

  describe('forgotPassword', () => {
    it('stores a hashed reset token, sends email, and does not return the raw token', async () => {
      const now = new Date('2026-03-15T12:00:00.000Z');
      const rawToken = 'a'.repeat(64);
      const hashedResetToken = 'hashed-reset-token';

      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from(rawToken, 'hex'));
      jest.spyOn(bcrypt, 'hash').mockResolvedValue(hashedResetToken as never);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.forgotPassword({
        email: 'user@example.com',
      });

      expect(result).toEqual({ token: null });
      expect(mockMailService.sendPasswordResetEmail).toHaveBeenCalledWith(
        'user@example.com',
        `http://localhost:3000/reset-password?token=${rawToken}`,
      );
      expect(console.log).toHaveBeenCalledWith(
        `Password reset link for user@example.com: http://localhost:3000/reset-password?token=${rawToken}`,
      );

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [PasswordResetUpdateArgs]
      >;
      const updatePayload = updateCalls[0][0];
      expect(updatePayload.where).toEqual({ id: 'user-1' });
      expect(updatePayload.data.passwordResetToken).toBe(hashedResetToken);
      expect(updatePayload.data.passwordResetExpiry).toEqual(
        new Date(now.getTime() + 60 * 60 * 1000),
      );
    });

    it('returns success without updating when the email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toEqual({ token: null });
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendPasswordResetEmail).not.toHaveBeenCalled();
    });
  });

  describe('resetPassword', () => {
    it('updates the password and clears reset fields when the token is valid', async () => {
      const rawToken = 'b'.repeat(64);
      const newPassword = 'NewPassword1';
      const passwordResetToken = await bcrypt.hash(rawToken, 10);

      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          passwordResetToken,
        },
      ]);
      mockPrismaService.user.update.mockResolvedValue({});

      await service.resetPassword({
        token: rawToken,
        newPassword,
      });

      const findManyCalls = mockPrismaService.user.findMany.mock.calls as Array<
        [ResetPasswordFindManyArgs]
      >;
      const findManyArgs = findManyCalls[0][0];
      expect(findManyArgs.where.passwordResetToken).toEqual({ not: null });
      expect(findManyArgs.where.passwordResetExpiry.gt).toBeInstanceOf(Date);

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [PasswordChangeUpdateArgs]
      >;
      const updatePayload = updateCalls[0][0];
      expect(updatePayload.where).toEqual({ id: 'user-1' });
      expect(updatePayload.data.passwordResetToken).toBeNull();
      expect(updatePayload.data.passwordResetExpiry).toBeNull();
      await expect(
        bcrypt.compare(newPassword, updatePayload.data.password),
      ).resolves.toBe(true);
    });

    it('throws UnauthorizedException when the token is expired or invalid', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await expect(
        service.resetPassword({
          token: 'invalid-token',
          newPassword: 'NewPassword1',
        }),
      ).rejects.toThrow(UnauthorizedException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('verifyEmail', () => {
    it('marks the user as verified when the token matches', async () => {
      const rawToken = 'd'.repeat(64);
      const emailVerificationToken = await bcrypt.hash(rawToken, 10);

      mockPrismaService.user.findMany.mockResolvedValue([
        {
          id: 'user-1',
          emailVerificationToken,
        },
      ]);
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(
        service.verifyEmail({
          token: rawToken,
        }),
      ).resolves.toEqual({ message: 'Email verified successfully' });

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [EmailVerificationSuccessArgs]
      >;
      expect(updateCalls[0][0]).toEqual({
        where: { id: 'user-1' },
        data: {
          emailVerified: true,
          emailVerificationToken: null,
        },
      });
    });

    it('throws BadRequestException when the verification token is invalid', async () => {
      mockPrismaService.user.findMany.mockResolvedValue([]);

      await expect(
        service.verifyEmail({
          token: 'invalid-token',
        }),
      ).rejects.toThrow(BadRequestException);
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });

  describe('resendVerification', () => {
    it('regenerates a verification token and resends the email', async () => {
      const rawToken = 'e'.repeat(64);
      const hashedVerificationToken = 'hashed-verification-token';

      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from(rawToken, 'hex'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockResolvedValue(hashedVerificationToken as never);
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: false,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      await expect(service.resendVerification('user-1')).resolves.toEqual({
        message: 'Verification email sent successfully',
      });

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [EmailVerificationUpdateArgs]
      >;
      expect(updateCalls[0][0]).toEqual({
        where: { id: 'user-1' },
        data: {
          emailVerified: false,
          emailVerificationToken: hashedVerificationToken,
        },
      });
      expect(mockMailService.sendVerificationEmail).toHaveBeenCalledWith(
        'user@example.com',
        `http://localhost:3000/verify-email?token=${rawToken}`,
      );
      expect(console.log).toHaveBeenCalledWith(
        `Email verification link for user@example.com: http://localhost:3000/verify-email?token=${rawToken}`,
      );
    });

    it('throws BadRequestException when the email is already verified', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
        emailVerified: true,
      });

      await expect(service.resendVerification('user-1')).rejects.toThrow(
        BadRequestException,
      );
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
      expect(mockMailService.sendVerificationEmail).not.toHaveBeenCalled();
    });
  });
});
