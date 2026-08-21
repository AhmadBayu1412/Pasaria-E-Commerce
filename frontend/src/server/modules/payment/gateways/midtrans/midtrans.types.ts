// ============================================================
// MIDTRANS TYPES
// Phase 5 Step 7: Provider-Specific Types
//
// Philosophy:
// - Midtrans types adalah INFRASTRUCTURE concern
// - Domain tidak tahu Midtrans-specific terms
// - Mapper mengkonversi antara dua dunia
// ============================================================

/**
 * Midtrans Snap API Request
 * https://docs.midtrans.com/reference/snap-api
 */
export interface MidtransSnapRequest {
  readonly transaction_details: {
    readonly order_id: string; // Menggunakan externalReference
    readonly gross_amount: number;
  };
  readonly customer_details?: {
    readonly first_name?: string;
    readonly last_name?: string;
    readonly email?: string;
    readonly phone?: string;
  };
  readonly item_details?: Array<{
    readonly id: string;
    readonly name: string;
    readonly price: number;
    readonly quantity: number;
  }>;
  readonly callbacks?: {
    readonly finish?: string;
  };
}

/**
 * Midtrans Snap API Response
 */
export interface MidtransSnapResponse {
  readonly token: string; // Snap Token
  readonly redirect_url: string; // Redirect URL
  readonly status_code: string;
  readonly status_message: string;
}

/**
 * Midtrans Transaction Status (dari API)
 * https://docs.midtrans.com/reference/get-transaction-status
 */
export interface MidtransTransactionStatus {
  readonly transaction_id: string;
  readonly order_id: string;
  readonly transaction_status: MidtransTransactionStatusEnum;
  readonly gross_amount: string;
  readonly currency: string;
  readonly payment_type: string;
  readonly status_code: string;
}

export type MidtransTransactionStatusEnum =
  | 'capture'
  | 'settlement'
  | 'pending'
  | 'deny'
  | 'cancel'
  | 'expire'
  | 'refund';

/**
 * Midtrans Error Response
 */
export interface MidtransErrorResponse {
  readonly error_messages?: string[];
  readonly status_message?: string;
  readonly status_code?: string;
}
