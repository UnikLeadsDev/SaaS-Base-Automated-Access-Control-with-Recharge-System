import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  getUserSubscriptions,
  verifySubscriptionPayment,
  getSubscriptionPlans,
  getSubscriptionStatus,
  checkSubscriptionAccess,
  getSubscriptionUsage,
  updateSubscriptionPreferences
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);
router.post("/verify-payment", verifyToken, verifySubscriptionPayment);
router.get("/list", verifyToken, getUserSubscriptions);
router.get("/plans", verifyToken, getSubscriptionPlans);
router.get("/status", verifyToken, getSubscriptionStatus);
router.get("/access/:formType", verifyToken, checkSubscriptionAccess);
router.get("/usage", verifyToken, getSubscriptionUsage);
router.put("/preferences", verifyToken, updateSubscriptionPreferences);

export default router;