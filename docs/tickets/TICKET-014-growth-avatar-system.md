# Implement Growth Avatar Stage Progression Logic

## Metadata
- **Ticket ID:** TICKET-014
- **Priority:** P2
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** done
- **Dependencies:** none

---

## Problem
The `User` Prisma model already had `growthPoints` and `growthStage` fields, and the frontend already had a `GrowthAvatar` component. However, the backend never updated those fields, so the avatar system was effectively inert.

The profile page was compensating with a client-side workaround derived from `totalScore`, which meant:
1. `User.growthPoints` stayed unused in the database
2. `User.growthStage` stayed unused in the database
3. The frontend display did not reflect a real persisted growth mechanic

---

## Why This Matters
The growth avatar is presented as a PRO feature. If the backend never progresses the avatar and the frontend only guesses at a stage from total score, the feature does not deliver the progression loop it promises.

---

## Evidence
- `backend/prisma/schema.prisma` already contained:
  - `growthPoints Int @default(0)`
  - `growthStage Int @default(1)`
- `backend/src/modules/progress/progress.service.ts` did not award growth points on completion
- `frontend/src/app/(main)/profile/page.tsx` was deriving growth from `totalScore` instead of persisted growth fields

---

## Scope
1. Add canonical backend growth progression logic
2. Award growth points from puzzle completion flow
3. Expose `growthPoints` and `growthStage` in auth/profile/stats responses
4. Replace the profile-page workaround with real persisted data
5. Add a dashboard growth summary

---

## Out of Scope
- Redesigning the avatar visuals
- Backfilling historical growth for existing users
- Changing the PRO entitlement for the growth avatar

---

## Implementation Notes
- `backend/prisma/schema.prisma` already had the required growth fields, so no Prisma migration was needed.
- Added a canonical backend implementation in `UsersService.updateGrowth()` using:
  - `GROWTH_THRESHOLDS = [0, 50, 100, 250, 500, 1000]`
  - max `growthPoints = 1000`
  - max `growthStage = 5`
- `updateGrowth()` now:
  - reads the current persisted growth total
  - adds new points
  - caps the result at `1000`
  - recalculates the stage from the highest crossed threshold
  - updates `growthPoints` and `growthStage` in one Prisma update
- `ProgressService.updateUserStats()` now calls `usersService.updateGrowth()` after qualifying completions.
- Correction to the original ticket wording:
  - the actual repo difficulty enum is `BEGINNER`, `INTERMEDIATE`, `ADVANCED`, `MASTER`
  - implemented growth awards:
    - `BEGINNER = 10`
    - `INTERMEDIATE = 20`
    - `ADVANCED = 30`
    - `MASTER = 30`
    - missing difficulty defaults to `10`
- Added `growthPoints` and `growthStage` to:
  - auth responses
  - JWT user hydration
  - user profile responses
  - user stats responses
- The profile page now uses persisted growth fields and shows:
  - stage number
  - stage label
  - progress toward the next threshold
- The dashboard now shows a compact growth summary with stage label and points.
- `resetProgress()` now resets growth back to stage `1` and `0` points to keep a full progress reset internally consistent.

---

## Acceptance Criteria
- [x] `User.growthPoints` is updated in the database when a puzzle is completed
- [x] `User.growthStage` advances automatically when `growthPoints` crosses a threshold
- [x] `GET /api/auth/me` response includes `growthPoints` and `growthStage`
- [x] Profile page uses `user.growthPoints` and `user.growthStage` instead of the `totalScore` workaround
- [x] Completing 5 puzzles advances the avatar from stage 1 to stage 2
  - Verified by the `50`-point stage-2 threshold and automated tests using `BEGINNER = 10`

---

## Testing Requirements
- **Automated coverage added:**
  1. `UsersService.updateGrowth()` verifies missing-user handling, first-threshold promotion, later-threshold promotion, and max-cap behavior
  2. `ProgressService.updateUserStats()` verifies difficulty-based growth awards, default fallback, no duplicate growth on already-completed progress, and reset behavior
- **Manual QA recommended:**
  1. Complete a puzzle and verify profile growth points/stage update
  2. Refresh and confirm dashboard/profile stay in sync

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `packages/shared/src/schemas/user.schema.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/lib/growth.ts`
- `frontend/src/components/zen/growth-avatar.tsx`
- `frontend/src/app/(main)/profile/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`

---

## Risks / Edge Cases
- Existing users are not backfilled from historic completions; growth continues from whatever persisted values they already have.
- The frontend depends on refreshed auth/profile data for the new growth values to appear immediately after completion.

---

## Open Questions
None.

---

## Files Changed
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `packages/shared/src/schemas/user.schema.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/lib/growth.ts`
- `frontend/src/components/zen/growth-avatar.tsx`
- `frontend/src/app/(main)/profile/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`
- `docs/tickets/TICKET-014-growth-avatar-system.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npx eslint -- "src/modules/users/users.service.ts" "src/modules/progress/progress.service.ts" "src/modules/users/users.service.spec.ts" "src/modules/progress/progress.service.spec.ts" "src/modules/auth/auth.service.ts" "src/modules/auth/jwt.strategy.ts"`
- `backend`: `npm run test`
- `backend`: `npx eslint -- "src/modules/users/users.service.spec.ts"`
- `backend`: `npm run test -- users.service.spec.ts`
- `backend`: `npm run build`
- `packages/shared`: `npm run build`
- `frontend`: `npx eslint -- "src/types/api.types.ts" "src/lib/growth.ts" "src/components/zen/growth-avatar.tsx" "src/app/(main)/profile/page.tsx" "src/app/(main)/dashboard/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- `backend` tests pass, but the existing battle gateway specs still emit their long-standing mocked error logs and Jest worker shutdown warning unrelated to this ticket.
- Manual browser QA was not run in this terminal session.
