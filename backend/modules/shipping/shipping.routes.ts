// Shipping Routes

import { Router } from "express";
import { getShippingOptions } from "./shipping.controller.js";

const router = Router();

// GET /shipping - Get available shipping options
router.get("/", getShippingOptions);

export default router;
