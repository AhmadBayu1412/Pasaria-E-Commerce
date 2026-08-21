// Address Controller

import { Request, Response, NextFunction } from "express";
import { prisma } from "../../infra/db/prisma.js";
import type { AuthenticatedUser } from "../../shared/session/session.types.js";
import { BusinessError } from "../../shared/errors/business.error.js";

// Validation schema for address
interface AddressInput {
  label?: string;
  recipientName: string;
  phone: string;
  address: string;
  city: string;
  province?: string;
  postalCode?: string;
  isDefault?: boolean;
}

// Transform Prisma address to API response format
function transformAddress(address: any) {
  return {
    id: address.id.toString(),
    label: address.label,
    recipientName: address.recipientName,
    phone: address.phone,
    address: address.address,
    city: address.city,
    province: address.province,
    postalCode: address.postalCode,
    isDefault: address.isDefault,
  };
}

/**
 * GET /addresses
 * Get all addresses for authenticated user
 */
export async function getAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser;

    const addresses = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({
      success: true,
      data: addresses.map(transformAddress)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /addresses
 * Create new address
 */
export async function addAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser;
    const input: AddressInput = req.body;

    // Validate required fields
    if (!input.recipientName || !input.phone || !input.address || !input.city) {
      res.status(400).json({
        success: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "Field yang diperlukan: recipientName, phone, address, city",
        },
      });
      return;
    }

    // If this is set as default, unset other defaults first
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    // Check if this is the first address (make it default automatically)
    const existingCount = await prisma.address.count({
      where: { userId: user.id }
    });

    const address = await prisma.address.create({
      data: {
        userId: user.id,
        label: input.label || "Rumah",
        recipientName: input.recipientName,
        phone: input.phone,
        address: input.address,
        city: input.city,
        province: input.province || "DKI Jakarta",
        postalCode: input.postalCode || "12345",
        isDefault: input.isDefault ?? existingCount === 0,
      }
    });

    res.status(201).json({
      success: true,
      data: transformAddress(address)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * PATCH /addresses/:id
 * Update address
 */
export async function updateAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser;
    const addressId = parseInt(String(req.params.id));
    const input: Partial<AddressInput> = req.body;

    // Check ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: "ADDRESS_NOT_FOUND",
          message: "Address not found",
        },
      });
      return;
    }

    // If setting as default, unset other defaults first
    if (input.isDefault) {
      await prisma.address.updateMany({
        where: { userId: user.id, isDefault: true },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.update({
      where: { id: addressId },
      data: {
        ...(input.label && { label: input.label }),
        ...(input.recipientName && { recipientName: input.recipientName }),
        ...(input.phone && { phone: input.phone }),
        ...(input.address && { address: input.address }),
        ...(input.city && { city: input.city }),
        ...(input.province && { province: input.province }),
        ...(input.postalCode && { postalCode: input.postalCode }),
        ...(input.isDefault !== undefined && { isDefault: input.isDefault }),
      }
    });

    res.json({
      success: true,
      data: transformAddress(address)
    });
  } catch (error) {
    next(error);
  }
}

/**
 * DELETE /addresses/:id
 * Delete address
 */
export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser;
    const addressId = parseInt(String(req.params.id));

    // Check ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: "ADDRESS_NOT_FOUND",
          message: "Address not found",
        },
      });
      return;
    }

    await prisma.address.delete({
      where: { id: addressId }
    });

    // If deleted address was default, set another one as default
    if (existing.isDefault) {
      const firstAddress = await prisma.address.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'asc' }
      });

      if (firstAddress) {
        await prisma.address.update({
          where: { id: firstAddress.id },
          data: { isDefault: true }
        });
      }
    }

    res.json({
      success: true,
      message: "Address deleted"
    });
  } catch (error) {
    next(error);
  }
}

/**
 * POST /addresses/:id/default
 * Set address as default
 */
export async function setDefaultAddress(req: Request, res: Response, next: NextFunction) {
  try {
    const user = req.user as AuthenticatedUser;
    const addressId = parseInt(String(req.params.id));

    // Check ownership
    const existing = await prisma.address.findFirst({
      where: { id: addressId, userId: user.id }
    });

    if (!existing) {
      res.status(404).json({
        success: false,
        error: {
          code: "ADDRESS_NOT_FOUND",
          message: "Address not found",
        },
      });
      return;
    }

    // Unset all defaults
    await prisma.address.updateMany({
      where: { userId: user.id, isDefault: true },
      data: { isDefault: false }
    });

    // Set new default
    const address = await prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true }
    });

    res.json({
      success: true,
      data: transformAddress(address)
    });
  } catch (error) {
    next(error);
  }
}
