# Add Server-Side Validation for Hints Used in Progress Submission

## Metadata
- **Ticket ID:** TICKET-020
- **Priority:** P2
- **Type:** bug
- **Area:** backend
- **Status:** open
- **Dependencies:** none

---

## Problem
When a player submits puzzle progress (`POST /api/progress`), the request body includes `hintsUsed` sent by the client. The backend stores this value without validation. A user can manipulate the request payload to claim they used 0 hints even if they requested 3, artificially inflating their score and polluting leaderboards.

Score formula: `base(100) - (25 * hintsUsed) + timeBonus` — claiming 0 hints = 75 extra points per puzzle.

---

## Why This Matters
Score integrity directly affects the leaderboard. Cheating by underreporting hints is trivially easy with browser DevTools or any HTTP client. This undermines the competitive fairness of the game.

---

## Evidence
- `backend/src/modules/progress/progress.service.ts` — `submitProgress()` accepts `hintsUsed` from request body with no validation
- `backend/src/modules/progress/dto/submit-progress.dto.ts` (or equivalent) — `hintsUsed: number` accepted as-is
- `frontend/src/config/constants.ts` — `HINTS_PER_PUZZLE: 3` defines the maximum

---

## Scope

### Minimum viable fix (this ticket):
Add a server-side bounds check in `ProgressService.submitProgress()`:
```typescript
const MAX_HINTS = 3; // Match GAME_CONFIG.HINTS_PER_PUZZLE
if (input.hintsUsed < 0 || input.hintsUsed > MAX_HINTS) {
  throw new BadRequestException(`hintsUsed must be between 0 and ${MAX_HINTS}`);
}
```

This prevents impossible values but does not prevent a user from claiming 0 hints when they used 3.

### Stronger fix (stretch goal for this ticket):
Track hint requests server-side. When a player calls the hints endpoint (or when hints are revealed), record the count server-side per user-puzzle session.

**Option A — In-memory session (simpler):**
In `ProgressService` or a new `HintSessionService`, maintain a per-user-per-puzzle hint counter in memory (Map). When `submitProgress` is called, compare `input.hintsUsed` with the server-tracked count. Accept the higher of the two (server-tracked count wins).

**Option B — Database tracking:**
Add a `hintsRequested Int @default(0)` field to `UserProgress`. Increment it via `POST /api/progress/hint/:puzzleId` endpoint. On submission, use the DB value instead of client-supplied value.

**Recommended for this ticket:** Implement Option A (in-memory) as a pragmatic improvement. Option B is the full solution but requires a schema migration — leave it for a future ticket.

---

## Out of Scope
- Redesigning the hint UI
- Score recalculation for historical data
- Option B (full DB tracking) — noted as future work

---

## Implementation Notes
- `HINTS_PER_PUZZLE` should be a shared constant in `packages/shared/src/constants/` to avoid magic numbers in the backend
- If the in-memory session is used, note that it does not survive server restarts — acceptable for the current scope
- The score calculation currently happens on the frontend and is submitted. Consider: should the backend recalculate score from `hintsUsed`? This would fully prevent score manipulation. The backend has all needed data (puzzle completion time is submitted too). Recalculation is the most secure approach — add it here if in scope.

---

## Acceptance Criteria
- [ ] `POST /api/progress` with `hintsUsed: -1` returns 400
- [ ] `POST /api/progress` with `hintsUsed: 10` (above max) returns 400
- [ ] `POST /api/progress` with `hintsUsed: 2` (valid) succeeds
- [ ] (Stretch) Server-tracked hint count overrides client-supplied value when it's higher

---

## Testing Requirements
- **Unit test `ProgressService.submitProgress()`:** Test with `hintsUsed: -1`, `4`, `0`, `3` — verify correct behavior
- **Integration test:** Submit progress with invalid `hintsUsed` → verify 400 response

---

## Affected Areas
- `backend/src/modules/progress/progress.service.ts`
- `packages/shared/src/constants/` (add `MAX_HINTS_PER_PUZZLE`)

---

## Risks / Edge Cases
- The frontend currently sends `hintsUsed` from `useGameStore`. If the game allows fewer than 3 hints (e.g., for easier puzzles), the max should be per-puzzle — not a global constant. For now, assume all puzzles allow up to 3 hints.

---

## Open Questions
- Should the backend fully recalculate the score (ignoring client-supplied score entirely)? This would completely eliminate score manipulation. The data needed is: `hintsUsed`, `timeSpent`, `completed`. If yes, remove `score` from the submission DTO.
