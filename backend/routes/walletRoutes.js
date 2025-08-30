import express from "express";
import { verifyToken } from "../middleware/auth.js";
import { generalRateLimit } from "../middleware/security.js";
import { getWalletBalance, getWalletBalanceCheck, getTransactionHistory, deductFromWallet,addToWallet } from "../controllers/walletController.js";
import { checkBalance } from "../middleware/accessControl.js";

const router = express.Router();

// Apply rate limiting
router.use(generalRateLimit);

router.get("/balance", verifyToken, getWalletBalance);
router.get("/balance-check", verifyToken, getWalletBalanceCheck);
router.get("/check-balance", verifyToken, checkBalance);
router.get("/transactions", verifyToken, getTransactionHistory);
router.post("/transactions", verifyToken, async (req, res) => {
  try {
    const { amount, type, description, txnRef } = req.body; // <-- get txnRef from frontend

    if (!amount || !type || !txnRef) {
      return res.status(400).json({ message: "Amount, type, and txnRef are required" });
    }

    let result;
    if (type === "debit") {
      // Pass the txnRef received from frontend
      result = await deductFromWallet(req.user.id, amount, txnRef, description);
    } else if (type === "credit") {
      result = await addToWallet(req.user.id, amount, txnRef, description);
    } else {
      return res.status(400).json({ message: "Invalid transaction type" });
    }

    return res.json(result);
  } catch (err) {
    console.error("Transaction Error:", err);
    return res.status(500).json({ message: err.message });
  }
});


export default router;