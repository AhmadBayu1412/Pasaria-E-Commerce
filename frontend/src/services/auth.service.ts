// Auth Service

import apiClient from './api-client';
import type {
  LoginRequest,
  RegisterRequest,
  LoginResponse,
  RegisterResponse,
  SessionResponse,
  User,
} from '@/types/api';

export const authService = {
  /**
   * Login user
   */
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>('/auth/login', data);
    return response.data;
  },

  /**
   * Register new user
   */
  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>('/auth/register', data);
    return response.data;
  },

  /**
   * Logout user
   */
  async logout(): Promise<{ success: boolean }> {
    const response = await apiClient.post<{ success: boolean }>('/auth/logout');
    return response.data;
  },

  /**
   * Get current session
   */
  async getSession(): Promise<SessionResponse> {
    const response = await apiClient.get<SessionResponse>('/auth/session');
    return response.data;
  },

  /**
   * Check if user is authenticated (simple check)
   */
  async checkAuth(): Promise<User | null> {
    try {
      const response = await apiClient.get<{ user: User }>('/auth/session');
      return response.data.user;
    } catch {
      return null;
    }
  },
};
