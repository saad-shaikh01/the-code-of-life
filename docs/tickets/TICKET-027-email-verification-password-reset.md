# Add Email Delivery: Verification on Register + Reset Link for Forgot Password

## Metadata
- **Ticket ID:** TICKET-027
- **Priority:** P3
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** done
- **Dependencies:** TICKET-008

---

## Problem
Two email-dependent auth flows still lacked real delivery:
1. New accounts were created without any verification token or verification email
2. Forgot-password generated reset tokens, but only exposed them through the API instead of sending email

Without email delivery, the verification flow did not exist in practice and the reset flow was only usable in development.

---

## Why This Matters
- Email verification confirms ownership of the address attached to the account
- Password reset must work without exposing reset tokens in API responses
- A real mail channel is required for production auth flows and subscription communications

---

## Evidence
- `backend/src/modules/auth/auth.service.ts` originally registered users without `emailVerified` or `emailVerificationToken`
- `backend/prisma/schema.prisma` originally had no verification fields on `User`
- `forgotPassword()` still returned the reset token in the response in development
- No mail module or SMTP integration existed in `backend/src/modules/`

---

## Scope

### Backend
- Add `emailVerified` and `emailVerificationToken` to the `User` model
- Create a `MailModule` / `MailService` using Nodemailer + SMTP env config
- Update register flow to create and send hashed email-verification tokens
- Update forgot-password flow to email the reset URL instead of returning the raw token
- Add `GET /auth/verify-email`
- Add `POST /auth/resend-verification`
- Add `FRONTEND_URL` and SMTP variables to env docs and startup validation

### Frontend
- Add `/verify-email`
- Add a dismissible in-app verification banner for authenticated unverified users
- Add resend-verification client calls

---

## Out of Scope
- HTML email templating beyond minimal inline content
- Blocking login for unverified users
- Verification-token expiry fields beyond the prompt-required schema changes

---

## Implementation Notes
- Added `emailVerified Boolean @default(false)` and `emailVerificationToken String?` to `User`, then ran `npx prisma migrate dev --name add-email-verification`.
- Added `backend/src/modules/mail/mail.module.ts` and `backend/src/modules/mail/mail.service.ts` with Nodemailer-based SMTP delivery using:
  - `SMTP_HOST`
  - `SMTP_PORT`
  - `SMTP_USER`
  - `SMTP_PASS`
  - `SMTP_FROM`
- `MailService` gracefully logs and returns when SMTP is unconfigured or send fails, so local development still works.
- `AuthService.register()` now:
  - creates the user
  - generates a raw verification token
  - stores a bcrypt-hashed `emailVerificationToken`
  - sends the verification URL via `MailService`
  - logs the verification link in non-production environments
- `AuthService.forgotPassword()` now:
  - still generates and stores a hashed reset token + expiry
  - sends the reset URL via `MailService`
  - logs the reset link in non-production environments
  - returns `{ token: null }` instead of exposing the raw token in the API response
- Added `AuthService.verifyEmail()` and `AuthService.resendVerification()`:
  - verification compares the raw token against stored bcrypt hashes
  - successful verification sets `emailVerified=true` and clears the token
  - resend regenerates the token and rejects already-verified users with `400`
- Added `GET /auth/verify-email?token=...` and `POST /auth/resend-verification` in `AuthController`.
- Added `FRONTEND_URL` to `validateEnv()` required checks in `main.ts`.
- Added `/verify-email` in the frontend and a shared authenticated verification banner rendered from `(main)/layout.tsx`.
- Added `emailVerified` to the shared/user frontend types and updated the frontend auth-store test fixtures accordingly.
- Correction to the older ticket draft:
  - the implementation uses Nodemailer + SMTP as requested in the final prompt
  - no `emailVerificationExpiry` field was added because the final ticket scope only required `emailVerified` and `emailVerificationToken`

---

## Acceptance Criteria
- [x] Registering a new account sends a verification email
- [x] Clicking the link in the verification email sets `emailVerified: true`
- [x] Unverified users see a persistent banner in the main app
- [x] "Resend verification" button works
- [x] `POST /api/auth/forgot-password` sends a password reset email without returning the raw token in the response body
- [x] Reset link in email is wired end-to-end to the existing reset-password page
- [x] `backend/.env.example` documents `FRONTEND_URL` and all SMTP env vars

---

## Testing Requirements
- **Automated coverage added:**
  - `AuthService.register()` stores a hashed verification token and calls `sendVerificationEmail()`
  - `AuthService.forgotPassword()` stores a hashed reset token, calls `sendPasswordResetEmail()`, and returns `token: null`
  - `AuthService.verifyEmail()` verifies the token and updates the user
  - `AuthService.resendVerification()` regenerates the token and rejects already-verified users
  - `MailService` sends mail when SMTP is configured and gracefully skips when it is not
  - `validateEnv()` now requires `FRONTEND_URL`
- **Manual QA recommended:**
  1. Register a new account and confirm the verification URL is delivered through SMTP or logged in development
  2. Open the verification link and confirm the page verifies then redirects to login
  3. Sign in as an unverified user and confirm the banner appears, dismisses, and resends email
  4. Submit forgot-password and confirm the reset URL is delivered through SMTP or logged in development
  5. Open the reset link, set a new password, and sign in successfully

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260315050053_add_email_verification/migration.sql`
- `backend/.env.example`
- `backend/package.json`
- `package-lock.json`
- `backend/src/main.ts`
- `backend/src/main.spec.ts`
- `backend/src/modules/mail/mail.module.ts`
- `backend/src/modules/mail/mail.service.ts`
- `backend/src/modules/mail/mail.service.spec.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.service.spec.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `packages/shared/src/schemas/auth.schema.ts`
- `packages/shared/src/schemas/user.schema.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/api/services/auth.service.ts`
- `frontend/src/components/layout/email-verification-banner.tsx`
- `frontend/src/components/layout/index.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/app/(auth)/verify-email/page.tsx`
- `frontend/src/stores/__tests__/auth.store.test.ts`

---

## Risks / Edge Cases
- Verification tokens currently have no expiry because the final prompt only required `emailVerified` and `emailVerificationToken`; resend replaces the token, but old unused tokens otherwise remain valid until replaced or verified.
- SMTP misconfiguration no longer breaks auth flows, but it will silently degrade to logged links in development-style environments.
- Existing users created before this migration default to `emailVerified=false` and will see the verification banner until verified or dismissed.

---

## Open Questions
- `TICKET-028` remains a separate discovered follow-up outside the original `TICKET-001` through `TICKET-027` backlog.

---

## Files Changed
- `backend/prisma/schema.prisma`
- `backend/prisma/migrations/20260315050053_add_email_verification/migration.sql`
- `backend/.env.example`
- `backend/package.json`
- `package-lock.json`
- `backend/src/main.ts`
- `backend/src/main.spec.ts`
- `backend/src/modules/mail/mail.module.ts`
- `backend/src/modules/mail/mail.service.ts`
- `backend/src/modules/mail/mail.service.spec.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.service.spec.ts`
- `backend/src/modules/auth/auth.controller.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `packages/shared/src/schemas/auth.schema.ts`
- `packages/shared/src/schemas/user.schema.ts`
- `frontend/src/types/api.types.ts`
- `frontend/src/api/services/auth.service.ts`
- `frontend/src/components/layout/email-verification-banner.tsx`
- `frontend/src/components/layout/index.ts`
- `frontend/src/app/(main)/layout.tsx`
- `frontend/src/app/(auth)/verify-email/page.tsx`
- `frontend/src/stores/__tests__/auth.store.test.ts`
- `docs/tickets/TICKET-027-email-verification-password-reset.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npm install nodemailer`
- `backend`: `npm install -D @types/nodemailer`
- `backend`: `npx prisma migrate dev --name add-email-verification`
- `packages/shared`: `npm run build`
- `backend`: `npm run test -- auth.service.spec.ts mail.service.spec.ts main.spec.ts --runInBand`
- `backend`: `npm run test -- --runInBand`
- `backend`: `npm run build`
- `repo root`: `npx eslint -c backend/eslint.config.mjs "packages/shared/src/schemas/auth.schema.ts" "packages/shared/src/schemas/user.schema.ts"`
- `backend`: `npx eslint -- "src/main.ts" "src/main.spec.ts" "src/modules/mail/mail.module.ts" "src/modules/mail/mail.service.ts" "src/modules/mail/mail.service.spec.ts" "src/modules/auth/auth.module.ts" "src/modules/auth/auth.service.ts" "src/modules/auth/auth.controller.ts" "src/modules/auth/auth.service.spec.ts" "src/modules/auth/jwt.strategy.ts"`
- `frontend`: `npx eslint -- "src/types/api.types.ts" "src/api/services/auth.service.ts" "src/components/layout/email-verification-banner.tsx" "src/components/layout/index.ts" "src/app/(main)/layout.tsx" "src/app/(auth)/verify-email/page.tsx" "src/stores/__tests__/auth.store.test.ts"`
- `frontend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- The original `TICKET-001` through `TICKET-027` backlog is now implemented. `TICKET-028` remains a separate audit-discovered follow-up created during `TICKET-011`.
- The full backend suite still prints the existing mocked `BattleGateway` error logs and Jest open-handle warning during passing runs.
- Backend Jest still warns about compiling `packages/shared/dist/*.js` via `ts-jest`; this did not block the ticket.
