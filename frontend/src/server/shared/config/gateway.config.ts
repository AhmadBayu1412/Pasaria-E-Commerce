// ============================================================
// GATEWAY CONFIGURATION
// Phase 5 Step 7: Type-Safe Config
//
// Philosophy:
// - Single source of truth untuk gateway config
// - Validasi di bootstrap, bukan di runtime
// - Fail fast jika konfigurasi invalid
// ============================================================

// Provider type - menggunakan uppercase sesuai Prisma enum
// Note: Environment variable tetap lowercase, conversion dilakukan di loadGatewayConfig
export type ProviderType = 'STUB' | 'MIDTRANS' | 'XENDIT';

export interface GatewayConfig {
  readonly provider: ProviderType;
  readonly isProduction: boolean;
  readonly midtrans?: MidtransConfig;
  readonly xendit?: XenditConfig;
  readonly webhook?: WebhookConfig;
}

export interface MidtransConfig {
  readonly serverKey: string;
  readonly clientKey: string;
  readonly baseUrl: string;
}

export interface XenditConfig {
  readonly apiKey: string;
  readonly baseUrl: string;
}

export interface WebhookConfig {
  readonly midtransServerKey: string;
  readonly xenditCallbackToken: string;
}

/**
 * Convert lowercase env var to uppercase ProviderType
 */
function toProviderType(value: string | undefined): ProviderType {
  const normalized = (value ?? 'stub').toUpperCase() as ProviderType;
  if (normalized === 'MIDTRANS' || normalized === 'XENDIT' || normalized === 'STUB') {
    return normalized;
  }
  return 'STUB';
}

/**
 * Load gateway configuration from environment
 * Dipanggil sekali di bootstrap
 */
export function loadGatewayConfig(): GatewayConfig {
  const envProvider = process.env.PAYMENT_PROVIDER ?? 'stub';
  const provider = toProviderType(envProvider);
  const isProduction = process.env.NODE_ENV === 'production';

  let midtransConfig: MidtransConfig | undefined;
  let xenditConfig: XenditConfig | undefined;
  let webhookConfig: WebhookConfig | undefined;

  // Midtrans configuration (support both MIDTRANS and stub)
  if (provider === 'MIDTRANS' || provider === 'STUB') {
    const serverKey = process.env.MIDTRANS_SERVER_KEY;

    if (provider === 'MIDTRANS' && !serverKey) {
      throw new Error(
        'MIDTRANS_SERVER_KEY is required when PAYMENT_PROVIDER=midtrans',
      );
    }

    // Base URL berdasarkan environment
    const baseUrl = isProduction
      ? 'https://app.midtrans.com/snap/v1'
      : (process.env.MIDTRANS_SANDBOX_URL ??
        'https://app.sandbox.midtrans.com/snap/v1');

    midtransConfig = {
      serverKey: serverKey ?? 'stub_key',
      clientKey: process.env.MIDTRANS_CLIENT_KEY ?? '',
      baseUrl,
    };

    webhookConfig = {
      midtransServerKey: serverKey ?? 'stub_key',
      xenditCallbackToken: process.env.XENDIT_CALLBACK_TOKEN ?? 'stub_token',
    };
  }

  // Xendit configuration
  if (provider === 'XENDIT') {
    const apiKey = process.env.XENDIT_API_KEY;
    if (!apiKey) {
      throw new Error(
        'XENDIT_API_KEY is required when PAYMENT_PROVIDER=xendit',
      );
    }

    xenditConfig = {
      apiKey,
      baseUrl: 'https://api.xendit.co/v2',
    };
  }

  // Webhook verification fallback
  if (!webhookConfig) {
    webhookConfig = {
      midtransServerKey: process.env.MIDTRANS_SERVER_KEY ?? 'stub_key',
      xenditCallbackToken: process.env.XENDIT_CALLBACK_TOKEN ?? 'stub_token',
    };
  }

  return {
    provider,
    isProduction,
    midtrans: midtransConfig,
    xendit: xenditConfig,
    webhook: webhookConfig,
  };
}
