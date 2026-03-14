# Unify Streak Logic Into Single Canonical Implementation

## Metadata
- **Ticket ID:** TICKET-005
- **Priority:** P1
- **Type:** bug
- **Area:** backend
- **Status:** done
- **Dependencies:** TICKET-004 (streak product rules must be defined first)

---

## Problem
Streak logic is implemented in two separate places with different algorithms:

1. **`users.service.ts` — `updateStreak()`:** Uses calendar-day comparison (correct approach for "did user play today?")
2. **`progress.service.ts` — `updateUserStats()`:** Uses a 24-hour rolling window (`Date.now() - lastPlayedAt < 86400000`)

These two methods are both called during normal gameplay, meaning a user's streak can be updated by either path and produce different results. For example:
- User plays at 11pm Monday, then again at 1am Wednesday
- Calendar-day check: streak resets (missed Tuesday)
- 24h rolling check: streak increments (only 26 hours apart)

Over time, the two `streakDays` values would diverge.

---

## Why This Matters
The streak is a visible game metric on the dashboard, leaderboard, and profile. Inconsistent calculations mean users cannot trust the number shown. It could also cause unfair leaderboard rankings in the streak category.

---

## Evidence
- `backend/src/modules/users/users.service.ts` — `updateStreak()` method with calendar-day logic
- `backend/src/modules/progress/progress.service.ts` — `updateUserStats()` with `< 24 * 60 * 60 * 1000` check
- Both methods update `User.streakDays` and `User.lastPlayedAt`
- `User` Prisma model: `streakDays Int @default(0)`, `lastPlayedAt DateTime?`

---

## Scope
1. **Delete `updateStreak()` from `users.service.ts`** (or keep as a thin wrapper)
2. **Move the canonical streak logic to `users.service.ts`** implementing the rules from TICKET-004 (recommended: calendar-day UTC comparison)
3. **Update `progress.service.ts`** to call `usersService.updateStreak(userId)` instead of its own inline logic
4. **Ensure `updateStreak()` is the single source of truth** — no other place in the codebase should modify `streakDays` directly

The canonical implementation (using TICKET-004 rules):
```typescript
// users.service.ts
async updateStreak(userId: string): Promise<void> {
  const user = await this.prisma.user.findUnique({ where: { id: userId } });
  const now = new Date();
  const today = new Date(now.toDateString()); // UTC calendar day

  if (!user.lastPlayedAt) {
    // First play
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakDays: 1, lastPlayedAt: now },
    });
    return;
  }

  const lastPlayed = new Date(user.lastPlayedAt.toDateString());
  const dayDiff = Math.floor((today.getTime() - lastPlayed.getTime()) / 86400000);

  if (dayDiff === 0) {
    // Same day — update lastPlayedAt but don't change streak
    await this.prisma.user.update({ where: { id: userId }, data: { lastPlayedAt: now } });
  } else if (dayDiff === 1) {
    // Consecutive day — increment
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakDays: { increment: 1 }, lastPlayedAt: now },
    });
  } else {
    // Missed day(s) — reset
    await this.prisma.user.update({
      where: { id: userId },
      data: { streakDays: 1, lastPlayedAt: now },
    });
  }
}
```

---

## Out of Scope
- Frontend streak display changes
- Streak leaderboard changes
- Adding streak shields or grace periods (unless TICKET-004 specifies them)

---

## Implementation Notes
- Removed the `AuthService.login()` write to `lastPlayedAt`. Login is not a qualifying completion and must not influence streak calculations.
- `UsersService.updateStreak()` is now the canonical UTC-based implementation:
  - compares UTC calendar dates via `getUTCFullYear()/getUTCMonth()/getUTCDate()`
  - keeps same-day completions idempotent while still updating `lastPlayedAt` to the latest completion time
  - increments on the next UTC day
  - resets to `1` after a gap of 2 or more UTC calendar days
- `ProgressService.updateUserStats()` no longer calculates streaks. It updates score/level, then delegates streak handling to `usersService.updateStreak(userId)`.
- `ProgressModule` now imports `UsersModule` so Nest can inject `UsersService`.
- Verified by code search that `lastPlayedAt` is now only written in `UsersService.updateStreak()` within application code.

---

## Acceptance Criteria
- [x] Only one streak calculation function exists in the entire backend codebase
- [x] `progress.service.ts` calls `usersService.updateStreak()` instead of inline logic
- [x] Streak increments correctly when consecutive days are played
- [x] Streak resets to 1 (not 0) when a day is missed
- [x] Playing multiple puzzles in one day only increments streak once

---

## Testing Requirements
- **Unit tests for `updateStreak()`:**
  - Same day: streak unchanged, `lastPlayedAt` updated
  - Consecutive day: streak + 1
  - Gap of 2 days: streak resets to 1
  - First ever play (null `lastPlayedAt`): streak = 1
- **Integration test:** Submit progress via `POST /api/progress` twice on same day — streak should be 1, not 2

---

## Affected Areas
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.module.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/progress/progress.streak.integration.spec.ts`

---

## Risks / Edge Cases
- Circular dependency between UsersModule and ProgressModule — resolve by extracting streak logic to a shared utility if needed
- Timezone: using `toDateString()` in Node.js uses the server's local timezone, not UTC — use explicit UTC calculation instead

---

## Open Questions
None after TICKET-004 is resolved.

---

## Files Changed
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/users/users.service.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.ts`
- `backend/src/modules/progress/progress.module.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `backend/src/modules/progress/progress.streak.integration.spec.ts`
- `docs/tickets/TICKET-005-streak-logic-unification.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npm run test -- users.service.spec.ts progress.service.spec.ts progress.streak.integration.spec.ts`
- `backend`: `npm run test`
- `backend`: `npm run build`
- Code search: verified application writes to `lastPlayedAt` now exist only in `backend/src/modules/users/users.service.ts`

---

## Follow-up Notes
- Completed: 2026-03-13.
- `resetProgress()` still clears `streakDays` explicitly when wiping all user progress; that is a reset operation, not a competing streak-calculation path.
