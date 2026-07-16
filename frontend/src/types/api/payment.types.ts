// Payment Types

import type { PaymentStatus } from './order.types';

/**
 * Supported Payment Methods
 */
export type PaymentMethodType =
  | 'bank_transfer'
  | 'ewallet'
  | 'credit_card'
  | 'convenience_store'
  | 'qr_code';

export interface PaymentMethod {
  id: string;
  name: string;
  type: PaymentMethodType;
  provider: string;
  icon: string;
  description?: string;
  minAmount?: number;
  maxAmount?: number;
  fee: number;
}

export interface PaymentIntent {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  paymentUrl?: string;
  paymentMethod?: string;
  paymentMethodDetails?: {
    provider: string;
    instructions?: string;
    vaNumber?: string;
    qrCode?: string;
  };
}

export interface PaymentCallback {
  orderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
}
