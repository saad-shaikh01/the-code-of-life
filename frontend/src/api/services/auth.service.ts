/**
 * Auth API Service
 *
 * @description Authentication endpoints
 * @author Lead Engineer
 */

import { apiClient } from '../client';
import type {
  AuthResponse,
  AuthTokens,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  User,
} from '@/types/api.types';

export const authService = {
  /**
   * Register a new user
   */
  register: (data: RegisterInput) =>
    apiClient.post<AuthResponse>('/auth/register', data),

  /**
   * Login with email and password
   */
  login: (data: LoginInput) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  /**
   * Refresh access token
   */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>('/auth/refresh', { refreshToken }),

  /**
   * Change password (requires auth)
   */
  changePassword: (data: ChangePasswordInput) =>
    apiClient.post<null>('/auth/change-password', data, true),

  /**
   * Get current authenticated user
   */
  me: () => apiClient.get<User>('/auth/me', true),
};
