// Checkout Types

export interface CheckoutItemPreview {
  productId: number;
  productName: string;
  productImage: string | null;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export interface CheckoutSummary {
  subtotal: number;
  shippingFee: number;
  tax: number;
  total: number;
  totalQuantity: number;
}

export interface CheckoutPreview {
  items: CheckoutItemPreview[];
  summary: CheckoutSummary;
}

export interface InitiateCheckoutResponse {
  orderId: number;
  orderStatus: 'DRAFT';
  expiresAt: string;
}
