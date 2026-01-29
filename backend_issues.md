# Backend Issues

## `updatePuzzleSchema` does not handle `null` values correctly

The `updatePuzzleSchema` in `packages/shared/src/schemas/puzzle.schema.ts` is currently defined as `createPuzzleSchema.partial()`. This makes all fields optional, but it does not allow `null` values to be passed for optional fields.

When a `null` value is passed in a request to update a puzzle (e.g., to clear the `bookChapter` field), the `ZodValidationPipe` in the NestJS backend converts `null` to `undefined`. This prevents the field from being updated to `null` in the database.

### Proposed Solution

To fix this, the `updatePuzzleSchema` should be explicitly defined to allow `null` for fields that can be nullable.

```typescript
export const updatePuzzleSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be less than 200 characters')
    .optional(),

  encryptedPattern: z
    .string()
    .min(1, 'Encrypted pattern is required')
    .describe('The encrypted pattern using symbols, numbers, and punctuation')
    .optional(),

  originalReflection: z
    .string()
    .min(1, 'Original reflection is required')
    .describe('The decoded life lesson from the book')
    .optional(),

  gameMode: gameModeSchema.describe('Game mode for the puzzle').optional(),

  difficulty: difficultySchema.describe('Difficulty level of the puzzle').optional(),

  bookChapter: z
    .number()
    .int()
    .min(1, 'Book chapter must be at least 1')
    .nullable()
    .optional()
    .describe('Chapter number from the book'),

  bookSection: z
    .string()
    .max(100)
    .nullable()
    .optional()
    .describe('Section name within the chapter'),

  bookPageRef: z
    .string()
    .max(50)
    .nullable()
    .optional()
    .describe('Page reference in the book'),

  orderIndex: z
    .number()
    .int()
    .min(0)
    .describe('Order index for puzzle sequencing')
    .optional(),

  scheduledDate: z
    .string()
    .datetime({ offset: true })
    .or(z.string().date())
    .nullable()
    .optional()
    .describe('Scheduled date for DAILY mode puzzles'),

  hints: z
    .array(z.string().min(1))
    .nullable()
    .optional()
    .describe('Array of hints to help players'),
});
```
