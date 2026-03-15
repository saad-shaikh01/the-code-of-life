# Close Backend Unit Test Coverage Gaps for Critical Business Logic

## Metadata
- **Ticket ID:** TICKET-024
- **Priority:** P3
- **Type:** testing
- **Area:** backend
- **Status:** done
- **Dependencies:** TICKET-005 (streak unification should be done before writing streak tests)

---

## Problem
Backend spec files existed, but the real coverage of business-critical backend logic was only partially verified. The audited risk areas were the numeric decoder, UTC streak logic, progress score updates, subscription entitlement checks, Stripe billing behavior, and battle gateway scoring.

The backlog required an audit-first pass: confirm what was already covered, then add tests only where coverage was genuinely missing.

---

## Why This Matters
These paths directly affect puzzle correctness, player progression, monetization, and gated access. Regressions here are user-facing and expensive to discover manually.

---

## Evidence
- `backend/src/modules/puzzles/decoder.service.spec.ts` already existed from TICKET-001, but coverage beyond the base cipher flow still needed verification
- `backend/src/modules/users/users.service.spec.ts` already existed from TICKET-005, but the seven-day gap case and additional file-level coverage still needed confirmation
- `backend/src/modules/progress/progress.service.spec.ts` already existed from TICKET-005, but the `Math.min(new, previous)` hints behavior was not explicitly asserted
- `backend/src/common/guards/subscription.guard.ts` had no dedicated spec file
- `backend/src/modules/billing/billing.service.ts` had no dedicated spec file
- `backend/src/modules/battle/battle.gateway.ts` required audit to determine whether standalone scoring logic existed there at all

---

## Scope

### 1. Audit existing spec files first
Read the existing backend spec files and document what they already cover. Do not rewrite passing tests that already provide meaningful coverage.

### 2. Add the genuinely missing guard and billing tests
- Add `backend/src/common/guards/subscription.guard.spec.ts`
- Add `backend/src/modules/billing/billing.service.spec.ts`

### 3. Extend existing specs only where the audited gaps remain
- Add the explicit seven-day streak reset case to `UsersService.updateStreak()`
- Add an explicit `Math.min(new, previous)` hints-used resubmission assertion to `ProgressService`
- Add missing decoder helper-path coverage only where the file-level coverage still fell below the threshold

### 4. Verify battle gateway scope before writing tests
If no standalone score calculation exists in `battle.gateway.ts`, do not invent a new gateway scoring test. Document that result instead.

---

## Out of Scope
- E2E tests
- Rewriting existing passing specs without a confirmed coverage gap
- Changing billing or subscription behavior just to satisfy a test prompt mismatch
- Frontend tests (covered by TICKET-023)

---

## Implementation Notes
- Audit result for previously existing coverage:
  - `decoder.service.spec.ts` already covered numeric encode/decode, round-trip, unmapped symbols, and validation/similarity basics from TICKET-001
  - `users.service.spec.ts` already covered first play, same day, next day, and 2+ day streak reset from TICKET-005
  - `progress.service.spec.ts` already covered first submission, higher/lower score behavior, hint bounds, streak delegation, and growth defaults
  - `roles.guard.spec.ts` and `auth.service.spec.ts` already existed and were left unchanged
- Added `subscription.guard.spec.ts` for:
  - active PRO access
  - active PREMIUM access to a PRO route
  - FREE tier rejection
  - unauthenticated rejection
  - missing subscription rejection
  - expired subscription rejection
- Added `billing.service.spec.ts` for:
  - checkout session creation
  - existing Stripe customer reuse
  - new Stripe customer plus FREE subscription record creation
  - billing portal session creation
  - `customer.subscription.updated` webhook mutation
  - `customer.subscription.deleted` downgrade handling
  - active paid subscription detection
- Extended `users.service.spec.ts` with:
  - explicit seven-day streak gap reset
  - `getStats()` aggregation coverage so the audited service file clears the coverage threshold
- Extended `progress.service.spec.ts` with an explicit `Math.min(new, previous)` hints-used assertion for higher-score resubmissions
- Extended `decoder.service.spec.ts` with:
  - case-sensitive validation coverage
  - non-perfect similarity coverage through Levenshtein distance
  - zero-similarity empty-input coverage
  - `getDefaultSymbolMap()` defensive-copy coverage
- Battle gateway audit result:
  - `backend/src/modules/battle/battle.gateway.spec.ts` already existed and covers routing/lifecycle behavior
  - `battle.gateway.ts` has no standalone score calculation logic, so no new gateway scoring spec was added
- Correction to the original prompt:
  - `SubscriptionGuard` currently throws `ForbiddenException('Authentication required')` for unauthenticated requests, not `UnauthorizedException`
  - `BillingService` mutates subscription state on `customer.subscription.created/updated` and `customer.subscription.deleted`; `checkout.session.completed` is not an implemented mutation path in the current service, so the new tests cover the actual webhook contract

---

## Acceptance Criteria
- [x] All existing spec files have been read and their coverage documented
- [x] `DecoderService` encode/decode/validate tests all pass
- [x] `UsersService.updateStreak()` tests cover all 5 scenarios
- [x] `SubscriptionGuard` tests cover all subscription tiers
- [x] `ProgressService` score update tests pass
- [x] `npm run test` passes with no failures
- [x] Coverage report shows > 60% on the audited modules

---

## Testing Requirements
- Run `npm run test:cov` to generate coverage report
- All new tests must pass in CI (`npm run test`)

---

## Affected Areas
- `backend/src/common/guards/subscription.guard.spec.ts`
- `backend/src/modules/billing/billing.service.spec.ts`
- `backend/src/modules/puzzles/decoder.service.spec.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.spec.ts`

---

## Risks / Edge Cases
- The full backend suite still emits the existing mocked `BattleGateway` error logs and Jest open-handle warning during passing runs; those pre-existing harness issues remain outside this ticket
- This ticket audited the gateway and confirmed no standalone scoring logic exists there, but future score logic added to the gateway would need its own tests

---

## Open Questions
None.

---

## Files Changed
- `backend/src/common/guards/subscription.guard.spec.ts`
- `backend/src/modules/billing/billing.service.spec.ts`
- `backend/src/modules/puzzles/decoder.service.spec.ts`
- `backend/src/modules/users/users.service.spec.ts`
- `backend/src/modules/progress/progress.service.spec.ts`
- `docs/tickets/TICKET-024-backend-test-coverage-gaps.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npm run test -- subscription.guard.spec.ts --runInBand`
- `backend`: `npm run test -- billing.service.spec.ts --runInBand`
- `backend`: `npm run test -- users.service.spec.ts --runInBand`
- `backend`: `npm run test -- progress.service.spec.ts --runInBand`
- `backend`: `npm run test -- decoder.service.spec.ts --runInBand`
- `backend`: `npm run test -- --runInBand`
- `backend`: `npm run test:cov -- --runInBand --coverageReporters=json-summary --coverageReporters=text-summary`
- `backend`: verified `coverage/coverage-summary.json` for audited modules:
  - `decoder.service.ts`: `100%` line coverage
  - `users.service.ts`: `74.57%` line coverage
  - `progress.service.ts`: `94.64%` line coverage
  - `subscription.guard.ts`: `96.55%` line coverage
  - `billing.service.ts`: `75.36%` line coverage
  - `battle.gateway.ts`: `96.87%` line coverage from the pre-existing gateway spec; no standalone scoring logic exists in the gateway itself
- `backend`: `npx eslint -- "src/common/guards/subscription.guard.spec.ts" "src/modules/billing/billing.service.spec.ts" "src/modules/puzzles/decoder.service.spec.ts" "src/modules/users/users.service.spec.ts" "src/modules/progress/progress.service.spec.ts"`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- No application code was changed for this ticket; all edits were test/documentation-only.
