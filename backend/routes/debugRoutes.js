import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { checkPaymentSystemHealth, testPaymentVerification } from "../controllers/debugController.js";

const router = express.Router();

// Debug routes (only available in development)
if (process.env.NODE_ENV !== 'production') {
  router.get("/health", verifyToken, checkPaymentSystemHealth);
  router.post("/test-payment", verifyToken, testPaymentVerification);
}

export default router;