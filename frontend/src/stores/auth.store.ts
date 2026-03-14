/**
 * Auth Store
 *
 * @description Global authentication state management using Zustand
 * @author Lead Engineer
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { apiClient } from '@/api/client';
import { authService } from '@/api/services/auth.service';
import { AUTH_CONFIG } from '@/config/constants';
import type { User, LoginInput, RegisterInput } from '@/types/api.types';

interface AuthState {
  // State
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  hasHydrated: boolean;
  isAuthReady: boolean;

  // Actions
  login: (credentials: LoginInput) => Promise<void>;
  register: (data: RegisterInput) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  clearError: () => void;
  setUser: (user: User) => void;
  setHasHydrated: (value: boolean) => void;
  setAuthReady: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // Initial state
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,
      hasHydrated: false,
      isAuthReady: false,

      // Login action
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.login(credentials);
          const { user, tokens } = response.data;

          // Store tokens
          apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAuthReady: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Login failed',
          });
          throw error;
        }
      },

      // Register action
      register: async (data) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authService.register(data);
          const { user, tokens } = response.data;

          // Store tokens
          apiClient.setTokens(tokens.accessToken, tokens.refreshToken);

          set({
            user,
            isAuthenticated: true,
            isLoading: false,
            isAuthReady: true,
          });
        } catch (error) {
          set({
            isLoading: false,
            error: error instanceof Error ? error.message : 'Registration failed',
          });
          throw error;
        }
      },

      // Logout action
      logout: () => {
        apiClient.clearTokens();
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
          isAuthReady: true,
        });
      },

      // Refresh user data
      refreshUser: async () => {
        if (!apiClient.hasStoredSession()) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
          return;
        }

        set({ isLoading: true, error: null });

        try {
          const response = await authService.me();
          set({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token might be invalid, logout
          get().logout();
        } finally {
          set({ isLoading: false });
        }
      },

      // Clear error
      clearError: () => set({ error: null }),

      // Set user (for external updates)
      setUser: (user) => set({ user }),

      setHasHydrated: (value) => set({ hasHydrated: value }),

      setAuthReady: (value) => set({ isAuthReady: value }),
    }),
    {
      name: AUTH_CONFIG.USER_KEY,
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state, error) => {
        if (!error && !apiClient.hasStoredSession()) {
          state?.logout();
        }

        state?.setHasHydrated(true);

        if (error || !apiClient.hasStoredSession()) {
          state?.setAuthReady(true);
        }
      },
    }
  )
);
