# Add Server-Side Validation for Hints Used in Progress Submission

## Metadata
- **Ticket ID:** TICKET-020
- **Priority:** P2
- **Type:** bug
- **Area:** backend
- **Status:** done
- **Dependencies:** none

---

## Problem
When a player submits puzzle progress (`POST /api/progress`), the request body includes `hintsUsed` sent by the client. The backend previously accepted and stored that value without enforcing an upper bound, so a manipulated client could submit impossible values that would pollute progress records and score-related behavior.

This ticket's minimum viable fix is to ensure `hintsUsed` is a plausible integer in the `0..3` range on the server.

---

## Why This Matters
Score integrity affects competitive fairness and leaderboard trust. Even without full server-side hint tracking, the backend must reject impossible values instead of trusting the client blindly.

---

## Evidence
- `backend/src/modules/progress/progress.service.ts` previously accepted `input.hintsUsed` without server-side bounds validation
- `packages/shared/src/schemas/progress.schema.ts` previously required `hintsUsed >= 0` but did not cap the maximum
- `frontend/src/config/constants.ts` already defined the gameplay maximum as `3`, but the backend had no shared equivalent

---

## Scope
1. Add a shared `HINTS_PER_PUZZLE = 3` constant for server-side use
2. Enforce `hintsUsed` schema validation with `z.number().int().min(0).max(3)`
3. Add a backend guard in `ProgressService.submitProgress()` so invalid values still fail if the service is called outside the controller pipe
4. Keep existing score calculation behavior unchanged

---

## Out of Scope
- Full server-side hint tracking
- Score recalculation from trusted server-side inputs
- Frontend hint UI changes

---

## Implementation Notes
- Added `HINTS_PER_PUZZLE` in `packages/shared/src/constants.ts` and exported it from the shared package root.
- Updated `submitProgressSchema` in `packages/shared/src/schemas/progress.schema.ts` to validate:
  - integer only
  - minimum `0`
  - maximum `HINTS_PER_PUZZLE`
- Added a defensive backend guard in `ProgressService.submitProgress()` that throws:
  - `BadRequestException('hintsUsed must be an integer')`
  - `BadRequestException('hintsUsed cannot be negative')`
  - `BadRequestException('hintsUsed cannot exceed 3')`
- Kept the existing score and progress update behavior unchanged after validation, per ticket scope.
- Scope correction:
  - the older ticket draft mentioned a stretch goal for server-tracked hint sessions
  - the implementation prompt explicitly limited this ticket to plausible integer `0..3` validation
  - no in-memory or database hint tracking was added here

---

## Acceptance Criteria
- [x] `POST /api/progress` with `hintsUsed: -1` returns 400
- [x] `POST /api/progress` with `hintsUsed: 10` (above max) returns 400
- [x] `POST /api/progress` with `hintsUsed: 2` (valid) succeeds
- [x] Stretch goal intentionally deferred: no server-tracked hint session override was added in this ticket

---

## Testing Requirements
- **Automated coverage added:**
  1. `ProgressService.submitProgress()` rejects `-1`, `4`, and `1.5`, and still accepts valid values
  2. shared `submitProgressSchema` rejects invalid `hintsUsed` values before the request reaches the service
- **Manual QA recommended:**
  1. Submit progress with `hintsUsed` values outside `0..3` and verify the API responds with `400`
  2. Submit valid progress and verify existing scoring/progress flows still work

---

## Affected Areas
- `packages/shared/src/constants.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/progress.schema.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/progress/schemas/progress.schema.spec.ts`

---

## Risks / Edge Cases
- This prevents impossible values but does not stop a user from underreporting a plausible `0..3` hint count. Full server-tracked hint integrity remains future work.
- The backend still trusts the submitted `score`; this ticket deliberately did not recalculate score server-side.

---

## Open Questions
- Should a future ticket move score calculation fully server-side so `score` is no longer client-authoritative?

---

## Files Changed
- `packages/shared/src/constants.ts`
- `packages/shared/src/index.ts`
- `packages/shared/src/schemas/progress.schema.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/progress/schemas/progress.schema.spec.ts`
- `docs/tickets/TICKET-020-hints-server-validation.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `packages/shared`: `npm run build`
- `repo root`: `npx eslint -c backend/eslint.config.mjs "packages/shared/src/constants.ts" "packages/shared/src/index.ts" "packages/shared/src/schemas/progress.schema.ts"`
- `backend`: `npx eslint -- "src/modules/progress/progress.service.ts" "src/modules/progress/progress.service.spec.ts" "src/modules/progress/schemas/progress.schema.spec.ts"`
- `backend`: `npm run test -- progress.service.spec.ts progress.schema.spec.ts --runInBand`
- `backend`: `npm run test -- --runInBand`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- The full backend test suite still emits the existing mocked `BattleGateway` error logs during passing tests; that pre-existing harness behavior is unrelated to this ticket.
- No frontend changes were made.
