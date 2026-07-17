/**
 * Order Store
 * State management for orders
 */

import { create } from 'zustand';
import type { Order, OrderStatus } from '@/types/api';
import { OrderError } from '@/services/order.service';

interface OrderState {
  // Data
  orders: Order[];
  selectedOrder: Order | null;

  // Pagination
  page: number;
  totalPages: number;
  totalItems: number;

  // UI State
  isLoading: boolean;
  error: OrderError | null;
}

// Combined type for store with actions
type OrderStore = OrderState & {
  updateOrderStatus: (orderId: number, newStatus: OrderStatus) => void;
};

/**
 * Store only manages state, not HTTP
 * HTTP calls remain in OrderService
 */
export const useOrderStore = create<OrderStore>()((set) => ({
  // Initial state
  orders: [],
  selectedOrder: null,
  page: 1,
  totalPages: 1,
  totalItems: 0,
  isLoading: false,
  error: null,

  // Action
  updateOrderStatus: (orderId: number, newStatus: OrderStatus) =>
    set((state) => ({
      orders: state.orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      ),
      selectedOrder:
        state.selectedOrder?.id === orderId
          ? { ...state.selectedOrder, status: newStatus }
          : state.selectedOrder,
    })),
}));

// Action helpers
export const orderStoreActions = {
  setOrders: (
    orders: Order[],
    pagination: {
      page: number;
      totalPages: number;
      totalItems: number;
    },
  ) =>
    useOrderStore.setState({
      orders,
      page: pagination.page,
      totalPages: pagination.totalPages,
      totalItems: pagination.totalItems,
    }),

  setSelectedOrder: (order: Order | null) =>
    useOrderStore.setState({ selectedOrder: order }),

  setLoading: (isLoading: boolean) => useOrderStore.setState({ isLoading }),

  setError: (error: OrderError | null) => useOrderStore.setState({ error }),

  clearError: () => useOrderStore.setState({ error: null }),

  clearSelectedOrder: () => useOrderStore.setState({ selectedOrder: null }),

  reset: () =>
    useOrderStore.setState({
      orders: [],
      selectedOrder: null,
      page: 1,
      totalPages: 1,
      totalItems: 0,
      isLoading: false,
      error: null,
    }),

  updateOrderStatus: (orderId: number, newStatus: OrderStatus) =>
    useOrderStore.getState().updateOrderStatus(orderId, newStatus),
};

// Selectors
export const useOrders = () => useOrderStore((state) => state.orders);
export const useSelectedOrder = () =>
  useOrderStore((state) => state.selectedOrder);
export const useOrderPagination = () =>
  useOrderStore((state) => ({
    page: state.page,
    totalPages: state.totalPages,
    totalItems: state.totalItems,
  }));
