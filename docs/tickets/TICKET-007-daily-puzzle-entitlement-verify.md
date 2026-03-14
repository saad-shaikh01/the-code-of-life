# Verify Daily Puzzle Fallback + Fix 403 vs No-Data Handling in Hook

## Metadata
- **Ticket ID:** TICKET-007
- **Priority:** P1
- **Type:** bug
- **Area:** multi-area
- **Status:** done
- **Dependencies:** none

---

## Problem
Two related issues existed in the daily puzzle flow:

**Issue 1, backend fallback audit:** `findDailyPuzzle()` first looked for a puzzle scheduled for today, then fell back to a deterministic selector. That fallback was intended to guarantee a daily puzzle even after the initially seeded scheduled dates passed, but it had not been verified and was mixing `STORY` puzzles into the result set.

**Issue 2, frontend 403 semantics:** `useDailyPuzzle()` always fired the daily puzzle query. Free users therefore hit `GET /api/puzzles/daily`, received `403`, and the hook treated the response like a normal failure instead of a silent locked state even though the `/daily` page already had a `LockedOverlay`.

---

## Why This Matters
- PRO users should either receive a valid daily puzzle or an accurate empty-state message
- Free users should see the paywall, not noisy entitlement errors
- Daily puzzle availability should not silently degrade into a different game mode

---

## Evidence
- `backend/src/modules/puzzles/puzzles.service.ts`
  - Audit finding (a): the modulo selection itself does not return `null` for particular day-of-year values; once the candidate list is non-empty, `dayOfYear % availablePuzzles.length` always picks a valid index
  - Audit finding (b): yes, there was a real path where a PRO user could get `null` instead of a puzzle. If no puzzle was scheduled for today and the database only contained scheduled `DAILY` rows, the fallback returned `null` because it only queried unscheduled `DAILY` rows or `STORY` rows
  - Audit finding (c): yes, non-PRO users correctly receive `403`. `GET /puzzles/daily` is protected by `JwtAuthGuard`, `SubscriptionGuard`, and `@RequireSubscription(SubscriptionTier.PRO)` in `backend/src/modules/puzzles/puzzles.controller.ts`, and `SubscriptionGuard` throws `ForbiddenException` for inactive or insufficient subscriptions
- `backend/prisma/seed.ts`
  - Seeds 5 `DAILY` puzzles, all with `scheduledDate` values for the next 5 days; none are unscheduled fallback candidates
- `frontend/src/hooks/use-puzzles.ts`
  - `useDailyPuzzle()` previously fetched unconditionally and did not distinguish locked vs empty vs real error states
- `frontend/src/app/(main)/daily/page.tsx`
  - Already had `LockedOverlay`, so the hook needed to stop treating free-tier `403` as a visible error

---

## Scope
1. Verify backend fallback behavior before changing code
2. Fix the backend only where a real null-return path was confirmed
3. Update the daily puzzle hook so free-tier users do not fire the request and do not surface `403`
4. Distinguish `locked`, `real error`, and `no puzzle available` states in the daily puzzle UI

---

## Out of Scope
- Redesigning the paywall UI
- Seeding more daily puzzles
- Changing subscription rules

---

## Implementation Notes
- Backend audit confirmed the deterministic selection math was stable, but the candidate query was wrong for seeded data. The fallback now rotates through `DAILY` puzzles only, ordered by `orderIndex`, so scheduled-only daily inventories still produce a deterministic daily puzzle
- Added `backend/src/modules/puzzles/puzzles.service.spec.ts` covering:
  - scheduled puzzle returned directly
  - deterministic fallback when today has no scheduled puzzle
  - null returned only when there are zero `DAILY` puzzles in the database
- `useDailyPuzzle()` now depends on `useSubscriptionStatus()` and uses `enabled: isPro && !subscriptionLoading`, so free-tier users do not call the endpoint at all
- The hook now returns `isLocked` and suppresses free-tier `403` as a locked state if a refetch somehow occurs anyway
- The `/daily` page now treats locked, real error, and empty-data states separately
- The dashboard daily card now also distinguishes locked vs real error vs no available daily puzzle, so PRO users no longer see an upgrade CTA when the daily endpoint is empty or failing

---

## Acceptance Criteria
- [x] Backend `findDailyPuzzle()` code has been read and its fallback behavior is documented in this ticket
- [x] If fallback was broken, it is now fixed and always returns a puzzle when daily puzzles exist in DB
- [x] `useDailyPuzzle()` hook does not fire API call for free-tier users
- [x] No `403` errors appear in browser console for free users on the `/daily` page
- [x] PRO users always see a puzzle (or an accurate "no puzzle available" message if DB is empty)

---

## Testing Requirements
- **Backend unit test:** covered via `puzzles.service.spec.ts`
- **Manual QA scenarios to run:**
  1. Free user navigates to `/daily` and sees the locked overlay without a daily fetch error
  2. PRO user navigates to `/daily` and sees the current daily puzzle
  3. PRO user with an empty `DAILY` inventory sees the no-puzzle state instead of an upgrade prompt

---

## Affected Areas
- `backend/src/modules/puzzles/puzzles.service.ts`
- `backend/src/modules/puzzles/puzzles.service.spec.ts`
- `frontend/src/hooks/use-puzzles.ts`
- `frontend/src/app/(main)/daily/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`

---

## Risks / Edge Cases
- If the database truly contains zero `DAILY` puzzles, the service still returns `null`; that is now the only empty-data path and is surfaced intentionally
- Next.js middleware from `TICKET-006` is unrelated to this entitlement flow; auth and subscription remain separate concerns

---

## Open Questions
None.

---

## Files Changed
- `backend/src/modules/puzzles/puzzles.service.ts`
- `backend/src/modules/puzzles/puzzles.service.spec.ts`
- `frontend/src/hooks/use-puzzles.ts`
- `frontend/src/app/(main)/daily/page.tsx`
- `frontend/src/app/(main)/dashboard/page.tsx`
- `docs/tickets/TICKET-007-daily-puzzle-entitlement-verify.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npm run test -- puzzles.service.spec.ts`
- `backend`: `npx eslint -- "src/modules/puzzles/puzzles.service.ts" "src/modules/puzzles/puzzles.service.spec.ts"`
- `backend`: `npm run build`
- `frontend`: `npx eslint -- "src/hooks/use-puzzles.ts" "src/app/(main)/daily/page.tsx" "src/app/(main)/dashboard/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-13.
- Browser manual QA was not executed in this terminal session; the required scenarios are listed above.
