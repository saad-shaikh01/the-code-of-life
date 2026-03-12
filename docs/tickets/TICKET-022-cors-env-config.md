# Make CORS Origins Configurable via Environment Variables

## Metadata
- **Ticket ID:** TICKET-022
- **Priority:** P3
- **Type:** tech-debt
- **Area:** backend
- **Status:** open
- **Dependencies:** none

---

## Problem
`backend/src/main.ts` hardcodes CORS allowed origins:
```typescript
origin: ['http://localhost:3000', 'http://127.0.0.1:3000']
```
Deploying to production (e.g., `https://codeoflife.app`) requires a code change and redeploy just to update the CORS config. This is an unnecessary code-to-environment coupling.

---

## Why This Matters
Without this fix, production deployment requires modifying `main.ts` — meaning the production build differs from the development build in a non-obvious way. Any future domain change also requires a code change.

---

## Evidence
- `backend/src/main.ts` — hardcoded localhost origins

---

## Scope
```typescript
// main.ts
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://127.0.0.1:3000'];

app.enableCors({
  origin: allowedOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
});
```

Add to `backend/.env.example`:
```
ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
```

---

## Out of Scope
- CORS preflight caching
- Per-route CORS configuration

---

## Acceptance Criteria
- [ ] CORS origins are read from `ALLOWED_ORIGINS` env var when set
- [ ] Falls back to localhost origins when env var is not set (no breaking change in dev)
- [ ] `backend/.env.example` documents the variable
- [ ] Setting `ALLOWED_ORIGINS=https://production.example.com` allows that origin

---

## Testing Requirements
- **Manual test:** Set `ALLOWED_ORIGINS=https://example.com` → start backend → verify localhost requests are blocked, example.com is allowed
- **Regression:** Dev setup without env var still allows localhost

---

## Affected Areas
- `backend/src/main.ts`
- `backend/.env.example`

---

## Risks / Edge Cases
- If `ALLOWED_ORIGINS` is set to an empty string, `split(',')` produces `['']` — add a filter: `.filter(Boolean)`

---

## Open Questions
None.
