/**
 * API Type Definitions
 *
 * @description Types matching backend API responses
 * @author Lead Engineer
 * @note Keep in sync with @code-of-life/shared package
 */

// ============================================
// Common Types
// ============================================

export type GameMode = 'STORY' | 'CHALLENGE' | 'DAILY';
export type Difficulty = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'MASTER';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  timestamp: string;
}

export interface ApiError {
  success: false;
  message: string;
  errors?: Array<{
    field: string;
    message: string;
  }>;
  timestamp: string;
}

// ============================================
// Auth Types
// ============================================

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface User {
  id: string;
  email: string;
  username: string;
  avatarUrl: string | null;
  currentLevel: number;
  totalScore: number;
  streakDays: number;
  lastPlayedAt: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export interface RegisterInput {
  email: string;
  username: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

// ============================================
// Puzzle Types
// ============================================

export interface Puzzle {
  id: string;
  title: string;
  encryptedPattern: string;
  originalReflection: string;
  bookChapter: number | null;
  bookSection: string | null;
  bookPageRef: string | null;
  gameMode: GameMode;
  difficulty: Difficulty;
  orderIndex: number;
  scheduledDate: string | null;
  hints: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PuzzleQueryParams {
  page?: number;
  limit?: number;
  gameMode?: GameMode;
  difficulty?: Difficulty;
}

export interface CreatePuzzleInput {
  title: string;
  encryptedPattern: string;
  originalReflection: string;
  gameMode: GameMode;
  difficulty: Difficulty;
  bookChapter?: number;
  bookSection?: string;
  hints?: string[];
  scheduledDate?: string;
}

// ============================================
// Decoder Types
// ============================================

export interface DecodeResult {
  output: string;
  unmappedSymbols: string[];
  mappedCount: number;
  totalSymbols: number;
}

export interface ValidationResult {
  isCorrect: boolean;
  similarity: number;
  hint?: string;
}

export interface DecodeRequest {
  encryptedPattern: string;
  customMap?: Record<string, string>;
}

export interface EncodeRequest {
  text: string;
  customMap?: Record<string, string>;
}

export interface ValidateAttemptRequest {
  puzzleId: string;
  attempt: string;
  caseSensitive?: boolean;
}

// ============================================
// Progress Types
// ============================================

export interface UserProgress {
  id: string;
  puzzleId: string;
  completed: boolean;
  completedAt: string | null;
  score: number;
  timeSpent: number;
  hintsUsed: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressWithPuzzle extends UserProgress {
  puzzle: Puzzle;
}

export interface GameModeProgress {
  total: number;
  completed: number;
  totalScore: number;
  averageTime: number;
}

export interface SubmitProgressInput {
  puzzleId: string;
  completed?: boolean;
  score?: number;
  timeSpent: number;
  hintsUsed?: number;
}

// ============================================
// User Types
// ============================================

export interface UserStats {
  totalPuzzlesCompleted: number;
  totalScore: number;
  currentLevel: number;
  streakDays: number;
  averageTimePerPuzzle: number;
  hintsUsed: number;
  achievementsUnlocked: number;
}

export interface PublicProfile {
  id: string;
  username: string;
  avatarUrl: string | null;
  currentLevel: number;
  totalScore: number;
  streakDays: number;
  createdAt: string;
  puzzlesCompleted: number;
  achievementsUnlocked: number;
}

export interface UpdateProfileInput {
  username?: string;
  avatarUrl?: string | null;
}

// ============================================
// Achievement Types
// ============================================

export type AchievementCriteriaType =
  | 'PUZZLES_COMPLETED'
  | 'SCORE_REACHED'
  | 'STREAK_DAYS'
  | 'MODE_COMPLETED'
  | 'PERFECT_SCORE'
  | 'SPEED_RUN'
  | 'NO_HINTS'
  | 'FIRST_PUZZLE'
  | 'DAILY_STREAK';

export interface AchievementCriteria {
  type: AchievementCriteriaType;
  target: number;
  gameMode?: GameMode;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  iconUrl: string | null;
  points: number;
  criteria: string; // JSON stringified AchievementCriteria
  createdAt: string;
}

export interface AchievementWithUnlock extends Achievement {
  isUnlocked: boolean;
  unlockedAt: string | null;
}

export interface UserAchievement {
  id: string;
  unlockedAt: string;
  achievement: Achievement;
}

export interface AchievementProgress {
  current: number;
  target: number;
  percentage: number;
}

// ============================================
// Leaderboard Types
// ============================================

export type LeaderboardPeriod = 'all' | 'monthly' | 'weekly' | 'daily';

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  score: number;
  puzzlesCompleted: number;
  streakDays: number;
  currentLevel: number;
}

export interface LeaderboardResponse {
  entries: LeaderboardEntry[];
  total: number;
  userRank: number | null;
  period: LeaderboardPeriod;
}

export interface LeaderboardQueryParams {
  limit?: number;
  offset?: number;
  period?: LeaderboardPeriod;
}

export interface GlobalStats {
  totalPlayers: number;
  totalPuzzlesCompleted: number;
  totalScore: number;
  averageScore: number;
}
