import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { paymentRateLimit } from "../middleware/security.js";
import { validate } from "../middleware/validation.js";
import { 
  createPaymentOrder, 
  verifyPayment, 
  handleWebhook 
} from "../controllers/paymentController.js";

const router = express.Router();

// Apply rate limiting to payment endpoints
router.use(paymentRateLimit);

router.post("/create-order", verifyToken, validate('payment'), createPaymentOrder);
router.post("/verify", verifyToken, verifyPayment);
router.post("/webhook", handleWebhook); // No auth needed for webhook

export default router;