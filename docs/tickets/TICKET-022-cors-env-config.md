# Make CORS Origins Configurable via Environment Variables

## Metadata
- **Ticket ID:** TICKET-022
- **Priority:** P3
- **Type:** tech-debt
- **Area:** backend
- **Status:** done
- **Dependencies:** none

---

## Problem
`backend/src/main.ts` hardcoded the allowed CORS origins to localhost values. That meant production deployments required a code change just to allow the real frontend domain.

---

## Why This Matters
Origin configuration belongs in the environment, not the build. Keeping it hardcoded couples deployment domains to source changes and makes production setup brittle.

---

## Evidence
- `backend/src/main.ts` previously used:
  - `http://localhost:3000`
  - `http://127.0.0.1:3000`
- no environment variable existed to override the allowed origins list

---

## Scope
1. Read CORS origins from `ALLOWED_ORIGINS` when set
2. Keep the existing localhost fallback when the env var is missing
3. Document the variable in `backend/.env.example`
4. Do not change any other CORS settings

---

## Out of Scope
- Per-route CORS configuration
- CORS preflight caching
- Making `ALLOWED_ORIGINS` a required env var

---

## Implementation Notes
- Added `allowedOrigins` in `backend/src/main.ts`:
  - reads `process.env.ALLOWED_ORIGINS`
  - splits on commas
  - trims each origin
  - filters out blank entries with `.filter(Boolean)`
  - falls back to `['http://localhost:3000', 'http://127.0.0.1:3000']` when unset
- Left all other CORS settings unchanged:
  - `credentials: true`
  - existing methods list
  - existing headers list
- Added `ALLOWED_ORIGINS` to `backend/.env.example` with an explanatory comment and localhost default example.
- `validateEnv()` in `main.ts` was intentionally left unchanged. `ALLOWED_ORIGINS` remains optional per ticket scope.

---

## Acceptance Criteria
- [x] CORS origins are read from `ALLOWED_ORIGINS` env var when set
- [x] Falls back to localhost origins when env var is not set (no breaking change in dev)
- [x] `backend/.env.example` documents the variable
- [x] Setting `ALLOWED_ORIGINS=https://production.example.com` allows that origin

---

## Testing Requirements
- **Automated validation run:**
  - targeted ESLint on `src/main.ts`
  - backend production build
- **Manual QA recommended:**
  1. Set `ALLOWED_ORIGINS=https://example.com` and verify only that origin is allowed
  2. Unset `ALLOWED_ORIGINS` and verify localhost still works in development

---

## Affected Areas
- `backend/src/main.ts`
- `backend/.env.example`

---

## Risks / Edge Cases
- If `ALLOWED_ORIGINS` is set incorrectly, legitimate frontend requests will be blocked until the env value is corrected.
- Blank comma-separated entries are filtered out, so `ALLOWED_ORIGINS=""` results in an empty allowed-origin list rather than `['']`.

---

## Open Questions
None.

---

## Files Changed
- `backend/src/main.ts`
- `backend/.env.example`
- `docs/tickets/TICKET-022-cors-env-config.md`
- `docs/tickets/README.md`

---

## Validation Performed
- `backend`: `npx prettier --write "src/main.ts"`
- `backend`: `npx eslint -- "src/main.ts"`
- `backend`: `npm run build`

---

## Follow-up Notes
- Completed: 2026-03-15.
- Manual browser/origin QA was not run in this terminal session.
