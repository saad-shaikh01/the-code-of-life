import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma';
import { Puzzle, Prisma } from '@prisma/client';
import { CreatePuzzleInput, UpdatePuzzleInput } from './schemas/puzzle.schema';
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

    // Try to find a scheduled puzzle for today
    let puzzle = await this.prisma.puzzle.findFirst({
      where: {
        gameMode: 'DAILY',
        scheduledDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Fallback: If no scheduled puzzle, use deterministic selection
    if (!puzzle) {
      puzzle = await this.getDeterministicDailyPuzzle(today);
    }

    return puzzle;
  }

  /**
   * Fallback: Select a puzzle deterministically based on date.
   * This ensures the same DAILY puzzle is shown all day without needing scheduling.
   */
  private async getDeterministicDailyPuzzle(
    date: Date,
  ): Promise<Puzzle | null> {
    // Only rotate through DAILY puzzles so the entitlement always resolves to a daily challenge.
    const availablePuzzles = await this.prisma.puzzle.findMany({
      where: {
        gameMode: 'DAILY',
      },
      orderBy: { orderIndex: 'asc' },
    });

    if (availablePuzzles.length === 0) {
      return null;
    }

    // Use day of year to select puzzle deterministically
    const startOfYear = new Date(date.getFullYear(), 0, 0);
    const diff = date.getTime() - startOfYear.getTime();
    const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));

    const index = dayOfYear % availablePuzzles.length;
    return availablePuzzles[index];
  }

  async update(
    id: string,
    updatePuzzleInput: UpdatePuzzleInput,
  ): Promise<Puzzle> {
    await this.findOne(id);

    const scheduledDate =
      updatePuzzleInput.scheduledDate === undefined
        ? undefined
        : updatePuzzleInput.scheduledDate === null
          ? null
          : new Date(updatePuzzleInput.scheduledDate);

    const data: Prisma.PuzzleUpdateInput = {
      ...updatePuzzleInput,
      scheduledDate,
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
