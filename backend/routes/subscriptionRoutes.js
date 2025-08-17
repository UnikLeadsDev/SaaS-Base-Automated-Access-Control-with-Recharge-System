import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { 
  createSubscription, 
  getUserSubscriptions
} from "../controllers/subscriptionController.js";

const router = express.Router();

router.post("/create", verifyToken, createSubscription);
router.get("/list", verifyToken, getUserSubscriptions);

export default router;