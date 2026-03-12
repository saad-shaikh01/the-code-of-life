# Fix Auth State Not Hydrating on New Tab / Page Refresh

## Metadata
- **Ticket ID:** TICKET-002
- **Priority:** P0
- **Type:** bug
- **Area:** frontend
- **Status:** open
- **Dependencies:** none

---

## Problem
When a logged-in user opens a new tab to `localhost:3000` (landing page), they see "Sign In" and "Get Started" buttons — the app treats them as unauthenticated. However, navigating directly to `/dashboard` correctly recognises them as logged in.

The root cause is that:
1. `RootLayout` (`frontend/src/app/layout.tsx`) has no `useEffect` that calls `refreshUser()` on mount
2. Zustand's `persist` middleware restores `isAuthenticated: true` and the `user` object from `localStorage` — but this only happens client-side after the initial render
3. The landing page `page.tsx` is a server component (or renders before hydration) and never reads the Zustand store
4. Protected pages under `/(main)/` also do not explicitly re-validate the token with the backend on mount, meaning a stale/expired token in localStorage would still show authenticated UI

---

## Why This Matters
This is the first bug listed in `issues.md`. It directly breaks the perceived auth state for all existing users on every new tab or browser refresh at the root URL. It also risks showing protected content briefly before auth is confirmed (flash of authenticated content with an expired token).

---

## Evidence
- `issues.md` line 1: "jb user logged in ha lkn new tab ma open kia usne localhost:3000 to landing page par phr b signin or register wale buttons display ho rahe ha"
- `frontend/src/app/layout.tsx` — no `useEffect`, no `refreshUser()` call
- `frontend/src/stores/auth.store.ts:99` — `refreshUser()` exists: calls `GET /auth/me`, updates user, logs out on failure
- `frontend/src/app/page.tsx:69-74` — hardcoded Sign In / Get Started links, no auth check
- Auth store uses Zustand `persist` — restores from `localStorage` key `"code_of_life_user"`

---

## Scope
1. **Create an auth initializer component** (client component) that:
   - Calls `useAuthStore.getState().refreshUser()` once on mount
   - Sets a `hydrated` flag to avoid flash-of-wrong-UI
   - Renders `null` (invisible) — purely side-effect

2. **Mount the initializer in `RootLayout`** so it runs on every page, including the landing page:
   ```tsx
   // frontend/src/app/layout.tsx
   <QueryProvider>
     <ThemeProvider defaultTheme="dark">
       <ToastProvider>
         <AuthInitializer />   {/* ← add this */}
         {children}
       </ToastProvider>
     </ThemeProvider>
   </QueryProvider>
   ```

3. **Handle loading state:** While `refreshUser()` is in-flight, `isLoading` should be `true` in the store. Components that render auth-conditional UI (landing page nav, header) should show a neutral state (e.g., no buttons, or a spinner) during this window.

4. **Token expiry handling:** `refreshUser()` calls `/auth/me` with the access token. If it fails (401), the store's `refreshUser()` already calls `logout()` — this is correct and covers expired token cleanup.

---

## Out of Scope
- Landing page CTA changes (that's TICKET-017, which depends on this ticket)
- Route guards/middleware (that's TICKET-006)
- "Remember me" logic (TICKET-016)

---

## Implementation Notes
- The `AuthInitializer` must be a `"use client"` component because it uses `useEffect`
- Place it at: `frontend/src/components/providers/auth-initializer.tsx`
- Use the store's existing `refreshUser()` — do not duplicate the `/auth/me` call
- The `isLoading` flag in `useAuthStore` should be set to `true` at the start of `refreshUser()` and `false` at the end (check if this is already the case in `auth.store.ts`)
- The initializer should only call `refreshUser()` once per app mount, not on every re-render — use `useEffect(() => { ... }, [])`
- If `isAuthenticated` is already `false` and there is no token in localStorage, skip the API call (read `apiClient.getAccessToken()` before calling)

---

## Acceptance Criteria
- [ ] Opening `localhost:3000` in a new tab while logged in does NOT show Sign In / Get Started buttons after hydration completes
- [ ] Opening `localhost:3000` in a new tab while logged out correctly shows Sign In / Get Started
- [ ] Refreshing any `/(main)/` page while logged in keeps the user logged in (no redirect to login)
- [ ] If the access token has expired, the app calls the refresh endpoint and re-authenticates silently (existing `apiClient` 401 retry logic should handle this)
- [ ] If both tokens are invalid/expired, the user is logged out and redirected to `/login` from protected pages

---

## Testing Requirements
- **Manual QA:**
  1. Login → open new tab → verify landing page shows user-authenticated nav
  2. Login → hard-refresh `/dashboard` → verify no redirect to login
  3. Manually clear access token from localStorage → refresh `/dashboard` → verify token refresh kicks in
  4. Manually clear both tokens → refresh `/dashboard` → verify redirect to login
- **Unit test:** Mock `authService.me()` returning user data; verify `AuthInitializer` calls `refreshUser()` once on mount
- **Regression:** Logout flow must still work (tokens cleared, redirect to landing)

---

## Affected Areas
- `frontend/src/app/layout.tsx`
- New: `frontend/src/components/providers/auth-initializer.tsx`
- `frontend/src/stores/auth.store.ts` (verify `isLoading` is set during `refreshUser`)
- `frontend/src/app/page.tsx` (will benefit from this fix; full CTA fix in TICKET-017)

---

## Risks / Edge Cases
- **SSR / hydration mismatch:** `AuthInitializer` must be `"use client"` and must not render auth-conditional HTML on the server
- **Race condition:** If `refreshUser()` is slow and the user navigates away, the setState call could update an unmounted component — use a cleanup flag or React 18 automatic batching should handle this
- **Multiple tabs:** Each tab independently calls `refreshUser()` — acceptable; all share the same localStorage tokens

---

## Open Questions
None — implementation path is clear.
