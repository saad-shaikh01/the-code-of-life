/**
 * Puzzle Hooks
 *
 * @description React Query hooks for puzzle data
 * @author Lead Engineer
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { puzzlesService } from "@/api";
import { ApiClientError } from "@/api/client";
import { useSubscriptionStatus } from "./use-subscription";
import type {
  ApiResponse,
  Puzzle,
  PuzzleQueryParams,
  CreatePuzzleInput,
} from "@/types/api.types";

// Query keys
export const puzzleKeys = {
  all: ["puzzles"] as const,
  lists: () => [...puzzleKeys.all, "list"] as const,
  list: (params: PuzzleQueryParams) => [...puzzleKeys.lists(), params] as const,
  details: () => [...puzzleKeys.all, "detail"] as const,
  detail: (id: string) => [...puzzleKeys.details(), id] as const,
  daily: () => [...puzzleKeys.all, "daily"] as const,
};

/**
 * Hook to fetch paginated puzzles
 */
export function usePuzzles(params?: PuzzleQueryParams) {
  return useQuery({
    queryKey: puzzleKeys.list(params || {}),
    queryFn: () => puzzlesService.getAll(params),
  });
}

/**
 * Hook to fetch a single puzzle by ID
 */
export function usePuzzle(id: string) {
  return useQuery({
    queryKey: puzzleKeys.detail(id),
    queryFn: () => puzzlesService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch daily puzzle
 */
export function useDailyPuzzle() {
  const { isPro, isLoading: subscriptionLoading } = useSubscriptionStatus();
  const isLocked = !subscriptionLoading && !isPro;

  const query = useQuery({
    queryKey: [...puzzleKeys.daily(), isPro ? "pro" : "locked"],
    queryFn: async () => {
      try {
        return await puzzlesService.getDaily();
      } catch (error) {
        if (!isPro && error instanceof ApiClientError && error.status === 403) {
          return {
            success: true,
            data: null,
            message: "Daily puzzle is locked for free-tier users",
            timestamp: new Date().toISOString(),
          } satisfies ApiResponse<Puzzle | null>;
        }

        throw error;
      }
    },
    enabled: isPro && !subscriptionLoading,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false,
  });

  const isNoPuzzleAvailable =
    !isLocked &&
    !subscriptionLoading &&
    query.isSuccess &&
    query.data?.data == null;

  return {
    ...query,
    data: isLocked ? null : query.data,
    error: isLocked ? null : query.error,
    isLoading: subscriptionLoading || query.isLoading,
    isLocked,
    isNoPuzzleAvailable,
  };
}

/**
 * Hook to create a puzzle (admin)
 */
export function useCreatePuzzle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePuzzleInput) => puzzlesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });
    },
  });
}

/**
 * Hook to update a puzzle (admin)
 */
export function useUpdatePuzzle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreatePuzzleInput>;
    }) => puzzlesService.update(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: puzzleKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });
    },
  });
}

/**
 * Hook to delete a puzzle (admin)
 */
export function useDeletePuzzle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => puzzlesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: puzzleKeys.lists() });
    },
  });
}
