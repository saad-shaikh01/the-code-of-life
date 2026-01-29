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

## 🎨 DESIGN SYSTEM (MUST FOLLOW)

### Visual Philosophy

This game is about **decoding ancient symbols** to unlock **life wisdom**. The UI should feel:
- **Mystical & Premium** - Like opening an ancient, magical book
- **3D & Depth** - Cards should feel like they float above the surface
- **Smooth & Fluid** - Every interaction should be buttery smooth
- **Dark-first** - Dark mode is primary, light mode secondary

---

### Color Palette

#### Primary Brand Colors
```tsx
// Use these for main actions, highlights, and branding
const brandColors = {
  // Gold/Amber - Represents wisdom, knowledge
  gold: {
    light: '#F59E0B',    // amber-500
    DEFAULT: '#D97706',  // amber-600
    dark: '#B45309',     // amber-700
  },

  // Purple/Violet - Represents mystery, magic
  mystic: {
    light: '#A78BFA',    // violet-400
    DEFAULT: '#8B5CF6',  // violet-500
    dark: '#7C3AED',     // violet-600
  },

  // Teal/Cyan - Represents clarity, insight
  insight: {
    light: '#22D3EE',    // cyan-400
    DEFAULT: '#06B6D4',  // cyan-500
    dark: '#0891B2',     // cyan-600
  },
};
```

#### Usage Rules
| Element | Color | Example Class |
|---------|-------|---------------|
| Primary buttons | Gold gradient | `bg-gradient-to-r from-amber-500 to-amber-600` |
| Secondary buttons | Purple/Violet | `bg-violet-600 hover:bg-violet-700` |
| Success states | Emerald | `text-emerald-500` |
| Links & accents | Cyan | `text-cyan-400 hover:text-cyan-300` |
| Symbols (encrypted) | Gold glow | `text-amber-400 drop-shadow-[0_0_10px_rgba(251,191,36,0.5)]` |
| Symbols (decoded) | Cyan glow | `text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,0.5)]` |

#### Difficulty Badge Colors
```tsx
const difficultyStyles = {
  BEGINNER: {
    bg: 'bg-emerald-500/20',
    text: 'text-emerald-400',
    border: 'border-emerald-500/30',
    glow: 'shadow-emerald-500/20',
  },
  INTERMEDIATE: {
    bg: 'bg-amber-500/20',
    text: 'text-amber-400',
    border: 'border-amber-500/30',
    glow: 'shadow-amber-500/20',
  },
  ADVANCED: {
    bg: 'bg-orange-500/20',
    text: 'text-orange-400',
    border: 'border-orange-500/30',
    glow: 'shadow-orange-500/20',
  },
  MASTER: {
    bg: 'bg-red-500/20',
    text: 'text-red-400',
    border: 'border-red-500/30',
    glow: 'shadow-red-500/20',
  },
};
```

#### Game Mode Badge Colors
```tsx
const gameModeStyles = {
  STORY: {
    bg: 'bg-violet-500/20',
    text: 'text-violet-400',
    icon: 'BookOpen',
  },
  CHALLENGE: {
    bg: 'bg-rose-500/20',
    text: 'text-rose-400',
    icon: 'Swords',
  },
  DAILY: {
    bg: 'bg-cyan-500/20',
    text: 'text-cyan-400',
    icon: 'Calendar',
  },
};
```

---

### 3D Card Effect (MUST USE)

Every card should have depth and feel like it floats:

```tsx
// Base 3D Card Component
const Card3D = ({ children, className }) => (
  <div
    className={cn(
      // Base styling
      "relative rounded-xl p-6",
      // Background with glassmorphism
      "bg-card/80 backdrop-blur-sm",
      // Border glow
      "border border-white/10",
      // 3D shadow layers
      "shadow-[0_8px_30px_rgb(0,0,0,0.12)]",
      "shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]",
      // Hover lift effect
      "hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)]",
      "hover:-translate-y-1",
      // Smooth transition
      "transition-all duration-300 ease-out",
      className
    )}
  >
    {/* Inner glow effect */}
    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    {children}
  </div>
);
```

#### Elevated Card (for important items)
```tsx
// For puzzle cards, achievement cards
const ElevatedCard = ({ children, glowColor = "amber" }) => (
  <div
    className={cn(
      "relative rounded-2xl p-6",
      "bg-gradient-to-br from-gray-900/90 to-gray-800/90",
      "border border-white/10",
      // Multiple shadow layers for 3D depth
      "shadow-xl",
      `shadow-${glowColor}-500/10`,
      // Subtle inner border highlight
      "before:absolute before:inset-0 before:rounded-2xl",
      "before:bg-gradient-to-br before:from-white/10 before:to-transparent",
      "before:pointer-events-none",
      // Hover glow
      `hover:shadow-${glowColor}-500/20`,
      "hover:border-white/20",
      "transition-all duration-300"
    )}
  >
    {children}
  </div>
);
```

---

### Animation Guidelines (Framer Motion)

#### Page Transitions
```tsx
// Use for all page components
const pageVariants = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
};

const pageTransition = {
  type: "spring",
  stiffness: 300,
  damping: 30,
};

// Usage in page
<motion.div
  initial="initial"
  animate="animate"
  exit="exit"
  variants={pageVariants}
  transition={pageTransition}
>
  {/* Page content */}
</motion.div>
```

#### Staggered List Animation
```tsx
// For puzzle grids, achievement lists
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      type: "spring",
      stiffness: 300,
      damping: 24,
    },
  },
};

// Usage
<motion.div variants={containerVariants} initial="hidden" animate="show">
  {items.map((item) => (
    <motion.div key={item.id} variants={itemVariants}>
      <PuzzleCard puzzle={item} />
    </motion.div>
  ))}
</motion.div>
```

#### Symbol Animation (for puzzle screen)
```tsx
// Symbols should appear one by one with glow
const symbolVariants = {
  hidden: {
    opacity: 0,
    scale: 0,
    filter: "blur(10px)",
  },
  visible: {
    opacity: 1,
    scale: 1,
    filter: "blur(0px)",
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 20,
    },
  },
};

// Glow pulse animation
const glowPulse = {
  animate: {
    textShadow: [
      "0 0 10px rgba(251, 191, 36, 0.5)",
      "0 0 20px rgba(251, 191, 36, 0.8)",
      "0 0 10px rgba(251, 191, 36, 0.5)",
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: "easeInOut",
    },
  },
};
```

#### Button Interactions
```tsx
// All buttons should have micro-interactions
const buttonVariants = {
  idle: { scale: 1 },
  hover: { scale: 1.02 },
  tap: { scale: 0.98 },
};

<motion.button
  variants={buttonVariants}
  initial="idle"
  whileHover="hover"
  whileTap="tap"
  className="..."
>
  Button Text
</motion.button>
```

#### Success Celebration
```tsx
// When puzzle is solved correctly
const celebrationVariants = {
  hidden: { scale: 0, rotate: -180 },
  visible: {
    scale: 1,
    rotate: 0,
    transition: {
      type: "spring",
      stiffness: 200,
      damping: 15,
    },
  },
};

// Add confetti effect using react-confetti or canvas-confetti
import confetti from 'canvas-confetti';

const celebrate = () => {
  confetti({
    particleCount: 100,
    spread: 70,
    origin: { y: 0.6 },
    colors: ['#F59E0B', '#8B5CF6', '#06B6D4'],
  });
};
```

---

### Component Design Specs

#### Button Styles
```tsx
// Primary Button (Gold gradient with glow)
const PrimaryButton = () => (
  <button className={cn(
    "px-6 py-3 rounded-xl font-semibold",
    "bg-gradient-to-r from-amber-500 to-amber-600",
    "text-white",
    "shadow-lg shadow-amber-500/25",
    "hover:shadow-xl hover:shadow-amber-500/40",
    "hover:from-amber-400 hover:to-amber-500",
    "active:scale-[0.98]",
    "transition-all duration-200",
  )}>
    Start Puzzle
  </button>
);

// Secondary Button (Glass effect)
const SecondaryButton = () => (
  <button className={cn(
    "px-6 py-3 rounded-xl font-semibold",
    "bg-white/10 backdrop-blur-sm",
    "text-white",
    "border border-white/20",
    "hover:bg-white/20",
    "hover:border-white/30",
    "active:scale-[0.98]",
    "transition-all duration-200",
  )}>
    View Hints
  </button>
);

// Ghost Button
const GhostButton = () => (
  <button className={cn(
    "px-6 py-3 rounded-xl font-semibold",
    "text-muted-foreground",
    "hover:text-foreground",
    "hover:bg-white/5",
    "transition-all duration-200",
  )}>
    Skip
  </button>
);
```

#### Input Fields
```tsx
// Styled input with glow on focus
const StyledInput = () => (
  <input className={cn(
    "w-full px-4 py-3 rounded-xl",
    "bg-white/5 backdrop-blur-sm",
    "border border-white/10",
    "text-foreground placeholder:text-muted-foreground",
    "focus:outline-none",
    "focus:border-amber-500/50",
    "focus:ring-2 focus:ring-amber-500/20",
    "focus:shadow-[0_0_20px_rgba(251,191,36,0.15)]",
    "transition-all duration-200",
  )} />
);
```

#### Symbol Display (Puzzle Screen)
```tsx
// Each symbol should be large and mystical
const SymbolDisplay = ({ symbol, isDecoded }) => (
  <span className={cn(
    "inline-block text-4xl md:text-6xl font-mono",
    "px-2 py-1 rounded-lg",
    // Encoded symbols - gold glow
    !isDecoded && [
      "text-amber-400",
      "drop-shadow-[0_0_15px_rgba(251,191,36,0.6)]",
      "animate-pulse",
    ],
    // Decoded symbols - cyan, no pulse
    isDecoded && [
      "text-cyan-400",
      "drop-shadow-[0_0_10px_rgba(34,211,238,0.4)]",
    ],
    "transition-all duration-500",
  )}>
    {symbol}
  </span>
);
```

---

### Layout Patterns

#### Dashboard Grid
```tsx
// Responsive grid with proper gaps
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* Cards */}
</div>
```

#### Page Container
```tsx
const PageContainer = ({ children }) => (
  <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950">
    {/* Optional: Ambient background glow */}
    <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-violet-900/20 via-transparent to-transparent pointer-events-none" />

    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {children}
    </div>
  </div>
);
```

#### Section Header
```tsx
const SectionHeader = ({ title, subtitle }) => (
  <div className="mb-8">
    <h2 className="text-2xl md:text-3xl font-bold text-foreground">
      {title}
    </h2>
    {subtitle && (
      <p className="mt-2 text-muted-foreground">
        {subtitle}
      </p>
    )}
  </div>
);
```

---

### Typography Scale

```tsx
// Headings
"text-4xl md:text-5xl font-bold"     // Page title (h1)
"text-2xl md:text-3xl font-bold"     // Section title (h2)
"text-xl md:text-2xl font-semibold"  // Card title (h3)
"text-lg font-medium"                 // Subtitle

// Body text
"text-base text-foreground"          // Normal text
"text-sm text-muted-foreground"      // Secondary text
"text-xs text-muted-foreground"      // Caption

// Special
"text-6xl md:text-8xl font-mono"     // Symbols
"text-3xl font-bold tabular-nums"    // Scores/numbers
```

---

### Dark/Light Mode

Always design for dark mode first, then adjust for light:

```tsx
// Example: Card that works in both modes
<div className={cn(
  // Dark mode (default)
  "bg-gray-900/80 border-white/10 text-white",
  // Light mode adjustments
  "dark:bg-gray-900/80 dark:border-white/10 dark:text-white",
  "light:bg-white light:border-gray-200 light:text-gray-900",
)}>
```

**Dark Mode Colors:**
- Background: `gray-950`, `gray-900`
- Cards: `gray-900/80` with `backdrop-blur`
- Text: `white`, `gray-300`, `gray-500`
- Borders: `white/10`, `white/20`

**Light Mode Colors:**
- Background: `gray-50`, `white`
- Cards: `white` with subtle shadow
- Text: `gray-900`, `gray-600`, `gray-400`
- Borders: `gray-200`, `gray-300`

---

### Spacing System

```
Space Scale (use consistently):
- xs: 0.5rem (8px)  → gap-2, p-2, m-2
- sm: 0.75rem (12px) → gap-3, p-3, m-3
- md: 1rem (16px)   → gap-4, p-4, m-4
- lg: 1.5rem (24px) → gap-6, p-6, m-6
- xl: 2rem (32px)   → gap-8, p-8, m-8
- 2xl: 3rem (48px)  → gap-12, p-12, m-12

Section spacing: mb-8 or mb-12
Card padding: p-4 (compact) or p-6 (comfortable)
Grid gaps: gap-4 (tight) or gap-6 (normal)
```

---

### Icons (Lucide React)

Use these icons consistently:

| Purpose | Icon Name |
|---------|-----------|
| Story mode | `BookOpen` |
| Challenge mode | `Swords` |
| Daily puzzle | `Calendar` |
| Timer | `Clock` |
| Hints | `Lightbulb` |
| Score | `Trophy` |
| Streak | `Flame` |
| Level | `Star` |
| Settings | `Settings` |
| Profile | `User` |
| Leaderboard | `Medal` |
| Achievement | `Award` |
| Lock (puzzle) | `Lock` |
| Check (complete) | `CheckCircle2` |
| Close | `X` |
| Menu | `Menu` |
| Back | `ArrowLeft` |
| Next | `ChevronRight` |

---

### Loading States

```tsx
// Skeleton with shimmer effect
const Skeleton = ({ className }) => (
  <div className={cn(
    "animate-pulse rounded-xl bg-white/5",
    className
  )} />
);

// Card skeleton
const CardSkeleton = () => (
  <div className="rounded-xl bg-white/5 p-6 space-y-4">
    <Skeleton className="h-4 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <Skeleton className="h-20 w-full" />
  </div>
);

// Spinner
const Spinner = () => (
  <div className="animate-spin h-6 w-6 border-2 border-amber-500 border-t-transparent rounded-full" />
);
```

---

### Z-Index Scale

```
z-0:   Base content
z-10:  Elevated cards
z-20:  Sticky headers
z-30:  Dropdown menus
z-40:  Modals/dialogs
z-50:  Toast notifications
z-[100]: Confetti/celebrations
```

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

## 🎯 Design Inspiration & References

### Visual Mood Board

The game should feel like a mix of:
1. **Duolingo** - Gamification, progress tracking, streak motivation
2. **Monument Valley** - Mysterious, beautiful, puzzle-focused
3. **Notion** - Clean, minimal, focused interface
4. **Discord** - Dark theme done right, smooth animations

### Reference Screenshots (Search these for inspiration)

| Reference | What to Take |
|-----------|--------------|
| "Duolingo dark mode" | Streak flames, XP animations, achievement popups |
| "Monument Valley UI" | Mysterious atmosphere, geometric patterns |
| "Linear app design" | Clean cards, subtle gradients, smooth transitions |
| "Stripe dashboard" | 3D card effects, professional gradients |
| "Apple Music lyrics" | Glowing text effects, smooth color transitions |

### Key Design Decisions

1. **Cards should FLOAT** - Use shadows and hover effects
2. **Symbols should GLOW** - Gold pulsing glow for mystery
3. **Transitions should be SMOOTH** - Use spring physics (Framer Motion)
4. **Text should be READABLE** - High contrast, proper hierarchy
5. **Actions should RESPOND** - Every click should have feedback

### Example Component Mockups

#### Puzzle Card (Locked State)
```
┌─────────────────────────────────────┐
│  🔒                                 │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░         │
│                                     │
│  ■■■ LOCKED ■■■                     │
│  Complete previous puzzle first     │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ STORY   │  │ BEGINNER│          │
│  └─────────┘  └─────────┘          │
└─────────────────────────────────────┘
(Grayscale, slightly transparent, no hover effect)
```

#### Puzzle Card (Available State)
```
┌─────────────────────────────────────┐
│  ✨ The Inner Light                 │
│  ☀☽★◆☀☽★◆☀☽★◆                      │  <- Gold glowing symbols
│                                     │
│  Discover the wisdom that lies      │
│  within every challenge             │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ STORY   │  │ADVANCED │          │  <- Purple & Orange badges
│  └─────────┘  └─────────┘          │
│                                     │
│  [ Start Puzzle → ]                 │  <- Gold gradient button
└─────────────────────────────────────┘
(Hover: lift up, glow increases, border brightens)
```

#### Puzzle Card (Completed State)
```
┌─────────────────────────────────────┐
│  ✓ The Inner Light        ⭐ 850   │  <- Checkmark + Score
│  THE LIGHT YOU SEEK...              │  <- Revealed text
│                                     │
│  Completed in 2:34                  │
│  0 hints used                       │
│                                     │
│  ┌─────────┐  ┌─────────┐          │
│  │ STORY   │  │ADVANCED │          │
│  └─────────┘  └─────────┘          │
│                                     │
│  [ Play Again ]  [ Share ]          │
└─────────────────────────────────────┘
(Success green glow on border, confetti on first complete)
```

#### Daily Puzzle Banner
```
╔═══════════════════════════════════════════════════════╗
║  🔥 7 Day Streak!                    Today's Puzzle   ║
║                                                       ║
║     ☀ ☽ ★ ◆ ✦ ☀ ☽ ★ ◆ ✦                            ║
║                                                       ║
║  "A new mystery awaits..."                            ║
║                                                       ║
║        ┌──────────────────────┐                       ║
║        │   SOLVE TODAY'S      │                       ║
║        │      PUZZLE          │  <- Large gold button ║
║        └──────────────────────┘                       ║
║                                                       ║
║  ⏰ Resets in 14:23:45                                ║
╚═══════════════════════════════════════════════════════╝
(Gradient border, animated symbols, countdown timer)
```

#### Achievement Unlock Popup
```
        ╭──────────────────────────╮
        │                          │
        │      🏆                  │  <- Bouncing animation
        │                          │
        │   ACHIEVEMENT UNLOCKED   │
        │                          │
        │   ★ First Steps ★        │
        │                          │
        │   Complete your first    │
        │   puzzle                 │
        │                          │
        │   +100 XP                │  <- Gold text
        │                          │
        │      [ Awesome! ]        │
        ╰──────────────────────────╯
(Appears with confetti, scale-in animation, glass effect)
```

---

### Pre-built CSS Utilities Available

These are already in `globals.css` - USE THEM:

| Class | Effect |
|-------|--------|
| `.card-3d` | 3D card with hover lift effect |
| `.glass` | Glassmorphism effect |
| `.animate-glow-pulse` | Pulsing glow animation |
| `.animate-float` | Floating up/down animation |
| `.animate-fade-in-up` | Fade in from bottom |
| `.animate-scale-in` | Scale in from small |
| `.animate-shimmer` | Skeleton loading shimmer |
| `.symbol-gold` | Gold glowing symbol |
| `.symbol-mystic` | Purple glowing symbol |
| `.symbol-insight` | Cyan glowing symbol |
| `.text-gradient-gold` | Gold gradient text |
| `.text-gradient-mystic` | Purple gradient text |
| `.focus-ring` | Accessible focus outline |
| `.stagger-1` to `.stagger-5` | Animation delays |

---

## Questions?

If you're unsure about:
- **API usage**: Check `src/api/services/*.service.ts`
- **Types**: Check `src/types/api.types.ts`
- **State management**: Check `src/stores/*.store.ts`
- **Data fetching**: Check `src/hooks/*.ts`
- **Theming**: Check `src/app/globals.css` for CSS variables and utilities

All infrastructure is documented and typed. Focus on creating great UI!

---

## Quick Start Checklist

Before starting any component:

```
□ Read this entire design system section
□ Install canvas-confetti: npm install canvas-confetti
□ Check globals.css for available utility classes
□ Use Framer Motion for all animations
□ Test in dark mode first, then light mode
□ Make sure cards have 3D depth
□ Add hover states to all interactive elements
□ Use the correct colors from the palette
```

**Remember**: This is a MYSTICAL puzzle game. Every element should feel magical, premium, and satisfying to interact with. When in doubt, add more glow and smoother animations!
