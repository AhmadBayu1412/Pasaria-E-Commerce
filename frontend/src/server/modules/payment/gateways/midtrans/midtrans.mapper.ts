// ============================================================
// MIDTRANS MAPPER
// Phase 5 Step 7: Domain ↔ Midtrans Translation
//
// Philosophy:
// - Mapper adalah ANTICORRUPTION LAYER
// - Mapper TIDAK membuat externalReference (dari Domain)
// - Mapper TIDAK membuat gatewayTransactionId (dari Webhook)
// - Mapper HANYA translate format
//
// Mapper seperti Google Translate:
// - Input: Bahasa Indonesia
// - Output: English
// - Mapper TIDAK membuat isi kalimat baru
// ============================================================

import type { CreateChargeRequest, CreateChargeResult } from '../gateway.types';
import type { MidtransSnapRequest, MidtransSnapResponse } from './midtrans.types';

export class MidtransMapper {
  /**
   * Map domain request → Midtrans request
   * externalReference sudah ada di request, mapper hanya copy
   */
  toProviderRequest(domain: CreateChargeRequest): MidtransSnapRequest {
    return {
      transaction_details: {
        order_id: domain.externalReference, // Sudah dibuat di Domain
        gross_amount: domain.amount,
      },
      callbacks: {
        finish: domain.returnUrl,
      },
    };
  }

  /**
   * Map Midtrans response → domain result
   * Kembalikan snapToken, BUKAN gatewayTransactionId
   */
  toDomainResult(
    provider: MidtransSnapResponse,
    domain: CreateChargeRequest,
  ): CreateChargeResult {
    return {
      chargeStatus: 'CREATED', // Snap selalu CREATED saat berhasil dibuat
      snapToken: provider.token,
      redirectUrl: provider.redirect_url,
      externalReference: domain.externalReference,
      metadata: {
        orderId: domain.orderId,
        paymentId: domain.paymentId,
        externalReference: domain.externalReference,
      },
      createdAt: new Date(),
    };
  }

  /**
   * Map Midtrans transaction status → domain status (gateway level)
   * Dipakai di webhook processing
   */
  mapStatus(midtransStatus: string): 'CREATED' | 'FAILED' {
    const failedStatuses = ['deny', 'cancel', 'expire'];
    return failedStatuses.includes(midtransStatus.toLowerCase())
      ? 'FAILED'
      : 'CREATED';
  }

  /**
   * Check if status indicates successful payment (settlement/capture)
   * Dipakai untuk business outcome decision
   */
  isSuccessStatus(midtransStatus: string): boolean {
    return ['capture', 'settlement'].includes(midtransStatus.toLowerCase());
  }
}
