// Shipping Controller

import { Request, Response, NextFunction } from "express";

/**
 * Shipping Options Response
 */
interface ShippingOptionResponse {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  logo?: string;
}

// Mock shipping options - in production, integrate with shipping APIs
const SHIPPING_OPTIONS: ShippingOptionResponse[] = [
  {
    id: "jne_reg",
    name: "JNE Regular",
    description: "Layanan reguler JNE",
    price: 15000,
    estimatedDays: "3-5 hari kerja",
    logo: "jne"
  },
  {
    id: "jne_yes",
    name: "JNE YES",
    description: "Layanan kilat JNE",
    price: 35000,
    estimatedDays: "1-2 hari kerja",
    logo: "jne"
  },
  {
    id: "pos_kilat",
    name: "Pos Kilat",
    description: "Layanan kilat dari Pos Indonesia",
    price: 20000,
    estimatedDays: "3-5 hari kerja",
    logo: "pos"
  },
  {
    id: "tiki_reg",
    name: "TIKI Regular",
    description: "Layanan reguler TIKI",
    price: 18000,
    estimatedDays: "4-6 hari kerja",
    logo: "tiki"
  },
  {
    id: "grab_express",
    name: "GrabExpress",
    description: "Pengiriman instan Same-Day",
    price: 25000,
    estimatedDays: "Same-day (4-6 jam)",
    logo: "grab"
  }
];

/**
 * GET /shipping
 * Get available shipping options
 * No authentication required
 */
export async function getShippingOptions(req: Request, res: Response, next: NextFunction) {
  try {
    res.json({
      success: true,
      data: SHIPPING_OPTIONS
    });
  } catch (error) {
    next(error);
  }
}
