# Add Authentication Route Guards for Protected Pages

## Metadata
- **Ticket ID:** TICKET-006
- **Priority:** P1
- **Type:** bug
- **Area:** frontend
- **Status:** done
- **Dependencies:** TICKET-002 (auth hydration should be done first for consistent behavior)

---

## Problem
There were no route-level guards protecting the `/(main)/` routes. Any unauthenticated user could navigate directly to `/dashboard`, `/puzzle/123`, `/battle`, and similar pages and see broken or empty content after API calls returned `401`.

Symmetrically, a logged-in user navigating to `/login` or `/register` was still shown the auth forms instead of being redirected to `/dashboard`.

The `useAuthStore` is client-side only, so layout-level checks alone run after the initial render and can allow a flash of protected UI before redirecting.

---

## Why This Matters
Security and UX both require that unauthenticated users cannot access game content. Before this fix a user could reach `/dashboard` by typing the URL and see the protected shell before API calls failed. For a game with subscription tiers, unauthenticated users should not even see the protected experience.

---

## Evidence
- No `frontend/src/middleware.ts` file existed in the project
- `frontend/src/app/(main)/layout.tsx` rendered the protected shell without a redirect fallback
- `frontend/src/stores/auth.store.ts` keeps auth state only on the client

---

## Scope
1. Add Next.js route guards for all current `/(main)` pages
2. Redirect unauthenticated requests for protected pages to `/login`
3. Redirect authenticated requests for `/login` and `/register` to `/dashboard`
4. Mirror the client session into a readable cookie so middleware can evaluate auth state
5. Add a client-side fallback in `/(main)/layout.tsx` so protected UI stays hidden if middleware is bypassed or the session becomes invalid after navigation

---

## Out of Scope
- Subscription-based page gating
- Auth hydration work from `TICKET-002`
- Backend token issuance changes

---

## Implementation Notes
- Added `frontend/src/middleware.ts` with an explicit matcher for all current protected `/(main)` routes: `/dashboard`, `/puzzle/*`, `/battle`, `/daily`, `/challenge`, `/leaderboard`, `/leaderboards`, `/achievements`, `/profile`, `/settings`, `/subscription`, `/story`, `/pricing`, and `/zen-demo`
- Middleware also guards `/login` and `/register`, redirecting authenticated users to `/dashboard`
- `frontend/src/api/client.ts` now mirrors client auth state into a lightweight `auth_session` cookie on `setTokens()` and clears it on `clearTokens()`
- The routing cookie uses `Path=/`, `SameSite=Lax`, and `Max-Age=604800` (7 days, aligned with refresh token lifetime); `Secure` is added automatically on HTTPS origins
- `frontend/src/components/providers/auth-initializer.tsx` now syncs the routing cookie from existing localStorage tokens during hydration so upgraded sessions repair themselves on the next client render
- `frontend/src/app/(main)/layout.tsx` now blocks the full protected shell until auth hydration completes and performs a `router.replace('/login')` fallback once hydration confirms the session is unauthenticated

---

## Acceptance Criteria
- [x] Unauthenticated `GET /dashboard` redirects to `/login`
- [x] Unauthenticated `GET /puzzle/any-id` redirects to `/login`
- [x] Authenticated `GET /login` redirects to `/dashboard`
- [x] Authenticated `GET /register` redirects to `/dashboard`
- [x] No flash of protected content before redirect fires (middleware approach)
- [x] Logout clears the auth cookie so subsequent protected-route visits redirect to login

---

## Testing Requirements
- **Manual QA:**
  1. Log out, navigate to `/dashboard`, and verify redirect to `/login`
  2. Log in, navigate to `/login`, and verify redirect to `/dashboard`
  3. Log in, close and reopen the browser, navigate to `/dashboard`, and verify access still works while the session is valid
- **Regression:** Normal login to dashboard flow still works

---

## Affected Areas
- New: `frontend/src/middleware.ts`
- `frontend/src/api/client.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/components/providers/auth-initializer.tsx`
- `frontend/src/config/constants.ts`

---

## Risks / Edge Cases
- The routing cookie is a hint for middleware, not the source of truth; backend JWT validation still decides whether API requests are valid
- Sessions created before this change will not have the cookie until the client hydrates or the user logs in again
- Next.js 16 warns that the `middleware` file convention is deprecated in favor of `proxy`; this ticket intentionally keeps `middleware.ts` because that is the backlog requirement

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/api/client.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/components/providers/auth-initializer.tsx`
- `frontend/src/config/constants.ts`
- `frontend/src/middleware.ts`
- `docs/tickets/TICKET-006-auth-route-guards.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/api/client.ts" "src/app/(main)/layout.tsx" "src/components/providers/auth-initializer.tsx" "src/config/constants.ts" "src/middleware.ts"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-13.
- Manual QA scenarios above remain the recommended browser-level verification for cookie persistence and redirect behavior.
