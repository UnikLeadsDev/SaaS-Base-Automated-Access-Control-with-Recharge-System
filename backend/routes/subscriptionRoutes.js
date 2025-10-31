import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  verifySubscriptionPayment,
  getSubscriptionPlans,
  getSubscriptionStatus,
  checkSubscriptionAccess,
  updatePreferences,
  getUserSubscriptions,
  getUserPreferences,
  cancelSubscription,
 
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);
router.post("/verify-payment", verifyToken, verifySubscriptionPayment);
router.get("/plans", getSubscriptionPlans); 
router.get("/list", verifyToken, getUserSubscriptions);
router.get("/status", verifyToken, getSubscriptionStatus);
router.get("/access/:formType", verifyToken, checkSubscriptionAccess);
router.put("/preferences", verifyToken, updatePreferences);
router.get("/preferences", verifyToken, getUserPreferences);
router.put("/cancel/:subscriptionId", verifyToken, cancelSubscription);
// router.get("/subscription-status", verifyToken, getSubscriptionStatus);

export default router;