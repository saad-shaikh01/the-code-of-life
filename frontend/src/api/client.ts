/**
 * API Client
 *
 * @description Centralized HTTP client with authentication handling
 * @author Lead Engineer
 */

import { API_CONFIG, AUTH_CONFIG } from "@/config/constants";
import type { ApiResponse, ApiError } from "@/types/api.types";

type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
type AuthStorageMode = "session" | "local";

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  requireAuth?: boolean;
  timeout?: number;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout: number;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
    this.defaultTimeout = API_CONFIG.TIMEOUT;
  }

  /**
   * Get access token from storage
   */
  private getAccessToken(): string | null {
    return this.getToken(AUTH_CONFIG.ACCESS_TOKEN_KEY);
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    return this.getToken(AUTH_CONFIG.REFRESH_TOKEN_KEY);
  }

  /**
   * Check whether any auth token is available in storage
   */
  hasStoredSession(): boolean {
    return Boolean(this.getStoredSessionMode());
  }

  /**
   * Keep the middleware routing cookie in sync with client-side auth storage.
   */
  syncSessionCookie(): void {
    const storageMode = this.getStoredSessionMode();

    if (!storageMode) {
      this.clearSessionCookie();
      return;
    }

    this.setSessionCookie(storageMode === "local");
  }

  private setSessionCookie(rememberMe: boolean): void {
    if (typeof document === "undefined" || typeof window === "undefined")
      return;

    const cookieParts = [
      `${AUTH_CONFIG.SESSION_COOKIE_NAME}=1`,
      "Path=/",
      "SameSite=Lax",
    ];

    if (rememberMe) {
      cookieParts.push(`Max-Age=${AUTH_CONFIG.SESSION_COOKIE_MAX_AGE_SECONDS}`);
    }

    if (window.location.protocol === "https:") {
      cookieParts.push("Secure");
    }

    document.cookie = cookieParts.join("; ");
  }

  private clearSessionCookie(): void {
    if (typeof document === "undefined" || typeof window === "undefined")
      return;

    const cookieParts = [
      `${AUTH_CONFIG.SESSION_COOKIE_NAME}=`,
      "Path=/",
      "Expires=Thu, 01 Jan 1970 00:00:00 GMT",
      "Max-Age=0",
      "SameSite=Lax",
    ];

    if (window.location.protocol === "https:") {
      cookieParts.push("Secure");
    }

    document.cookie = cookieParts.join("; ");
  }

  /**
   * Set tokens in storage
   */
  setTokens(
    accessToken: string,
    refreshToken: string,
    rememberMe = true,
  ): void {
    const storage = this.getStorage(rememberMe ? "local" : "session");
    const alternateStorage = this.getStorage(rememberMe ? "session" : "local");

    if (!storage || !alternateStorage) return;

    alternateStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    alternateStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    storage.setItem(AUTH_CONFIG.ACCESS_TOKEN_KEY, accessToken);
    storage.setItem(AUTH_CONFIG.REFRESH_TOKEN_KEY, refreshToken);
    this.setSessionCookie(rememberMe);
  }

  /**
   * Clear tokens from storage
   */
  clearTokens(): void {
    if (typeof window === "undefined") return;
    localStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    localStorage.removeItem(AUTH_CONFIG.USER_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_CONFIG.USER_KEY);
    this.clearSessionCookie();
  }

  /**
   * Refresh access token using refresh token
   */
  private async refreshAccessToken(): Promise<boolean> {
    const refreshToken = this.getRefreshToken();
    const storageMode =
      this.getStorageModeForKey(AUTH_CONFIG.REFRESH_TOKEN_KEY) ??
      this.getStoredSessionMode();

    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return false;
      }

      const data = await response.json();
      if (data.success && data.data.accessToken) {
        this.setTokens(
          data.data.accessToken,
          data.data.refreshToken,
          storageMode !== "session",
        );
        return true;
      }

      return false;
    } catch {
      this.clearTokens();
      return false;
    }
  }

  /**
   * Make HTTP request
   */
  async request<T>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<ApiResponse<T>> {
    const {
      method = "GET",
      body,
      headers = {},
      requireAuth = false,
      timeout = this.defaultTimeout,
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const isFormData =
      typeof FormData !== "undefined" && body instanceof FormData;

    // Build headers
    const requestHeaders: Record<string, string> = { ...headers };

    if (!isFormData) {
      requestHeaders["Content-Type"] = "application/json";
    }

    // Add auth header if required
    if (requireAuth) {
      const token = this.getAccessToken();
      if (token) {
        requestHeaders["Authorization"] = `Bearer ${token}`;
      }
    }

    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        method,
        headers: requestHeaders,
        body: body
          ? isFormData
            ? body instanceof FormData
              ? body
              : undefined
            : JSON.stringify(body)
          : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle 401 - try to refresh token
      if (response.status === 401 && requireAuth) {
        const refreshed = await this.refreshAccessToken();
        if (refreshed) {
          // Retry the request with new token
          return this.request<T>(endpoint, options);
        }
        // Refresh failed, clear tokens
        this.clearTokens();
        throw new ApiClientError("Session expired. Please login again.", 401);
      }

      const data = await response.json();

      if (!response.ok) {
        throw new ApiClientError(
          data.message || "Request failed",
          response.status,
          (data as ApiError).errors,
        );
      }

      return data as ApiResponse<T>;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiClientError) {
        throw error;
      }

      if (error instanceof Error) {
        if (error.name === "AbortError") {
          throw new ApiClientError("Request timeout", 408);
        }
        throw new ApiClientError(error.message, 500);
      }

      throw new ApiClientError("Unknown error occurred", 500);
    }
  }

  // Convenience methods
  get<T>(endpoint: string, requireAuth = false) {
    return this.request<T>(endpoint, { method: "GET", requireAuth });
  }

  post<T>(endpoint: string, body?: unknown, requireAuth = false) {
    return this.request<T>(endpoint, { method: "POST", body, requireAuth });
  }

  put<T>(endpoint: string, body?: unknown, requireAuth = false) {
    return this.request<T>(endpoint, { method: "PUT", body, requireAuth });
  }

  patch<T>(endpoint: string, body?: unknown, requireAuth = false) {
    return this.request<T>(endpoint, { method: "PATCH", body, requireAuth });
  }

  delete<T>(endpoint: string, requireAuth = false) {
    return this.request<T>(endpoint, { method: "DELETE", requireAuth });
  }

  private getToken(key: string): string | null {
    if (typeof window === "undefined") return null;

    return sessionStorage.getItem(key) ?? localStorage.getItem(key);
  }

  private getStorageModeForKey(key: string): AuthStorageMode | null {
    if (typeof window === "undefined") return null;

    if (sessionStorage.getItem(key)) {
      return "session";
    }

    if (localStorage.getItem(key)) {
      return "local";
    }

    return null;
  }

  private getStoredSessionMode(): AuthStorageMode | null {
    return (
      this.getStorageModeForKey(AUTH_CONFIG.ACCESS_TOKEN_KEY) ??
      this.getStorageModeForKey(AUTH_CONFIG.REFRESH_TOKEN_KEY)
    );
  }

  private getStorage(mode: AuthStorageMode): Storage | null {
    if (typeof window === "undefined") {
      return null;
    }

    return mode === "session" ? sessionStorage : localStorage;
  }
}

/**
 * Custom API Error class
 */
export class ApiClientError extends Error {
  constructor(
    message: string,
    public status: number,
    public errors?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = "ApiClientError";
  }
}

// Export singleton instance
export const apiClient = new ApiClient();
