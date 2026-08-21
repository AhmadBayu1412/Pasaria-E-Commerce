// App Constants

// API Configuration
// Note: Frontend runs on 3001, Backend runs on 3000
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== 'undefined' ? '/api' : 'http://localhost:3000/api');
export const API_TIMEOUT = 30000; // 30 seconds

// App Configuration
export const APP_NAME = 'Pasaria';
export const APP_DESCRIPTION = 'Pasar Indonesia Online';

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

// Cart
export const CART_TTL_DAYS = 7;
export const MAX_CART_ITEMS = 50;

// Toast
export const TOAST_DURATION = 4000; // 4 seconds
export const MAX_TOASTS = 3;

// Retry
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY_BASE = 1000; // 1 second

// Debounce
export const SEARCH_DEBOUNCE_MS = 300;
export const FILTER_DEBOUNCE_MS = 300;
export const QUANTITY_DEBOUNCE_MS = 500;
