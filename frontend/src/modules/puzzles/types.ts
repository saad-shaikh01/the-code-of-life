import { z } from 'zod';
import { puzzleSchema } from '@shared/schemas';

export type Puzzle = z.infer<typeof puzzleSchema>;
