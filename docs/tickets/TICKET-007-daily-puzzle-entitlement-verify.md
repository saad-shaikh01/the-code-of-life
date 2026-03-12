# Verify Daily Puzzle Fallback + Fix 403 vs No-Data Handling in Hook

## Metadata
- **Ticket ID:** TICKET-007
- **Priority:** P1
- **Type:** bug
- **Area:** multi-area
- **Status:** open
- **Dependencies:** none

---

## Problem
Two related issues exist in the daily puzzle flow:

**Issue 1 — Unverified fallback behavior (backend):**
`puzzles.service.ts` has a `findDailyPuzzle()` method that first tries to find a puzzle scheduled for today's date, then falls back to a deterministic day-of-year modulo selection. The seed only schedules 5 puzzles for specific future dates (the "next 5 days" from when seed was last run). If the deterministic fallback has a bug or returns `null` in an edge case, PRO subscribers will see "No daily puzzle available today" even though the feature is supposed to always provide a puzzle.

**Issue 2 — 403 vs null not distinguished in frontend hook (frontend):**
The backend returns HTTP 403 (via `SubscriptionGuard`) for free users hitting `GET /api/puzzles/daily`. The `useDailyPuzzle()` hook likely catches this as a generic error or treats it the same as a `null` response. While the `LockedOverlay` on the `/daily` page is gated on `isPro` (correct), the 403 error may still log as an unhandled/unexpected error in the browser console, creating noise and potentially triggering error monitoring alerts.

---

## Why This Matters
**Issue 1:** PRO users paying for daily puzzles could find the feature broken after the initially seeded 5 dates pass. The fallback is the safety net — it must be verified to always return a puzzle.

**Issue 2:** Console errors create noise, confuse developers, and may cause false-positive alerts in error tracking tools. Free users hitting a protected endpoint should produce a clean, silent response in the hook.

---

## Evidence
- `backend/src/modules/puzzles/puzzles.service.ts` — `findDailyPuzzle()` method (read and audit this)
- `backend/prisma/seed.ts` — seeds 5 daily puzzles with `scheduledDate` = next 5 days from seed time
- `frontend/src/hooks/useDailyPuzzle.ts` — read to confirm how 403 is handled
- `frontend/src/app/(main)/daily/page.tsx:18` — calls `useDailyPuzzle()` unconditionally
- `frontend/src/app/(main)/daily/page.tsx:126` — `LockedOverlay isLocked={!isPro}` (correct paywall gate)

---

## Scope

**Step 1 — Audit backend `findDailyPuzzle()`:**
- Read `puzzles.service.ts` `findDailyPuzzle()` implementation
- Verify the deterministic fallback: confirm it uses `dayOfYear % totalDailyPuzzles` and always returns a puzzle (assuming at least 1 daily puzzle exists in DB)
- If the fallback returns `null` (e.g., when `totalDailyPuzzles === 0`), add a guard and a clear error message
- If the fallback is correct, document it as verified — no code change needed

**Step 2 — Fix `useDailyPuzzle` hook for 403:**
Read `frontend/src/hooks/useDailyPuzzle.ts`. If it uses React Query's `useQuery`, check how errors are handled. Add a `retry: false` option and a custom `onError` that silently ignores 403 responses for free users:

```typescript
export function useDailyPuzzle() {
  const { isPro } = useSubscriptionStatus();
  return useQuery({
    queryKey: ['daily-puzzle'],
    queryFn: () => puzzlesService.getDailyPuzzle(),
    enabled: isPro,  // Don't even call the API if user isn't PRO
    retry: false,
    staleTime: 5 * 60 * 1000,
  });
}
```

The key fix: `enabled: isPro` — if the user is not PRO, the query never fires. No 403, no console error.

---

## Out of Scope
- Redesigning the paywall UI (already implemented correctly)
- Changing the dashboard daily puzzle card (already shows correct upgrade CTA)
- Seeding more daily puzzles (not this ticket's concern)

---

## Implementation Notes
- The `enabled` option in React Query prevents the query from running — this is the correct pattern for conditional queries
- `useSubscriptionStatus()` returns `isLoading` while subscription data is fetching — use `enabled: isPro && !subscriptionLoading` to avoid a brief window where the query fires before subscription is known
- If backend fallback needs fixing, ensure `findDailyPuzzle()` always returns a puzzle when the DB has at least one `DAILY` mode puzzle — add a final fallback to `findFirst({ where: { gameMode: 'DAILY' } })` if the modulo selection fails

---

## Acceptance Criteria
- [ ] Backend `findDailyPuzzle()` code has been read and its fallback behavior is documented in this ticket (update Evidence section)
- [ ] If fallback was broken, it is now fixed and always returns a puzzle when daily puzzles exist in DB
- [ ] `useDailyPuzzle()` hook does not fire API call for free-tier users
- [ ] No 403 errors appear in browser console for free users on the `/daily` page
- [ ] PRO users always see a puzzle (or an accurate "no puzzle scheduled" message if DB is empty)

---

## Testing Requirements
- **Manual QA — free user:** Navigate to `/daily` → verify no 403 in console, verify LockedOverlay shown
- **Manual QA — PRO user:** Navigate to `/daily` → verify puzzle loads correctly
- **Backend unit test:** Mock `puzzleRepository.findFirst` returning null for scheduled date → verify fallback fires → verify a puzzle is returned

---

## Affected Areas
- `backend/src/modules/puzzles/puzzles.service.ts`
- `frontend/src/hooks/useDailyPuzzle.ts`

---

## Risks / Edge Cases
- If DB has 0 daily puzzles (e.g., after a reset), even the fallback fails — handle with a meaningful error, not a 500
- `subscriptionLoading` is true briefly on page load — avoid firing the query during that window

---

## Open Questions
None — verify-first approach avoids assumptions.
