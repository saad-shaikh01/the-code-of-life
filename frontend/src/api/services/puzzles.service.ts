/**
 * Puzzles API Service
 *
 * @description Puzzle management endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  Puzzle,
  PuzzleQueryParams,
  CreatePuzzleInput,
  PaginatedResponse,
} from '@/types/api.types';

export const puzzlesService = {
  /**
   * Get all puzzles with pagination and filtering
   */
  getAll: async (params?: PuzzleQueryParams) => {
    const query = new URLSearchParams();
    if (params?.page) query.set('page', String(params.page));
    if (params?.limit) query.set('limit', String(params.limit));
    if (params?.gameMode) query.set('gameMode', params.gameMode);
    if (params?.difficulty) query.set('difficulty', params.difficulty);

    const queryString = query.toString();
    const endpoint = `/puzzles${queryString ? `?${queryString}` : ''}`;

    return apiClient.request<Puzzle[]>(endpoint) as Promise<PaginatedResponse<Puzzle>>;
  },

  /**
   * Get puzzle by ID
   */
  getById: (id: string) => apiClient.get<Puzzle>(`/puzzles/${id}`),

  /**
   * Get daily puzzle
   */
  getDaily: () => apiClient.get<Puzzle | null>('/puzzles/daily'),

  /**
   * Create a new puzzle (admin)
   */
  create: (data: CreatePuzzleInput) =>
    apiClient.post<Puzzle>('/puzzles', data, true),

  /**
   * Update puzzle (admin)
   */
  update: (id: string, data: Partial<CreatePuzzleInput>) =>
    apiClient.patch<Puzzle>(`/puzzles/${id}`, data, true),

  /**
   * Delete puzzle (admin)
   */
  delete: (id: string) => apiClient.delete<Puzzle>(`/puzzles/${id}`, true),
};
