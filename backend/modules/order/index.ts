// ============================================================
// ORDER MODULE — Public API
// Phase 4 Step 6: Order Draft Foundation
// Phase 5 Step 1: Order Lifecycle Foundation
// ============================================================

export { OrderService } from './order.service.js';
export { OrderController } from './order.controller.js';
export { OrderMapper } from './order.mapper.js';

// Phase 5 Step 1: Order Lifecycle
// NOTE: OrderRules is DEPRECATED - use OrderLifecycleRules instead
// Keeping for backward compatibility until all callers are migrated
export { OrderRules } from './order.rules.js';
export { OrderLifecycleService } from './order-lifecycle.service.js';
export { OrderLifecycleRules } from './order-lifecycle.rules.js';

export type {
  CreateDraftInput,
  OrderDraft,
  OrderItemSnapshot,
  OrderItemData,
  OrderTotals,
} from './order.types.js';

// OrderStatus from lifecycle types (single source of truth)
export type { OrderStatus } from './order-lifecycle.types.js';

export type {
  OrderStateTransitions,
  TERMINAL_STATES,
  PAYABLE_STATES,
} from './order-lifecycle.types.js';

export type { TransitionResult } from './order-lifecycle.service.js';

export type {
  OrderDraftResponseDTO,
  OrderErrorResponseDTO,
} from './order.dto.js';
