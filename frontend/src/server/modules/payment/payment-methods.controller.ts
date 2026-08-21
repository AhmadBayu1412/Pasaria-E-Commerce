// Payment Methods Controller

import { Request, Response, NextFunction } from "express";

/**
 * Payment Method
 */
interface PaymentMethodResponse {
  id: string;
  name: string;
  type: string;
  provider: string;
  icon: string;
  description: string;
  fee: number;
  minAmount?: number;
  maxAmount?: number;
}

/**
 * Available Payment Methods
 */
const PAYMENT_METHODS: PaymentMethodResponse[] = [
  // Bank Transfer
  {
    id: "bca_va",
    name: "BCA Virtual Account",
    type: "bank_transfer",
    provider: "BCA",
    icon: "bca",
    description: "Bayar melalui Virtual Account BCA",
    fee: 4000,
    minAmount: 10000,
  },
  {
    id: "mandiri_va",
    name: "Mandiri Virtual Account",
    type: "bank_transfer",
    provider: "Mandiri",
    icon: "mandiri",
    description: "Bayar melalui Virtual Account Mandiri",
    fee: 4000,
    minAmount: 10000,
  },
  {
    id: "bni_va",
    name: "BNI Virtual Account",
    type: "bank_transfer",
    provider: "BNI",
    icon: "bni",
    description: "Bayar melalui Virtual Account BNI",
    fee: 4000,
    minAmount: 10000,
  },
  {
    id: "bri_va",
    name: "BRI Virtual Account",
    type: "bank_transfer",
    provider: "BRI",
    icon: "bri",
    description: "Bayar melalui Virtual Account BRI",
    fee: 4000,
    minAmount: 10000,
  },

  // E-Wallet
  {
    id: "gopay",
    name: "GoPay",
    type: "ewallet",
    provider: "Gojek",
    icon: "gopay",
    description: "Bayar dengan GoPay",
    fee: 2000,
    minAmount: 10000,
  },
  {
    id: "ovo",
    name: "OVO",
    type: "ewallet",
    provider: "OVO",
    icon: "ovo",
    description: "Bayar dengan OVO",
    fee: 2000,
    minAmount: 10000,
  },
  {
    id: "dana",
    name: "DANA",
    type: "ewallet",
    provider: "DANA",
    icon: "dana",
    description: "Bayar dengan DANA",
    fee: 2000,
    minAmount: 10000,
  },

  // Credit Card
  {
    id: "credit_card",
    name: "Kartu Kredit",
    type: "credit_card",
    provider: "Visa/Mastercard",
    icon: "credit_card",
    description: "Bayar dengan Kartu Kredit (Visa/Mastercard)",
    fee: 2.9,
    minAmount: 5000,
    maxAmount: 50000000,
  },

  // Convenience Store
  {
    id: "indomaret",
    name: "Indomaret",
    type: "convenience_store",
    provider: "Indomaret",
    icon: "indomaret",
    description: "Bayar di Indomaret",
    fee: 2500,
    minAmount: 10000,
    maxAmount: 5000000,
  },
  {
    id: "alfamart",
    name: "Alfamart",
    type: "convenience_store",
    provider: "Alfamart",
    icon: "alfamart",
    description: "Bayar di Alfamart",
    fee: 2500,
    minAmount: 10000,
    maxAmount: 5000000,
  },

  // QR Code
  {
    id: "qris",
    name: "QRIS",
    type: "qr_code",
    provider: "QRIS",
    icon: "qris",
    description: "Scan QR Code dengan aplikasi bank atau e-wallet",
    fee: 0,
    minAmount: 1000,
    maxAmount: 10000000,
  },
];

/**
 * GET /payments/methods
 * Get available payment methods
 * No authentication required
 */
export async function getPaymentMethods(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      success: true,
      data: PAYMENT_METHODS
    });
  } catch (error) {
    next(error);
  }
}
