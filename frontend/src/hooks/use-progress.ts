/**
 * Progress Hooks
 *
 * @description React Query hooks for progress tracking
 * @author Lead Engineer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { progressService } from '@/api';
import { achievementsService } from '@/api';
import type { SubmitProgressInput, GameMode } from '@/types/api.types';
import { puzzleKeys } from './use-puzzles';

// Query keys
export const progressKeys = {
  all: ['progress'] as const,
  list: () => [...progressKeys.all, 'list'] as const,
  puzzle: (puzzleId: string) => [...progressKeys.all, 'puzzle', puzzleId] as const,
  mode: (mode: GameMode) => [...progressKeys.all, 'mode', mode] as const,
  completed: () => [...progressKeys.all, 'completed'] as const,
};

/**
 * Hook to fetch all user progress
 */
export function useUserProgress() {
  return useQuery({
    queryKey: progressKeys.list(),
    queryFn: () => progressService.getAll(),
  });
}

/**
 * Hook to fetch progress for a specific puzzle
 */
export function usePuzzleProgress(puzzleId: string) {
  return useQuery({
    queryKey: progressKeys.puzzle(puzzleId),
    queryFn: () => progressService.getByPuzzle(puzzleId),
    enabled: !!puzzleId,
  });
}

/**
 * Hook to fetch progress by game mode
 */
export function useModeProgress(mode: GameMode) {
  return useQuery({
    queryKey: progressKeys.mode(mode),
    queryFn: () => progressService.getByMode(mode),
  });
}

/**
 * Hook to fetch completed puzzle IDs
 */
export function useCompletedPuzzles() {
  return useQuery({
    queryKey: progressKeys.completed(),
    queryFn: () => progressService.getCompleted(),
  });
}

/**
 * Hook to submit puzzle progress
 */
export function useSubmitProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SubmitProgressInput) => progressService.submit(data),
    onSuccess: (_, variables) => {
      // Invalidate related queries
      queryClient.invalidateQueries({ queryKey: progressKeys.list() });
      queryClient.invalidateQueries({ queryKey: progressKeys.puzzle(variables.puzzleId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.completed() });

      // Also check for new achievements
      achievementsService.checkAchievements().catch(() => {});
    },
  });
}

/**
 * Hook to reset all progress
 */
export function useResetProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => progressService.resetAll(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: progressKeys.all });
    },
  });
}

/**
 * Hook to reset progress for a specific puzzle
 */
export function useResetPuzzleProgress() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (puzzleId: string) => progressService.resetPuzzle(puzzleId),
    onSuccess: (_, puzzleId) => {
      queryClient.invalidateQueries({ queryKey: progressKeys.puzzle(puzzleId) });
      queryClient.invalidateQueries({ queryKey: progressKeys.completed() });
    },
  });
}
