import { Test, TestingModule } from '@nestjs/testing';
import { ProgressService } from './progress.service';
import { UsersService } from '../users';
import { PrismaService } from '../../prisma';

describe('ProgressService streak integration', () => {
  let service: ProgressService;

  const userId = 'user-123';
  const progressRecords = new Map<string, {
    id: string;
    userId: string;
    puzzleId: string;
    completed: boolean;
    completedAt: Date | null;
    score: number;
    timeSpent: number;
    hintsUsed: number;
  }>();
  const userState: {
    id: string;
    totalScore: number;
    currentLevel: number;
    streakDays: number;
    lastPlayedAt: Date | null;
  } = {
    id: userId,
    totalScore: 0,
    currentLevel: 1,
    streakDays: 0,
    lastPlayedAt: null,
  };

  const getProgressKey = (ownerId: string, puzzleId: string) =>
    `${ownerId}:${puzzleId}`;

  const mockPrismaService = {
    puzzle: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) =>
        Promise.resolve(where.id.startsWith('puzzle-') ? { id: where.id } : null),
      ),
      findMany: jest.fn(),
    },
    userProgress: {
      findUnique: jest.fn(
        ({
          where,
        }: {
          where: { userId_puzzleId: { userId: string; puzzleId: string } };
        }) =>
          Promise.resolve(
            progressRecords.get(
              getProgressKey(
                where.userId_puzzleId.userId,
                where.userId_puzzleId.puzzleId,
              ),
            ) ?? null,
          ),
      ),
      findMany: jest.fn(),
      create: jest.fn(
        ({
          data,
        }: {
          data: {
            userId: string;
            puzzleId: string;
            completed: boolean;
            completedAt: Date | null;
            score: number;
            timeSpent: number;
            hintsUsed: number;
          };
        }) => {
          const record = {
            id: `progress-${progressRecords.size + 1}`,
            ...data,
          };

          progressRecords.set(getProgressKey(data.userId, data.puzzleId), record);
          return Promise.resolve(record);
        },
      ),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(
        ({ where }: { where: { userId: string; completed: boolean } }) =>
          Promise.resolve(
            Array.from(progressRecords.values()).filter(
              (progress) =>
                progress.userId === where.userId &&
                progress.completed === where.completed,
            ).length,
          ),
      ),
    },
    user: {
      findUnique: jest.fn(({ where }: { where: { id: string } }) => {
        if (where.id !== userId) {
          return Promise.resolve(null);
        }

        return Promise.resolve({
          id: userState.id,
          totalScore: userState.totalScore,
          currentLevel: userState.currentLevel,
          streakDays: userState.streakDays,
          lastPlayedAt: userState.lastPlayedAt,
        });
      }),
      update: jest.fn(
        ({
          where,
          data,
        }: {
          where: { id: string };
          data: Partial<typeof userState>;
        }) => {
          if (where.id !== userId) {
            return Promise.resolve(null);
          }

          if (typeof data.totalScore === 'number') {
            userState.totalScore = data.totalScore;
          }
          if (typeof data.currentLevel === 'number') {
            userState.currentLevel = data.currentLevel;
          }
          if (typeof data.streakDays === 'number') {
            userState.streakDays = data.streakDays;
          }
          if ('lastPlayedAt' in data) {
            userState.lastPlayedAt = data.lastPlayedAt ?? null;
          }

          return Promise.resolve({ ...userState });
        },
      ),
    },
  };

  beforeEach(async () => {
    progressRecords.clear();
    userState.totalScore = 0;
    userState.currentLevel = 1;
    userState.streakDays = 0;
    userState.lastPlayedAt = null;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProgressService,
        UsersService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<ProgressService>(ProgressService);

    jest.clearAllMocks();
    jest.useFakeTimers().setSystemTime(new Date('2026-03-13T10:00:00.000Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps the streak at 1 when two puzzles are completed on the same UTC day', async () => {
    await service.submitProgress(userId, {
      puzzleId: 'puzzle-1',
      completed: true,
      score: 100,
      timeSpent: 120,
      hintsUsed: 0,
    });

    expect(userState.streakDays).toBe(1);

    await service.submitProgress(userId, {
      puzzleId: 'puzzle-2',
      completed: true,
      score: 150,
      timeSpent: 150,
      hintsUsed: 1,
    });

    expect(userState.streakDays).toBe(1);
    expect(userState.lastPlayedAt).toEqual(new Date('2026-03-13T10:00:00.000Z'));
  });
});
