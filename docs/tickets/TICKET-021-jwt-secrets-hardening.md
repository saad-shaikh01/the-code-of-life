# Fail-Fast on Missing JWT Secrets at Application Startup

## Metadata
- **Ticket ID:** TICKET-021
- **Priority:** P3
- **Type:** bug
- **Area:** backend
- **Status:** done
- **Dependencies:** none

---

## Problem
The backend previously fell back to hardcoded JWT secrets when environment variables were missing:

```ts
secret: process.env.JWT_SECRET || 'default-secret-change-in-production'
```

That meant the app could start and issue valid tokens even when secure secrets were not configured.

---

## Why This Matters
This is a silent security failure. Missing configuration should stop the application at startup, not downgrade it to a known weak secret.

---

## Evidence
- `backend/src/modules/auth/auth.module.ts` used a default JWT signing fallback
- `backend/src/modules/auth/auth.service.ts` used a default refresh-token fallback
- `backend/src/modules/auth/jwt.strategy.ts` used the same insecure access-token fallback
- the repo’s local secrets were defined in `backend/.env`, but `ConfigModule` was pointed at `../.env`, which only contained `DATABASE_URL`

---

## Scope
1. Remove insecure JWT secret fallbacks
2. Fail fast when required env vars are missing
3. Document the required secrets in `backend/.env.example`
4. Keep the fix simple without adding a full config validation framework

---

## Out of Scope
- JWT secret rotation
- asymmetric JWT signing
- broader config refactors beyond the required env-path correction

---

## Implementation Notes
- Updated `AuthModule` to use `configService.getOrThrow<string>('JWT_SECRET')` instead of an insecure default.
- Updated `AuthService` to remove both fallback secrets:
  - refresh-token verification now uses a required `JWT_REFRESH_SECRET`
  - access-token and refresh-token signing now use required secrets fetched through private helper methods
- Updated `JwtStrategy` to require `JWT_SECRET` instead of falling back to a known value.
- Added `validateEnv()` in `backend/src/main.ts` and call it before `bootstrap()` when the app is executed directly.
- `validateEnv()` now requires:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
- Added `backend/src/main.spec.ts` to verify startup validation behavior for missing and present env vars.
- Repo-specific correction:
  - `ConfigModule.forRoot()` previously loaded only `../.env`
  - this repo keeps JWT secrets in `backend/.env`
  - updated `envFilePath` to `['.env', '../.env']` so backend-local secrets load first while still allowing root-level fallback values such as `DATABASE_URL`
- Added `backend/.env.example` documenting the required JWT secrets and database URL.
- Root `README.md` was not updated because it does not currently contain a setup/environment section.

---

## Acceptance Criteria
- [x] Starting the backend without `JWT_SECRET` set throws an error and exits; the app does not start
- [x] Starting the backend without `JWT_REFRESH_SECRET` set throws an error and exits
- [x] `backend/.env.example` documents both required variables
- [x] With valid env vars set, the app starts normally

---

## Testing Requirements
- **Automated coverage added:**
  1. `validateEnv()` throws when `JWT_SECRET` is missing
  2. `validateEnv()` throws when `JWT_REFRESH_SECRET` is missing
  3. `validateEnv()` passes when all required env vars are present
- **Regression validation run:**
  - targeted ESLint on touched backend files
  - full backend test suite
  - backend production build
- **Manual QA recommended:**
  1. Temporarily unset `JWT_SECRET` in the runtime environment and verify startup exits immediately
  2. Restore secrets and verify normal startup still works

---

## Affected Areas
- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/main.spec.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `backend/.env.example`

---

## Risks / Edge Cases
- The backend now correctly fails at startup if secrets are missing, which is the intended behavior but will immediately expose any misconfigured environments.
- Full config-schema validation is still not in place; this ticket only hardens the required JWT and database env checks.

---

## Open Questions
None.

---

## Files Changed
- `backend/src/app.module.ts`
- `backend/src/main.ts`
- `backend/src/main.spec.ts`
- `backend/src/modules/auth/auth.module.ts`
- `backend/src/modules/auth/auth.service.ts`
- `backend/src/modules/auth/jwt.strategy.ts`
- `backend/.env.example`
- `docs/tickets/TICKET-021-jwt-secrets-hardening.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npx eslint -- "src/app.module.ts" "src/main.ts" "src/main.spec.ts" "src/modules/auth/auth.module.ts" "src/modules/auth/auth.service.ts" "src/modules/auth/jwt.strategy.ts"`
- `backend`: `npm run test -- --runInBand`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- The full backend test suite still emits the existing mocked `BattleGateway` error logs during passing tests; that pre-existing harness behavior is unrelated to this ticket.
