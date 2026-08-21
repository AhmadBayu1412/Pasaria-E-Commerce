// Payment Methods Routes

import { Router } from "express";
import { getPaymentMethods } from "./payment-methods.controller";

const router = Router();

// GET /payments/methods - Get available payment methods
router.get("/methods", getPaymentMethods);

export default router;
