# Add Authentication Route Guards for Protected Pages

## Metadata
- **Ticket ID:** TICKET-006
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** TICKET-002 (auth hydration should be done first for consistent behavior)

---

## Problem
There are no route-level guards protecting the `/(main)/` routes. Any unauthenticated user can navigate directly to `/dashboard`, `/puzzle/123`, `/battle`, etc. and see broken or empty content (API calls fail silently or return 401).

Symmetrically, a logged-in user navigating to `/login` or `/register` should be redirected to `/dashboard` — but currently they land on the auth forms.

The `useAuthStore` is client-side only, meaning layout-level checks also run after the initial render, causing a flash of protected content before the redirect fires.

---

## Why This Matters
Security and UX both require that unauthenticated users cannot access game content. Currently a user can reach `/dashboard` by typing the URL — they'll see the dashboard shell (headers, layout) before API calls fail. For a game with subscription tiers, this is also a risk: unauthenticated users shouldn't even see the game UI.

---

## Evidence
- No `frontend/src/middleware.ts` file exists in the project
- `frontend/src/app/(main)/layout.tsx` — no auth check
- `issues.md` line 1: user navigates to `/dashboard` directly and sees they're logged in — but via the auth store, not a guard
- `frontend/src/stores/auth.store.ts` — `isAuthenticated` is the gating flag

---

## Scope
**Option A (Recommended): Next.js Middleware**

Create `frontend/src/middleware.ts`:
```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PROTECTED_PATHS = ['/dashboard', '/story', '/challenge', '/daily', '/puzzle', '/battle', '/leaderboards', '/achievements', '/profile', '/settings', '/subscription', '/pricing'];
const AUTH_PATHS = ['/login', '/register', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('access_token')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p));
  const isAuthPage = AUTH_PATHS.some(p => pathname.startsWith(p));

  if (isProtected && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

**Important caveat:** JWT tokens are currently stored in `localStorage`, NOT cookies. Middleware runs on the server and cannot read `localStorage`. Two solutions:
- **Solution 1 (preferred):** Store the access token in an `httpOnly` cookie in addition to localStorage on login/register — middleware can then read it. Update `apiClient.setTokens()` to also set a cookie via `document.cookie`.
- **Solution 2 (simpler, less secure):** Use a non-httpOnly cookie just for the middleware check (not for API calls). The cookie is set on login, cleared on logout.
- **Solution 3 (fallback):** Do the guard in `(main)/layout.tsx` as a client-side redirect (still has flash, but better than nothing)

**Recommended approach for this ticket:** Solution 2 — set a lightweight `auth_session` cookie on login/logout for middleware use. Keep the JWT in localStorage for API calls.

---

## Out of Scope
- Subscription-based page gating (that's the `SubscriptionGuard` on backend + `LockedOverlay` on frontend)
- Auth hydration (TICKET-002)

---

## Implementation Notes
- `frontend/src/middleware.ts` runs at the Edge, before the page renders — no flash
- The matcher should exclude `_next/static`, `_next/image`, API routes, and public assets
- On `apiClient.setTokens()` (in `auth.store.ts` or `api/client.ts`), also set: `document.cookie = 'auth_session=1; path=/; SameSite=Lax'`
- On `apiClient.clearTokens()` (logout), also clear: `document.cookie = 'auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT'`
- Middleware reads `request.cookies.get('auth_session')` — if present, user is considered authenticated for routing purposes (the actual JWT is validated by the backend on API calls)

---

## Acceptance Criteria
- [ ] Unauthenticated `GET /dashboard` redirects to `/login`
- [ ] Unauthenticated `GET /puzzle/any-id` redirects to `/login`
- [ ] Authenticated `GET /login` redirects to `/dashboard`
- [ ] Authenticated `GET /register` redirects to `/dashboard`
- [ ] No flash of protected content before redirect fires (middleware approach)
- [ ] Logout clears the auth cookie so subsequent protected-route visits redirect to login

---

## Testing Requirements
- **Manual QA:**
  1. Log out → navigate to `/dashboard` → verify redirect to `/login`
  2. Log in → navigate to `/login` → verify redirect to `/dashboard`
  3. Log in → close and reopen browser (session cookie persists) → navigate to `/dashboard` → verify access
- **Regression:** Normal login → dashboard flow still works

---

## Affected Areas
- New: `frontend/src/middleware.ts`
- `frontend/src/api/client.ts` (add cookie set/clear on token operations)
- `frontend/src/stores/auth.store.ts` (ensure logout clears cookie)

---

## Risks / Edge Cases
- Cookie approach relies on `document.cookie` which is synchronous and available only client-side. Token set in localStorage but the middleware cookie might not be set if the user is on an old session before this fix — add a migration: on next login, cookie gets set
- SameSite=Lax is appropriate; do NOT use SameSite=None without Secure
- The `auth_session` cookie is NOT the JWT — it's just a routing hint. The real security is the backend's JWT validation on every API call.

---

## Open Questions
None.
