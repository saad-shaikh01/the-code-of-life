import {
  ExecutionContext,
  INestApplication,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@prisma/client';
import * as request from 'supertest';
import { JwtAuthGuard, RolesGuard } from '../../common/guards';
import { AchievementsController } from './achievements.controller';
import { AchievementsService } from './achievements.service';

describe('AchievementsController RBAC', () => {
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

  const mockAchievementsService = {
    seedDefaultAchievements: jest.fn(),
    createAchievement: jest.fn(),
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

  const createAchievementPayload = {
    name: 'Admin Only Achievement',
    description: 'Created by an admin',
    points: 100,
    criteria: {
      type: 'FIRST_PUZZLE',
      target: 1,
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AchievementsController],
      providers: [
        Reflector,
        RolesGuard,
        {
          provide: AchievementsService,
          useValue: mockAchievementsService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue(testJwtAuthGuard)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    mockAchievementsService.seedDefaultAchievements.mockResolvedValue([
      { id: 'achievement-1', name: 'Seeded' },
    ]);
    mockAchievementsService.createAchievement.mockResolvedValue({
      id: 'achievement-1',
      ...createAchievementPayload,
      criteria: JSON.stringify(createAchievementPayload.criteria),
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    if (app) {
      await app.close();
    }
  });

  it('returns 401 when an unauthenticated request hits the seed endpoint', async () => {
    await supertest(getHttpServer()).post('/api/achievements/seed').expect(401);

    expect(
      mockAchievementsService.seedDefaultAchievements,
    ).not.toHaveBeenCalled();
  });

  it('returns 403 when a regular user attempts to seed achievements', async () => {
    await supertest(getHttpServer())
      .post('/api/achievements/seed')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.USER)
      .expect(403);

    expect(
      mockAchievementsService.seedDefaultAchievements,
    ).not.toHaveBeenCalled();
  });

  it('allows an admin user to seed achievements', async () => {
    const response = await supertest(getHttpServer())
      .post('/api/achievements/seed')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.ADMIN)
      .expect(201);

    const responseBody = response.body as { success: boolean };

    expect(
      mockAchievementsService.seedDefaultAchievements,
    ).toHaveBeenCalledTimes(1);
    expect(responseBody.success).toBe(true);
  });

  it('returns 403 when a regular user attempts to create an achievement', async () => {
    await supertest(getHttpServer())
      .post('/api/achievements')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.USER)
      .send(createAchievementPayload)
      .expect(403);

    expect(mockAchievementsService.createAchievement).not.toHaveBeenCalled();
  });

  it('allows an admin user to create an achievement', async () => {
    const response = await supertest(getHttpServer())
      .post('/api/achievements')
      .set('Authorization', 'Bearer test-token')
      .set('x-user-role', Role.ADMIN)
      .send(createAchievementPayload)
      .expect(201);

    const responseBody = response.body as { success: boolean };

    expect(mockAchievementsService.createAchievement).toHaveBeenCalledWith(
      createAchievementPayload,
    );
    expect(responseBody.success).toBe(true);
  });
});
