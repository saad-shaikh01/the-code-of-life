# Rewrite Cipher System from Unicode Symbols to Numerical Substitution (A=1…Z=26)

## Metadata
- **Ticket ID:** TICKET-001
- **Priority:** P0
- **Type:** mismatch
- **Area:** multi-area
- **Status:** open
- **Dependencies:** none — must be completed first; all other game-logic tickets depend on a correct cipher

---

## Problem
The entire encoder/decoder system uses arbitrary Unicode symbols (A→☀, B→☽, C→★, etc.) instead of the numerical substitution cipher specified by the source book (A=1, B=2 … Z=26, punctuation=27–37).

The mismatch is end-to-end:
1. `DecoderService.defaultSymbolMap` maps letters to Unicode characters.
2. `backend/prisma/seed.ts` encodes all 25 puzzle `encryptedPattern` values using those Unicode symbols.
3. Frontend components split `encryptedPattern` character-by-character using `split("")` — which breaks for any multi-character token (e.g., `"26"` becomes `["2","6"]`).

A player decoding a puzzle sees meaningless Unicode symbols and cannot interact with them correctly. The entire core game loop is broken relative to the product specification.

---

## Why This Matters
This is the most critical bug in the project. Every puzzle in the database is encoded with the wrong cipher. Every decode/encode API call produces wrong output. The frontend rendering logic fails on numbers > 9. No puzzle is currently solvable as intended.

---

## Evidence
- `backend/src/modules/puzzles/decoder.service.ts` — `defaultSymbolMap` uses Unicode chars
- `backend/prisma/seed.ts` — encodes 25 puzzles via the Unicode cipher
- `CURRENT_STATUS.md` line 15: "CRITICAL MISMATCH — Numerical Substitution vs Unicode Symbols"
- `CURRENT_STATUS.md` line 28–29: `[...string]` spread fails on multi-digit numbers
- Frontend puzzle render: any component calling `.split("")` on `encryptedPattern` produces wrong tokens for numeric encoding (e.g., `"1 2 26"` splits to `["1"," ","2"," ","2","6"]` instead of tokens `["1","2","26"]`)

---

## Scope
1. **Backend — `DecoderService`:**
   - Replace `defaultSymbolMap` with numerical mapping: `{ A: "1", B: "2", ..., Z: "26", " ": "27", ".": "28", ",": "29", "!": "30", "?": "31", "'": "32", "-": "33" }` (verify exact punctuation values against book PDF page 6)
   - Update `encode()` to join tokens with a space separator: `"HELLO"` → `"8 5 12 12 15"`
   - Update `decode()` to tokenize input by space: `"8 5 12 12 15".split(" ")` → map each token to letter
   - Reverse map must also work: `{ "1": "A", "2": "B", ..., "26": "Z" }`

2. **Database — `seed.ts`:**
   - Update local symbol map to match new service logic
   - Re-encode all `originalReflection` strings using new cipher
   - Truncate `UserProgress`, `Puzzle` tables before re-seeding (add `prisma.$executeRaw` truncation or `deleteMany` before seeding)
   - Verify all 25 puzzle `encryptedPattern` values are correct after re-seed

3. **Shared — `packages/shared/src/`:**
   - If a cipher map constant exists here, update it to match
   - Export a shared `CIPHER_MAP` type or constant if not already present

4. **Frontend — puzzle rendering:**
   - Find every component that calls `.split("")` on `encryptedPattern` or renders it char-by-char
   - Replace with space-tokenization: `encryptedPattern.split(" ")` to get an array of number-string tokens
   - Each token renders as a "cell" or "box" (stylized number display, not a Unicode glyph)

---

## Out of Scope
- The visual design of number cells (that's TICKET-012)
- Any battle mode changes
- Progress or score recalculation

---

## Implementation Notes
- Read `book.pdf` page 6 before writing the final map — confirm the exact punctuation assignments (27–37)
- The `encode()` function must produce space-separated output: `encode("AB Z") → "1 2 27 26"` (space=27 if that's the spec)
- The `decode()` function must `split(" ")` input and look up each token
- After updating `seed.ts`, run: `npx prisma db push --force-reset && npx ts-node prisma/seed.ts` (or the project's seed script) to rebuild the database
- Frontend cells should render via `puzzle.encryptedPattern.split(" ").map(token => <CipherCell key={token} value={token} />)`
- Check `frontend/src/app/(main)/puzzle/[id]/page.tsx` and `frontend/src/modules/puzzles/` for all render locations

---

## Acceptance Criteria
- [ ] `encode("A B Z")` returns `"1 2 26"` (space-separated)
- [ ] `decode("1 2 26")` returns `"A B Z"`
- [ ] All 25 seeded puzzles have numeric `encryptedPattern` values (no Unicode symbols in DB)
- [ ] Frontend splits `encryptedPattern` by space and renders each token as a distinct visual cell
- [ ] Puzzle solver accepts numeric space-separated input or letter input (verify which mode is intended)
- [ ] `POST /api/decoder/encode` and `POST /api/decoder/decode` return correct results
- [ ] `POST /api/decoder/validate` correctly validates a decoded answer
- [ ] No `.split("")` calls remain on `encryptedPattern` in frontend codebase

---

## Testing Requirements
- **Unit tests:** `DecoderService.encode()` and `DecoderService.decode()` with full alphabet + edge cases (empty string, punctuation, unknown chars)
- **Integration test:** `POST /api/decoder/encode` → take output → `POST /api/decoder/decode` → verify round-trip
- **Manual QA:** Open a story puzzle, verify the encrypted display shows numbers in cells, type the correct answer, verify validation passes
- **Regression:** Existing `validate` endpoint must still return `isCorrect: true` for correct answers after cipher change

---

## Affected Areas
- `backend/src/modules/puzzles/decoder.service.ts`
- `backend/prisma/seed.ts`
- `packages/shared/src/` (cipher map if present)
- `frontend/src/app/(main)/puzzle/[id]/page.tsx`
- Any frontend component that renders `encryptedPattern`
- `backend/src/modules/puzzles/puzzles.controller.ts` (decoder endpoints)

---

## Risks / Edge Cases
- Re-seeding deletes all existing `UserProgress` — acceptable in dev, must be coordinated in production
- Punctuation mapping must exactly match book spec; wrong values mean puzzles cannot be decoded
- The `validate` endpoint uses Levenshtein distance for similarity — ensure it still works with space-separated numeric strings
- If any puzzle `originalReflection` contains characters outside A-Z + defined punctuation, the encoder will produce unmapped tokens — log warnings

---

## Open Questions
- Does the book specify exact punctuation code assignments (27–37)? Read `book.pdf` page 6 before implementing.
- Should the puzzle solver accept the decoded text (letters) or the raw numbers? The product spec should clarify the intended player experience.
