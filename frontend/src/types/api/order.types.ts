// Order Types

export type OrderStatus =
  | 'DRAFT'
  | 'PENDING'
  | 'PAID'
  | 'CANCELLED'
  | 'EXPIRED';

export interface OrderItem {
  id: number;
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export type PaymentStatus =
  | 'PENDING'
  | 'COMPLETED'
  | 'FAILED'
  | 'EXPIRED'
  | 'CANCELLED';

export interface PaymentInfo {
  id: number;
  status: PaymentStatus;
  method: string;
  amount: number;
  paidAt: string | null;
}

export interface Order {
  id: number;
  userId: number;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  totalQuantity: number;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
