# Set Up Frontend Test Infrastructure (Vitest + Testing Library)

## Metadata
- **Ticket ID:** TICKET-023
- **Priority:** P3
- **Type:** testing
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
The frontend has zero test infrastructure. `frontend/package.json` has no test runner, no `@testing-library/react`, no `vitest` or `jest`. There are no `.test.ts` or `.spec.ts` files anywhere in the frontend codebase.

This means:
- No automated verification of bug fixes
- No regression protection when making changes
- CI/CD pipeline cannot validate frontend correctness

---

## Why This Matters
Without tests, every code change requires full manual regression. Critical logic like auth store behavior, subscription status checks, and API token handling has no safety net.

---

## Evidence
- `frontend/package.json` — devDependencies contain only eslint and typescript tooling; no test runner
- No `*.test.ts` or `*.spec.ts` files found in `frontend/src/`
- `TESTING_STATUS.md` claims tests exist but actual codebase evidence contradicts this

---

## Scope

### 1. Install dependencies
```bash
cd frontend
npm install -D vitest @vitejs/plugin-react @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

### 2. Create `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
    },
  },
});
```

### 3. Create `src/test/setup.ts`
```typescript
import '@testing-library/jest-dom';
```

### 4. Add test script to `frontend/package.json`
```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
}
```

### 5. Write initial test suite (minimum 4 tests to validate the setup works)

**`src/stores/__tests__/auth.store.test.ts`:**
- `refreshUser()` calls `/auth/me` when authenticated
- `logout()` clears user and isAuthenticated

**`src/api/__tests__/client.test.ts`:**
- Token refresh fires on 401 response
- `setTokens` stores to localStorage

**`src/hooks/__tests__/use-subscription.test.ts`:**
- `isPro` returns true for PRO tier with ACTIVE status
- `isFree` returns true when no subscription

**`src/components/__tests__/PuzzleCard.test.tsx`** (after TICKET-001):
- Renders encrypted pattern as separate tokens (not char-by-char)

---

## Out of Scope
- E2E tests (Playwright/Cypress) — separate initiative
- 100% coverage — goal is infrastructure + critical path tests

---

## Implementation Notes
- Vitest is preferred over Jest for Next.js 15+ projects — better ESM support
- Mock API calls using `vi.mock()` or `msw` (Mock Service Worker) — for this ticket, `vi.mock()` is sufficient
- The `@` path alias in vitest config must match `tsconfig.json` paths
- Next.js App Router components that use hooks like `useRouter` need mocking: `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))`

---

## Acceptance Criteria
- [ ] `npm test` runs in `frontend/` without errors
- [ ] `vitest.config.ts` is correctly configured with jsdom environment and `@` alias
- [ ] Minimum 4 test files created and passing
- [ ] Auth store tests pass: login, logout, refreshUser behaviors
- [ ] API client tests pass: token storage, 401 retry
- [ ] Subscription hook tests pass: tier checks
- [ ] CI can run `npm test` in the frontend workspace

---

## Testing Requirements
- This ticket IS the testing infrastructure — validate by running `npm test` and verifying all written tests pass

---

## Affected Areas
- `frontend/package.json`
- New: `frontend/vitest.config.ts`
- New: `frontend/src/test/setup.ts`
- New: `frontend/src/stores/__tests__/auth.store.test.ts`
- New: `frontend/src/api/__tests__/client.test.ts`
- New: `frontend/src/hooks/__tests__/use-subscription.test.ts`

---

## Risks / Edge Cases
- Next.js server components cannot be tested with JSDOM — only test client components and utility functions
- Some Zustand store tests may need `act()` wrapping for async state updates

---

## Open Questions
None.
