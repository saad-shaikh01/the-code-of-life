/**
 * Game Store
 *
 * @description Global game state management for puzzle gameplay
 * @author Lead Engineer
 */

import { create } from 'zustand';
import { GAME_CONFIG } from '@/config/constants';
import type { Puzzle, GameMode, Difficulty } from '@/types/api.types';

interface GameState {
  // Current puzzle state
  currentPuzzle: Puzzle | null;
  userInput: string;
  hintsUsed: number;
  hintsRevealed: string[];
  startTime: number | null;
  elapsedTime: number;
  isCompleted: boolean;
  isCorrect: boolean;
  similarity: number;

  // Symbol mapping state
  symbolMap: Record<string, string>;
  userSymbolMap: Record<string, string>;

  // Filter state
  selectedMode: GameMode | null;
  selectedDifficulty: Difficulty | null;

  // Actions
  setPuzzle: (puzzle: Puzzle) => void;
  setUserInput: (input: string) => void;
  useHint: () => string | null;
  startTimer: () => void;
  updateElapsedTime: () => void;
  resetTimer: () => void;
  setCompleted: (isCorrect: boolean, similarity: number) => void;
  setSymbolMap: (map: Record<string, string>) => void;
  updateUserSymbolMap: (symbol: string, letter: string) => void;
  clearUserSymbolMap: () => void;
  setSelectedMode: (mode: GameMode | null) => void;
  setSelectedDifficulty: (difficulty: Difficulty | null) => void;
  resetGame: () => void;
  calculateScore: () => number;
}

const initialState = {
  currentPuzzle: null,
  userInput: '',
  hintsUsed: 0,
  hintsRevealed: [],
  startTime: null,
  elapsedTime: 0,
  isCompleted: false,
  isCorrect: false,
  similarity: 0,
  symbolMap: {},
  userSymbolMap: {},
  selectedMode: null,
  selectedDifficulty: null,
};

export const useGameStore = create<GameState>()((set, get) => ({
  ...initialState,

  // Set current puzzle and reset game state
  setPuzzle: (puzzle) =>
    set({
      currentPuzzle: puzzle,
      userInput: '',
      hintsUsed: 0,
      hintsRevealed: [],
      startTime: null,
      elapsedTime: 0,
      isCompleted: false,
      isCorrect: false,
      similarity: 0,
      userSymbolMap: {},
    }),

  // Update user input
  setUserInput: (input) => set({ userInput: input }),

  // Use a hint
  useHint: () => {
    const { currentPuzzle, hintsUsed, hintsRevealed } = get();

    if (!currentPuzzle) return null;
    if (hintsUsed >= GAME_CONFIG.HINTS_PER_PUZZLE) return null;
    if (hintsUsed >= currentPuzzle.hints.length) return null;

    const hint = currentPuzzle.hints[hintsUsed];

    set({
      hintsUsed: hintsUsed + 1,
      hintsRevealed: [...hintsRevealed, hint],
    });

    return hint;
  },

  // Start the timer
  startTimer: () => {
    const { startTime } = get();
    if (startTime === null) {
      set({ startTime: Date.now() });
    }
  },

  // Update elapsed time
  updateElapsedTime: () => {
    const { startTime, isCompleted } = get();
    if (startTime && !isCompleted) {
      set({ elapsedTime: Math.floor((Date.now() - startTime) / 1000) });
    }
  },

  // Reset timer
  resetTimer: () => set({ startTime: null, elapsedTime: 0 }),

  // Mark puzzle as completed
  setCompleted: (isCorrect, similarity) =>
    set({
      isCompleted: true,
      isCorrect,
      similarity,
    }),

  // Set symbol map from API
  setSymbolMap: (map) => set({ symbolMap: map }),

  // Update user's symbol mapping guess
  updateUserSymbolMap: (symbol, letter) =>
    set((state) => ({
      userSymbolMap: {
        ...state.userSymbolMap,
        [symbol]: letter.toUpperCase(),
      },
    })),

  // Clear user's symbol map
  clearUserSymbolMap: () => set({ userSymbolMap: {} }),

  // Set selected mode filter
  setSelectedMode: (mode) => set({ selectedMode: mode }),

  // Set selected difficulty filter
  setSelectedDifficulty: (difficulty) => set({ selectedDifficulty: difficulty }),

  // Reset entire game state
  resetGame: () => set(initialState),

  // Calculate score based on hints used and time
  calculateScore: () => {
    const { hintsUsed, elapsedTime, isCorrect } = get();

    if (!isCorrect) return 0;

    let score = GAME_CONFIG.POINTS_PER_CORRECT;

    // Deduct points for hints
    score -= hintsUsed * GAME_CONFIG.POINTS_DEDUCTION_PER_HINT;

    // Bonus for fast completion
    if (elapsedTime < GAME_CONFIG.TIME_BONUS_THRESHOLD) {
      const timeBonus = Math.floor(
        (GAME_CONFIG.TIME_BONUS_THRESHOLD - elapsedTime) / 2
      );
      score += timeBonus;
    }

    return Math.max(0, score);
  },
}));
