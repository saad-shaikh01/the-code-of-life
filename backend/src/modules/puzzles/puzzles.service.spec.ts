import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma';
import { PuzzlesService } from './puzzles.service';

describe('PuzzlesService', () => {
  let service: PuzzlesService;

  const mockPrismaService = {
    puzzle: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PuzzlesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<PuzzlesService>(PuzzlesService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('findDailyPuzzle', () => {
    it("returns today's scheduled daily puzzle when one exists", async () => {
      const scheduledPuzzle = { id: 'daily-today', gameMode: 'DAILY' };
      mockPrismaService.puzzle.findFirst.mockResolvedValue(scheduledPuzzle);

      const result = await service.findDailyPuzzle();

      expect(result).toBe(scheduledPuzzle);
      expect(mockPrismaService.puzzle.findMany).not.toHaveBeenCalled();
    });

    it('falls back to a deterministic DAILY puzzle when no puzzle is scheduled today', async () => {
      const now = new Date('2026-03-13T12:00:00.000Z');
      jest.useFakeTimers().setSystemTime(now);

      const availableDailyPuzzles = [
        { id: 'daily-1', gameMode: 'DAILY', orderIndex: 1 },
        { id: 'daily-2', gameMode: 'DAILY', orderIndex: 2 },
        { id: 'daily-3', gameMode: 'DAILY', orderIndex: 3 },
      ];

      mockPrismaService.puzzle.findFirst.mockResolvedValue(null);
      mockPrismaService.puzzle.findMany.mockResolvedValue(
        availableDailyPuzzles,
      );

      const result = await service.findDailyPuzzle();

      const startOfYear = new Date(now.getFullYear(), 0, 0);
      const diff = now.getTime() - startOfYear.getTime();
      const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
      const expectedPuzzle =
        availableDailyPuzzles[dayOfYear % availableDailyPuzzles.length];

      expect(mockPrismaService.puzzle.findMany).toHaveBeenCalledWith({
        where: { gameMode: 'DAILY' },
        orderBy: { orderIndex: 'asc' },
      });
      expect(result).toEqual(expectedPuzzle);
    });

    it('returns null when no DAILY puzzles exist', async () => {
      mockPrismaService.puzzle.findFirst.mockResolvedValue(null);
      mockPrismaService.puzzle.findMany.mockResolvedValue([]);

      await expect(service.findDailyPuzzle()).resolves.toBeNull();
    });
  });
});
