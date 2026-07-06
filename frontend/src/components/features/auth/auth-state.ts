/**
 * Auth State Types
 *
 * Defines auth state machine and error types.
 */

import type { User } from '@/types/api';

// Re-export User for convenience
export type { User };

export type AuthStatus = 'UNKNOWN' | 'AUTHENTICATED' | 'GUEST';

export type AuthErrorCode =
  | 'INVALID_CREDENTIAL'
  | 'NETWORK_ERROR'
  | 'SESSION_EXPIRED'
  | 'SERVER_ERROR'
  | 'UNKNOWN';

export interface AuthError {
  code: AuthErrorCode;
  message: string;
}

export interface AuthState {
  // Core state
  user: User | null;
  status: AuthStatus;

  // Error state
  error: AuthError | null;
}

export const AUTH_ERROR_MESSAGES: Record<AuthErrorCode, string> = {
  INVALID_CREDENTIAL: 'Email atau password salah',
  NETWORK_ERROR: 'Koneksi internet terputus. Coba lagi.',
  SESSION_EXPIRED: 'Sesi Anda telah berakhir. Silakan login kembali.',
  SERVER_ERROR: 'Terjadi kesalahan server. Coba beberapa saat lagi.',
  UNKNOWN: 'Terjadi kesalahan yang tidak diketahui',
};
