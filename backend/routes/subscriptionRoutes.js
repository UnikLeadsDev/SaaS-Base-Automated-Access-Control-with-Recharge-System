import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  getUserSubscriptions, 
  getSubscriptionPlans,
  cancelSubscription 
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.get("/plans", getSubscriptionPlans);
router.post("/create", verifyToken, createSubscription);
router.post("/cancel", verifyToken, cancelSubscription);
router.get("/current", verifyToken, getUserSubscriptions);
router.get("/my-subscriptions", verifyToken, getUserSubscriptions);

export default router;