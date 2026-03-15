# Fix updatePuzzleSchema to Allow Null on Nullable Fields

## Metadata
- **Ticket ID:** TICKET-015
- **Priority:** P2
- **Type:** bug
- **Area:** shared
- **Status:** done
- **Dependencies:** none

---

## Problem
`updatePuzzleSchema` in `packages/shared/src/schemas/puzzle.schema.ts` was defined as `createPuzzleSchema.partial()`. That made every field optional, but it did not allow explicit `null` values for nullable Prisma fields.

As a result, PATCH requests could omit fields, but they could not intentionally clear nullable values such as `bookChapter`, `bookSection`, `bookPageRef`, or `scheduledDate`.

---

## Why This Matters
Puzzle content management needs true PATCH semantics:
- field omitted: leave existing value unchanged
- field provided with a value: update it
- field provided as `null`: clear it when the Prisma field is nullable

Without that distinction, admins cannot remove incorrect book metadata or scheduled dates once they have been set.

---

## Evidence
- `packages/shared/src/schemas/puzzle.schema.ts` previously exported `updatePuzzleSchema = createPuzzleSchema.partial()`
- `backend_issues.md` documented the shared-schema side of the bug
- `backend/src/modules/puzzles/puzzles.service.ts` also needed one correction: `scheduledDate: null` was being rewritten to `undefined`, so the clear operation was lost before reaching Prisma
- Prisma `Puzzle` model nullable fields are:
  - `bookChapter Int?`
  - `bookSection String?`
  - `bookPageRef String?`
  - `scheduledDate DateTime?`

---

## Scope
1. Replace the derived update schema with an explicit schema
2. Mark only the truly nullable Prisma fields as `.nullable().optional()`
3. Preserve non-nullable fields as optional but not nullable
4. Ensure `scheduledDate: null` survives the service layer and reaches Prisma as `null`

---

## Out of Scope
- Changes to `createPuzzleSchema`
- Prisma schema changes
- Frontend admin editing UI

---

## Implementation Notes
- Replaced `createPuzzleSchema.partial()` with an explicit `updatePuzzleSchema`.
- Applied `.nullable().optional()` only to Prisma-nullable fields:
  - `bookChapter`
  - `bookSection`
  - `bookPageRef`
  - `scheduledDate`
- Kept required-on-create fields optional but non-nullable on update:
  - `title`
  - `encryptedPattern`
  - `originalReflection`
  - `gameMode`
  - `difficulty`
  - `orderIndex`
- Correction to the original ticket text:
  - `hints` is `String[] @default([])` in the current Prisma schema, not a nullable array
  - because of that, `hints` correctly remains optional but not nullable in `updatePuzzleSchema`
  - clearing hints continues to use an empty array `[]`, not `null`
- Minimal backend fix applied in `PuzzlesService.update()`:
  - `scheduledDate === null` now passes through as `null`
  - string dates are still converted to `Date`
  - `undefined` still means "no change"

---

## Acceptance Criteria
- [x] `PATCH /api/puzzles/:id` with `{ "bookChapter": null }` can clear `bookChapter`
- [x] `PATCH /api/puzzles/:id` with `{ "scheduledDate": null }` can clear `scheduledDate`
- [x] `PATCH /api/puzzles/:id` with `{ "bookSection": null }` can clear `bookSection`
- [x] `PATCH /api/puzzles/:id` with `{ "bookPageRef": null }` can clear `bookPageRef`
- [x] Required fields (`title`, `encryptedPattern`, `originalReflection`) still reject `null`
- [x] `hints` remains non-nullable because the Prisma field is not nullable
- [x] `npm run build` passes in `packages/shared`

---

## Testing Requirements
- **Automated coverage added:**
  1. `updatePuzzleSchema` accepts `null` for nullable fields and rejects `null` for non-nullable fields
  2. `PuzzlesService.update()` passes nullable fields through to Prisma and preserves `scheduledDate: null`
  3. `PuzzlesService.update()` still converts string `scheduledDate` values to `Date`

---

## Affected Areas
- `packages/shared/src/schemas/puzzle.schema.ts`
- `backend/src/modules/puzzles/puzzles.service.ts`
- `backend/src/modules/puzzles/puzzles.service.spec.ts`
- `backend/src/modules/puzzles/schemas/puzzle.schema.spec.ts`

---

## Risks / Edge Cases
- Existing callers that incorrectly send `null` for non-nullable fields now fail validation, which is the intended behavior.
- `hints` cannot be cleared with `null` unless the Prisma model itself changes in a future ticket.

---

## Open Questions
None.

---

## Files Changed
- `packages/shared/src/schemas/puzzle.schema.ts`
- `backend/src/modules/puzzles/puzzles.service.ts`
- `backend/src/modules/puzzles/puzzles.service.spec.ts`
- `backend/src/modules/puzzles/schemas/puzzle.schema.spec.ts`
- `docs/tickets/TICKET-015-update-puzzle-schema-nulls.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `packages/shared`: `npm run build`
- `repo root`: `npx eslint -c backend/eslint.config.mjs "packages/shared/src/schemas/puzzle.schema.ts"`
- `backend`: `npx eslint -- "src/modules/puzzles/puzzles.service.ts" "src/modules/puzzles/puzzles.service.spec.ts" "src/modules/puzzles/schemas/puzzle.schema.spec.ts"`
- `backend`: `npm run test`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- `backend` tests pass, but the existing battle gateway specs still emit their long-standing mocked error logs and Jest worker shutdown warning unrelated to this ticket.
