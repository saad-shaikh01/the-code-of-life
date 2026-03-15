# Implement "Remember Me" Persistent Session on Login

## Metadata
- **Ticket ID:** TICKET-016
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** done
- **Dependencies:** TICKET-002

---

## Problem
The login page already rendered a "Remember me" checkbox, but the checkbox only affected local component state. All successful logins behaved the same way and always used persistent storage.

The intended behavior is:
- checked: persist auth across browser restarts
- unchecked: keep auth only for the current browser session

---

## Why This Matters
Users expect "Remember me" to control whether a device stays logged in. Without that choice:
- shared-computer sessions stay persistent when they should not
- session-only users cannot opt out of browser-restored auth

---

## Evidence
- `frontend/src/app/(auth)/login/page.tsx` had `rememberMe` UI state that was never passed into auth logic
- `frontend/src/stores/auth.store.ts` always stored auth through `apiClient.setTokens()` with persistent storage semantics
- `frontend/src/api/client.ts` always read and wrote tokens through `localStorage`

---

## Scope
1. Route login persistence based on the checkbox value
2. Persist non-remembered sessions in `sessionStorage`
3. Persist remembered sessions in `localStorage`
4. Make hydration and API token reads work with either storage
5. Keep the routing cookie in sync with the actual storage mode

---

## Out of Scope
- Backend token TTL changes
- Server-side session changes
- Multi-device session management

---

## Implementation Notes
- Added `rememberMe` to `useAuthStore` state and to the persisted auth snapshot.
- `login(credentials, rememberMe)` now stores tokens according to the checkbox value:
  - `rememberMe=true` -> `localStorage`
  - `rememberMe=false` -> `sessionStorage`
- Token reads in `apiClient` now check:
  - `sessionStorage` first
  - `localStorage` second
- `clearTokens()` now clears both storages and removes the persisted auth snapshot from both.
- The persisted Zustand auth state now uses a custom storage adapter that:
  - rehydrates from `sessionStorage` first, then `localStorage`
  - writes back to the correct storage based on persisted `rememberMe`
  - removes stale copies from the alternate storage
- Added a migration-safe fallback:
  - if older persisted auth state does not include `rememberMe`, the store infers it from the storage source during rehydrate
- `login/page.tsx` now passes the checkbox value to `useAuthStore.login()`
- `AuthInitializer` now syncs the routing cookie before deciding whether a stored session exists
- Cookie behavior needed one extra fix beyond the original ticket text:
  - remembered sessions use a persistent `auth_session` cookie
  - non-remembered sessions use a session cookie
  - this keeps middleware behavior consistent after the browser closes
- `register()` continues to use persistent storage so existing registration behavior is preserved

---

## Acceptance Criteria
- [x] "Remember me" checked + login stores tokens in `localStorage`
- [x] "Remember me" unchecked + login stores tokens in `sessionStorage`
- [x] Logout clears tokens from both storages regardless of remember-me setting
- [x] The checkbox now affects real auth persistence instead of only local UI state

---

## Testing Requirements
- **Automated validation available in this repo:**
  - targeted ESLint on touched frontend files
  - `frontend` production build
- **Manual QA recommended:**
  1. Login with "Remember me" checked, close the browser, reopen, and confirm the session persists
  2. Login with "Remember me" unchecked, close the browser, reopen, and confirm the session is gone
  3. Verify logout clears both `localStorage` and `sessionStorage`
  4. Verify a session-only login still hydrates correctly on normal refresh within the same tab/session

---

## Affected Areas
- `frontend/src/api/client.ts`
- `frontend/src/stores/auth.store.ts`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/components/providers/auth-initializer.tsx`

---

## Risks / Edge Cases
- Session-only auth is intentionally per-tab/per-browser-session; opening a new browser session without remembered storage will require login again.
- If both storages somehow contain tokens from older behavior, the client now prefers `sessionStorage` first per the ticket instruction, and new writes clear the alternate storage to collapse back to one source of truth.

---

## Open Questions
None.

---

## Files Changed
- `frontend/src/api/client.ts`
- `frontend/src/stores/auth.store.ts`
- `frontend/src/app/(auth)/login/page.tsx`
- `frontend/src/components/providers/auth-initializer.tsx`
- `docs/tickets/TICKET-016-remember-me.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `frontend`: `npx eslint -- "src/api/client.ts" "src/stores/auth.store.ts" "src/app/(auth)/login/page.tsx" "src/components/providers/auth-initializer.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Manual browser QA was not run in this terminal session.
- No backend changes were required.
