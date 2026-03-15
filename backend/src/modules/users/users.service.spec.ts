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

    it('resets the streak to 1 after a seven-day gap', async () => {
      const now = new Date('2026-03-20T08:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      mockPrismaService.user.findUnique.mockResolvedValue({
        lastPlayedAt: new Date('2026-03-13T22:30:00.000Z'),
        streakDays: 21,
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

  describe('updateGrowth', () => {
    it('throws when the user does not exist', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.updateGrowth('missing-user', 10)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('adds growth points and keeps stage 1 below the first threshold', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        growthPoints: 0,
      });
      mockPrismaService.user.update.mockResolvedValue({
        growthPoints: 10,
        growthStage: 1,
      });

      const growth = await service.updateGrowth('user-1', 10);

      expect(growth).toEqual({
        growthPoints: 10,
        growthStage: 1,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          growthPoints: 10,
          growthStage: 1,
        },
        select: {
          growthPoints: true,
          growthStage: true,
        },
      });
    });

    it('advances from stage 1 to stage 2 at exactly 50 growth points', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        growthPoints: 40,
      });
      mockPrismaService.user.update.mockResolvedValue({
        growthPoints: 50,
        growthStage: 2,
      });

      const growth = await service.updateGrowth('user-1', 10);

      expect(growth).toEqual({
        growthPoints: 50,
        growthStage: 2,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          growthPoints: 50,
          growthStage: 2,
        },
        select: {
          growthPoints: true,
          growthStage: true,
        },
      });
    });

    it('advances to the correct stage at each threshold boundary', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        growthPoints: 90,
      });
      mockPrismaService.user.update.mockResolvedValue({
        growthPoints: 120,
        growthStage: 3,
      });

      const growth = await service.updateGrowth('user-1', 30);

      expect(growth).toEqual({
        growthPoints: 120,
        growthStage: 3,
      });
    });

    it('caps growth at 1000 points and stage 5', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        growthPoints: 990,
      });
      mockPrismaService.user.update.mockResolvedValue({
        growthPoints: 1000,
        growthStage: 5,
      });

      const growth = await service.updateGrowth('user-1', 50);

      expect(growth).toEqual({
        growthPoints: 1000,
        growthStage: 5,
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        data: {
          growthPoints: 1000,
          growthStage: 5,
        },
        select: {
          growthPoints: true,
          growthStage: true,
        },
      });
    });
  });

  describe('getStats', () => {
    it('aggregates completed puzzle stats, hints, average time, and achievements', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        totalScore: 420,
        currentLevel: 4,
        streakDays: 6,
        growthPoints: 120,
        growthStage: 3,
        progress: [
          { completed: true, timeSpent: 120, hintsUsed: 1 },
          { completed: true, timeSpent: 180, hintsUsed: 2 },
          { completed: false, timeSpent: 999, hintsUsed: 9 },
        ],
        achievements: [{ id: 'achievement-1' }, { id: 'achievement-2' }],
      });

      const stats = await service.getStats('user-1');

      expect(stats).toEqual({
        totalPuzzlesCompleted: 2,
        totalScore: 420,
        currentLevel: 4,
        streakDays: 6,
        growthPoints: 120,
        growthStage: 3,
        averageTimePerPuzzle: 150,
        hintsUsed: 3,
        achievementsUnlocked: 2,
      });
      expect(mockPrismaService.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-1' },
        include: {
          progress: {
            where: { completed: true },
          },
          achievements: true,
        },
      });
    });
  });
});
