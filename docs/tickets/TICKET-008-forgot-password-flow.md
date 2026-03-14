# Implement Forgot / Reset Password Minimal Flow

## Metadata
- **Ticket ID:** TICKET-008
- **Priority:** P1
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** done
- **Dependencies:** none (`TICKET-027` extends this with real email delivery)

---

## Problem
The login page linked to `/forgot-password`, but no page or backend flow existed for password recovery. Users who forgot their password had no self-service recovery path.

---

## Why This Matters
Without password reset, any user who forgets their password must abandon the account or rely on support that does not exist.

---

## Evidence
- `frontend/src/app/(auth)/login/page.tsx` linked to `/forgot-password`
- No `frontend/src/app/(auth)/forgot-password/` page existed
- No `frontend/src/app/(auth)/reset-password/` page existed
- `backend/src/modules/auth/auth.controller.ts` had no forgot/reset endpoints
- `backend/prisma/schema.prisma` had no password reset token fields

---

## Scope
1. Add password reset token fields to the `User` model and create a migration
2. Add public `forgot-password` and `reset-password` auth endpoints
3. Return the reset token in the API response in dev mode only
4. Add `/forgot-password` and `/reset-password` frontend pages using the existing auth layout style

---

## Out of Scope
- Real email delivery (`TICKET-027`)
- Email verification on registration (`TICKET-027`)
- Two-factor authentication

---

## Implementation Notes
- Added `passwordResetToken` and `passwordResetExpiry` to `User` in Prisma and created/applied migration `20260313111725_add_password_reset_fields`
- The new Neon dev database had schema drift because the existing migrations had never been recorded in `_prisma_migrations`; resolved non-destructively with `prisma migrate resolve --applied ...` for the three existing migrations before running the new migration
- Added shared Zod schemas for `forgotPassword` and `resetPassword` in `packages/shared/src/schemas/auth.schema.ts`
- `AuthService.forgotPassword()` now:
  - returns success for unknown emails without updating any user
  - generates a random 32-byte token
  - hashes the token with bcrypt before storage
  - stores a 1-hour expiry
  - logs and returns the raw token in dev mode only
- `AuthService.resetPassword()` now:
  - queries users with non-null reset tokens and future expiries
  - compares the provided token against stored hashes
  - updates the password and clears reset fields on success
  - throws `UnauthorizedException` on invalid or expired tokens
- Added public controller endpoints:
  - `POST /auth/forgot-password`
  - `POST /auth/reset-password`
- Added frontend auth service methods plus two new auth pages:
  - `/forgot-password`
  - `/reset-password?token=...`
- `reset-password` uses a `Suspense` boundary so Next.js 16 can prerender the page while still reading `useSearchParams()` client-side
- Corrected contract note: the original ticket text said invalid reset tokens should return `400`, but the final implementation prompt explicitly required `UnauthorizedException`, so the shipped behavior is `401`

---

## Acceptance Criteria
- [x] `POST /api/auth/forgot-password` returns `200` for valid and invalid emails (no enumeration by status)
- [x] In dev mode, reset token is logged and returned in response body
- [x] `POST /api/auth/reset-password` with valid token updates password and clears token
- [x] `POST /api/auth/reset-password` with expired or invalid token returns `401`
- [x] `/forgot-password` page renders correctly and submits email
- [x] `/reset-password?token=xxx` page renders and submits new password
- [x] After successful reset, user can log in with new password
- [x] Login page "Forgot password?" link no longer 404s

---

## Testing Requirements
- **Unit tests added:**
  - `AuthService.forgotPassword()` stores hashed token and expiry
  - `AuthService.resetPassword()` updates password and clears reset fields
  - `AuthService.resetPassword()` rejects expired or invalid tokens
- **Manual QA scenarios to run:**
  1. Click "Forgot password?" and verify `/forgot-password` loads
  2. Submit an email and verify a token is returned in dev mode
  3. Visit `/reset-password?token=<token>`, set a new password, and verify login works
  4. Try reset with an invalid or expired token and verify the error state is shown

---

## Affected Areas
- `packages/shared/src/schemas/auth.schema.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260313111725_add_password_reset_fields/migration.sql`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.service.spec.ts`
- `frontend/src/api/services/auth.service.ts`
- `frontend/src/types/api.types.ts`
- New: `frontend/src/app/(auth)/forgot-password/page.tsx`
- New: `frontend/src/app/(auth)/reset-password/page.tsx`

---

## Risks / Edge Cases
- Returning the token in the response is intentionally dev-only and must be replaced by real email delivery in `TICKET-027`
- Reset-token lookup scans current unexpired candidates because the stored token is hashed; that is acceptable for the minimal flow
- Rate limiting is still out of scope for this ticket

---

## Open Questions
None.

---

## Files Changed
- `packages/shared/src/schemas/auth.schema.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260313111725_add_password_reset_fields/migration.sql`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.service.spec.ts`
- `frontend/src/api/services/auth.service.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/app/(auth)/forgot-password/page.tsx`
- `frontend/src/app/(auth)/reset-password/page.tsx`
- `docs/tickets/TICKET-008-forgot-password-flow.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npx prisma migrate resolve --applied 20260129052018_init`
- `backend`: `npx prisma migrate resolve --applied 20260205004409_add_subscription_model`
- `backend`: `npx prisma migrate resolve --applied 20260205011706_add_growth_points`
- `backend`: `npx prisma migrate dev --name add-password-reset-fields`
- `packages/shared`: `npm run build`
- `backend`: `npm run test -- auth.service.spec.ts`
- `backend`: `npm run test`
- `backend`: `npx eslint -- "src/modules/auth/auth.controller.ts" "src/modules/auth/auth.service.ts" "src/modules/auth/auth.service.spec.ts"`
- `backend`: `npm run build`
- `frontend`: `npx eslint -- "src/api/services/auth.service.ts" "src/types/api.types.ts" "src/app/(auth)/forgot-password/page.tsx" "src/app/(auth)/reset-password/page.tsx"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-13.
- Browser manual QA was not executed in this terminal session; the required scenarios are listed above.
- `packages/shared` has no standalone ESLint config in this repo, so validation there was performed via `npm run build`.
