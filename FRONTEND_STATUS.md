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
