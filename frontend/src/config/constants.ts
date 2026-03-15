/**
 * Application Configuration Constants
 *
 * @description Central configuration for the frontend application
 * @author Lead Engineer
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api',
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
} as const;

export const AUTH_CONFIG = {
  ACCESS_TOKEN_KEY: 'code_of_life_access_token',
  REFRESH_TOKEN_KEY: 'code_of_life_refresh_token',
  USER_KEY: 'code_of_life_user',
  SESSION_COOKIE_NAME: 'auth_session',
  SESSION_COOKIE_MAX_AGE_SECONDS: 7 * 24 * 60 * 60,
  TOKEN_REFRESH_THRESHOLD: 5 * 60 * 1000, // 5 minutes before expiry
} as const;

export const GAME_CONFIG = {
  MODES: ['STORY', 'CHALLENGE', 'DAILY'] as const,
  DIFFICULTIES: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'MASTER'] as const,
  HINTS_PER_PUZZLE: 3,
  POINTS_PER_CORRECT: 100,
  POINTS_DEDUCTION_PER_HINT: 25,
  TIME_BONUS_THRESHOLD: 60, // seconds
} as const;

export const UI_CONFIG = {
  ANIMATION_DURATION: 0.3,
  TOAST_DURATION: 5000,
  DEBOUNCE_DELAY: 300,
  PAGINATION_LIMIT: 10,
} as const;

export const ROUTES = {
  // Public routes
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',

  // Protected routes
  DASHBOARD: '/dashboard',
  PUZZLE: (id: string) => `/puzzle/${id}`,
  DAILY: '/daily',
  STORY: '/story',
  CHALLENGE: '/challenge',
  PROFILE: '/profile',
  SETTINGS: '/settings',
  LEADERBOARDS: '/leaderboards',
  ACHIEVEMENTS: '/achievements',
  PRICING: '/pricing',
  SUBSCRIPTION: '/subscription',
  BATTLE: '/battle',
} as const;

export const STRIPE_CONFIG = {
  PRO_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PRO_PRICE_ID || 'prod_U9SiwXC9wVqWLa',
  PREMIUM_PRICE_ID: process.env.NEXT_PUBLIC_STRIPE_PREMIUM_PRICE_ID || 'prod_U9SjghcdOTSwdH',
} as const;
