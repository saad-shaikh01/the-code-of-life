# Fail-Fast on Missing JWT Secrets at Application Startup

## Metadata
- **Ticket ID:** TICKET-021
- **Priority:** P3
- **Type:** bug
- **Area:** backend
- **Status:** open
- **Dependencies:** none

---

## Problem
`auth.module.ts` configures JWT with hardcoded fallback secrets:
```typescript
secret: process.env.JWT_SECRET || 'default-secret-change-in-production'
```
If `JWT_SECRET` or `JWT_REFRESH_SECRET` env vars are not set (e.g., missing `.env` file, misconfigured deployment), the application starts and issues tokens signed with a publicly known weak secret. Any attacker who knows this default can forge valid JWTs.

---

## Why This Matters
This is a silent security failure. The app "works" but tokens are compromised. In a development environment it's inconvenient; in production it's a critical vulnerability.

---

## Evidence
- `backend/src/modules/auth/auth.module.ts` — `process.env.JWT_SECRET || 'default-secret-change-in-production'`
- `backend/src/modules/auth/auth.module.ts` — `process.env.JWT_REFRESH_SECRET || 'refresh-secret'`

---

## Scope
Replace the fallback with an explicit startup check:

```typescript
// auth.module.ts
const jwtSecret = process.env.JWT_SECRET;
const refreshSecret = process.env.JWT_REFRESH_SECRET;

if (!jwtSecret || !refreshSecret) {
  throw new Error(
    'FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables. ' +
    'Application cannot start without secure JWT secrets.'
  );
}

JwtModule.register({
  secret: jwtSecret,
  signOptions: { expiresIn: '15m' },
})
```

Also add both variables to:
- `backend/.env.example` with a comment explaining what they are
- Root `README.md` (if it has a setup section)

---

## Out of Scope
- JWT secret rotation
- Asymmetric keys (RS256)

---

## Acceptance Criteria
- [ ] Starting the backend without `JWT_SECRET` set throws an error and exits — app does not start
- [ ] Starting the backend without `JWT_REFRESH_SECRET` set throws an error and exits
- [ ] `backend/.env.example` documents both required variables
- [ ] With valid env vars set, the app starts normally

---

## Testing Requirements
- **Manual test:** Unset `JWT_SECRET` → start backend → verify error thrown and process exits
- **Regression:** Normal startup with env vars set works correctly

---

## Affected Areas
- `backend/src/modules/auth/auth.module.ts`
- `backend/.env.example`

---

## Risks / Edge Cases
- If using NestJS `ConfigModule` with validation (e.g., Joi or Zod), consider moving the validation there for consistency — but a direct check in the module is simpler and sufficient

---

## Open Questions
None.
