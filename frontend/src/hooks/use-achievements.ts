/**
 * Achievement Hooks
 *
 * @description React Query hooks for achievements
 * @author Lead Engineer
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { achievementsService } from '@/api';

// Query keys
export const achievementKeys = {
  all: ['achievements'] as const,
  list: () => [...achievementKeys.all, 'list'] as const,
  detail: (id: string) => [...achievementKeys.all, 'detail', id] as const,
  user: () => [...achievementKeys.all, 'user'] as const,
  unlocked: () => [...achievementKeys.all, 'unlocked'] as const,
  progress: (id: string) => [...achievementKeys.all, 'progress', id] as const,
};

/**
 * Hook to fetch all achievements
 */
export function useAchievements() {
  return useQuery({
    queryKey: achievementKeys.list(),
    queryFn: () => achievementsService.getAll(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook to fetch achievement by ID
 */
export function useAchievement(id: string) {
  return useQuery({
    queryKey: achievementKeys.detail(id),
    queryFn: () => achievementsService.getById(id),
    enabled: !!id,
  });
}

/**
 * Hook to fetch user achievements with unlock status
 */
export function useUserAchievements() {
  return useQuery({
    queryKey: achievementKeys.user(),
    queryFn: () => achievementsService.getUserAchievements(),
  });
}

/**
 * Hook to fetch unlocked achievements only
 */
export function useUnlockedAchievements() {
  return useQuery({
    queryKey: achievementKeys.unlocked(),
    queryFn: () => achievementsService.getUnlocked(),
  });
}

/**
 * Hook to fetch progress towards an achievement
 */
export function useAchievementProgress(achievementId: string) {
  return useQuery({
    queryKey: achievementKeys.progress(achievementId),
    queryFn: () => achievementsService.getProgress(achievementId),
    enabled: !!achievementId,
  });
}

/**
 * Hook to check and unlock new achievements
 */
export function useCheckAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => achievementsService.checkAchievements(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.user() });
      queryClient.invalidateQueries({ queryKey: achievementKeys.unlocked() });
    },
  });
}

/**
 * Hook to seed default achievements (admin)
 */
export function useSeedAchievements() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => achievementsService.seed(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: achievementKeys.list() });
    },
  });
}
