import express from "express";
import { sendReceipt } from "../controllers/receiptController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

// Protected route
router.post("/send-receipt", verifyToken, sendReceipt);

export default router;
