# The Code of Life — Ticket Backlog

> **Audit Date:** 2026-03-12
> **Auditor:** Claude Code (Senior Technical Auditor)
> **Scope:** Full monorepo audit — NestJS backend, Next.js frontend, shared packages, Prisma schema, seed data

---

## 0. Implementation Progress

- `TICKET-001`: completed on 2026-03-12.
- `TICKET-002`: completed on 2026-03-12.
- `TICKET-003`: completed on 2026-03-13.
- `TICKET-004`: completed on 2026-03-13. Canonical streak rules are now defined in `docs/product-rules/streak.md` for `TICKET-005`.
- `TICKET-005`: completed on 2026-03-13. UTC streak logic is now centralized in `UsersService.updateStreak()`, and login no longer mutates `lastPlayedAt`.
- `TICKET-006`: completed on 2026-03-13. Middleware-based route guards now protect all `/(main)` routes, and auth sessions are mirrored into an `auth_session` cookie for routing.
- `TICKET-007`: completed on 2026-03-13. Daily puzzle fallback now stays within `DAILY` puzzles, and free-tier users no longer fire or surface `403` entitlement errors in the daily hook.
- `TICKET-008`: completed on 2026-03-13. Minimal forgot/reset password flow is now live with dev-mode reset tokens returned in the API response and two new auth pages.
- `TICKET-009`: completed on 2026-03-15. Dashboard achievements now use `useUserAchievements()` data, including real unlocked counts, loading skeletons, and an empty state.
- `TICKET-010`: completed on 2026-03-15. Battle sockets now use app-level heartbeat, bounded reconnect + room rejoin logic, stronger waiting/error UX, and a forfeit confirmation dialog.

---

## 1. Audit Summary

"The Code of Life" is a well-architected interactive puzzle game with a solid technical foundation: NestJS 11 backend, Next.js 16 App Router frontend, Prisma/PostgreSQL, Socket.IO battle, and Stripe billing. The stack is modern and the code is generally clean. However, the audit found **3 critical bugs, 7 high-priority gaps, and 17 medium/low issues** that collectively prevent the game from being production-ready.

The most severe issue is a **complete cipher system mismatch**: the core encoder/decoder uses Unicode symbols instead of the numerical substitution system (A=1…Z=26) specified in the source book. Every puzzle in the database is encoded incorrectly, and the frontend tokenization logic fails on multi-character numeric tokens. This makes every puzzle unsolvable as intended.

The second most severe issue is **auth state not hydrating on new tab**: the landing page always shows "Sign In" buttons to logged-in users because the root layout never calls `refreshUser()`. The third critical issue is **battle mode user identification**: hardcoded array indices (`players[0]`, `results[0]`) cause the wrong player's data to be shown.

Beyond critical bugs, several features are partially implemented (growth avatar, streak logic, decoder UI) and others are missing entirely (forgot password, route guards, legal pages, admin RBAC, test infrastructure).

**Key finding:** Several status documents (`CURRENT_STATUS.md`, `TESTING_STATUS.md`, `BACKEND_STATUS.md`) claim features are "complete" or "tested" — the audit found these claims unreliable. The audit checklist (`_audit-checklist.md`) reflects actual code state, not documentation claims.

---

## 2. Feature-by-Feature Gap Matrix

| Feature | Status | P0 | P1 | P2 | P3 |
|---|---|---|---|---|---|
| Cipher system | Done | TICKET-001 | — | — | — |
| Auth hydration | Done | TICKET-002 | — | — | — |
| Battle user identification | Done | TICKET-003 | — | — | — |
| Streak logic | Done | — | TICKET-004, 005 | — | — |
| Auth route guards | Done | — | TICKET-006 | — | — |
| Daily puzzle paywall | Done | — | TICKET-007 | — | — |
| Forgot password | Done | — | TICKET-008 | — | — |
| Dashboard achievements | Done | — | TICKET-009 | — | — |
| Battle socket reliability | Done | — | TICKET-010 | — | — |
| Legal pages | ❌ Missing | — | — | TICKET-011 | — |
| Decoder UI panel | ❌ Missing | — | — | TICKET-012 | — |
| Admin RBAC | ❌ Missing | — | — | TICKET-013 | — |
| Growth avatar system | ⚠️ Partial | — | — | TICKET-014 | — |
| updatePuzzleSchema nulls | 🔴 Broken | — | — | TICKET-015 | — |
| Remember me | ⚠️ Partial | — | — | TICKET-016 | — |
| Landing page auth CTAs | 🔴 Broken | — | — | TICKET-017 | — |
| Navbar upgrade CTA | ❌ Missing | — | — | — | TICKET-018 |
| Error/loading/empty states | ⚠️ Partial | — | — | TICKET-019 | — |
| Hints server validation | 🔴 Broken | — | — | TICKET-020 | — |
| JWT secrets hardening | 🔴 Security | — | — | — | TICKET-021 |
| CORS env config | ⚠️ Partial | — | — | — | TICKET-022 |
| Frontend test infra | ❌ Missing | — | — | — | TICKET-023 |
| Backend test coverage | ❓ Unknown | — | — | — | TICKET-024 |
| Avatar upload | ❌ Missing | — | — | — | TICKET-025 |
| WS input validation | ❌ Missing | — | — | — | TICKET-026 |
| Email verification | ❌ Missing | — | — | — | TICKET-027 |

---

## 3. Ticket Index

| ID | Title | Priority | Type | Area | Dependencies |
|---|---|---|---|---|---|
| TICKET-001 | Rewrite Cipher System (A=1..Z=26) | P0 | mismatch | multi-area | none |
| TICKET-002 | Fix Auth State Not Hydrating on New Tab | P0 | bug | frontend | none |
| TICKET-003 | Fix Hardcoded Player Array Indices in Battle | P0 | bug | frontend | none |
| TICKET-004 | Define Streak Logic Product Rules | P1 | product-definition | backend | none |
| TICKET-005 | Unify Streak Logic into Single Implementation | P1 | bug | backend | TICKET-004 |
| TICKET-006 | Add Authentication Route Guards | P1 | bug | frontend | TICKET-002 |
| TICKET-007 | Verify Daily Puzzle Fallback + Fix 403 Handling | P1 | bug | multi-area | none |
| TICKET-008 | Implement Forgot/Reset Password Minimal Flow | P1 | feature-gap | multi-area | none |
| TICKET-009 | Replace Hardcoded Dashboard Achievement Placeholders | P1 | bug | frontend | none |
| TICKET-010 | Harden Battle WebSocket: Heartbeat, Reconnection, Null Guards | P1 | bug | frontend | TICKET-003 |
| TICKET-011 | Create Legal Pages + Audit Challenge Mode | P2 | feature-gap | frontend | none |
| TICKET-012 | Add Cipher Reference Panel to Puzzle Solver | P2 | feature-gap | frontend | TICKET-001 |
| TICKET-013 | Add Admin Role and Protect Content Endpoints | P2 | bug | multi-area | none |
| TICKET-014 | Implement Growth Avatar Stage Progression | P2 | feature-gap | multi-area | none |
| TICKET-015 | Fix updatePuzzleSchema to Allow Null Values | P2 | bug | shared | none |
| TICKET-016 | Implement Remember Me Persistent Session | P2 | feature-gap | frontend | TICKET-002 |
| TICKET-017 | Show Auth-Conditional CTAs on Landing Page | P2 | bug | frontend | TICKET-002 |
| TICKET-018 | Add Upgrade CTA to Header for Free Users | P3 | feature-gap | frontend | none |
| TICKET-019 | Standardise Error/Loading/Empty States | P2 | tech-debt | frontend | none |
| TICKET-020 | Add Server-Side Validation for Hints Used | P2 | bug | backend | none |
| TICKET-021 | Fail-Fast on Missing JWT Secrets | P3 | bug | backend | none |
| TICKET-022 | Make CORS Origins Configurable via Env | P3 | tech-debt | backend | none |
| TICKET-023 | Set Up Frontend Test Infrastructure | P3 | testing | frontend | none |
| TICKET-024 | Close Backend Test Coverage Gaps | P3 | testing | backend | TICKET-005 |
| TICKET-025 | Add Avatar Upload Endpoint | P3 | feature-gap | multi-area | TICKET-013 |
| TICKET-026 | Add Zod Validation to Battle WS Messages | P3 | bug | backend | none |
| TICKET-027 | Add Email Delivery + Email Verification | P3 | feature-gap | multi-area | TICKET-008 |

---

## 4. Recommended Implementation Order

### Phase 0 — Critical Game Loop (implement first, unblocks everything else)
```
TICKET-001  Cipher system rewrite         ← unblocks correct game loop + all puzzle features
TICKET-002  Auth hydration                ← unblocks TICKET-006, 016, 017
TICKET-021  JWT secrets hardening         ← security baseline, 30min fix
```

### Phase 1 — Core Player Experience
```
TICKET-003  Battle user identification    ← battle mode playable
TICKET-004  Streak product rules          ← must define rules before code
TICKET-005  Streak unification            ← after 004
TICKET-006  Auth route guards             ← after 002
TICKET-007  Daily puzzle verify + fix     ← verify then fix
TICKET-008  Forgot password flow          ← production blocker
TICKET-009  Dashboard achievements data   ← quick win (1 hook call)
TICKET-010  Battle socket hardening       ← after 003
```

### Phase 2 — Feature Completeness
```
TICKET-011  Legal pages + challenge audit
TICKET-012  Decoder UI panel              ← after 001 (cipher must be correct)
TICKET-013  Admin RBAC                    ← data integrity
TICKET-014  Growth avatar system
TICKET-015  updatePuzzleSchema nulls      ← quick fix (1 file)
TICKET-016  Remember me                   ← after 002
TICKET-017  Landing page auth CTAs        ← after 002
TICKET-019  Error/loading/empty states
TICKET-020  Hints server validation
```

### Phase 3 — Polish, Security, and Tech Debt
```
TICKET-018  Navbar upgrade CTA
TICKET-022  CORS env config               ← 30min fix
TICKET-023  Frontend test infrastructure  ← enables all future regression testing
TICKET-024  Backend test coverage         ← after 005 (streak tests)
TICKET-025  Avatar upload endpoint
TICKET-026  WS input validation
TICKET-027  Email verification + delivery ← after 008
```

---

## 5. Cross-Cutting Risks

| Risk | Impact | Mitigation |
|---|---|---|
| **Database re-seed required by TICKET-001** | All existing UserProgress records reference puzzles encoded with wrong cipher | Run `prisma migrate reset` in dev; plan production migration carefully |
| **Auth cookie approach (TICKET-006)** | middleware.ts cannot read localStorage; needs a routing cookie | Use a lightweight non-httpOnly `auth_session` cookie for routing; keep JWT in localStorage for API calls |
| **Circular dependency (TICKET-005)** | ProgressModule importing UsersModule may conflict if UsersModule imports ProgressModule | Extract `updateStreak()` to a shared utility module if circular dep occurs |
| **Existing JWT tokens without `role` field (TICKET-013)** | After RBAC is added, old tokens lack the role claim | Add `role: user.role ?? 'USER'` fallback in JWT strategy |
| **No test coverage for cipher change** | TICKET-001 is the highest-risk change; no tests to catch regressions | Write DecoderService tests (TICKET-024) immediately after or alongside TICKET-001 |
| **TICKET-002 vs SSR** | AuthInitializer is a client component; may cause hydration mismatch | Ensure AuthInitializer renders `null` server-side and uses `useEffect` for the API call |

---

## 6. Assumptions and Contradictions Found

| Item | Claim | Reality | Ticket |
|---|---|---|---|
| `CURRENT_STATUS.md` | "cipher uses Unicode symbols — CRITICAL MISMATCH" | Confirmed: cipher uses Unicode symbols | TICKET-001 |
| `TESTING_STATUS.md` | Tests are "complete" | Frontend has zero test files; backend coverage unknown | TICKET-023, 024 |
| `BACKEND_STATUS.md` | All modules "working" | Achievement seed endpoint is public (no auth); puzzle CRUD unprotected | TICKET-013 |
| `FRONTEND_STATUS.md` | Pages "complete" | Dashboard achievements preview is hardcoded; decoder UI never built | TICKET-009, 012 |
| Frontend agent report | `/achievements`, `/profile`, `/settings`, `/subscription` listed as "missing" | All four pages are fully implemented | — (report corrected) |
| Frontend agent report | Dashboard "shows no upgrade CTA" | Dashboard:177 has "Unlock Daily Puzzles" CTA implemented | — (report corrected) |
| Frontend agent report | "Navbar missing useful links" | Header:120-127 has Profile, Achievements, Settings in dropdown | — (report corrected) |

---

## 7. What I Intentionally Did Not Ticket

These items were evaluated and intentionally excluded from the backlog:

- **Framer Motion animation details** — subjective UX polish; existing animations are functional
- **Mobile responsiveness fine-tuning** — layout is functional; pixel-perfect mobile is design scope
- **Analytics / Mixpanel** — not in current spec; future initiative
- **Social login (OAuth)** — not in PROJECT_OVERVIEW; separate feature sprint
- **PWA support** — future expansion; not a current bug
- **Localization / i18n** — not in scope per product vision
- **Leaderboard pagination performance** — premature optimization; address at scale
- **Stripe webhook rate limiting** — minor hardening; Stripe already validates signatures
- **In-memory battle lobbies** — known limitation; acceptable until production scale requires Redis
- **API rate limiting (general)** — infrastructure-level concern; out of current ticket scope
- **Two-factor authentication** — explicitly out of scope; not referenced in product plan
- **`RETRY_ATTEMPTS` / `TOKEN_REFRESH_THRESHOLD` constants unused** — dead config; low impact cleanup

---

*See `_audit-checklist.md` for the complete feature-by-feature status table.*
*See `_ticket-template.md` for the standard ticket format.*
