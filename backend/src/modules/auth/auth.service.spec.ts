import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../../prisma';
import { AuthService } from './auth.service';

interface PasswordResetUpdateArgs {
  where: { id: string };
  data: {
    passwordResetToken: string;
    passwordResetExpiry: Date;
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

      if (key === 'FRONTEND_URL') {
        return 'http://localhost:3000';
      }

      return undefined;
    }),
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
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
  });

  describe('forgotPassword', () => {
    it('stores a hashed reset token and expiry for existing users', async () => {
      const now = new Date('2026-03-13T12:00:00.000Z');
      const rawToken = 'a'.repeat(64);
      const hashedResetToken = 'hashed-reset-token';

      jest.spyOn(Date, 'now').mockReturnValue(now.getTime());
      jest
        .spyOn(crypto, 'randomBytes')
        .mockImplementation(() => Buffer.from(rawToken, 'hex'));
      jest
        .spyOn(bcrypt, 'hash')
        .mockImplementation(
          (
            _data: string | Buffer,
            _saltOrRounds: string | number,
            callback?: (err: Error | undefined, encrypted: string) => unknown,
          ) => {
            if (callback) {
              callback(undefined, hashedResetToken);
              return undefined as never;
            }

            return Promise.resolve(hashedResetToken) as never;
          },
        );
      jest.spyOn(console, 'log').mockImplementation(() => undefined);

      mockPrismaService.user.findUnique.mockResolvedValue({
        id: 'user-1',
        email: 'user@example.com',
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.forgotPassword({
        email: 'user@example.com',
      });

      expect(result).toEqual({ token: rawToken });
      expect(mockPrismaService.user.update).toHaveBeenCalledTimes(1);

      const updateCalls = mockPrismaService.user.update.mock.calls as Array<
        [PasswordResetUpdateArgs]
      >;
      const updatePayload = updateCalls[0][0];
      expect(updatePayload.where).toEqual({ id: 'user-1' });
      expect(updatePayload.data.passwordResetToken).toBe(hashedResetToken);
      expect(updatePayload.data.passwordResetExpiry).toEqual(
        new Date(now.getTime() + 60 * 60 * 1000),
      );
      expect(bcrypt.hash).toHaveBeenCalledWith(rawToken, 10);
      expect(console.log).toHaveBeenCalledWith(
        `Password reset link for user@example.com: http://localhost:3000/reset-password?token=${rawToken}`,
      );
    });

    it('returns success without updating when the email does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.forgotPassword({ email: 'missing@example.com' }),
      ).resolves.toEqual({ token: null });
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
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
      expect(findManyArgs.select).toEqual({
        id: true,
        passwordResetToken: true,
      });

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
});
