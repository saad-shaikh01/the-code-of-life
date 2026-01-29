/**
 * Users API Service
 *
 * @description User profile and stats endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  User,
  UserStats,
  PublicProfile,
  UpdateProfileInput,
} from '@/types/api.types';

export const usersService = {
  /**
   * Get current user profile
   */
  getProfile: () => apiClient.get<User>('/users/profile', true),

  /**
   * Update user profile
   */
  updateProfile: (data: UpdateProfileInput) =>
    apiClient.patch<User>('/users/profile', data, true),

  /**
   * Get user statistics
   */
  getStats: () => apiClient.get<UserStats>('/users/stats', true),

  /**
   * Get public profile by username
   */
  getPublicProfile: (username: string) =>
    apiClient.get<PublicProfile>(`/users/${username}`),

  /**
   * Delete user account
   */
  deleteAccount: () => apiClient.delete<null>('/users/account', true),
};
