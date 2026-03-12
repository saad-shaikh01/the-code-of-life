# Audit Checklist — The Code of Life

> Legend: ✅ Aligned | ⚠️ Partially Implemented | 🔴 Broken | ❌ Missing | ❓ Unclear/Spec-Needed

---

## Authentication

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| User registration | ✅ | POST /auth/register works, bcrypt, JWT issued | — |
| Login with email/password | ✅ | POST /auth/login works, access + refresh tokens | — |
| JWT access token (15min) | ✅ | Configured correctly | — |
| Refresh token (7d) | ✅ | POST /auth/refresh works | — |
| JWT secret fail-fast on missing env | 🔴 | Falls back to hardcoded insecure default | TICKET-021 |
| Logout | ✅ | Clears tokens from localStorage | — |
| Forgot password flow | ❌ | Login links to /forgot-password which 404s; no backend endpoint | TICKET-008 |
| Password reset via token | ❌ | Not implemented | TICKET-008 |
| Email verification on register | ❌ | Not implemented; no emailVerified field | TICKET-027 |
| Auth state hydration on new tab | 🔴 | RootLayout does not call refreshUser(); new tab shows logged-out state | TICKET-002 |
| Remember me | ⚠️ | Checkbox exists but does nothing | TICKET-016 |
| Route guards (middleware) | ❌ | No middleware.ts; protected pages accessible without auth | TICKET-006 |
| Auth redirect (login→dashboard) | ❌ | No redirect for authenticated users on /login | TICKET-006 |
| Change password (authenticated) | ✅ | POST /auth/change-password works; settings page wired | — |

---

## Landing Page & Navigation

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Landing page renders | ✅ | Renders correctly with hero, features, pricing preview | — |
| Landing page auth-conditional CTAs | 🔴 | Always shows Sign In/Get Started regardless of auth state | TICKET-017 |
| Header nav links (authenticated) | ✅ | Dashboard, Story, Challenge, Daily, Leaderboards | — |
| Header user dropdown (authenticated) | ✅ | Profile, Achievements, Settings, Logout in dropdown | — |
| Header upgrade CTA for free users | ❌ | No pricing shortcut for free-tier users | TICKET-018 |
| Mobile navigation | ✅ | Hamburger menu with collapsible nav | — |
| Legal pages (/about, /privacy, /terms) | ❌ | Footer links exist but pages 404 | TICKET-011 |

---

## Puzzle System

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Cipher system (A=1..Z=26) | 🔴 | CRITICAL: Uses Unicode symbols, not numerical substitution | TICKET-001 |
| Seed data (25 puzzles) | 🔴 | All 25 puzzles encoded with wrong cipher | TICKET-001 |
| Puzzle list (story/challenge/daily) | ✅ | Pagination, gameMode/difficulty filtering | — |
| Puzzle solver page | ✅ | Timer, input, hints, score, submit — functionally correct | — |
| Decoder/cipher reference panel | ❌ | No in-game reference showing symbol→letter mapping | TICKET-012 |
| Hint system (3 hints, -25pts each) | ✅ | Frontend logic correct | — |
| Hints server-side validation | 🔴 | Backend accepts any hintsUsed value from client | TICKET-020 |
| Score calculation | ⚠️ | Client-side; no server recalculation | TICKET-020 |
| Puzzle solve validation (POST /decoder/validate) | ✅ | Levenshtein similarity, case-insensitive | — |
| Sequential story mode locking | ✅ | getIsLocked() checks previous completion | — |
| Story mode (page + data) | ✅ | Fully implemented | — |
| Challenge mode (page + data) | ❓ | Page exists; completeness unverified | TICKET-011 |
| updatePuzzleSchema null handling | 🔴 | Cannot clear nullable fields via PATCH | TICKET-015 |

---

## Daily Puzzle

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Daily puzzle API endpoint | ✅ | GET /api/puzzles/daily exists | — |
| PRO subscription gate on API | ✅ | SubscriptionGuard applied | — |
| Dashboard upgrade CTA (non-PRO) | ✅ | Shows "Unlock Daily Puzzles" for free users | — |
| /daily LockedOverlay (non-PRO) | ✅ | LockedOverlay isLocked={!isPro} | — |
| Daily puzzle fallback (always returns puzzle) | ❓ | Deterministic fallback exists; correctness unverified | TICKET-007 |
| 403 vs no-data distinction in hook | ⚠️ | useDailyPuzzle() may log 403 as unexpected error for free users | TICKET-007 |
| Daily puzzle countdown timer | ✅ | UTC midnight reset countdown | — |
| Streak display on /daily | ✅ | Streak dots and current streak count | — |

---

## Progress & Streak

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Progress submission (POST /progress) | ✅ | Creates/updates UserProgress record | — |
| Best score retention | ✅ | Math.max(new, existing) | — |
| Level progression (1 per 5 puzzles) | ✅ | Calculated on progress submission | — |
| Streak increment | 🔴 | Two different implementations (calendar day vs 24h rolling) | TICKET-004, 005 |
| Streak reset rule | ❓ | No product specification for reset behavior | TICKET-004 |
| Growth avatar points/stage | ⚠️ | Schema fields exist; backend never updates them; workaround in frontend | TICKET-014 |

---

## Battle / Multiplayer

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| WebSocket connection (Socket.IO) | ✅ | /battle namespace, WsJwtGuard | — |
| Lobby creation and joining | ✅ | join_lobby event, difficulty-based matching | — |
| Player ready / match start | ✅ | player_ready → match_start flow | — |
| Real-time progress (opponent view) | ⚠️ | Logic exists; opponentProgress used without null check | TICKET-010 |
| Solution submission and scoring | ✅ | submit_solution, winner determination | — |
| Game over results | 🔴 | results[0] hardcoded; wrong user's result shown | TICKET-003 |
| Current player identification | 🔴 | players[0] hardcoded; wrong user identified | TICKET-003 |
| WebSocket reconnection | ❌ | No reconnect logic or UI state | TICKET-010 |
| Heartbeat / stale connection detection | ❌ | No application-level heartbeat | TICKET-010 |
| Waiting for opponent UI | ❌ | No visible waiting state with 1 player in lobby | TICKET-010 |
| Forfeit confirmation | ❌ | Forfeit button fires without confirmation | TICKET-010 |
| WS message body validation | ❌ | No Zod schemas on @MessageBody() handlers | TICKET-026 |
| In-memory lobbies (not persisted) | ⚠️ | Known limitation; acceptable for current scope | — |

---

## Achievements

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Achievements page (/achievements) | ✅ | Fully implemented; loads real data from useUserAchievements() | — |
| Achievement unlock check endpoint | ✅ | POST /achievements/check | — |
| 14 seeded achievement types | ✅ | Seeded via POST /achievements/seed | — |
| Achievement progress tracking | ✅ | GET /achievements/:id/progress | — |
| Dashboard achievements preview | 🔴 | Hardcoded emoji placeholders; doesn't call useUserAchievements() | TICKET-009 |
| Achievement seed endpoint (public) | 🔴 | No auth guard; anyone can trigger | TICKET-013 |

---

## Leaderboards

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Score leaderboard (all/monthly/weekly/daily) | ✅ | Implemented with period filters | — |
| Streak leaderboard | ✅ | Implemented | — |
| Level leaderboard | ✅ | Implemented | — |
| Current user rank | ✅ | GET /leaderboards/rank | — |
| Global stats | ✅ | Total players, puzzles, score, average | — |
| Top 3 players | ✅ | GET /leaderboards/top | — |

---

## Billing / Subscription

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Stripe checkout session creation | ✅ | POST /billing/checkout-session | — |
| Stripe customer portal | ✅ | POST /billing/portal-session | — |
| Subscription status query | ✅ | GET /billing/subscription | — |
| Stripe webhook handling | ✅ | created/updated/deleted/paid/failed events | — |
| Subscription tier enforcement (SubscriptionGuard) | ✅ | Applied to daily puzzle and other PRO endpoints | — |
| Pricing page | ✅ | 3 tiers, Stripe checkout wired | — |
| Subscription management page | ✅ | Shows current tier, portal link | — |
| Stripe price ID defaults (insecure) | ⚠️ | Default to placeholder strings if env vars missing | — |

---

## Profile & Settings

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Profile page (/profile) | ✅ | Fully implemented; stats, progress, achievements | — |
| Settings page (/settings) | ✅ | Username, avatar URL, password change, theme, account deletion | — |
| Growth avatar display (PRO) | ⚠️ | Component exists; uses totalScore as workaround for growthPoints | TICKET-014 |
| Avatar upload (file) | ❌ | Only URL input; no file upload endpoint | TICKET-025 |

---

## Admin Controls

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Puzzle CRUD protection | 🔴 | Any authenticated user can create/edit/delete puzzles | TICKET-013 |
| Achievement creation protection | 🔴 | Any authenticated user can create achievements | TICKET-013 |
| Achievement seed protection | 🔴 | Public endpoint — no authentication required | TICKET-013 |
| Admin role in User model | ❌ | No role field in schema | TICKET-013 |

---

## Infrastructure & Security

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| JWT secret fail-fast | 🔴 | Hardcoded fallback secrets | TICKET-021 |
| CORS configurable via env | ❌ | Hardcoded localhost origins | TICKET-022 |
| API rate limiting | ❌ | No rate limiting on any endpoint | — (out of scope) |
| Webhook rate limiting | ❌ | Stripe webhook unprotected | — (out of scope) |
| Shared cipher map (packages/shared) | ❓ | Existence of cipher constant in shared package unverified | TICKET-001 |
| updatePuzzleSchema null support | 🔴 | Drops null values for nullable fields | TICKET-015 |

---

## Testing

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| Frontend test infrastructure | ❌ | No vitest/jest/testing-library configured | TICKET-023 |
| Frontend unit tests | ❌ | Zero test files | TICKET-023 |
| Backend spec files exist | ⚠️ | Files exist; content and coverage unverified | TICKET-024 |
| DecoderService unit tests | ❓ | Spec file may exist; coverage unknown | TICKET-024 |
| Streak logic unit tests | ❓ | Coverage unknown | TICKET-024 |
| SubscriptionGuard unit tests | ❓ | Coverage unknown | TICKET-024 |
| E2E tests | ❌ | No e2e test suite | — (out of scope) |

---

## Developer Experience

| Feature / Flow | Status | Notes | Ticket |
|---|---|---|---|
| .env.example documentation | ⚠️ | Some env vars undocumented | TICKET-021, 022, 027 |
| Monorepo workspace setup | ✅ | npm workspaces configured | — |
| Prisma migrations | ✅ | Migration history present | — |
| Seed script | ⚠️ | Works but uses wrong cipher | TICKET-001 |
