/**
 * Auth Service
 *
 * All HTTP calls for authentication.
 * Follows consumer pattern: Frontend → Express API
 */

import axios, { type AxiosError } from 'axios';
import { API_BASE_URL } from '@/lib/constants';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  SessionResponse,
  User,
} from '@/types/api';

export type AuthErrorCode =
  | 'INVALID_CREDENTIAL'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

// Create auth-specific axios instance
const authApiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await authApiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await authApiClient.post<RegisterResponse>(
      '/auth/register',
      data,
    );
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean }> {
    const response = await authApiClient.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  /**
   * Get current session (source of truth)
   */
  async getSession(): Promise<SessionResponse> {
    const response = await authApiClient.get<SessionResponse>('/auth/session');
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<User | null> {
    try {
      const response = await authApiClient.get<{ user: User }>('/auth/session');
      return response.data.user;
    } catch {
      return null;
    }
  },
};

/**
 * Error handling helper
 * Converts Axios errors to AuthErrorCode
 */
export function handleAuthError(error: unknown): AuthErrorCode {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError.response?.status === 401) {
      return 'INVALID_CREDENTIAL';
    }
    if (axiosError.response?.status === 500) {
      return 'SERVER_ERROR';
    }
    if (!axiosError.response) {
      return 'NETWORK_ERROR';
    }
  }
  return 'UNKNOWN';
}
