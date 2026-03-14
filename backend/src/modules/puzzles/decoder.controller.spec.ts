import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { DecoderController } from './puzzles.controller';
import { DecoderService } from './decoder.service';
import { PuzzlesService } from './puzzles.service';

describe('DecoderController', () => {
  let app: INestApplication;

  const mockPuzzlesService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DecoderController],
      providers: [
        DecoderService,
        {
          provide: PuzzlesService,
          useValue: mockPuzzlesService,
        },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();

    mockPuzzlesService.findOne.mockResolvedValue({
      id: 'puzzle-1',
      originalReflection: 'A B Z',
      hints: ['Use the page 6 legend'],
    });
  });

  afterEach(async () => {
    jest.clearAllMocks();
    await app.close();
  });

  it('round-trips encode/decode responses through the HTTP API', async () => {
    const encodeResponse = await request(app.getHttpServer())
      .post('/api/decoder/encode')
      .send({ text: 'A B Z' })
      .expect(200);

    expect(encodeResponse.body.success).toBe(true);
    expect(encodeResponse.body.data.output).toBe('1  2  26');

    const decodeResponse = await request(app.getHttpServer())
      .post('/api/decoder/decode')
      .send({ encryptedPattern: encodeResponse.body.data.output })
      .expect(200);

    expect(decodeResponse.body.success).toBe(true);
    expect(decodeResponse.body.data.output).toBe('A B Z');
  });

  it('validates correct numeric attempts against puzzle reflections', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/decoder/validate')
      .send({
        puzzleId: 'puzzle-1',
        attempt: '1  2  26',
      })
      .expect(200);

    expect(mockPuzzlesService.findOne).toHaveBeenCalledWith('puzzle-1');
    expect(response.body.success).toBe(true);
    expect(response.body.data).toMatchObject({
      isCorrect: true,
      similarity: 1,
    });
  });
});
