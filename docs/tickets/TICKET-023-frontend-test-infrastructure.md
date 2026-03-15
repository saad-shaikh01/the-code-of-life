# Set Up Frontend Test Infrastructure (Vitest + Testing Library)

## Metadata
- **Ticket ID:** TICKET-023
- **Priority:** P3
- **Type:** testing
- **Area:** frontend
- **Status:** done
- **Dependencies:** none

---

## Problem
The frontend previously had no automated test infrastructure:
- no test runner
- no Testing Library
- no `vitest` config
- no setup file
- no frontend `*.test.ts` / `*.test.tsx` files

That left frontend logic and component behavior without any automated regression protection.

---

## Why This Matters
Frontend tickets were being validated almost entirely by manual QA and build success. Core client behavior such as auth persistence, API token handling, subscription helpers, and puzzle rendering needed an executable test baseline before broader coverage work in `TICKET-024`.

---

## Evidence
- `frontend/package.json` had no `test`, `test:watch`, or `test:coverage` scripts
- no Vitest or Testing Library packages were installed
- no frontend test files existed under `frontend/src/`

---

## Scope
1. Add frontend test dependencies
2. Add Vitest configuration with jsdom and `@` alias support
3. Add a shared test setup file
4. Add the first four frontend test files
5. Verify `npm test` works in the frontend workspace

---

## Out of Scope
- E2E/browser automation
- large-scale coverage expansion across the app
- testing server components

---

## Implementation Notes
- Added frontend test dependencies:
  - `vitest`
  - `@vitest/coverage-v8`
  - `@testing-library/react`
  - `@testing-library/jest-dom`
  - `@testing-library/user-event`
  - `jsdom`
  - `@vitejs/plugin-react`
- Repo/runtime correction:
  - the latest `vitest@3` and `@vitejs/plugin-react@5` combination pulled in runtime/tooling that did not work cleanly on this machine's Node `20.17.0`
  - pinned to:
    - `vitest@2.1.8`
    - `@vitest/coverage-v8@2.1.8`
    - `@vitejs/plugin-react@4.3.4`
    - `jsdom@26.1.0`
  - this preserves the requested stack while keeping the workspace compatible with the current environment
- Added `frontend/vitest.config.ts` with:
  - React plugin
  - `jsdom` environment
  - global test APIs
  - `src/test/setup.ts`
  - alias support for:
    - `@`
    - `@shared`
- Added `frontend/src/test/setup.ts` importing `@testing-library/jest-dom`.
- Added `frontend/src/test/vitest.d.ts` so test globals and matcher types are available during `next build` type-checking.
- Added frontend scripts:
  - `test`
  - `test:watch`
  - `test:coverage`
- Added the first four test files:
  - `src/stores/__tests__/auth.store.test.ts`
  - `src/api/__tests__/client.test.ts`
  - `src/hooks/__tests__/use-subscription.test.ts`
  - `src/modules/puzzles/components/__tests__/CipherTokenCell.test.tsx`
- Scope corrections to match the current codebase:
  - the real auth-store hydration flag is `hasHydrated`, not `isHydrated`
  - `useSubscriptionStatus()` is query-backed, so the tests mock `useQuery` instead of `useAuthStore`
  - the requested component target in the implementation prompt was `CipherTokenCell`, so the component test was added there instead of the older ticket draft's `PuzzleCard`
- Test coverage added by file:
  - `auth.store.test.ts`
    - initial state contract
    - `login()`
    - `logout()`
    - `refreshUser()` with and without stored session
  - `client.test.ts`
    - token storage mode
    - auth header injection
    - no-auth-header path
    - `401` refresh-and-retry flow
  - `use-subscription.test.ts`
    - PRO and PREMIUM tiers return `isPro=true`
    - FREE and `null` return `isPro=false`
  - `CipherTokenCell.test.tsx`
    - numeric token render
    - punctuation/edge token render
    - empty spacer render
    - hidden placeholder render

---

## Acceptance Criteria
- [x] `npm test` runs in `frontend/` without errors
- [x] `vitest.config.ts` is correctly configured with jsdom environment and `@` alias
- [x] Minimum 4 test files created and passing
- [x] Auth store tests pass: login, logout, refreshUser behaviors
- [x] API client tests pass: token storage, 401 retry
- [x] Subscription hook tests pass: tier checks
- [x] CI can run `npm test` in the frontend workspace

---

## Testing Requirements
- This ticket is the test infrastructure baseline. Validation is the written suite itself plus a successful frontend build.

---

## Affected Areas
- `frontend/package.json`
- `package-lock.json`
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/vitest.d.ts`
- `frontend/src/stores/__tests__/auth.store.test.ts`
- `frontend/src/api/__tests__/client.test.ts`
- `frontend/src/hooks/__tests__/use-subscription.test.ts`
- `frontend/src/modules/puzzles/components/__tests__/CipherTokenCell.test.tsx`

---

## Risks / Edge Cases
- Next.js server components still are not directly testable in this setup; the suite is intentionally limited to client-side logic/components.
- The Vite Node API currently emits a deprecation warning about the CJS build during `vitest run`; tests still pass.
- Full frontend lint is still blocked by unrelated pre-existing errors elsewhere in the repo.

---

## Open Questions
None.

---

## Files Changed
- `frontend/package.json`
- `package-lock.json`
- `frontend/vitest.config.ts`
- `frontend/src/test/setup.ts`
- `frontend/src/test/vitest.d.ts`
- `frontend/src/stores/__tests__/auth.store.test.ts`
- `frontend/src/api/__tests__/client.test.ts`
- `frontend/src/hooks/__tests__/use-subscription.test.ts`
- `frontend/src/modules/puzzles/components/__tests__/CipherTokenCell.test.tsx`
- `docs/tickets/TICKET-023-frontend-test-infrastructure.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npm run test`
- `frontend`: `npm run build`
- `frontend`: `npx eslint -- "vitest.config.ts" "src/test/setup.ts" "src/test/vitest.d.ts" "src/stores/__tests__/auth.store.test.ts" "src/api/__tests__/client.test.ts" "src/hooks/__tests__/use-subscription.test.ts" "src/modules/puzzles/components/__tests__/CipherTokenCell.test.tsx"`
- `frontend`: attempted `npm run lint`
  - result: failed on unrelated pre-existing errors in `achievements/page.tsx`, `pricing/page.tsx`, `particle-effects.tsx`, `theme-provider.tsx`, and `tailwind.config.ts`

---

## Follow-up Notes
- Completed: 2026-03-15.
- No application code behavior was changed outside the test/tooling setup.
