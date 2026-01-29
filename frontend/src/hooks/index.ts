/**
 * Hooks Index
 *
 * @description Central export for all custom hooks
 * @author Lead Engineer
 */

// Puzzle hooks
export {
  usePuzzles,
  usePuzzle,
  useDailyPuzzle,
  useCreatePuzzle,
  useUpdatePuzzle,
  useDeletePuzzle,
  puzzleKeys,
} from './use-puzzles';

// Progress hooks
export {
  useUserProgress,
  usePuzzleProgress,
  useModeProgress,
  useCompletedPuzzles,
  useSubmitProgress,
  useResetProgress,
  useResetPuzzleProgress,
  progressKeys,
} from './use-progress';

// Achievement hooks
export {
  useAchievements,
  useAchievement,
  useUserAchievements,
  useUnlockedAchievements,
  useAchievementProgress,
  useCheckAchievements,
  useSeedAchievements,
  achievementKeys,
} from './use-achievements';

// Leaderboard hooks
export {
  useLeaderboard,
  useUserRank,
  useTopPlayers,
  useGlobalStats,
  useStreakLeaderboard,
  useLevelLeaderboard,
  leaderboardKeys,
} from './use-leaderboards';
