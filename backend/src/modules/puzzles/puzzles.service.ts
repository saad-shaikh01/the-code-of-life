import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Puzzle, Prisma } from '../../../generated/prisma';
import {
  CreatePuzzleInput,
  UpdatePuzzleInput,
} from './schemas/puzzle.schema';
import { PuzzleQueryInput } from './schemas/puzzle-query.schema';

@Injectable()
export class PuzzlesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPuzzleInput: CreatePuzzleInput): Promise<Puzzle> {
    const data: Prisma.PuzzleCreateInput = {
      ...createPuzzleInput,
      scheduledDate: createPuzzleInput.scheduledDate
        ? new Date(createPuzzleInput.scheduledDate)
        : undefined,
    };

    return this.prisma.puzzle.create({ data });
  }

  async findAll(
    query: PuzzleQueryInput,
  ): Promise<{ puzzles: Puzzle[]; total: number }> {
    const { page = 1, limit = 10, gameMode, difficulty } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PuzzleWhereInput = {
      ...(gameMode && { gameMode }),
      ...(difficulty && { difficulty }),
    };

    const [puzzles, total] = await Promise.all([
      this.prisma.puzzle.findMany({
        where,
        skip,
        take: limit,
        orderBy: { orderIndex: 'asc' },
      }),
      this.prisma.puzzle.count({ where }),
    ]);

    return { puzzles, total };
  }

  async findOne(id: string): Promise<Puzzle> {
    const puzzle = await this.prisma.puzzle.findUnique({
      where: { id },
    });

    if (!puzzle) {
      throw new NotFoundException(`Puzzle with ID "${id}" not found`);
    }

    return puzzle;
  }

  async findDailyPuzzle(): Promise<Puzzle | null> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return this.prisma.puzzle.findFirst({
      where: {
        gameMode: 'DAILY',
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }

  async update(
    id: string,
    updatePuzzleInput: UpdatePuzzleInput,
  ): Promise<Puzzle> {
    await this.findOne(id);

    const data: Prisma.PuzzleUpdateInput = {
      ...updatePuzzleInput,
      scheduledDate: updatePuzzleInput.scheduledDate
        ? new Date(updatePuzzleInput.scheduledDate)
        : undefined,
    };

    return this.prisma.puzzle.update({
      where: { id },
      data,
    });
  }

  async remove(id: string): Promise<Puzzle> {
    await this.findOne(id);

    return this.prisma.puzzle.delete({
      where: { id },
    });
  }
}
