// API Response Types

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, string[]>;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;

// Helper type guard
export function isApiError<T>(result: ApiResult<T>): result is ApiError {
  return result.success === false;
}
