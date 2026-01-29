import { z } from 'zod';

export const puzzleSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  code: z.string(),
});
