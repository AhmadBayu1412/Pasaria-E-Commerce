/**
 * Auth Service
 *
 * All HTTP calls for authentication.
 * PEIA Audit: Fixed response wrapper handling
 *
 * Backend returns: { data: { user } } or { data: user }
 * Frontend transforms to: { user }
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

// Backend response wrapper types
interface BackendAuthResponse {
  data: User;
}

interface BackendRegisterResponse {
  data: {
    id: number;
    email: string;
    role: 'CUSTOMER' | 'SELLER' | 'ADMIN';
  };
}

interface BackendLogoutResponse {
  data: {
    message: string;
  };
}

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
   * Backend: POST /auth/login returns { data: { user: { id, email, role } } }
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await authApiClient.post<{ data: { user: User } }>('/auth/login', data);
    // Transform: { data: { user: { id, email, role } } } -> { user: { id, email, role } }
    return { user: response.data.data.user };
  },

  /**
   * Register new user
   * Backend: POST /auth/register returns { data: { id, email, role } }
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await authApiClient.post<BackendRegisterResponse>(
      '/auth/register',
      data,
    );
    // Transform backend response to frontend expected format
    const { id, email, role } = response.data.data;
    return {
      user: { id, email, role },
    };
  },

  /**
   * Logout user
   * Backend: POST /auth/logout returns { data: { message } }
   */
  async logout(): Promise<{ success: boolean }> {
    await authApiClient.post<BackendLogoutResponse>('/auth/logout');
    return { success: true };
  },

  /**
   * Get current session (source of truth)
   * Backend: GET /users/me returns { success, data: { id, email, role } }
   */
  async getSession(): Promise<SessionResponse> {
    try {
      const response = await authApiClient.get<{
        success: boolean;
        data: { id: number; email: string; role: string };
      }>('/users/me', {
        // Don't throw on 4xx status codes - we handle them here
        validateStatus: (status) => status >= 200 && status < 400,
      });

      // If response indicates no user (401 or similar handled by validateStatus)
      if (!response.data?.data) {
        return { user: null };
      }

      // Transform backend response to frontend expected format
      return {
        user: {
          id: response.data.data.id,
          email: response.data.data.email,
          role: response.data.data.role as 'CUSTOMER' | 'SELLER' | 'ADMIN',
        },
      };
    } catch {
      // Network error or other issues - treat as guest
      return { user: null };
    }
  },

  /**
   * Check if user is authenticated
   */
  async checkAuth(): Promise<User | null> {
    try {
      const response = await authApiClient.get<{
        success: boolean;
        data: { id: number; email: string; role: string };
      }>('/users/me');
      return {
        id: response.data.data.id,
        email: response.data.data.email,
        role: response.data.data.role as 'CUSTOMER' | 'SELLER' | 'ADMIN',
      };
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
