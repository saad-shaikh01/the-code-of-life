# Implement "Remember Me" Persistent Session on Login

## Metadata
- **Ticket ID:** TICKET-016
- **Priority:** P2
- **Type:** feature-gap
- **Area:** frontend
- **Status:** open
- **Dependencies:** TICKET-002 (auth hydration should be complete for consistent behavior)

---

## Problem
The login page has a "Remember me" checkbox, but it does nothing. The checkbox state is stored in local component state and is never used. All sessions currently behave the same regardless of whether the box is checked.

The intended behavior: if checked, tokens persist across browser closes (localStorage); if unchecked, tokens clear when the tab/browser closes (sessionStorage).

---

## Why This Matters
"Remember me" is a standard security/UX feature users expect. Without it:
- Users who don't want to re-login every session must always check the box (but can't)
- Users on shared computers cannot choose a session-only login

---

## Evidence
- `frontend/src/app/(auth)/login/page.tsx` — has `rememberMe` state (`useState(false)`) used only for UI rendering; never passed to `useAuthStore.login()`
- `frontend/src/stores/auth.store.ts` — `login()` always calls `apiClient.setTokens()` which stores in `localStorage`
- `frontend/src/api/client.ts` — `setTokens()` uses `localStorage.setItem()` unconditionally

---

## Scope

### 1. Update `apiClient.setTokens()` to accept a storage preference
```typescript
// api/client.ts
setTokens(accessToken: string, refreshToken: string, remember: boolean = true): void {
  const storage = remember ? localStorage : sessionStorage;
  storage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
  storage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
}
```

### 2. Update `getAccessToken()` and `getRefreshToken()` to check both storages
```typescript
private getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY)
    ?? sessionStorage.getItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
}
```

### 3. Update `clearTokens()` to clear from both
```typescript
clearTokens(): void {
  localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
}
```

### 4. Pass `rememberMe` from login page through to `apiClient.setTokens()`
In `useAuthStore.login()`:
```typescript
login: async (credentials, rememberMe = true) => {
  // ...call authService.login(credentials)...
  apiClient.setTokens(response.tokens.accessToken, response.tokens.refreshToken, rememberMe);
  // ...
}
```

In `login/page.tsx`:
```typescript
await login(credentials, rememberMe); // pass rememberMe flag
```

### 5. Zustand persist — also conditioned on rememberMe
The Zustand `persist` middleware stores `user` and `isAuthenticated` to `localStorage`. For non-remembered sessions, persist to `sessionStorage` instead. This may require conditionally configuring the persist storage:
```typescript
// In useAuthStore definition:
storage: {
  getItem: (name) => {
    const item = localStorage.getItem(name) ?? sessionStorage.getItem(name);
    return item ? JSON.parse(item) : null;
  },
  setItem: (name, value) => {
    const remember = /* read from a non-reactive flag */;
    (remember ? localStorage : sessionStorage).setItem(name, JSON.stringify(value));
  },
  removeItem: (name) => {
    localStorage.removeItem(name);
    sessionStorage.removeItem(name);
  },
}
```

---

## Out of Scope
- Backend session management changes (JWT expiry stays the same)
- Multi-device session management

---

## Implementation Notes
- The remember-me preference needs to survive for the duration of the session to be used in the Zustand persist storage. Store it as a non-persisted flag or in sessionStorage itself.
- Keep it simple: a module-level `let rememberMeFlag = true` that gets set during login is sufficient for this scope
- `sessionStorage` clears automatically when the browser tab/window closes — this is the "not remembered" behavior

---

## Acceptance Criteria
- [ ] "Remember me" checked + login: tokens in `localStorage`; reopening browser keeps user logged in
- [ ] "Remember me" unchecked + login: tokens in `sessionStorage`; closing browser logs user out
- [ ] Logout clears tokens from both storages regardless of remember-me setting
- [ ] The checkbox visually reflects its state (already working — just needs to be functional)

---

## Testing Requirements
- **Manual QA:**
  1. Login with "Remember me" checked → close browser → reopen → verify still logged in
  2. Login with "Remember me" unchecked → close browser → reopen → verify logged out
- **Regression:** Normal login/logout flow must still work

---

## Affected Areas
- `frontend/src/api/client.ts`
- `frontend/src/stores/auth.store.ts`
- `frontend/src/app/(auth)/login/page.tsx`

---

## Risks / Edge Cases
- If a user has tokens in both localStorage and sessionStorage (edge case from migration), `getAccessToken()` should prefer localStorage
- sessionStorage is per-tab — opening a second tab will not have the session; this is expected behavior for "not remembered" sessions

---

## Open Questions
None.
