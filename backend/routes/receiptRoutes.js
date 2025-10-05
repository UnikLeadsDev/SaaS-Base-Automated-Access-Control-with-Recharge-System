import express from "express";
import { addReceipt, fetchReceipts } from "../controllers/receiptController.js";
import { verifyToken } from "../middleware/auth.js";

const router = express.Router();

router.post("/add", verifyToken, addReceipt);
router.get("/my-receipts", verifyToken, fetchReceipts);

export default router;
