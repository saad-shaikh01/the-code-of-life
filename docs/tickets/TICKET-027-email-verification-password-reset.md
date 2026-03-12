# Add Email Delivery: Verification on Register + Reset Link for Forgot Password

## Metadata
- **Ticket ID:** TICKET-027
- **Priority:** P3
- **Type:** feature-gap
- **Area:** multi-area
- **Status:** open
- **Dependencies:** TICKET-008 (forgot/reset password token flow must be implemented first)

---

## Problem
Two email-dependent flows are missing real email delivery:
1. **Email verification on registration:** New accounts are created immediately without verifying the email address. A user can register with `someone.else@gmail.com` and start playing.
2. **Password reset email:** TICKET-008 implements the reset token flow, but returns the token in the API response (dev mode). Production requires sending the token via email.

---

## Why This Matters
- **Email verification:** Protects against bot accounts and ensures communication channels work. Required by many email providers' anti-spam policies.
- **Password reset:** Without email delivery, users on production cannot self-serve reset their password — the feature is non-functional for real users.
- Stripe may require email verification for subscription management.

---

## Evidence
- `backend/src/modules/auth/auth.service.ts` — `register()` creates user without email verification
- `backend/prisma/schema.prisma` — `User` model has no `emailVerified` field
- TICKET-008 implements reset token but explicitly defers email delivery to this ticket

---

## Scope

### Phase 1 — Email Service

**1. Install email dependencies:**
```bash
cd backend && npm install nodemailer @types/nodemailer
# OR: npm install resend (simpler API, no SMTP config needed)
```

**2. Create `MailModule` and `MailService`:**
New: `backend/src/modules/mail/mail.module.ts`
New: `backend/src/modules/mail/mail.service.ts`

```typescript
@Injectable()
export class MailService {
  async sendPasswordReset(to: string, resetUrl: string): Promise<void> {
    await this.transporter.sendMail({
      to,
      subject: 'Reset Your Password - The Code of Life',
      html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`,
    });
  }

  async sendEmailVerification(to: string, verificationUrl: string): Promise<void> {
    await this.transporter.sendMail({
      to,
      subject: 'Verify Your Email - The Code of Life',
      html: `<p>Click <a href="${verificationUrl}">here</a> to verify your email.</p>`,
    });
  }
}
```

**Config env vars:**
```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your-app-password
MAIL_FROM=noreply@codeoflife.dev
```
(Or for Resend: `RESEND_API_KEY=re_xxx`)

### Phase 2 — Email Verification on Register

**3. Add to `User` Prisma model (run migration):**
```prisma
emailVerified          Boolean   @default(false)
emailVerificationToken String?
```

**4. Update `AuthService.register()`:**
- Set `emailVerified: false`, generate a verification token (UUID), store in `emailVerificationToken`
- Call `mailService.sendEmailVerification(email, url)`
- User can log in without verifying (soft gate), but show a persistent banner: "Please verify your email"

**5. Add `GET /api/auth/verify-email?token=xxx` endpoint:**
- Find user by `emailVerificationToken`
- Set `emailVerified: true`, clear `emailVerificationToken`
- Return success

**6. Frontend — verification banner:**
In `(main)/layout.tsx`, if `user.emailVerified === false`:
```tsx
<Banner>
  Please verify your email address.
  <Button onClick={resendVerification}>Resend verification email</Button>
</Banner>
```
Add `POST /api/auth/resend-verification` endpoint.

### Phase 3 — Wire Reset Email (extends TICKET-008)

**7. Update `AuthService.forgotPassword()`:**
- Instead of returning token in response body, call `mailService.sendPasswordReset(email, resetUrl)`
- Return `{ message: "If an account exists, a reset email has been sent" }` (no token in body)

---

## Out of Scope
- Email templates with HTML styling (plain text is acceptable for this ticket)
- Blocking login for unverified emails
- Two-factor authentication via email

---

## Implementation Notes
- Use Resend SDK instead of Nodemailer if setting up SMTP is too complex for dev — Resend provides a free tier and a simple `send()` API
- For local development without SMTP: use `ethereal.email` (free fake SMTP) or just log emails to console via a conditional
- Store email templates inline (no separate template engine needed at this stage)

---

## Acceptance Criteria
- [ ] Registering a new account sends a verification email
- [ ] Clicking the link in the verification email sets `emailVerified: true`
- [ ] Unverified users see a persistent banner in the main app
- [ ] "Resend verification" button works
- [ ] `POST /api/auth/forgot-password` sends a password reset email (not returning token in body)
- [ ] Reset link in email works end-to-end
- [ ] `backend/.env.example` documents all SMTP/Resend env vars

---

## Testing Requirements
- **Manual QA (using Ethereal or Resend sandbox):**
  1. Register → check inbox → click verification link → verify `emailVerified: true`
  2. Submit forgot-password form → check inbox → click link → reset password → login
- **Unit test `MailService`:** Mock transporter and verify `sendMail()` called with correct parameters

---

## Affected Areas
- `backend/prisma/schema.prisma`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/auth.controller.ts`
- New: `backend/src/modules/mail/mail.module.ts`
- New: `backend/src/modules/mail/mail.service.ts`
- `backend/src/app.module.ts` (import MailModule)
- `frontend/src/app/(main)/layout.tsx` (verification banner)
- `frontend/src/types/api.types.ts` (add `emailVerified` to `User` interface)
- `backend/.env.example`

---

## Risks / Edge Cases
- SMTP credentials in env must never be committed to git
- If email sending fails (SMTP timeout), the registration should still succeed — wrap `sendMail` in a try-catch and log the error rather than rolling back registration
- Verification tokens should have an expiry (e.g., 24 hours) — users who don't verify within 24h need a resend

---

## Open Questions
- Should unverified users be blocked from purchasing subscriptions? (Currently assumed: soft gate, banner only — no hard block)
