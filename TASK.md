# Project Scaling Roadmap: Subscriptions & Multiplayer

## Goal
Scale 'The Code of Life' from a single-player MVP to a commercial-grade platform with a focus on Cipher accuracy, Monetization, and Real-time interaction.

---

## Phase 1: Subscription & Monetization (Stripe) - COMPLETED
- [x] **Research:** Stripe Billing Lifecycle analyzed (Webhook handling, Trial periods, Pro-rated billing).
- [x] **Database:** Update Prisma Schema to include `Subscription` model linked to `User`.
- [x] **Backend:** Implement `/api/billing` endpoints for Stripe Checkout Session and Portal.
- [x] **Frontend:** Create Pricing Page and Subscription Management Dashboard using shadcn/ui.
- [x] **Logic:** Implement Middleware/Guard to restrict 'Daily Challenges' or 'Premium Puzzles' to active subscribers.

## Phase 2: Real-time Multiplayer (WebSockets) - COMPLETED
- [x] **Research:** WebSocket Protocol for "Battle Mode" (Events: `join_lobby`, `match_start`, `progress_update`, `game_over`).
- [x] **Backend:** Setup NestJS Gateway using `@nestjs/websockets` and `socket.io`.
- [x] **Shared:** Update `packages/shared` with Zod schemas for real-time events.
- [x] **Frontend:** Build Multiplayer Lobby and Battle UI with Framer Motion progress bars for opponents.

---

## BOTH PHASES COMPLETE

### Session: 2026-02-05
**Status: ALL TASKS COMPLETED**

---

## Phase 1 Implementation Summary

### Database Changes
- Added `SubscriptionStatus` enum: ACTIVE, CANCELED, PAST_DUE, TRIALING, INCOMPLETE, INCOMPLETE_EXPIRED, UNPAID
- Added `SubscriptionTier` enum: FREE, PRO, PREMIUM
- Added `Subscription` model with Stripe integration fields
- Migration: `20260205004409_add_subscription_model`

### Backend (NestJS)
- `billing.module.ts`, `billing.service.ts`, `billing.controller.ts`
- `subscription.guard.ts` + `@RequireSubscription` decorator

### Frontend (Next.js)
- `/pricing` - Pricing tiers with Stripe Checkout
- `/subscription` - Subscription management dashboard
- `billing.service.ts` - Frontend API client

### API Endpoints (Phase 1)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/billing/checkout-session` | JWT | Create Stripe checkout |
| POST | `/api/billing/portal-session` | JWT | Open billing portal |
| GET | `/api/billing/subscription` | JWT | Get subscription status |
| POST | `/api/billing/webhook` | Stripe | Handle Stripe webhooks |

---

## Phase 2 Implementation Summary

### Shared Package
- `packages/shared/src/schemas/multiplayer.schema.ts`
  - Battle status enum
  - Player & PlayerProgress schemas
  - Lobby schema
  - Client events: `join_lobby`, `leave_lobby`, `player_ready`, `progress_update`, `submit_solution`
  - Server events: `lobby_joined`, `player_joined`, `player_left`, `match_start`, `opponent_progress`, `game_over`, `battle_error`

### Backend (NestJS WebSocket Gateway)
Files in `/backend/src/modules/battle/`:
- `battle.module.ts` - Module with JWT integration
- `battle.gateway.ts` - WebSocket gateway with namespace `/battle`
- `battle.service.ts` - Lobby management, matchmaking, game logic
- `ws-jwt.guard.ts` - WebSocket JWT authentication

### Frontend (Next.js)
- `/battle` - Full battle mode UI
  - Difficulty selection
  - Matchmaking/Find opponent
  - Battle lobby with ready system
  - Real-time puzzle solving with opponent progress
  - Game over with results and scores
- `useBattleSocket.ts` - Custom hook for WebSocket connection

### WebSocket Events

**Client -> Server:**
| Event | Description |
|-------|-------------|
| `join_lobby` | Join/create lobby with optional difficulty |
| `leave_lobby` | Leave current lobby |
| `player_ready` | Toggle ready state |
| `progress_update` | Send puzzle-solving progress |
| `submit_solution` | Submit final solution |

**Server -> Client:**
| Event | Description |
|-------|-------------|
| `lobby_joined` | Lobby data after joining |
| `player_joined` | New player joined lobby |
| `player_left` | Player left lobby |
| `match_start` | Game starting with puzzle data |
| `opponent_progress` | Real-time opponent progress |
| `game_over` | Final results and winner |
| `battle_error` | Error notifications |

---

## Environment Variables Required

```env
# Stripe (Phase 1)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRO_PRICE_ID=price_pro_monthly
STRIPE_PREMIUM_PRICE_ID=price_premium_monthly

# Frontend Stripe
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro_monthly
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_premium_monthly

# WebSocket (Phase 2)
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## New Routes Added

| Route | Description |
|-------|-------------|
| `/pricing` | Subscription pricing page |
| `/subscription` | Subscription management |
| `/battle` | Real-time multiplayer battle |

---

## Build Status
- Backend: PASSING
- Frontend: PASSING
- Shared: PASSING

All code compiles successfully and is ready for testing.

---

## Instructions for Autonomous Workflow
1. **Agent Collaboration:** Claude (Developer) will handle all code changes. If complex research or PDF extraction is needed, Claude will request Gemini (Architect) to analyze the files first.
2. **Persistence:** Work in `tmux` sessions to ensure tasks continue running even if the browser is closed.
3. **Execution:** Auto-approve package installations. Update this file with `[x]` upon completion of each sub-task.
