// ============================================================
// GATEWAY FACTORY
// Phase 5 Step 7: Factory Pattern for Gateway Creation
//
// Philosophy:
// - Factory menerima GatewayConfig sebagai parameter
// - Tidak baca process.env langsung (validasi di bootstrap)
// - Base URL dari config, bukan hardcoded
// - Business layer tidak melakukan `new MidtransGateway()`
// ============================================================

import type { PaymentGateway } from '../gateway.interface';
import { StubGateway } from '../stub/stub.gateway';
import { MidtransGateway } from '../midtrans/midtrans.gateway';
import type { GatewayConfig, ProviderType } from '../../../../shared/config/gateway.config';

/**
 * Gateway Factory
 * 
 * CHANGE v2:
 * - Terima GatewayConfig sebagai parameter
 * - Tidak baca process.env langsung
 * - Base URL dari config, bukan hardcoded
 */
export const GatewayFactory = {
  /**
   * Create gateway instance based on config
   */
  create(config: GatewayConfig): PaymentGateway {
    switch (config.provider) {
      case 'STUB':
        return new StubGateway({ shouldSucceed: true });

      case 'MIDTRANS':
        if (!config.midtrans) {
          throw new Error('Midtrans configuration required');
        }
        return new MidtransGateway({
          serverKey: config.midtrans.serverKey,
          clientKey: config.midtrans.clientKey,
          baseUrl: config.midtrans.baseUrl,
          isProduction: config.isProduction,
        });

      case 'XENDIT':
        // OUT OF SCOPE Step 7: Xendit implementation
        throw new Error(
          'Xendit gateway not yet implemented. See Phase 5 Step 7.x',
        );

      default:
        console.warn(
          `Unknown provider "${config.provider}", falling back to StubGateway`,
        );
        return new StubGateway();
    }
  },
} as const;
