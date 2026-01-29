# Frontend Development Tasks

## For: Gemini Pro / Junior Developers
## Prepared by: Lead Engineer (Claude Opus)
## Date: 2026-01-29

---

## Overview

This document contains all UI tasks for "The Code of Life" puzzle game. The API layer, state management, and hooks are **already implemented**. Your role is to create the **UI components and pages**.

**Important**: Read `FRONTEND_STATUS.md` first to understand the architecture.

---

## Task Priority Levels

- **P0** - Critical (Must have for MVP)
- **P1** - High (Important features)
- **P2** - Medium (Nice to have)
- **P3** - Low (Future enhancements)

---

## Phase 1: Core UI Components (P0)

### Task 1.1: Base UI Components
**Location**: `src/components/ui/`

Create shadcn-style base components:

```
□ Button.tsx        - Primary, secondary, ghost, destructive variants
□ Input.tsx         - Text input with validation states
□ Card.tsx          - Card container with header, content, footer
□ Badge.tsx         - Status badges (difficulty, mode)
□ Avatar.tsx        - User avatars with fallback
□ Progress.tsx      - Progress bar component
□ Skeleton.tsx      - Loading skeleton
□ Dialog.tsx        - Modal dialogs
□ Toast.tsx         - Toast notifications
□ Dropdown.tsx      - Dropdown menus
□ Tabs.tsx          - Tab navigation
```

**Design Notes**:
- Use Tailwind CSS classes
- Support dark/light themes via CSS variables
- Use `cn()` utility from `@/lib/utils` for class merging
- Keep components accessible (ARIA labels, keyboard nav)

---

### Task 1.2: Layout Components
**Location**: `src/components/layout/`

```
□ Header.tsx        - Navigation header with user menu
□ Footer.tsx        - App footer
□ Sidebar.tsx       - Side navigation (mobile-friendly)
□ Container.tsx     - Content container with max-width
□ PageHeader.tsx    - Page title with breadcrumbs
```

---

### Task 1.3: Auth Pages
**Location**: `src/app/(auth)/`

```
□ login/page.tsx    - Login form
    - Email input
    - Password input
    - "Remember me" checkbox
    - Link to register
    - Error handling
    - Use: useAuthStore().login()

□ register/page.tsx - Registration form
    - Email input
    - Username input (3-30 chars, alphanumeric + underscore)
    - Password input (8+ chars, 1 upper, 1 lower, 1 number)
    - Confirm password
    - Terms checkbox
    - Use: useAuthStore().register()

□ layout.tsx        - Auth layout (centered card)
```

**Validation Rules** (from backend):
- Email: Valid email format
- Username: 3-30 chars, `/^[a-zA-Z0-9_]+$/`
- Password: 8+ chars, 1 uppercase, 1 lowercase, 1 number

---

## Phase 2: Main Features (P0)

### Task 2.1: Dashboard Page
**Location**: `src/app/(main)/dashboard/page.tsx`

```
□ Dashboard layout with:
    - Welcome message with username
    - Daily puzzle card (if available)
    - Progress stats summary
    - Recent activity
    - Quick links to game modes

□ Use hooks:
    - useDailyPuzzle()
    - useUserProgress()
    - useAuthStore()
```

---

### Task 2.2: Puzzle List Pages
**Location**: `src/app/(main)/`

```
□ story/page.tsx    - Story mode puzzles
    - Grid of puzzle cards
    - Progress indicators (completed/locked)
    - Difficulty badges
    - Pagination

□ challenge/page.tsx - Challenge mode puzzles
    - Difficulty filter
    - Sorting options
    - High score display

□ daily/page.tsx    - Daily puzzle page
    - Today's puzzle
    - Streak display
    - Previous daily puzzles (history)

□ Use hooks:
    - usePuzzles({ gameMode: 'STORY' | 'CHALLENGE' | 'DAILY' })
    - useCompletedPuzzles()
```

---

### Task 2.3: Puzzle Card Component
**Location**: `src/modules/puzzles/components/PuzzleCard.tsx`

```
□ Display:
    - Title
    - Difficulty badge (color-coded)
    - Game mode badge
    - Completion status (checkmark if done)
    - Score (if completed)
    - Book chapter reference (if available)

□ States:
    - Locked (grayed out, for sequential story mode)
    - Available (clickable)
    - Completed (with score)
    - Current (highlighted)
```

---

### Task 2.4: Puzzle Game Screen
**Location**: `src/app/(main)/puzzle/[id]/page.tsx`

This is the **CORE GAMEPLAY** screen.

```
□ Components needed:
    - SymbolDisplay.tsx   - Shows encrypted pattern
    - DecoderInput.tsx    - User types their answer
    - HintPanel.tsx       - Shows available/used hints
    - TimerDisplay.tsx    - Elapsed time
    - SymbolGuide.tsx     - Symbol-to-letter reference

□ Game flow:
    1. Load puzzle with usePuzzle(id)
    2. Start timer on first interaction
    3. User decodes symbols and types answer
    4. Submit answer with decoderService.validate()
    5. Show result (correct/incorrect with similarity %)
    6. Save progress with useSubmitProgress()
    7. Check achievements with useCheckAchievements()

□ Use stores:
    - useGameStore() for all game state
    - Timer: startTimer(), updateElapsedTime()
    - Hints: useHint()
    - Score: calculateScore()
```

**Symbol Display Design**:
- Large, readable symbols
- Each symbol should be clickable (for symbol guide)
- Spaces between words clearly visible
- Animate symbols appearing (Framer Motion)

---

### Task 2.5: Result Modal
**Location**: `src/modules/puzzles/components/ResultModal.tsx`

```
□ Correct answer:
    - Celebration animation
    - Score breakdown (base + time bonus - hint penalty)
    - Original reflection revealed
    - "Next Puzzle" button
    - Share button

□ Incorrect answer:
    - Similarity percentage
    - Hint if available
    - "Try Again" button
    - Option to reveal answer (no points)
```

---

## Phase 3: User Features (P1)

### Task 3.1: Profile Page
**Location**: `src/app/(main)/profile/page.tsx`

```
□ Display:
    - Avatar
    - Username
    - Member since date
    - Current level
    - Total score
    - Streak days
    - Edit profile button

□ Statistics section:
    - Puzzles completed (by mode)
    - Average time per puzzle
    - Hints used
    - Achievements unlocked

□ Use hooks:
    - useAuthStore()
    - usersService.getStats()
```

---

### Task 3.2: Settings Page
**Location**: `src/app/(main)/settings/page.tsx`

```
□ Sections:
    - Profile settings (username, avatar)
    - Account settings (change password, delete account)
    - Theme toggle (dark/light/system)
    - Notification preferences

□ Use:
    - usersService.updateProfile()
    - authService.changePassword()
    - Theme provider context
```

---

### Task 3.3: Achievements Page
**Location**: `src/app/(main)/achievements/page.tsx`

```
□ Achievement grid:
    - Achievement cards with icon, name, description
    - Locked/unlocked state
    - Progress bar for in-progress achievements
    - Points value
    - Unlock date (if unlocked)

□ Filters:
    - All / Unlocked / Locked
    - By category (puzzles, score, streak, etc.)

□ Use hooks:
    - useUserAchievements()
    - useAchievementProgress(id)
```

---

### Task 3.4: Leaderboards Page
**Location**: `src/app/(main)/leaderboards/page.tsx`

```
□ Leaderboard table:
    - Rank
    - Avatar
    - Username
    - Score
    - Level
    - Streak

□ Tabs:
    - All Time
    - Monthly
    - Weekly
    - Daily

□ Additional boards:
    - Streak leaderboard
    - Level leaderboard

□ Current user highlight

□ Use hooks:
    - useLeaderboard({ period: 'all' | 'monthly' | 'weekly' | 'daily' })
    - useUserRank()
    - useStreakLeaderboard()
    - useLevelLeaderboard()
```

---

## Phase 4: Polish (P2)

### Task 4.1: Animations
**Location**: Throughout components

```
□ Page transitions (Framer Motion)
□ Card hover effects
□ Button press feedback
□ Loading states
□ Success celebrations (confetti?)
□ Achievement unlock notification
□ Streak milestone celebration
```

---

### Task 4.2: Empty States
**Location**: Create for each list page

```
□ No puzzles available
□ No achievements yet
□ No progress yet
□ Leaderboard empty
□ Search no results
```

---

### Task 4.3: Error States
**Location**: `src/components/error/`

```
□ ErrorBoundary.tsx    - Catch React errors
□ NotFound.tsx         - 404 page
□ ServerError.tsx      - 500 page
□ OfflineIndicator.tsx - Network status
```

---

### Task 4.4: Mobile Optimization

```
□ Responsive navigation (hamburger menu)
□ Touch-friendly puzzle interaction
□ Bottom navigation for mobile
□ Swipe gestures where appropriate
□ Viewport meta tags
```

---

## Phase 5: Advanced Features (P3)

### Task 5.1: Symbol Guide Interactive

```
□ Clickable symbol in puzzle shows letter
□ User can build their own mapping
□ Partial reveal feature
```

---

### Task 5.2: Social Features

```
□ Share puzzle result
□ Compare with friends
□ Challenge a friend
```

---

### Task 5.3: Accessibility

```
□ Screen reader support
□ Keyboard navigation
□ High contrast mode
□ Font size options
```

---

## Code Examples

### Using Hooks
```tsx
// Fetching puzzles
import { usePuzzles } from '@/hooks';

function StoryMode() {
  const { data, isLoading, error } = usePuzzles({
    gameMode: 'STORY',
    page: 1,
    limit: 10,
  });

  if (isLoading) return <Skeleton />;
  if (error) return <ErrorMessage error={error} />;

  return (
    <div className="grid grid-cols-3 gap-4">
      {data?.data.map((puzzle) => (
        <PuzzleCard key={puzzle.id} puzzle={puzzle} />
      ))}
    </div>
  );
}
```

### Using Stores
```tsx
// Auth state
import { useAuthStore } from '@/stores';

function UserMenu() {
  const { user, logout, isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <LoginButton />;
  }

  return (
    <div>
      <span>Welcome, {user?.username}</span>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Using Game Store
```tsx
// Puzzle gameplay
import { useGameStore } from '@/stores';
import { useSubmitProgress } from '@/hooks';

function PuzzleGame() {
  const {
    currentPuzzle,
    userInput,
    setUserInput,
    useHint,
    hintsUsed,
    elapsedTime,
    calculateScore,
    setCompleted,
  } = useGameStore();

  const submitProgress = useSubmitProgress();

  const handleSubmit = async () => {
    // Validate with backend
    const result = await decoderService.validate({
      puzzleId: currentPuzzle.id,
      attempt: userInput,
    });

    setCompleted(result.data.isCorrect, result.data.similarity);

    if (result.data.isCorrect) {
      // Save progress
      await submitProgress.mutateAsync({
        puzzleId: currentPuzzle.id,
        completed: true,
        score: calculateScore(),
        timeSpent: elapsedTime,
        hintsUsed,
      });
    }
  };
}
```

---

## Styling Guidelines

### Colors (CSS Variables)
```css
--primary           /* Main brand color */
--secondary         /* Secondary actions */
--accent            /* Highlights */
--background        /* Page background */
--foreground        /* Text color */
--muted             /* Subdued elements */
--destructive       /* Errors, delete */
```

### Difficulty Colors
```tsx
const difficultyColors = {
  BEGINNER: 'bg-green-500',
  INTERMEDIATE: 'bg-yellow-500',
  ADVANCED: 'bg-orange-500',
  MASTER: 'bg-red-500',
};
```

### Spacing
Use Tailwind spacing scale consistently:
- Cards: `p-4` or `p-6`
- Gaps: `gap-4` for grids
- Margins: `mb-4`, `mt-8` for sections

---

## Testing Checklist

Before marking a task complete:

```
□ Works in light mode
□ Works in dark mode
□ Mobile responsive (320px - 768px)
□ Tablet responsive (768px - 1024px)
□ Desktop (1024px+)
□ Loading states shown
□ Error states handled
□ Empty states displayed
□ Keyboard accessible
□ No console errors
```

---

## Questions?

If you're unsure about:
- **API usage**: Check `src/api/services/*.service.ts`
- **Types**: Check `src/types/api.types.ts`
- **State management**: Check `src/stores/*.store.ts`
- **Data fetching**: Check `src/hooks/*.ts`

All infrastructure is documented and typed. Focus on creating great UI!
