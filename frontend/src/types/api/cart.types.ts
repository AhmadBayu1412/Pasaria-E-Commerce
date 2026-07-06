// Cart Types

export interface CartProduct {
  id: number;
  name: string;
  slug: string;
  primaryImage: string | null;
  price: number;
}

export interface CartItem {
  id: number;
  productId: number;
  product: CartProduct;
  quantity: number;
  snapshotPrice: number;
  subtotal: number;
}

export interface Cart {
  id: number | null;
  userId: number;
  items: CartItem[];
  itemCount: number;
  totalQuantity: number;
  subtotal: number;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface AddToCartRequest {
  productId: number;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  quantity: number;
}
