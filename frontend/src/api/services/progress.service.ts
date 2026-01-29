/**
 * Progress API Service
 *
 * @description Puzzle progress tracking endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  UserProgress,
  ProgressWithPuzzle,
  GameModeProgress,
  SubmitProgressInput,
  GameMode,
} from '@/types/api.types';

export const progressService = {
  /**
   * Submit or update puzzle progress
   */
  submit: (data: SubmitProgressInput) =>
    apiClient.post<UserProgress>('/progress', data, true),

  /**
   * Get all user progress
   */
  getAll: () => apiClient.get<ProgressWithPuzzle[]>('/progress', true),

  /**
   * Get progress for a specific puzzle
   */
  getByPuzzle: (puzzleId: string) =>
    apiClient.get<UserProgress | null>(`/progress/puzzle/${puzzleId}`, true),

  /**
   * Get progress summary by game mode
   */
  getByMode: (gameMode: GameMode) =>
    apiClient.get<GameModeProgress>(`/progress/mode/${gameMode}`, true),

  /**
   * Get list of completed puzzle IDs
   */
  getCompleted: () => apiClient.get<string[]>('/progress/completed', true),

  /**
   * Reset all progress
   */
  resetAll: () => apiClient.delete<null>('/progress', true),

  /**
   * Reset progress for a specific puzzle
   */
  resetPuzzle: (puzzleId: string) =>
    apiClient.delete<null>(`/progress/puzzle/${puzzleId}`, true),
};
