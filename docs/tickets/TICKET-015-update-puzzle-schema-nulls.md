# Fix updatePuzzleSchema to Allow Null on Nullable Fields

## Metadata
- **Ticket ID:** TICKET-015
- **Priority:** P2
- **Type:** bug
- **Area:** shared
- **Status:** open
- **Dependencies:** none

---

## Problem
`updatePuzzleSchema` in `packages/shared/src/schemas/puzzle.schema.ts` is defined as `createPuzzleSchema.partial()`. This makes all fields optional but does NOT allow `null` values for nullable fields.

When a `null` value is passed to update a puzzle (e.g., to clear `bookChapter` back to null), the `ZodValidationPipe` in NestJS converts it to `undefined`. Since `undefined` means "not provided" in a PATCH request, the field is never cleared — the existing value stays in the database.

This means fields like `bookChapter`, `bookSection`, `bookPageRef`, `scheduledDate`, and `hints` cannot be cleared once set.

---

## Why This Matters
Content management: if a puzzle's `bookChapter` was set incorrectly and needs to be cleared, there is no way to do it via the API. This affects any admin tool or script that manages puzzle content.

---

## Evidence
- `packages/shared/src/schemas/puzzle.schema.ts` — `updatePuzzleSchema = createPuzzleSchema.partial()`
- `backend_issues.md` — documents this issue with the exact fix
- Prisma `Puzzle` model: `bookChapter Int?`, `bookSection String?`, `bookPageRef String?`, `scheduledDate DateTime?`, `hints String[]` (nullable array)

---

## Scope
Replace `updatePuzzleSchema` with an explicit definition that includes `.nullable().optional()` on nullable fields.

The exact fix (from `backend_issues.md`) — replace the current `updatePuzzleSchema` export with:

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

---

## Out of Scope
- Changes to `createPuzzleSchema`
- Backend controller or service changes (schema validation is shared)
- Frontend puzzle editing UI

---

## Implementation Notes
- This is a one-file change in `packages/shared/`
- After the change, run `npm run build` in the `packages/shared` workspace to verify no TypeScript errors
- The backend `PuzzlesService.updatePuzzle()` should already handle `null` values correctly via Prisma (Prisma treats `null` as "set to null" in an update) — verify this is the case, no backend changes should be needed

---

## Acceptance Criteria
- [ ] `PATCH /api/puzzles/:id` with `{ "bookChapter": null }` successfully sets `bookChapter` to null in the database
- [ ] `PATCH /api/puzzles/:id` with `{ "scheduledDate": null }` clears the scheduled date
- [ ] `PATCH /api/puzzles/:id` with `{ "hints": null }` clears the hints array
- [ ] Required fields (title, encryptedPattern, originalReflection) still cannot be set to null
- [ ] `npm run build` passes in `packages/shared`

---

## Testing Requirements
- **Integration test:** `PATCH /api/puzzles/:id` with each nullable field set to `null` — verify DB stores null
- **Unit test (optional):** Parse `updatePuzzleSchema` with `{ bookChapter: null }` — verify it passes validation

---

## Affected Areas
- `packages/shared/src/schemas/puzzle.schema.ts`

---

## Risks / Edge Cases
- If any existing code passes `null` for non-nullable fields, this schema change will correctly reject it — that's the desired behavior
- The `.nullable().optional()` combination means the field can be: missing (undefined, no change), present as a value, or explicitly `null` (clear it) — this is the correct semantic for a PATCH endpoint

---

## Open Questions
None — the fix is fully specified in `backend_issues.md`.
