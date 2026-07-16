// Order Types - Updated with complete status lifecycle

export type OrderStatus =
  | 'DRAFT' // Keranjang → Order draft
  | 'WAITING_PAYMENT' // Menunggu pembayaran
  | 'PAID' // Sudah dibayar
  | 'PROCESSING' // Sedang diproses seller
  | 'SHIPPING' // Sedang dikirim
  | 'DELIVERED' // Pesanan tiba
  | 'COMPLETED' // Selesai (user konfirmasi)
  | 'EXPIRED' // Pembayaran kadaluarsa
  | 'CANCELLED'; // Dibatalkan

export interface OrderItem {
  id?: number;
  productId: number;
  productName: string;
  productImage?: string | null;
  unitPrice: number;
  quantity: number;
  subtotal: number;
  // Optional fields for UI compatibility
  snapshotPrice?: number;
}

export type PaymentStatus =
  | 'PENDING'
  | 'SUCCESS'
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
  totalItemCount: number;
  // 📍 SHIPPING INFO
  shippingName?: string;
  shippingPhone?: string;
  shippingAddress?: string;
  shippingCity?: string;
  shippingPostalCode?: string;
  createdAt: string;
  updatedAt: string;
  payment?: PaymentInfo;
}
