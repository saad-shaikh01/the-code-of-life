# Standardise Error, Loading, and Empty States Across the App

## Metadata
- **Ticket ID:** TICKET-019
- **Priority:** P2
- **Type:** tech-debt
- **Area:** frontend
- **Status:** done
- **Dependencies:** none

---

## Problem
Error, loading, and empty states were handled inconsistently across the protected frontend:
- Some pages already used `<Skeleton>` components during loading, while others rendered blank sections or misleading zero-state content
- API failures were not always surfaced to the user with a retry path
- No global React `ErrorBoundary` wrapped the `/(main)` layout, so an unhandled render failure could take down the whole protected view
- Empty states used inconsistent patterns across pages

---

## Why This Matters
Inconsistent error handling makes the app feel unpolished and difficult to debug. A missing ErrorBoundary means a single render bug can blank the current protected page, and console-only failures are not actionable for users.

---

## Evidence
- `frontend/src/app/(main)/layout.tsx` had no `ErrorBoundary`
- `frontend/src/api/client.ts` throws request failures, but consuming pages were not consistently rendering inline error UI
- `story/page.tsx`, `challenge/page.tsx`, and `leaderboards/page.tsx` each had at least one missing or inconsistent loading/error/empty state
- `dashboard`, `achievements`, and `profile` already had acceptable loading/error handling and were intentionally left alone

---

## Scope
1. Create a reusable `ErrorBoundary` component
2. Wrap `/(main)/layout.tsx` with `ErrorBoundary`
3. Create reusable `QueryError` and `EmptyState` UI components
4. Audit and fix the requested pages:
   - `story/page.tsx`
   - `challenge/page.tsx`
   - `leaderboards/page.tsx`

---

## Out of Scope
- Redesigning working pages
- Adding telemetry or external error tracking
- Reworking pages that were already compliant

---

## Implementation Notes
- Implemented a class-based `ErrorBoundary` in `frontend/src/components/providers/ErrorBoundary.tsx` with:
  - `getDerivedStateFromError`
  - `componentDidCatch`
  - a default centered fallback card
  - a `Try again` action that reloads the page
- Re-exported `ErrorBoundary` from `@/components/ui` so the shared UI barrel satisfies the ticket contract while the file still lives under `providers/`.
- Wrapped the protected page content inside `frontend/src/app/(main)/layout.tsx` with `ErrorBoundary` without changing the existing auth guard structure.
- Added reusable UI primitives:
  - `frontend/src/components/ui/query-error.tsx`
  - `frontend/src/components/ui/empty-state.tsx`
- Updated `frontend/src/components/ui/index.ts` to export:
  - `ErrorBoundary`
  - `QueryError`
  - `EmptyState`
- `story/page.tsx` now:
  - shows skeletons while puzzle and progress queries load
  - renders a retryable `QueryError` if either query fails
  - renders a shared `EmptyState` when no story puzzles exist for the selected tab
- `challenge/page.tsx` now:
  - shows skeletons instead of misleading zero stats while loading
  - renders a retryable `QueryError` when puzzle or progress queries fail
  - renders a shared `EmptyState` when no challenge puzzles exist
- `leaderboards/page.tsx` now:
  - renders retryable `QueryError` states for leaderboard, global stats, streak, and level fetch failures
  - renders shared `EmptyState` blocks when those datasets are empty
  - keeps the existing skeleton pattern during loading
- `battle/page.tsx` was not changed in this ticket because the connection error and fallback UX were already hardened under `TICKET-010`.

---

## Acceptance Criteria
- [x] An unhandled render error in any `/(main)/` page shows the ErrorBoundary fallback instead of a blank white screen
- [x] All pages with React Query data fetching render `<QueryError>` when `isError` is true
- [x] All pages with empty data sets render a consistent `<EmptyState>` component
- [x] No API errors are silently swallowed (they should either show a toast or a query error state)
- [x] The `ErrorBoundary`, `QueryError`, and `EmptyState` components are exported from `@/components/ui`

---

## Testing Requirements
- **Automated validation run:**
  - targeted ESLint on all touched files
  - `frontend` production build
- **Manual QA recommended:**
  1. Temporarily throw inside a protected page component and verify `ErrorBoundary` catches it
  2. Disconnect the backend and verify `story`, `challenge`, and `leaderboards` render inline error states instead of blank sections
  3. Verify normal protected-page rendering is unchanged when data loads successfully

---

## Affected Areas
- `frontend/src/components/providers/ErrorBoundary.tsx`
- `frontend/src/components/ui/query-error.tsx`
- `frontend/src/components/ui/empty-state.tsx`
- `frontend/src/components/ui/index.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/app/(main)/story/page.tsx`
- `frontend/src/app/(main)/challenge/page.tsx`
- `frontend/src/app/(main)/leaderboards/page.tsx`

---

## Risks / Edge Cases
- React error boundaries do not catch async errors from event handlers or promises; they only catch render/lifecycle errors
- Manual browser QA is still needed to confirm the fallback and retry states in a live session

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/components/providers/ErrorBoundary.tsx`
- `frontend/src/components/ui/query-error.tsx`
- `frontend/src/components/ui/empty-state.tsx`
- `frontend/src/components/ui/index.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/app/(main)/story/page.tsx`
- `frontend/src/app/(main)/challenge/page.tsx`
- `frontend/src/app/(main)/leaderboards/page.tsx`
- `docs/tickets/TICKET-019-error-loading-empty-states.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/components/providers/ErrorBoundary.tsx" "src/components/ui/query-error.tsx" "src/components/ui/empty-state.tsx" "src/components/ui/index.ts" "src/app/(main)/layout.tsx" "src/app/(main)/leaderboards/page.tsx" "src/app/(main)/story/page.tsx" "src/app/(main)/challenge/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Manual browser QA was not run in this terminal session.
- The existing Next.js warning about `middleware.ts` being deprecated in favor of `proxy` remains unrelated to this ticket.
