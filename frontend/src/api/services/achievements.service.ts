/**
 * Achievements API Service
 *
 * @description Achievement management and tracking endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  Achievement,
  AchievementWithUnlock,
  UserAchievement,
  AchievementProgress,
} from '@/types/api.types';

export const achievementsService = {
  /**
   * Get all achievements
   */
  getAll: () => apiClient.get<Achievement[]>('/achievements'),

  /**
   * Get achievement by ID
   */
  getById: (id: string) => apiClient.get<Achievement>(`/achievements/${id}`),

  /**
   * Get all achievements with user unlock status
   */
  getUserAchievements: () =>
    apiClient.get<AchievementWithUnlock[]>('/achievements/user', true),

  /**
   * Get user's unlocked achievements
   */
  getUnlocked: () =>
    apiClient.get<UserAchievement[]>('/achievements/unlocked', true),

  /**
   * Check and unlock new achievements
   */
  checkAchievements: () =>
    apiClient.post<Achievement[]>('/achievements/check', undefined, true),

  /**
   * Get progress towards an achievement
   */
  getProgress: (achievementId: string) =>
    apiClient.get<AchievementProgress>(
      `/achievements/${achievementId}/progress`,
      true
    ),

  /**
   * Seed default achievements (admin)
   */
  seed: () => apiClient.post<Achievement[]>('/achievements/seed'),
};
