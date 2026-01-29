/**
 * Leaderboard Hooks
 *
 * @description React Query hooks for leaderboards
 * @author Lead Engineer
 */

import { useQuery } from '@tanstack/react-query';
import { leaderboardsService } from '@/api';
import type { LeaderboardQueryParams, LeaderboardPeriod } from '@/types/api.types';

// Query keys
export const leaderboardKeys = {
  all: ['leaderboards'] as const,
  list: (params: LeaderboardQueryParams) =>
    [...leaderboardKeys.all, 'list', params] as const,
  rank: (period: LeaderboardPeriod) =>
    [...leaderboardKeys.all, 'rank', period] as const,
  top: () => [...leaderboardKeys.all, 'top'] as const,
  stats: () => [...leaderboardKeys.all, 'stats'] as const,
  streaks: (limit: number) => [...leaderboardKeys.all, 'streaks', limit] as const,
  levels: (limit: number) => [...leaderboardKeys.all, 'levels', limit] as const,
};

/**
 * Hook to fetch score leaderboard
 */
export function useLeaderboard(params?: LeaderboardQueryParams) {
  return useQuery({
    queryKey: leaderboardKeys.list(params || {}),
    queryFn: () => leaderboardsService.getLeaderboard(params),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch current user's rank
 */
export function useUserRank(period: LeaderboardPeriod = 'all') {
  return useQuery({
    queryKey: leaderboardKeys.rank(period),
    queryFn: () => leaderboardsService.getUserRank(period),
  });
}

/**
 * Hook to fetch top 3 players
 */
export function useTopPlayers() {
  return useQuery({
    queryKey: leaderboardKeys.top(),
    queryFn: () => leaderboardsService.getTop(),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch global statistics
 */
export function useGlobalStats() {
  return useQuery({
    queryKey: leaderboardKeys.stats(),
    queryFn: () => leaderboardsService.getStats(),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook to fetch streak leaderboard
 */
export function useStreakLeaderboard(limit = 10) {
  return useQuery({
    queryKey: leaderboardKeys.streaks(limit),
    queryFn: () => leaderboardsService.getStreaks(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}

/**
 * Hook to fetch level leaderboard
 */
export function useLevelLeaderboard(limit = 10) {
  return useQuery({
    queryKey: leaderboardKeys.levels(limit),
    queryFn: () => leaderboardsService.getLevels(limit),
    staleTime: 60 * 1000, // 1 minute
  });
}
