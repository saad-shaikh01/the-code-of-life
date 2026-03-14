# Define Streak Logic Product Rules

## Metadata
- **Ticket ID:** TICKET-004
- **Priority:** P1
- **Type:** product-definition
- **Area:** backend
- **Status:** done
- **Dependencies:** none — must be resolved before TICKET-005

---

## Problem
The streak system has no documented, agreed-upon product rules. Two separate backend services implement streak logic differently:
- `users.service.ts` uses calendar-day comparison
- `progress.service.ts` uses a 24-hour rolling window

Beyond the code inconsistency, the fundamental product rules are undefined:
- What counts as "playing" for streak purposes? Solving a puzzle? Submitting any attempt?
- What timezone is used for day boundaries? UTC? User local time?
- If a user skips one day, does the streak reset to 0 or to 1?
- Is there a grace period (e.g., 48 hours)?
- If a user completes 3 puzzles in one day, does that count as 1 streak day or 3?
- Does the daily puzzle specifically extend the streak, or does any puzzle type count?

Without these rules defined, implementing TICKET-005 correctly is impossible.

---

## Why This Matters
`issues.md` line 5 explicitly calls this out: "streak logic kis trha work krna ha". The streak is a core engagement mechanic displayed on the dashboard, leaderboard, and profile. Inconsistent or undefined logic means users may lose streaks unexpectedly or gain them without meeting real criteria, eroding trust in the game.

---

## Evidence
- `issues.md` line 5: streak logic unclear
- `backend/src/modules/users/users.service.ts` — `updateStreak()` uses `isSameDay` / consecutive day check
- `backend/src/modules/progress/progress.service.ts` — `updateUserStats()` uses `Date.now() - lastPlayedAt < 24 * 60 * 60 * 1000` (24h window)
- `User` model has: `streakDays Int @default(0)`, `lastPlayedAt DateTime?`

---

## Scope
This ticket's only deliverable is a written product rule document. No code changes.

Create `docs/product-rules/streak.md` with the following sections:
1. **Definition of a streak day** — exactly what action qualifies
2. **Day boundary** — UTC midnight vs. user local time
3. **Reset rule** — what happens if a user misses exactly 1 day, 2 days, 7 days
4. **Grace period** — yes/no, and if yes, how long
5. **Multiple puzzles per day** — does solving 5 puzzles give 5 streak days or 1?
6. **Puzzle type scope** — story, challenge, daily, or all
7. **Display rule** — when does the UI show a streak "at risk" warning?

---

## Out of Scope
- Code implementation (TICKET-005)
- UI changes

---

## Implementation Notes
- Audited the existing backend behavior before defining the rule set:
  - `UsersService.updateStreak()` normalizes `now` and `lastPlayedAt` to local calendar dates, keeps the streak unchanged on the same day, increments on the next day, and resets to `1` after larger gaps.
  - `ProgressService.updateUserStats()` uses elapsed hours since `lastPlayedAt`, resets only when more than 24 hours have passed, and increments multiple times within the same calendar day.
- Added `docs/product-rules/streak.md` as the canonical source of truth for streak behavior.
- The confirmed product rule is: UTC calendar-day streaks, any completed puzzle counts, same-day completions are idempotent, no grace period, and a broken streak restarts at `1` on the next qualifying completion.
- `TICKET-005` must implement this document and remove the conflicting dual interpretations.

---

## Acceptance Criteria
- [x] `docs/product-rules/streak.md` file exists
- [x] All 7 sections are filled with specific, unambiguous rules
- [x] The document is reviewed and the rules are confirmed before TICKET-005 starts

---

## Testing Requirements
- No code tests for this ticket
- Manual review: ensure rules are internally consistent (e.g., UTC boundary is consistent with display timezone)

---

## Affected Areas
- New: `docs/product-rules/streak.md`

---

## Risks / Edge Cases
- If UTC midnight is used but the user is in UTC+5, their "day" resets at 7am local — this may feel wrong to users
- A 24h rolling window (current progress.service approach) feels more natural but is harder to display clearly

---

## Open Questions
None. `docs/product-rules/streak.md` is now the confirmed rule set for `TICKET-005`.

---

## Files Changed
- `docs/product-rules/streak.md`
- `docs/tickets/TICKET-004-streak-product-rule.md`
- `docs/tickets/README.md`

---

## Validation Performed
- Compared the two existing streak implementations:
  - `backend/src/modules/users/users.service.ts`
  - `backend/src/modules/progress/progress.service.ts`
- Manual review only; no code changes and no build/test commands were required for this ticket.

---

## Follow-up Notes
- Completed: 2026-03-13.
- `TICKET-005` should treat `docs/product-rules/streak.md` as the only valid streak definition and remove the 24-hour-window behavior.
