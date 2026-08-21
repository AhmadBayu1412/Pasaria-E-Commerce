// Shipping Routes

import { Router } from "express";
import { getShippingOptions } from "./shipping.controller";

const router = Router();

// GET /shipping - Get available shipping options
router.get("/", getShippingOptions);

export default router;
