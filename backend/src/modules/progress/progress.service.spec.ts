import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { PrismaService } from '../../prisma';
import { NotFoundException } from '@nestjs/common';
import { UsersService } from '../users';

describe('ProgressService', () => {
  let service: ProgressService;

  const mockPrismaService = {
    puzzle: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    userProgress: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  const mockUsersService = {
    updateStreak: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);

    // Clear all mocks before each test
    jest.clearAllMocks();
    mockUsersService.updateStreak.mockResolvedValue(1);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('submitProgress', () => {
    const userId = 'user-123';
    const puzzleId = 'puzzle-123';
    const submitInput = {
      puzzleId,
      completed: true,
      score: 100,
      timeSpent: 300,
      hintsUsed: 0,
    };

    it('should throw NotFoundException if puzzle does not exist', async () => {
      mockPrismaService.puzzle.findUnique.mockResolvedValue(null);

      await expect(
        service.submitProgress(userId, submitInput),
      ).rejects.toThrow(NotFoundException);
    });

    it('should create new progress if none exists', async () => {
      const puzzle = { id: puzzleId, title: 'Test Puzzle' };
      const createdProgress = {
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: new Date(),
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      };

      mockPrismaService.puzzle.findUnique.mockResolvedValue(puzzle);
      mockPrismaService.userProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.userProgress.create.mockResolvedValue(createdProgress);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        totalScore: 0,
        currentLevel: 1,
      });
      mockPrismaService.userProgress.count.mockResolvedValue(1);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.submitProgress(userId, submitInput);

      expect(result).toEqual(createdProgress);
      expect(mockPrismaService.userProgress.create).toHaveBeenCalledWith({
        data: {
          userId,
          puzzleId,
          completed: true,
          completedAt: expect.any(Date),
          score: 100,
          timeSpent: 300,
          hintsUsed: 0,
        },
      });
      expect(mockUsersService.updateStreak).toHaveBeenCalledWith(userId);
    });

    it('should update existing progress with higher score', async () => {
      const puzzle = { id: puzzleId, title: 'Test Puzzle' };
      const existingProgress = {
        id: 'progress-123',
        userId,
        puzzleId,
        completed: false,
        completedAt: null,
        score: 50,
        timeSpent: 200,
        hintsUsed: 2,
      };
      const updatedProgress = {
        ...existingProgress,
        completed: true,
        completedAt: new Date(),
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      };

      mockPrismaService.puzzle.findUnique.mockResolvedValue(puzzle);
      mockPrismaService.userProgress.findUnique.mockResolvedValue(existingProgress);
      mockPrismaService.userProgress.update.mockResolvedValue(updatedProgress);
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        totalScore: 50,
        currentLevel: 1,
      });
      mockPrismaService.userProgress.count.mockResolvedValue(1);
      mockPrismaService.user.update.mockResolvedValue({});

      const result = await service.submitProgress(userId, submitInput);

      expect(result).toEqual(updatedProgress);
      expect(mockPrismaService.userProgress.update).toHaveBeenCalled();
      expect(mockUsersService.updateStreak).toHaveBeenCalledWith(userId);
    });

    it('should not update if new score is lower and already completed', async () => {
      const puzzle = { id: puzzleId, title: 'Test Puzzle' };
      const existingProgress = {
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: new Date(),
        score: 150,
        timeSpent: 200,
        hintsUsed: 0,
      };

      mockPrismaService.puzzle.findUnique.mockResolvedValue(puzzle);
      mockPrismaService.userProgress.findUnique.mockResolvedValue(existingProgress);

      const result = await service.submitProgress(userId, { ...submitInput, score: 100 });

      expect(result).toEqual(existingProgress);
      expect(mockPrismaService.userProgress.update).not.toHaveBeenCalled();
      expect(mockUsersService.updateStreak).not.toHaveBeenCalled();
    });
  });

  describe('streak delegation', () => {
    const userId = 'user-123';
    const puzzleId = 'puzzle-123';

    beforeEach(() => {
      mockPrismaService.puzzle.findUnique.mockResolvedValue({ id: puzzleId });
      mockPrismaService.userProgress.findUnique.mockResolvedValue(null);
      mockPrismaService.userProgress.create.mockResolvedValue({
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: new Date(),
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      });
      mockPrismaService.userProgress.count.mockResolvedValue(1);
    });

    it('calls usersService.updateStreak when a new completed progress entry is created', async () => {
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        totalScore: 0,
        currentLevel: 1,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.submitProgress(userId, {
        puzzleId,
        completed: true,
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      });

      expect(mockUsersService.updateStreak).toHaveBeenCalledWith(userId);
    });

    it('calls usersService.updateStreak when an existing incomplete progress becomes completed', async () => {
      mockPrismaService.userProgress.findUnique.mockResolvedValue({
        id: 'progress-123',
        userId,
        puzzleId,
        completed: false,
        completedAt: null,
        score: 10,
        timeSpent: 120,
        hintsUsed: 2,
      });
      mockPrismaService.userProgress.update.mockResolvedValue({
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: new Date(),
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      });
      mockPrismaService.user.findUnique.mockResolvedValue({
        id: userId,
        totalScore: 100,
        currentLevel: 1,
      });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.submitProgress(userId, {
        puzzleId,
        completed: true,
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      });

      expect(mockUsersService.updateStreak).toHaveBeenCalledWith(userId);
    });

    it('does not call usersService.updateStreak when the completed progress record is unchanged', async () => {
      mockPrismaService.userProgress.findUnique.mockResolvedValue({
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: new Date(),
        score: 150,
        timeSpent: 200,
        hintsUsed: 0,
      });

      const result = await service.submitProgress(userId, {
        puzzleId,
        completed: true,
        score: 100,
        timeSpent: 300,
        hintsUsed: 0,
      });

      expect(result).toEqual({
        id: 'progress-123',
        userId,
        puzzleId,
        completed: true,
        completedAt: expect.any(Date),
        score: 150,
        timeSpent: 200,
        hintsUsed: 0,
      });
      expect(mockUsersService.updateStreak).not.toHaveBeenCalled();
    });
  });

  describe('getUserProgress', () => {
    it('should return user progress with puzzles', async () => {
      const userId = 'user-123';
      const mockProgress = [
        {
          id: 'progress-1',
          userId,
          puzzleId: 'puzzle-1',
          completed: true,
          score: 100,
          puzzle: { id: 'puzzle-1', title: 'Puzzle 1' },
        },
      ];

      mockPrismaService.userProgress.findMany.mockResolvedValue(mockProgress);

      const result = await service.getUserProgress(userId);

      expect(result).toEqual(mockProgress);
      expect(mockPrismaService.userProgress.findMany).toHaveBeenCalledWith({
        where: { userId },
        include: { puzzle: true },
        orderBy: { updatedAt: 'desc' },
      });
    });
  });

  describe('getProgressByGameMode', () => {
    it('should calculate progress statistics for a game mode', async () => {
      const userId = 'user-123';
      const puzzles = [
        { id: 'puzzle-1' },
        { id: 'puzzle-2' },
        { id: 'puzzle-3' },
      ];
      const progress = [
        {
          id: 'progress-1',
          userId,
          puzzleId: 'puzzle-1',
          completed: true,
          score: 100,
          timeSpent: 300,
        },
        {
          id: 'progress-2',
          userId,
          puzzleId: 'puzzle-2',
          completed: true,
          score: 150,
          timeSpent: 400,
        },
      ];

      mockPrismaService.puzzle.findMany.mockResolvedValue(puzzles);
      mockPrismaService.userProgress.findMany.mockResolvedValue(progress);

      const result = await service.getProgressByGameMode(userId, 'STORY');

      expect(result).toEqual({
        total: 3,
        completed: 2,
        totalScore: 250,
        averageTime: 350,
      });
    });
  });

  describe('resetProgress', () => {
    it('should reset all progress and user stats when no puzzleId provided', async () => {
      const userId = 'user-123';

      mockPrismaService.userProgress.deleteMany.mockResolvedValue({ count: 5 });
      mockPrismaService.user.update.mockResolvedValue({});

      await service.resetProgress(userId);

      expect(mockPrismaService.userProgress.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
      expect(mockPrismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: {
          totalScore: 0,
          currentLevel: 1,
          streakDays: 0,
        },
      });
    });

    it('should reset only specific puzzle progress when puzzleId provided', async () => {
      const userId = 'user-123';
      const puzzleId = 'puzzle-123';

      mockPrismaService.userProgress.deleteMany.mockResolvedValue({ count: 1 });

      await service.resetProgress(userId, puzzleId);

      expect(mockPrismaService.userProgress.deleteMany).toHaveBeenCalledWith({
        where: { userId, puzzleId },
      });
      expect(mockPrismaService.user.update).not.toHaveBeenCalled();
    });
  });
});
