# Frontend Architecture Status

## Lead Engineer: Claude Opus
## Date: 2026-01-29

---

## Architecture Overview

The frontend is built with **Next.js 16** (App Router) and follows a modular, scalable architecture designed for team collaboration.

### Tech Stack

| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 16.1.6 | Framework (App Router) |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type Safety |
| TanStack Query | 5.x | Server State Management |
| Zustand | 5.x | Client State Management |
| Tailwind CSS | 4.x | Styling |
| Framer Motion | 12.x | Animations |
| Lucide React | 0.563.x | Icons |

---

## Folder Structure

```
frontend/src/
├── api/                    # API client and services
│   ├── client.ts           # HTTP client with auth handling
│   ├── index.ts            # Exports all services
│   └── services/           # API service modules
│       ├── auth.service.ts
│       ├── puzzles.service.ts
│       ├── decoder.service.ts
│       ├── progress.service.ts
│       ├── users.service.ts
│       ├── achievements.service.ts
│       └── leaderboards.service.ts
│
├── app/                    # Next.js App Router pages
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Home page
│   ├── globals.css         # Global styles
│   └── (routes)/           # Route groups (to be created)
│
├── components/             # Shared UI components
│   ├── ui/                 # Base UI components (Button, Input, etc.)
│   └── providers/          # Context providers
│       └── query-provider.tsx
│
├── config/                 # Configuration
│   └── constants.ts        # App-wide constants
│
├── hooks/                  # Custom React hooks
│   ├── index.ts            # Exports all hooks
│   ├── use-puzzles.ts      # Puzzle data hooks
│   ├── use-progress.ts     # Progress tracking hooks
│   ├── use-achievements.ts # Achievement hooks
│   └── use-leaderboards.ts # Leaderboard hooks
│
├── lib/                    # Utilities
│   └── utils.ts            # Helper functions
│
├── modules/                # Feature modules
│   ├── auth/               # Authentication feature
│   │   ├── components/     # Auth-specific components
│   │   └── hooks/          # Auth-specific hooks
│   ├── puzzles/            # Puzzle gameplay feature
│   │   ├── components/
│   │   ├── hooks/
│   │   └── types.ts
│   ├── user/               # User profile feature
│   │   ├── components/
│   │   └── hooks/
│   ├── progress/           # Progress tracking feature
│   │   └── hooks/
│   ├── achievements/       # Achievements feature
│   │   ├── components/
│   │   └── hooks/
│   ├── leaderboards/       # Leaderboards feature
│   │   ├── components/
│   │   └── hooks/
│   ├── decoder/            # Decoder tool feature
│   │   └── hooks/
│   └── theme/              # Theme management
│       └── contexts/
│
├── stores/                 # Zustand stores
│   ├── index.ts
│   ├── auth.store.ts       # Auth state
│   └── game.store.ts       # Game state
│
└── types/                  # TypeScript types
    └── api.types.ts        # API response types
```

---

## Completed Infrastructure

### 1. API Client (`/api/client.ts`)
- Centralized HTTP client with fetch
- Automatic token management
- Token refresh handling
- Error handling with custom `ApiClientError`
- Request timeout support

### 2. API Services
All backend endpoints are wrapped in typed services:

| Service | Endpoints | Auth Required |
|---------|-----------|---------------|
| `authService` | register, login, refresh, changePassword, me | Partial |
| `puzzlesService` | getAll, getById, getDaily, create, update, delete | Partial |
| `decoderService` | decode, encode, validate, getSymbolMap | Partial |
| `progressService` | submit, getAll, getByPuzzle, getByMode, getCompleted, reset | Yes |
| `usersService` | getProfile, updateProfile, getStats, getPublicProfile, deleteAccount | Partial |
| `achievementsService` | getAll, getById, getUserAchievements, getUnlocked, check, getProgress | Partial |
| `leaderboardsService` | getLeaderboard, getUserRank, getTop, getStats, getStreaks, getLevels | Partial |

### 3. State Management

#### Zustand Stores:
- **`useAuthStore`**: User authentication, tokens, login/logout
- **`useGameStore`**: Current puzzle, timer, hints, score calculation

### 4. React Query Hooks

| Hook | Purpose |
|------|---------|
| `usePuzzles(params?)` | Fetch paginated puzzles |
| `usePuzzle(id)` | Fetch single puzzle |
| `useDailyPuzzle()` | Fetch daily puzzle |
| `useUserProgress()` | Fetch all progress |
| `usePuzzleProgress(id)` | Fetch puzzle progress |
| `useSubmitProgress()` | Submit progress mutation |
| `useAchievements()` | Fetch all achievements |
| `useUserAchievements()` | Fetch with unlock status |
| `useLeaderboard(params?)` | Fetch leaderboard |
| `useGlobalStats()` | Fetch global statistics |

### 5. Type Definitions (`/types/api.types.ts`)
Complete TypeScript types matching backend API:
- `User`, `AuthResponse`, `AuthTokens`
- `Puzzle`, `GameMode`, `Difficulty`
- `UserProgress`, `ProgressWithPuzzle`
- `Achievement`, `AchievementWithUnlock`
- `LeaderboardEntry`, `LeaderboardResponse`
- All request/response types

---

## Configuration

### Environment Variables (`.env.local`)
```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Constants (`/config/constants.ts`)
- `API_CONFIG`: Base URL, timeout, retry attempts
- `AUTH_CONFIG`: Token storage keys
- `GAME_CONFIG`: Points, hints, time bonuses
- `UI_CONFIG`: Animation durations, debounce delays
- `ROUTES`: Route path constants

---

## What's Ready for UI Development

1. **Data Fetching** - All hooks ready, just call them in components
2. **Authentication** - Store and service ready, needs UI forms
3. **State Management** - Zustand stores configured
4. **Type Safety** - Full TypeScript coverage
5. **Theme System** - Dark/light mode with Tailwind
6. **API Integration** - All backend endpoints accessible

---

## File Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| Components | PascalCase | `PuzzleCard.tsx` |
| Hooks | camelCase with `use` prefix | `use-puzzles.ts` |
| Services | camelCase with `.service` | `auth.service.ts` |
| Stores | camelCase with `.store` | `auth.store.ts` |
| Types | camelCase with `.types` | `api.types.ts` |
| Pages | lowercase | `page.tsx` |

---

## How to Use

### 1. Data Fetching (React Query)
```tsx
import { usePuzzles, useDailyPuzzle } from '@/hooks';

function PuzzleList() {
  const { data, isLoading, error } = usePuzzles({ gameMode: 'STORY' });

  if (isLoading) return <Loading />;
  if (error) return <Error message={error.message} />;

  return <div>{data?.data.map(puzzle => ...)}</div>;
}
```

### 2. Authentication (Zustand)
```tsx
import { useAuthStore } from '@/stores';

function LoginButton() {
  const { login, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    await login({ email, password });
  };
}
```

### 3. Game State (Zustand)
```tsx
import { useGameStore } from '@/stores';

function PuzzleGame() {
  const {
    currentPuzzle,
    userInput,
    setUserInput,
    useHint,
    calculateScore
  } = useGameStore();
}
```

---

## Next Steps (For Gemini/Junior Devs)

See `FRONTEND_TASKS.md` for detailed task breakdown.

---

## Session: 2026-02-05 - Subscriptions & Multiplayer Update

### New Features Implemented

#### 1. Billing & Subscription System
- [x] Billing API service (`/api/services/billing.service.ts`)
- [x] Pricing page (`/pricing`) with 3 tiers
- [x] Subscription management page (`/subscription`)
- [x] Stripe Checkout integration
- [x] Billing portal redirect

#### 2. Real-time Multiplayer (Battle Mode)
- [x] WebSocket hook (`/hooks/useBattleSocket.ts`)
- [x] Battle page (`/battle`) with full game flow
- [x] Matchmaking by difficulty
- [x] Real-time opponent progress bars
- [x] Game over with scores and results

---

## New Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/pricing` | Subscription pricing tiers | No |
| `/subscription` | Manage subscription | Yes |
| `/battle` | Real-time multiplayer battles | Yes |

---

## New API Services

### Billing Service (`/api/services/billing.service.ts`)

| Method | Description |
|--------|-------------|
| `getSubscription()` | Get current user's subscription |
| `createCheckoutSession(priceId, successUrl, cancelUrl)` | Create Stripe checkout |
| `createPortalSession(returnUrl)` | Open billing portal |

---

## New Hooks

### `useBattleSocket()` Hook

Real-time WebSocket connection for Battle Mode.

**State:**
- `isConnected` - WebSocket connection status
- `lobby` - Current lobby data
- `matchData` - Active match puzzle data
- `opponentProgress` - Real-time opponent progress
- `gameOver` - Game results
- `error` - Error state

**Actions:**
- `joinLobby(lobbyId?, difficulty?)` - Join or find match
- `leaveLobby()` - Leave current lobby
- `setReady(isReady)` - Toggle ready state
- `updateProgress(data)` - Send progress to opponents
- `submitSolution(solution, timeElapsed)` - Submit final answer
- `resetState()` - Reset all state

---

## Updated Folder Structure

```
frontend/src/
├── api/
│   └── services/
│       └── billing.service.ts  # NEW
│
├── app/(main)/
│   ├── pricing/
│   │   └── page.tsx            # NEW - Pricing tiers
│   ├── subscription/
│   │   └── page.tsx            # NEW - Subscription management
│   └── battle/
│       └── page.tsx            # NEW - Multiplayer battles
│
├── hooks/
│   └── useBattleSocket.ts      # NEW - WebSocket hook
│
└── config/
    └── constants.ts            # Updated with STRIPE_CONFIG
```

---

## Updated Configuration

### New Constants (`/config/constants.ts`)

```typescript
export const ROUTES = {
  // ... existing routes
  PRICING: '/pricing',
  SUBSCRIPTION: '/subscription',
  BATTLE: '/battle',
} as const;

export const STRIPE_CONFIG = {
  PRO_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
  PREMIUM_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'price_premium_monthly',
} as const;
```

---

## New Environment Variables

```env
# Stripe (Frontend)
NEXT_PUBLIC_STRIPE_PRO_PRICE_ID=price_pro_monthly
NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID=price_premium_monthly

# WebSocket
NEXT_PUBLIC_WS_URL=http://localhost:3001
```

---

## New Dependencies Added

- `socket.io-client` - Socket.IO client for real-time multiplayer

---

## Updated Sidebar Navigation

Added new navigation links:
- **Subscription** - Subscription management (with CreditCard icon)
- **Battle Mode** - Multiplayer battles (with Swords icon)

---

## Pricing Page Features

- 3 pricing tiers: Free, Pro ($9.99/mo), Premium ($19.99/mo)
- Feature comparison list
- 7-day free trial on paid plans
- Animated cards with Framer Motion
- FAQ section

---

## Battle Mode Features

1. **Difficulty Selection** - BEGINNER, INTERMEDIATE, ADVANCED, MASTER
2. **Matchmaking** - Find opponent or create lobby
3. **Lobby System** - Ready state, player list
4. **Real-time Gameplay**:
   - Countdown timer before match
   - Encrypted puzzle display
   - Progress bars (you vs opponent)
   - Game timer
5. **Game Over Screen**:
   - Winner announcement
   - Score breakdown
   - Time comparison
   - Play again option

---

## Session: 2026-02-05 - Zen & Growth Experience Update

### Zen-Mode UI System (TASK2.md Phase 1)

Premium mindfulness UI components with Framer Motion animations.

#### Zen Components (`/components/zen/`)

| Component | File | Description |
|-----------|------|-------------|
| `BreathingContainer` | `breathing-container.tsx` | Page transitions with breathing effect |
| `BreathingText` | `breathing-container.tsx` | Staggered text animations |
| `PulsingGlow` | `breathing-container.tsx` | Ambient background glow |
| `ParticleEffects` | `particle-effects.tsx` | Success/celebration particles |
| `GlowBurst` | `particle-effects.tsx` | Radial glow on success |
| `FloatingParticles` | `particle-effects.tsx` | Ambient floating particles |
| `SuccessRipple` | `particle-effects.tsx` | Ripple effect on success |
| `WisdomCard` | `wisdom-card.tsx` | Glassmorphism wisdom reveal |
| `GlassPanel` | `wisdom-card.tsx` | Reusable glass container |
| `GlassButton` | `wisdom-card.tsx` | Glass-styled button |
| `AmbientAudioControl` | `ambient-audio-control.tsx` | Audio widget with 5 soundscapes |
| `GrowthAvatar` | `growth-avatar.tsx` | 5-stage tree evolution |
| `GrowthAvatarMini` | `growth-avatar.tsx` | Compact avatar for headers |
| `LockedOverlay` | `locked-overlay.tsx` | Premium feature lock overlay |
| `LockedBadge` | `locked-overlay.tsx` | Inline "PRO" badge |
| `LockedFeatureCard` | `locked-overlay.tsx` | Card for locked features |

---

### Growth Avatar System (TASK2.md Phase 2)

Seed-to-Tree evolution gamification with animated SVG avatars.

#### Growth Stages

| Stage | Name | Points Required |
|-------|------|-----------------|
| 1 | Seed | 0 |
| 2 | Sprout | 100 |
| 3 | Sapling | 500 |
| 4 | Young Tree | 1,500 |
| 5 | Mature Tree | 5,000 |

---

### Pro-Tier Features (TASK2.md Phase 4)

Subscription gating for premium features.

#### Features Gated Behind PRO Tier

| Feature | Route | Implementation |
|---------|-------|----------------|
| Daily Challenges | `/daily` | Full page locked with LockedOverlay |
| Growth Avatar | `/profile` | Growth Journey section locked |

#### UX Flow
- Non-subscribers see glassmorphism overlay with blur effect
- Animated lock icon with shimmer on upgrade button
- "Upgrade to PRO" redirects to `/pricing`
- PRO badge indicates locked sections
- Smooth Framer Motion animations on lock/unlock

---

### New Hooks

#### `useAmbientAudio()` - Web Audio API Soundscapes

**Soundscapes:**
- 🌧️ Gentle Rain
- 🐦 Bird Songs
- 💨 Soft Wind
- 🌊 Ocean Waves
- 🌲 Forest Ambiance

**Returns:**
- `isPlaying` - Current playback state
- `volume` - Volume level (0-1)
- `currentSound` - Active soundscape
- `playSound(name)` - Start playing a sound
- `toggle()` - Toggle play/pause
- `setVolume(level)` - Adjust volume
- `stopAllSounds()` - Stop all audio

#### `useSubscription()` - Subscription Status

**Returns:**
- `subscription` - Full subscription object
- `isLoading` - Loading state
- `error` - Error state

#### `useSubscriptionStatus()` - Tier Helpers

**Returns:**
- `isPro` - User has PRO or PREMIUM tier
- `isPremium` - User has PREMIUM tier
- `isFree` - User has FREE tier
- `tier` - Current tier name
- `status` - Subscription status

---

### New Pages

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/zen-demo` | Demo showcasing all Zen components | No |

---

### Updated Folder Structure (Zen & Growth)

```
frontend/src/
├── components/zen/           # NEW - Premium UI components
│   ├── index.ts
│   ├── breathing-container.tsx
│   ├── particle-effects.tsx
│   ├── wisdom-card.tsx
│   ├── ambient-audio-control.tsx
│   ├── growth-avatar.tsx
│   └── locked-overlay.tsx
│
├── hooks/
│   ├── useAmbientAudio.ts    # NEW - Web Audio API
│   └── use-subscription.ts   # NEW - Subscription hooks
│
└── app/(main)/
    └── zen-demo/
        └── page.tsx          # NEW - Zen demo page
```

---

### Updated Pages (Subscription Gating)

| Route | Changes |
|-------|---------|
| `/daily` | Added LockedOverlay for non-PRO users |
| `/profile` | Added Growth Avatar section with subscription gating |

---

### Zen Demo Page Features (`/zen-demo`)

Three demo screens showcasing the Zen experience:

**Screen 1: Zen Home**
- Breathing page transitions
- Floating ambient particles
- Glassmorphism cards
- Pulsing background glow

**Screen 2: Puzzle Completion**
- Particle burst on correct answer
- Glow burst effect
- Success ripple animation
- Glassmorphism Wisdom Card

**Screen 3: Growth Profile**
- Animated SVG tree avatar
- 5 evolution stages
- Floating leaves effect
- Progress bar to next stage
