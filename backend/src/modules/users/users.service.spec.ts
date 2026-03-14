import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { PrismaService } from '../../prisma';

describe('UsersService', () => {
  let service: UsersService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('updateStreak', () => {
    it('throws when the user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateStreak('missing-user')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('sets streak to 1 for the first qualifying completion', async () => {
      const now = new Date('2026-03-13T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        lastPlayedAt: null,
        streakDays: 0,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const streak = await service.updateStreak('user-1');

      expect(streak).toBe(1);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          streakDays: 1,
          lastPlayedAt: now,
        },
      });
    });

    it('keeps the streak unchanged on the same UTC day and updates lastPlayedAt', async () => {
      const now = new Date('2026-03-13T23:59:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        lastPlayedAt: new Date('2026-03-13T00:01:00.000Z'),
        streakDays: 7,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const streak = await service.updateStreak('user-1');

      expect(streak).toBe(7);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          streakDays: 7,
          lastPlayedAt: now,
        },
      });
    });

    it('increments the streak on the next UTC calendar day', async () => {
      const now = new Date('2026-03-14T00:01:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        lastPlayedAt: new Date('2026-03-13T23:59:00.000Z'),
        streakDays: 7,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const streak = await service.updateStreak('user-1');

      expect(streak).toBe(8);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          streakDays: 8,
          lastPlayedAt: now,
        },
      });
    });

    it('resets the streak to 1 after a gap of two or more UTC days', async () => {
      const now = new Date('2026-03-15T00:01:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        lastPlayedAt: new Date('2026-03-13T23:59:00.000Z'),
        streakDays: 12,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      const streak = await service.updateStreak('user-1');

      expect(streak).toBe(1);
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          streakDays: 1,
          lastPlayedAt: now,
        },
      });
    });
  });
});
