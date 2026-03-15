import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma';
import { AvatarService } from './avatar.service';

jest.mock('fs/promises', () => ({
  mkdir: jest.fn(),
  unlink: jest.fn(),
  writeFile: jest.fn(),
}));

describe('AvatarService', () => {
  let service: AvatarService;

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AvatarService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<AvatarService>(AvatarService);
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('saves a valid avatar file and returns the public uploads path', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1710499200000);
    mockPrismaService.user.findUnique.mockResolvedValue({
      avatarUrl: null,
    });

    const result = await service.saveAvatar(
      {
        originalname: 'avatar.png',
        mimetype: 'image/png',
        size: 1024,
        buffer: Buffer.from('avatar-bytes'),
      } as Express.Multer.File,
      'user-1',
    );

    expect(result).toBe('/uploads/avatars/user-1-1710499200000.png');
    expect(mkdir).toHaveBeenCalledWith(
      join(process.cwd(), 'public', 'uploads', 'avatars'),
      { recursive: true },
    );
    expect(writeFile).toHaveBeenCalledWith(
      join(
        process.cwd(),
        'public',
        'uploads',
        'avatars',
        'user-1-1710499200000.png',
      ),
      Buffer.from('avatar-bytes'),
    );
  });

  it('deletes the previous local avatar file when replacing it', async () => {
    jest.spyOn(Date, 'now').mockReturnValue(1710499200000);
    mockPrismaService.user.findUnique.mockResolvedValue({
      avatarUrl: '/uploads/avatars/old-avatar.png',
    });

    await service.saveAvatar(
      {
        originalname: 'avatar.webp',
        mimetype: 'image/webp',
        size: 2048,
        buffer: Buffer.from('avatar-bytes'),
      } as Express.Multer.File,
      'user-1',
    );

    expect(unlink).toHaveBeenCalledWith(
      join(process.cwd(), 'public', 'uploads', 'avatars', 'old-avatar.png'),
    );
  });

  it('rejects files larger than 2MB', async () => {
    await expect(
      service.saveAvatar(
        {
          originalname: 'big.png',
          mimetype: 'image/png',
          size: 2 * 1024 * 1024 + 1,
          buffer: Buffer.from('avatar-bytes'),
        } as Express.Multer.File,
        'user-1',
      ),
    ).rejects.toThrow(BadRequestException);

    expect(mockPrismaService.user.findUnique).not.toHaveBeenCalled();
  });

  it('rejects non-image files', async () => {
    await expect(
      service.saveAvatar(
        {
          originalname: 'avatar.pdf',
          mimetype: 'application/pdf',
          size: 512,
          buffer: Buffer.from('avatar-bytes'),
        } as Express.Multer.File,
        'user-1',
      ),
    ).rejects.toThrow('Only JPEG, PNG, WEBP, and GIF images are allowed');
  });

  it('throws when the user does not exist', async () => {
    mockPrismaService.user.findUnique.mockResolvedValue(null);

    await expect(
      service.saveAvatar(
        {
          originalname: 'avatar.png',
          mimetype: 'image/png',
          size: 512,
          buffer: Buffer.from('avatar-bytes'),
        } as Express.Multer.File,
        'missing-user',
      ),
    ).rejects.toThrow(NotFoundException);
  });
});
