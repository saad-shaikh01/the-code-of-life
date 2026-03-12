# Implement Forgot / Reset Password Minimal Flow

## Metadata
- **Ticket ID:** TICKET-008
- **Priority:** P1
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** open
- **Dependencies:** none (TICKET-027 extends this with real email delivery)

---

## Problem
The login page (`login/page.tsx:146`) has a "Forgot password?" link pointing to `/forgot-password`. This page does not exist — users get a 404. There are also no backend endpoints for requesting or completing a password reset.

Users who forget their password have no self-service recovery path. This is a critical gap for any production application.

---

## Why This Matters
Without password reset, any user who forgets their password must contact support (which doesn't exist) or abandon their account. This is a production blocker.

---

## Evidence
- `frontend/src/app/(auth)/login/page.tsx:146` — link to `/forgot-password` exists
- No `frontend/src/app/(auth)/forgot-password/` directory exists
- No `frontend/src/app/(auth)/reset-password/` directory exists
- `backend/src/modules/auth/auth.controller.ts` — no `forgot-password` or `reset-password` endpoints
- `backend/prisma/schema.prisma` — `User` model has no reset token fields

---

## Scope

### Backend

**1. Prisma schema — add to `User` model:**
```prisma
passwordResetToken    String?
passwordResetExpiry   DateTime?
```
Run `npx prisma migrate dev --name add-password-reset-token`

**2. `POST /api/auth/forgot-password`** (public endpoint):
- Accept `{ email: string }`
- Find user by email (if not found, return 200 silently to prevent enumeration)
- Generate token: `crypto.randomBytes(32).toString('hex')`
- Hash token: `bcrypt.hash(token, 10)` before storing
- Store `passwordResetToken` (hashed) and `passwordResetExpiry` (now + 1 hour) on user
- **In dev mode:** Return `{ resetToken: token }` in response body + `console.log` the reset URL
- **When TICKET-027 is done:** Send email instead of returning token in response

**3. `POST /api/auth/reset-password`** (public endpoint):
- Accept `{ token: string, newPassword: string }`
- Find user where `passwordResetExpiry > now`
- For each candidate, `bcrypt.compare(token, user.passwordResetToken)`
- If valid: update password (`bcrypt.hash(newPassword, 12)`), clear `passwordResetToken` and `passwordResetExpiry`
- If invalid or expired: return 400

### Frontend

**4. New page `/forgot-password`** (`frontend/src/app/(auth)/forgot-password/page.tsx`):
- Email input field
- On submit: call `POST /api/auth/forgot-password`
- On success: show "If an account exists with this email, you will receive a reset link" (or in dev: show the token link)
- Match the auth layout style (centered card, same as login/register)

**5. New page `/reset-password`** (`frontend/src/app/(auth)/reset-password/page.tsx`):
- Reads `?token=xxx` from query params
- New password + confirm password fields
- On submit: call `POST /api/auth/reset-password` with `{ token, newPassword }`
- On success: show "Password changed" + link to login
- On error: show "Invalid or expired reset link"

**6. Auth service** (`frontend/src/api/services/auth.service.ts`):
- Add `forgotPassword(email: string)` method
- Add `resetPassword(token: string, newPassword: string)` method

---

## Out of Scope
- Real email delivery (TICKET-027)
- Email verification on registration (TICKET-027)
- The 2FA flow

---

## Implementation Notes
- Use `crypto` (Node.js built-in) for token generation — no extra package needed
- Store the HASHED token in DB, compare at reset time — never store plain tokens
- The "find user by reset token" query: since tokens are hashed, you cannot query by token directly. Options:
  - Store both plain token (for lookup) and hash (for verification) — NOT recommended
  - Use a separate `PasswordResetRequest` table with an index on a short token prefix — more complex
  - **Recommended:** Use a UUID token (not bcrypt hash), store it plain in DB as `passwordResetToken` — the security is in the 1-hour expiry and the random token entropy, not bcrypt
- Revise approach: `passwordResetToken` stores the raw UUID token; no bcrypt needed for the token itself (bcrypt is used for passwords only). Just ensure the token is cryptographically random.
- Match the visual style of existing auth pages (centered card, gradient background, same font/colors)

---

## Acceptance Criteria
- [ ] `POST /api/auth/forgot-password` returns 200 for valid and invalid emails (no enumeration)
- [ ] In dev mode, reset token is logged and returned in response body
- [ ] `POST /api/auth/reset-password` with valid token updates password and clears token
- [ ] `POST /api/auth/reset-password` with expired or invalid token returns 400
- [ ] `/forgot-password` page renders correctly and submits email
- [ ] `/reset-password?token=xxx` page renders and submits new password
- [ ] After successful reset, user can log in with new password
- [ ] Login page "Forgot password?" link no longer 404s

---

## Testing Requirements
- **Unit tests:**
  - `AuthService.forgotPassword()` — verify token stored, expiry set
  - `AuthService.resetPassword()` — verify password updated, token cleared
  - `AuthService.resetPassword()` with expired token — verify 400
- **Manual QA:**
  1. Click "Forgot password?" → verify `/forgot-password` loads
  2. Submit email → verify token in response (dev mode)
  3. Visit `/reset-password?token=<token>` → set new password → verify login works
  4. Try reset with expired token → verify error shown

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- New: `frontend/src/app/(auth)/forgot-password/page.tsx`
- New: `frontend/src/app/(auth)/reset-password/page.tsx`
- `frontend/src/api/services/auth.service.ts`

---

## Risks / Edge Cases
- Token stored in DB should be indexed for lookup performance
- If `forgotPassword` is called multiple times for the same email, overwrite the existing token (don't create duplicates)
- Rate limit this endpoint in the future (TICKET's scope is the flow itself, not rate limiting)

---

## Open Questions
None for this ticket. Email delivery is explicitly deferred to TICKET-027.
