// Address Routes

import { Router } from "express";
import { authenticate } from "../auth/auth.middleware";
import {
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress
} from "./address.controller";

const router = Router();

// GET /addresses - Get all addresses for authenticated user
router.get("/", authenticate, getAddresses);

// POST /addresses - Add new address
router.post("/", authenticate, addAddress);

// PATCH /addresses/:id - Update address
router.patch("/:id", authenticate, updateAddress);

// DELETE /addresses/:id - Delete address
router.delete("/:id", authenticate, deleteAddress);

// POST /addresses/:id/default - Set as default
router.post("/:id/default", authenticate, setDefaultAddress);

export default router;
