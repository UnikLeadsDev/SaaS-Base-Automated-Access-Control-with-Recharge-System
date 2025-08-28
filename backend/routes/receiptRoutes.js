import express from "express";
import { verifyToken, checkRole } from "../middleware/auth.js";
import { 
  createReceipt, 
  getUserReceipts, 
  getReceiptDetails, 
  getReceiptsReport,
  sendReceipt  // keep nodemailer
} from "../controllers/receiptController.js";

const router = express.Router();

// DB + Email
router.post("/receipt", verifyToken, createReceipt);
router.get("/receipts", verifyToken, getUserReceipts);
router.get("/receipt/:id", verifyToken, getReceiptDetails);
router.get("/reports", verifyToken, checkRole(['admin']), getReceiptsReport);
router.post("/send-receipt", verifyToken, sendReceipt);

export default router;
