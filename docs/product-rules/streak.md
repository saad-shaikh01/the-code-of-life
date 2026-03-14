# Streak Rules

## Purpose
This document is the canonical product definition for streak behavior in The Code of Life. It is the source of truth for `TICKET-005` and overrides the conflicting backend implementations currently found in `UsersService.updateStreak()` and `ProgressService.updateUserStats()`.

## Current Implementation Audit
- `backend/src/modules/users/users.service.ts` uses calendar-day comparison based on `new Date(year, month, day)`. It is idempotent within the same day, increments on the next day, and resets to `1` after a gap greater than one day. This uses the server's local date parts, not UTC.
- `backend/src/modules/progress/progress.service.ts` uses a rolling 24-hour window based on elapsed hours since `lastPlayedAt`. It resets only when more than 24 hours have elapsed and increments on every qualifying completion within that 24-hour window, including multiple completions on the same calendar day.
- These behaviors are incompatible. The rules below replace both of them.

## 1. Definition of a Streak Day
- A streak day is earned when a user completes at least one puzzle on a UTC calendar day.
- A qualifying action is a genuine puzzle completion for that user. In implementation terms, this means the event that records a puzzle as completed for the user.
- Failed attempts, partial progress, page views, hints, and logins do not count toward the streak.

## 2. Day Boundary
- The day boundary is UTC midnight.
- Each streak day runs from `00:00:00.000 UTC` to `23:59:59.999 UTC`.
- Streak comparisons must use UTC calendar dates, not a rolling 24-hour window and not the server's local timezone.
- `lastPlayedAt` stores the timestamp of the most recent qualifying completion in UTC.

## 3. Reset Rule
- First qualifying completion ever sets `streakDays = 1`.
- If the current completion happens on the same UTC calendar day as `lastPlayedAt`, `streakDays` does not change.
- If the current completion happens on the immediately next UTC calendar day after `lastPlayedAt`, `streakDays` increments by `1`.
- If the current completion happens more than one UTC calendar day after `lastPlayedAt`, the previous streak is broken and the new completion starts a new streak with `streakDays = 1`.
- Missing exactly one UTC calendar day is enough to break the streak.
- Missing 2, 7, or 30 UTC calendar days has the same streak outcome as missing 1: the next qualifying completion sets the streak to `1`.
- "Reset" means the old streak is broken and the next qualifying completion starts a new streak at `1`. The system does not need to write `0` just because time passed with no activity.

## 4. Grace Period
- There is no grace period.
- If the user does not complete at least one puzzle on the immediately previous UTC calendar day, the streak is broken.

## 5. Multiple Puzzles Per Day
- Multiple puzzle completions on the same UTC calendar day count as one streak day.
- Additional same-day completions may still affect score, progression, achievements, or analytics, but they do not increment `streakDays` again.
- The streak operation is idempotent within a single UTC date.

## 6. Puzzle Type Scope
- Any puzzle type counts if it produces a valid puzzle completion for the user.
- Story, Challenge, Daily, and any future mode that records a completed puzzle are all included.
- The streak is not restricted to Daily puzzles only.

## 7. Display Rule
- The streak displayed in the UI is the number of consecutive UTC calendar days with at least one puzzle completion.
- The UI should describe the streak in calendar-day terms, not "within 24 hours."
- No grace-period messaging or streak-shield mechanic is part of the rule set.
- No special "at risk" warning is defined by this ticket. Future warning UX can be added later without changing the underlying streak rule.

## Edge Cases
- First puzzle ever: streak becomes `1`.
- Completion at `23:59 UTC` followed by completion at `00:01 UTC` the next day: streak increments by `1` because the completions are on consecutive UTC calendar days.
- Two or more completions on the same UTC day: streak remains unchanged after the first qualifying completion that day.
- Last completion on March 10 UTC and next completion on March 12 UTC: March 11 was missed, so the new completion starts a new streak at `1`.
- A broken streak does not become `0` at completion time. The next qualifying completion always writes `1` as the start of the new streak.

## Implementation Notes for TICKET-005
- Unify all streak writes behind one code path that follows this document.
- Normalize comparisons using UTC date boundaries, not local `Date` constructors.
- Keep same-day completions idempotent for streak count.
- Preserve `lastPlayedAt` as the timestamp of the most recent qualifying completion.
