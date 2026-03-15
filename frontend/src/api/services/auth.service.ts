/**
 * Auth API Service
 *
 * @description Authentication endpoints
 * @author Lead Engineer
 */

import { apiClient } from "../client";
import type {
  AuthResponse,
  AuthTokens,
  RegisterInput,
  LoginInput,
  ChangePasswordInput,
  ForgotPasswordInput,
  ForgotPasswordResponse,
  MessageResponse,
  ResetPasswordInput,
  User,
} from "@/types/api.types";

export const authService = {
  /**
   * Register a new user
   */
  register: (data: RegisterInput) =>
    apiClient.post<AuthResponse>("/auth/register", data),

  /**
   * Login with email and password
   */
  login: (data: LoginInput) =>
    apiClient.post<AuthResponse>("/auth/login", data),

  /**
   * Refresh access token
   */
  refresh: (refreshToken: string) =>
    apiClient.post<AuthTokens>("/auth/refresh", { refreshToken }),

  /**
   * Change password (requires auth)
   */
  changePassword: (data: ChangePasswordInput) =>
    apiClient.post<null>("/auth/change-password", data, true),

  /**
   * Request a password reset link
   */
  forgotPassword: (data: ForgotPasswordInput) =>
    apiClient.post<ForgotPasswordResponse>("/auth/forgot-password", data),

  /**
   * Reset password using a valid reset token
   */
  resetPassword: (data: ResetPasswordInput) =>
    apiClient.post<null>("/auth/reset-password", data),

  /**
   * Verify email using a token from the email link
   */
  verifyEmail: (token: string) =>
    apiClient.get<MessageResponse>(
      `/auth/verify-email?token=${encodeURIComponent(token)}`,
    ),

  /**
   * Resend the current user's verification email
   */
  resendVerification: () =>
    apiClient.post<MessageResponse>("/auth/resend-verification", undefined, true),

  /**
   * Get current authenticated user
   */
  me: () => apiClient.get<User>("/auth/me", true),
};
