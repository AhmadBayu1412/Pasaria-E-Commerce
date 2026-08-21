// ============================================================
// ORDER MODULE — Public API
// Phase 4 Step 6: Order Draft Foundation
// Phase 5 Step 1: Order Lifecycle Foundation
// ============================================================

export { OrderService } from './order.service';
export { OrderController } from './order.controller';
export { OrderMapper } from './order.mapper';

// Phase 5 Step 1: Order Lifecycle
// NOTE: OrderRules is DEPRECATED - use OrderLifecycleRules instead
// Keeping for backward compatibility until all callers are migrated
export { OrderRules } from './order.rules';
export { OrderLifecycleService } from './order-lifecycle.service';
export { OrderLifecycleRules } from './order-lifecycle.rules';

export type {
  CreateDraftInput,
  OrderDraft,
  OrderItemSnapshot,
  OrderItemData,
  OrderTotals,
} from './order.types';

// OrderStatus from lifecycle types (single source of truth)
export type { OrderStatus } from './order-lifecycle.types';

export type {
  OrderStateTransitions,
  TERMINAL_STATES,
  PAYABLE_STATES,
} from './order-lifecycle.types';

export type { TransitionResult } from './order-lifecycle.service';

export type {
  OrderDraftResponseDTO,
  OrderErrorResponseDTO,
} from './order.dto';
