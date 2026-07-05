// ============================================================
// GATEWAY FACTORY
// Phase 5 Step 4: Gateway Abstraction
//
// Philosophy:
// - Factory FOR BOOTSTRAP ONLY
// - NOT a Service Locator
// - Called ONLY at composition root / bootstrap
// - Returns gateway instance for DI container
//
// Usage:
//   // app.ts or bootstrap.ts
//   const gateway = GatewayFactory.create();
//   const service = new PaymentHandler(gateway);
//
// NOT in services:
//   // PaymentHandler (WRONG)
//   const gateway = GatewayFactory.create();
// ============================================================

import type { PaymentGateway } from '../gateway.interface.js';
import { StubGateway } from '../stub/stub.gateway.js';

export type ProviderType = 'stub' | 'midtrans' | 'xendit' | 'stripe';

export const GatewayFactory = {
  create(override?: ProviderType): PaymentGateway {
    const provider = override ?? this.getProviderFromEnv();

    switch (provider) {
      case 'stub':
        return new StubGateway({
          shouldSucceed: true,
          simulatedDelayMs: 0,
        });

      case 'midtrans':
        throw new Error('Midtrans gateway not yet implemented (Step 7)');

      case 'xendit':
        throw new Error('Xendit gateway not yet implemented (Step 7)');

      case 'stripe':
        throw new Error('Stripe gateway not yet implemented (Step 7)');

      default:
        console.warn(
          `[GatewayFactory] Unknown provider "${provider}", falling back to StubGateway`,
        );
        return new StubGateway();
    }
  },

  getProviderFromEnv(): ProviderType {
    const env = process.env.PAYMENT_PROVIDER?.toLowerCase();

    if (!env) {
      return 'stub';
    }

    if (['stub', 'midtrans', 'xendit', 'stripe'].includes(env)) {
      return env as ProviderType;
    }

    console.warn(
      `[GatewayFactory] Invalid PAYMENT_PROVIDER="${env}", using "stub"`,
    );
    return 'stub';
  },
} as const;
