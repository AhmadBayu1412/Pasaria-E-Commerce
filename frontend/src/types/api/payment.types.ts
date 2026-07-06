// Payment Types

import type { PaymentStatus } from './order.types';

export interface PaymentIntent {
  id: number;
  orderId: number;
  amount: number;
  status: PaymentStatus;
  paymentUrl?: string;
  paymentMethod?: string;
}

export interface PaymentCallback {
  orderId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  transactionId?: string;
}
