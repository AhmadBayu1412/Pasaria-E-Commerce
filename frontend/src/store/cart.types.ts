/**
 * Cart Store Types
 * 
 * Type definitions for cart state and actions.
 */

export interface CartItemVariantInfo {
  color?: string;
  size?: string;
}

export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  name: string;
  slug: string;
  price: number;
  currentPrice: number;
  quantity: number;
  image: string;
  stock: number;
  isAvailable: boolean;
  variantInfo?: CartItemVariantInfo;
}

export interface Cart {
  id: string;
  items: CartItem[];
  createdAt: string;
  updatedAt: string;
}

export interface AddItemPayload {
  productId: number;
  variantId?: string;
  quantity: number;
}

export interface CartResponse {
  success: boolean;
  cart: Cart;
  message?: string;
}

export interface StockValidation {
  itemId: string;
  available: number;
  requested: number;
  isValid: boolean;
}

export interface CheckoutPreview {
  items: CartItem[];
  subtotal: number;
  shipping: number;
  total: number;
  validUntil: string;
}

export interface ShippingOption {
  id: string;
  name: string;
  price: number;
  estimatedDays: string;
  description?: string;
  logo?: string;
}

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
  fee: number;
  minAmount?: number;
  maxAmount?: number;
}

export interface Address {
  id: string;
  label: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode: string;
  isDefault: boolean;
}
