# Standardise Error, Loading, and Empty States Across the App

## Metadata
- **Ticket ID:** TICKET-019
- **Priority:** P2
- **Type:** tech-debt
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
Error, loading, and empty states are handled inconsistently across pages:
- Some pages show `<Skeleton>` components during loading; others render nothing or show blank sections
- API errors are sometimes caught and displayed; sometimes only `console.error()`'d; sometimes silently swallowed
- No global React `ErrorBoundary` wraps the `/(main)/` layout — an unhandled render error in any page component will crash the entire app to a blank white screen
- Empty states (e.g., no puzzles, no achievements) have different designs per page

---

## Why This Matters
Inconsistent error handling makes the app feel unpolished and hard to debug. A missing ErrorBoundary means a single component bug can take down the entire app view. Console-only errors make production debugging harder and may cause false-positive alerts.

---

## Evidence
- `frontend/src/app/(main)/layout.tsx` — no `ErrorBoundary`
- Dashboard, profile, and achievements pages use `<Skeleton>` (good)
- Some query hooks use `isError` state but pages don't always render an error UI
- `frontend/src/api/client.ts` — throws `ApiClientError` on failures; not always caught by consuming components

---

## Scope

### 1. Create a reusable `ErrorBoundary` component
New file: `frontend/src/components/error-boundary.tsx`
```tsx
"use client";
import React from 'react';
import { Button } from "@/components/ui";

interface State { hasError: boolean; error?: Error; }

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  State
> {
  state: State = { hasError: false };
  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? (
        <div className="flex flex-col items-center justify-center min-h-64 text-center p-8">
          <h2 className="text-xl font-semibold text-foreground mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">An unexpected error occurred.</p>
          <Button onClick={() => this.setState({ hasError: false })}>Try Again</Button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

### 2. Wrap `(main)/layout.tsx` with ErrorBoundary
```tsx
// frontend/src/app/(main)/layout.tsx
import { ErrorBoundary } from "@/components/error-boundary";

<ErrorBoundary>
  <div className="main-layout">
    {children}
  </div>
</ErrorBoundary>
```

### 3. Standardise query error display pattern
Create a reusable `QueryError` component:
```tsx
// frontend/src/components/ui/query-error.tsx
export function QueryError({ message }: { message?: string }) {
  return (
    <div className="text-center py-12">
      <p className="text-destructive">{message || "Failed to load data. Please try again."}</p>
    </div>
  );
}
```
Update pages that have `isError` from a query to render `<QueryError message={error?.message} />` instead of showing nothing.

### 4. Standardise empty state component
Create:
```tsx
// frontend/src/components/ui/empty-state.tsx
export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="text-center py-16">
      <Icon className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-muted-foreground mb-4">{description}</p>
      {action}
    </div>
  );
}
```

### 5. Audit pages for missing error states
Read the following pages and add `isError` → `<QueryError>` handling where missing:
- `story/page.tsx`
- `challenge/page.tsx`
- `leaderboards/page.tsx`
- `battle/page.tsx` (connection errors)

---

## Out of Scope
- Changing the visual design of existing working skeleton loaders
- Adding error tracking (Sentry, etc.) — that's a separate initiative

---

## Implementation Notes
- React `ErrorBoundary` must be a class component (React 18 doesn't support functional error boundaries natively)
- Keep the boundary broad (wrapping the main layout) rather than per-page — per-page is more granular but harder to maintain
- The `QueryError` and `EmptyState` components should go in `frontend/src/components/ui/` alongside existing UI components

---

## Acceptance Criteria
- [ ] An unhandled render error in any `/(main)/` page shows the ErrorBoundary fallback instead of a blank white screen
- [ ] All pages with React Query data fetching render `<QueryError>` when `isError` is true
- [ ] All pages with empty data sets render a consistent `<EmptyState>` component
- [ ] No API errors are silently swallowed (they should either show a toast or a query error state)
- [ ] The `ErrorBoundary`, `QueryError`, and `EmptyState` components are exported from `@/components/ui`

---

## Testing Requirements
- **Manual QA:** Temporarily throw an error in a page component → verify ErrorBoundary catches it and shows fallback
- **Manual QA:** Disconnect backend → navigate to pages → verify error states shown (not blank)
- **Regression:** Normal page loads must not be affected

---

## Affected Areas
- New: `frontend/src/components/error-boundary.tsx`
- New: `frontend/src/components/ui/query-error.tsx`
- New: `frontend/src/components/ui/empty-state.tsx`
- `frontend/src/app/(main)/layout.tsx`
- Various page files (story, challenge, leaderboards, battle)
- `frontend/src/components/ui/index.ts` (export new components)

---

## Risks / Edge Cases
- Class component ErrorBoundary plays well with React 18 but may need adjustment for React 19 concurrent features — test carefully
- ErrorBoundary does not catch async errors (e.g., errors in event handlers or promises) — only render errors

---

## Open Questions
None.
