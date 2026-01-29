/**
 * Leaderboards API Service
 *
 * @description Ranking and statistics endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  LeaderboardResponse,
  LeaderboardEntry,
  LeaderboardQueryParams,
  LeaderboardPeriod,
  GlobalStats,
} from '@/types/api.types';

export const leaderboardsService = {
  /**
   * Get score leaderboard
   */
  getLeaderboard: async (params?: LeaderboardQueryParams) => {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.offset) query.set('offset', String(params.offset));
    if (params?.period) query.set('period', params.period);

    const queryString = query.toString();
    const endpoint = `/leaderboards${queryString ? `?${queryString}` : ''}`;

    return apiClient.get<LeaderboardResponse>(endpoint);
  },

  /**
   * Get current user's rank
   */
  getUserRank: (period: LeaderboardPeriod = 'all') =>
    apiClient.get<{ rank: number | null; period: string }>(
      `/leaderboards/rank?period=${period}`,
      true
    ),

  /**
   * Get top 3 players
   */
  getTop: () => apiClient.get<LeaderboardEntry[]>('/leaderboards/top'),

  /**
   * Get global statistics
   */
  getStats: () => apiClient.get<GlobalStats>('/leaderboards/stats'),

  /**
   * Get streak leaderboard
   */
  getStreaks: (limit = 10) =>
    apiClient.get<LeaderboardEntry[]>(`/leaderboards/streaks?limit=${limit}`),

  /**
   * Get level leaderboard
   */
  getLevels: (limit = 10) =>
    apiClient.get<LeaderboardEntry[]>(`/leaderboards/levels?limit=${limit}`),
};
