import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma';

const MAX_AVATAR_SIZE_BYTES = 2 * 1024 * 1024;
const AVATAR_UPLOAD_PATH = '/uploads/avatars';
const AVATAR_MIME_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
};

@Injectable()
export class AvatarService {
  constructor(private readonly prisma: PrismaService) {}

  async saveAvatar(file: Express.Multer.File, userId: string): Promise<string> {
    if (!file) {
      throw new BadRequestException('Avatar file is required');
    }

    const extension = AVATAR_MIME_TYPE_TO_EXTENSION[file.mimetype];
    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG, WEBP, and GIF images are allowed',
      );
    }

    if (file.size > MAX_AVATAR_SIZE_BYTES) {
      throw new BadRequestException('Avatar file size cannot exceed 2MB');
    }

    if (!file.buffer) {
      throw new BadRequestException('Avatar file buffer is missing');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const uploadDirectory = this.getUploadDirectory();
    await mkdir(uploadDirectory, { recursive: true });

    const filename = `${userId}-${Date.now()}${extension}`;
    const relativeAvatarPath = `${AVATAR_UPLOAD_PATH}/${filename}`;
    const outputPath = join(uploadDirectory, filename);

    await writeFile(outputPath, file.buffer);
    await this.deleteOldLocalAvatar(user.avatarUrl);

    return relativeAvatarPath;
  }

  private getUploadDirectory(): string {
    return join(process.cwd(), 'public', 'uploads', 'avatars');
  }

  private async deleteOldLocalAvatar(avatarUrl: string | null): Promise<void> {
    const localPath = this.extractLocalUploadPath(avatarUrl);
    if (!localPath) {
      return;
    }

    const filePath = join(process.cwd(), 'public', ...localPath.split('/'));

    try {
      await unlink(filePath);
    } catch (error) {
      const errorCode =
        error instanceof Error && 'code' in error
          ? (error as NodeJS.ErrnoException).code
          : undefined;

      if (errorCode !== 'ENOENT') {
        throw error;
      }
    }
  }

  private extractLocalUploadPath(avatarUrl: string | null): string | null {
    if (!avatarUrl) {
      return null;
    }

    if (avatarUrl.startsWith('/uploads/')) {
      return avatarUrl.slice(1);
    }

    try {
      const parsedUrl = new URL(avatarUrl);
      if (parsedUrl.pathname.startsWith('/uploads/')) {
        return parsedUrl.pathname.slice(1);
      }
    } catch {
      return null;
    }

    return null;
  }
}
