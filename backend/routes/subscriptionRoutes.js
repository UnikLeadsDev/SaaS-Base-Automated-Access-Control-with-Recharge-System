import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  verifySubscriptionPayment,
  getSubscriptionPlans,
  getSubscriptionStatus,
  checkSubscriptionAccess,
  updatePreferences
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);
router.post("/verify-payment", verifyToken, verifySubscriptionPayment);
router.get("/plans", verifyToken, getSubscriptionPlans);
router.get("/status", verifyToken, getSubscriptionStatus);
router.get("/access/:formType", verifyToken, checkSubscriptionAccess);
router.put("/preferences", verifyToken, updatePreferences);

export default router;