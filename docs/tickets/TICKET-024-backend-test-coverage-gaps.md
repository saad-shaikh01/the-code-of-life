# Close Backend Unit Test Coverage Gaps for Critical Business Logic

## Metadata
- **Ticket ID:** TICKET-024
- **Priority:** P3
- **Type:** testing
- **Area:** backend
- **Status:** open
- **Dependencies:** TICKET-005 (streak unification should be done before writing streak tests)

---

## Problem
Backend spec files exist (`*.spec.ts`) but their actual content and coverage of critical business logic is unknown. Key services with complex logic — `DecoderService`, `UsersService.updateStreak()`, `ProgressService.updateUserStats()`, `SubscriptionGuard`, and battle scoring — may have no meaningful test coverage.

`TESTING_STATUS.md` claims coverage exists, but the audit found no evidence of tests actually covering these paths. Status docs should not be trusted without verification.

---

## Why This Matters
The decoder cipher (TICKET-001), streak logic (TICKET-005), and subscription guard are the most business-critical components. Bugs in these areas directly impact all users. Without tests, regressions are discovered by users, not CI.

---

## Evidence
- `TESTING_STATUS.md` — claims tests are "complete" but audit found only `app.controller.spec.ts` confirmed
- `backend/src/modules/puzzles/decoder.service.ts` — complex cipher logic with no confirmed tests
- `backend/src/modules/users/users.service.ts` — `updateStreak()` has complex date logic
- `backend/src/modules/progress/progress.service.ts` — score/level/streak update logic
- `backend/src/common/guards/` — `SubscriptionGuard` behavior under different tiers

---

## Scope

### 1. Audit existing spec files first
Read each `*.spec.ts` file and document what is actually tested. Update the audit checklist accordingly. Do not rewrite tests that already provide meaningful coverage.

### 2. Write missing tests for `DecoderService`
File: `backend/src/modules/puzzles/decoder.service.spec.ts`

Test cases (after TICKET-001 cipher rewrite):
- `encode("A")` returns `"1"`
- `encode("Z")` returns `"26"`
- `encode("HELLO")` returns `"8 5 12 12 15"`
- `decode("8 5 12 12 15")` returns `"HELLO"`
- Round-trip: `decode(encode(text)) === text` for standard phrases
- Unknown character in encode returns unmapped token, not crash
- `validate("puzzle-id", "correct answer")` returns `{ isCorrect: true, similarity: 1 }`
- `validate("puzzle-id", "wrong answer")` returns `{ isCorrect: false, similarity: < 1 }`

### 3. Write missing tests for `UsersService.updateStreak()`
File: `backend/src/modules/users/users.service.spec.ts`

Test cases (based on TICKET-004/005 rules):
- First play (no lastPlayedAt): streak = 1
- Same calendar day as last play: streak unchanged
- Consecutive calendar day: streak incremented by 1
- Two days gap: streak resets to 1
- Seven days gap: streak resets to 1

### 4. Write missing tests for `SubscriptionGuard`
File: `backend/src/common/guards/subscription.guard.spec.ts`

Test cases:
- PRO user accessing PRO-required route: passes
- FREE user accessing PRO-required route: throws `ForbiddenException`
- PREMIUM user accessing PRO-required route: passes (premium ≥ pro)
- No subscription record: treated as FREE

### 5. Write missing tests for `ProgressService` score update
Test cases:
- First submission: creates progress record
- Better score on re-submission: updates score (Math.max)
- Worse score on re-submission: keeps previous score
- Hints used: stores minimum of (new, previous)

---

## Out of Scope
- E2E tests
- Coverage for modules with already-adequate test coverage (verify first before writing more)
- Frontend tests (TICKET-023)

---

## Implementation Notes
- Use NestJS testing utilities: `Test.createTestingModule()`, mock `PrismaService`
- For streak tests, mock `prisma.user.findUnique` to return different `lastPlayedAt` values
- Use `jest.useFakeTimers()` and `jest.setSystemTime()` to control the "current date" in streak tests
- Run `npm run test:cov` after writing tests to see actual coverage percentages

---

## Acceptance Criteria
- [ ] All existing spec files have been read and their coverage documented
- [ ] `DecoderService` encode/decode/validate tests all pass
- [ ] `UsersService.updateStreak()` tests cover all 5 scenarios
- [ ] `SubscriptionGuard` tests cover all subscription tiers
- [ ] `ProgressService` score update tests pass
- [ ] `npm run test` passes with no failures
- [ ] Coverage report shows > 60% on the audited modules

---

## Testing Requirements
- Run `npm run test:cov` to generate coverage report
- All new tests must pass in CI (`npm run test`)

---

## Affected Areas
- `backend/src/modules/puzzles/decoder.service.spec.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/common/guards/subscription.guard.spec.ts`
- `backend/src/modules/progress/progress.service.spec.ts`

---

## Risks / Edge Cases
- Mocking `PrismaService` requires careful setup — use the `@prisma/client` mock pattern or `jest-mock-extended`
- Date mocking for streak tests must reset after each test with `jest.useRealTimers()`

---

## Open Questions
None.
