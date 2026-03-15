import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as request from 'supertest';
import { PrismaService } from '../../prisma';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { DecoderService } from './decoder.service';
import { PuzzlesController } from './puzzles.controller';
import { PuzzlesService } from './puzzles.service';

describe('PuzzlesController RBAC', () => {
  let app: INestApplication;

  type HttpServer = Parameters<typeof request.agent>[0];
  type SupertestClient = ReturnType<typeof request.agent>;
  const supertest = request as unknown as (
    server: HttpServer,
  ) => SupertestClient;

  interface TestAuthRequest {
    headers: Record<string, string | string[] | undefined>;
    user?: {
      id: string;
      role: Role;
    };
  }

  const mockPuzzlesService = {
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  const testJwtAuthGuard = {
    canActivate: (context: ExecutionContext) => {
      const request = context.switchToHttp().getRequest<TestAuthRequest>();
      const authorization = request.headers.authorization;

      if (!authorization) {
        throw new UnauthorizedException('Authentication required');
      }

      const requestedRole = request.headers['x-user-role'];
      request.user = {
        id: 'user-1',
        role: requestedRole === Role.ADMIN ? Role.ADMIN : Role.USER,
      };

      return true;
    },
  };

  const getHttpServer = () => app.getHttpServer() as HttpServer;

  const createPuzzlePayload = {
    title: 'Admin Puzzle',
    encryptedPattern: '1 2 3',
    originalReflection: 'ABC',
    gameMode: 'STORY',
    difficulty: 'BEGINNER',
    orderIndex: 1,
    hints: ['First hint'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PuzzlesController],
      providers: [
        Reflector,
        RolesGuard,
        {
          provide: PuzzlesService,
          useValue: mockPuzzlesService,
        },
        {
          provide: DecoderService,
          useValue: {},
        },
        {
          provide: PrismaService,
          useValue: {
            subscription: {
              findUnique: jest.fn(),
            },
          },
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(testJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    mockPuzzlesService.create.mockResolvedValue({
      id: 'puzzle-1',
      ...createPuzzlePayload,
    });
    mockPuzzlesService.update.mockResolvedValue({
      id: 'puzzle-1',
      ...createPuzzlePayload,
      title: 'Updated Puzzle',
    });
    mockPuzzlesService.remove.mockResolvedValue({
      id: 'puzzle-1',
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  it('returns 403 when a regular user attempts to create a puzzle', async () => {
    await supertest(getHttpServer())
      .post('/api/puzzles')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.USER)
      .send(createPuzzlePayload)
      .expect(403);

    expect(mockPuzzlesService.create).not.toHaveBeenCalled();
  });

  it('allows an admin user to create a puzzle', async () => {
    const response = await supertest(getHttpServer())
      .post('/api/puzzles')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.ADMIN)
      .send(createPuzzlePayload)
      .expect(201);

    const responseBody = response.body as { success: boolean };

    expect(mockPuzzlesService.create).toHaveBeenCalledWith(createPuzzlePayload);
    expect(responseBody.success).toBe(true);
  });

  it('returns 403 when a regular user attempts to update or delete a puzzle', async () => {
    await supertest(getHttpServer())
      .patch('/api/puzzles/puzzle-1')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.USER)
      .send({ title: 'Updated Puzzle' })
      .expect(403);

    await supertest(getHttpServer())
      .delete('/api/puzzles/puzzle-1')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.USER)
      .expect(403);

    expect(mockPuzzlesService.update).not.toHaveBeenCalled();
    expect(mockPuzzlesService.remove).not.toHaveBeenCalled();
  });

  it('allows an admin user to update and delete puzzles', async () => {
    await supertest(getHttpServer())
      .patch('/api/puzzles/puzzle-1')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.ADMIN)
      .send({ title: 'Updated Puzzle' })
      .expect(200);

    await supertest(getHttpServer())
      .delete('/api/puzzles/puzzle-1')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.ADMIN)
      .expect(200);

    expect(mockPuzzlesService.update).toHaveBeenCalledWith(
      'puzzle-1',
      expect.objectContaining({
        title: 'Updated Puzzle',
      }),
    );
    expect(mockPuzzlesService.remove).toHaveBeenCalledWith('puzzle-1');
  });
});
