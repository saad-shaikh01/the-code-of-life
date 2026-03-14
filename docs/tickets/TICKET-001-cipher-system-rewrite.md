# Rewrite Cipher System from Unicode Symbols to Numerical Substitution (A=1..Z=26)

## Metadata
- **Ticket ID:** TICKET-001
- **Priority:** P0
- **Type:** mismatch
- **Area:** multi-area
- **Status:** done
- **Dependencies:** none - must be completed first; all other game-logic tickets depend on a correct cipher

---

## Problem
The entire encoder/decoder system uses arbitrary Unicode symbols instead of the numerical substitution cipher specified by the source book.

The mismatch is end-to-end:
1. `DecoderService.defaultSymbolMap` mapped letters to placeholder Unicode characters.
2. `backend/prisma/seed.ts` encoded all 25 puzzle `encryptedPattern` values using that Unicode cipher.
3. Frontend components split `encryptedPattern` character-by-character with `split("")`, which breaks multi-character numeric tokens like `26`.

A player decoding a puzzle saw meaningless Unicode symbols and could not interact with them correctly. The core game loop was broken relative to the source material.

---

## Why This Matters
This is the most critical bug in the project. Every puzzle in the database was encoded with the wrong cipher. Every decode/encode API call produced the wrong output. The frontend rendering logic failed on numbers greater than 9. No puzzle was solvable as intended.

---

## Evidence
- `backend/src/modules/puzzles/decoder.service.ts` - placeholder Unicode map
- `backend/prisma/seed.ts` - seeded all 25 puzzles with the Unicode cipher
- `CURRENT_STATUS.md` line 15 - numerical substitution vs Unicode mismatch
- `CURRENT_STATUS.md` line 28-29 - character splitting fails on multi-digit numbers
- Frontend puzzle renderers split `encryptedPattern` character-by-character instead of tokenizing numeric cells

---

## Scope
1. **Backend - `DecoderService`:**
   - Replace the Unicode map with the book's page 6 numeric decoder bar
   - Support tokenized numeric encoding/decoding
   - Preserve word gaps in the serialized string so round-trip decode still returns readable text
   - Accept numeric attempts or decoded text in validation/similarity checks

2. **Database - `seed.ts`:**
   - Re-encode every `originalReflection` with the numeric cipher
   - Clear dependent `UserProgress` rows before re-seeding puzzles
   - Verify seeded `encryptedPattern` rows are numeric-only after reset/reseed

3. **Shared - `packages/shared/src/`:**
   - Export a shared `CIPHER_MAP` plus reusable tokenization/encode/decode helpers

4. **Frontend - puzzle rendering:**
   - Remove all `split("")` usage on `encryptedPattern`
   - Tokenize numeric patterns by spaces
   - Render each token as a distinct visual cell rather than a raw character stream

---

## Out of Scope
- The visual design of the reference/decoder panel (TICKET-012)
- Battle mode identification or socket fixes
- Progress or score recalculation

---

## Implementation Notes
- `book.pdf` page 6 was rendered and reviewed directly before implementation.
- The ticket's original `space = 27` assumption was incorrect. The book's legend is:
  - `0=*`
  - `1..26=A..Z`
  - `27=,`
  - `28=?`
  - `29=;`
  - `30=:`
  - `31='`
  - `32="`
  - `33=.`
  - `34=!`
  - `35=&`
  - `36=-`
  - `37=...`
- The book shows spaces as gaps between word groups, not as a numbered token. The app now serializes word gaps as double spaces between token groups so `decode()` can round-trip back to readable text.
- Added `packages/shared/src/cipher.ts` as the single source of truth for the cipher map and tokenization helpers.
- `DecoderService.validateAttempt()` and `calculateSimilarity()` now decode numeric-looking input before comparing against `originalReflection`, so the existing text-input solver accepts either letters or numeric attempts.
- `backend/prisma/seed.ts` now resets `UserProgress`, reseeds puzzles with the shared encoder, and verifies numeric-only `encryptedPattern` values after seeding.
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`, `frontend/src/app/(main)/dashboard/page.tsx`, `frontend/src/app/(main)/daily/page.tsx`, and `frontend/src/modules/puzzles/components/PuzzleCard.tsx` now render boxed numeric cells via shared tokenization helpers.

---

## Acceptance Criteria
- [x] `encode("A B Z")` returns `1  2  26` using the book-correct serialized word-gap format
- [x] `decode("1  2  26")` returns `A B Z`
- [x] All 25 seeded puzzles have numeric `encryptedPattern` values in the live database
- [x] Frontend tokenizes `encryptedPattern` by spaces and renders each token as a distinct visual cell
- [x] Puzzle solver accepts numeric space-separated input or decoded letter input
- [x] `POST /api/decoder/encode` and `POST /api/decoder/decode` return correct results
- [x] `POST /api/decoder/validate` correctly validates numeric or decoded answers
- [x] No `.split("")` calls remain on `encryptedPattern` in the frontend codebase

---

## Testing Requirements
- **Unit tests:** `DecoderService.encode()` and `DecoderService.decode()` now cover the full alphabet, punctuation, empty input, unknown characters, and numeric validation behavior.
- **Integration tests:** Added controller-level HTTP tests for `/api/decoder/encode`, `/api/decoder/decode`, and `/api/decoder/validate`.
- **Manual QA scenario:** Open a story puzzle, confirm boxed numeric cells render, submit the correct text answer, then submit the numeric answer and confirm both validate.
- **Regression:** Existing validate behavior remains true for correct answers after the cipher change.

---

## Affected Areas
- `packages/shared/src/cipher.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/decoder.schema.ts`
- `backend/src/modules/puzzles/decoder.service.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- `backend/src/modules/puzzles/index.ts`
- `backend/src/modules/puzzles/decoder.service.spec.ts`
- `backend/src/modules/puzzles/decoder.controller.spec.ts`
- `backend/prisma/seed.ts`
- `frontend/src/lib/cipher.ts`
- `frontend/src/modules/puzzles/components/CipherTokenCell.tsx`
- `frontend/src/modules/puzzles/components/PuzzleCard.tsx`
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`
- `frontend/src/app/(main)/daily/page.tsx`

---

## Risks / Edge Cases
- Re-seeding deletes all existing `UserProgress` rows in dev.
- The production migration still needs explicit planning because existing progress references old ciphertext.
- `frontend npm run lint` still fails on unrelated pre-existing files outside this ticket's scope.

---

## Open Questions
None. The punctuation map was resolved from `book.pdf` page 6, and the solver now accepts both intended input modes.

---

## Files Changed
- `packages/shared/src/cipher.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/decoder.schema.ts`
- `backend/src/modules/puzzles/decoder.service.ts`
- `backend/src/modules/puzzles/puzzles.controller.ts`
- `backend/src/modules/puzzles/index.ts`
- `backend/src/modules/puzzles/decoder.service.spec.ts`
- `backend/src/modules/puzzles/decoder.controller.spec.ts`
- `backend/prisma/seed.ts`
- `frontend/src/lib/cipher.ts`
- `frontend/src/modules/puzzles/components/CipherTokenCell.tsx`
- `frontend/src/modules/puzzles/components/PuzzleCard.tsx`
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`
- `frontend/src/app/(main)/daily/page.tsx`

---

## Validation Performed
- `packages/shared`: `npm run build`
- `backend`: `npm run test -- decoder.service.spec.ts decoder.controller.spec.ts`
- `backend`: `npm run test`
- `backend`: `npm run build`
- `backend`: `npx prisma db push --force-reset`
- `backend`: `npx prisma db seed`
- `backend`: direct Prisma verification query against the seeded database
  - Result: confirmed `25` puzzles and `0` non-numeric `encryptedPattern` values
- `frontend`: `npm run build`
- `frontend`: `npm run lint`
  - Result: failed on pre-existing unrelated lint errors in files such as `src/app/(main)/achievements/page.tsx`, `src/app/(main)/battle/page.tsx`, `src/app/(main)/pricing/page.tsx`, `src/components/zen/*`, `src/modules/theme/contexts/theme-provider.tsx`, and `tailwind.config.ts`
- `frontend`: `npx eslint -- "src/app/(main)/puzzle/[id]/page.tsx" "src/app/(main)/dashboard/page.tsx" "src/app/(main)/daily/page.tsx" "src/modules/puzzles/components/PuzzleCard.tsx" "src/modules/puzzles/components/CipherTokenCell.tsx" "src/lib/cipher.ts"`

---

## Follow-up Notes
- Completed: 2026-03-12. `npx prisma db push --force-reset` and `npx prisma db seed` succeeded against the updated database, and direct verification confirmed all 25 seeded puzzles use numeric `encryptedPattern` values.
