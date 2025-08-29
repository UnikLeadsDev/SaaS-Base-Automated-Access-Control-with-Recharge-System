import db from "../config/db.js";
import { addToWallet } from "./walletController.js";

// Validate amount helper
const validateAmount = (amount) => {
  if (!amount || isNaN(amount) || amount <= 0) {
    throw new Error("Amount must be a positive number");
  }
};

// Add balance to user account - DEPRECATED: Use walletController.addToWallet
export const rechargeBalance = async (req, res) => {
  const { amount, paymentMethod, txnRef } = req.body;

  try {
    validateAmount(amount);
    
    const result = await addToWallet(
      req.user.id, 
      amount, 
      txnRef || `recharge_${Date.now()}`,
      paymentMethod || "manual"
    );
    
    res.json({ 
      message: "Balance recharged successfully", 
      newBalance: result.newBalance 
    });
  } catch (error) {
    console.error("Recharge Error:", error);
    res.status(400).json({ message: error.message });
  }
};

// Get user balance
export const getBalance = async (req, res) => {
  try {
    const [wallet] = await db.query("SELECT balance FROM wallets WHERE user_id = ?", [req.user.id]);
    
    if (wallet.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    res.json({ balance: wallet[0].balance });
  } catch (error) {
    console.error("Get Balance Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50",
      [req.user.id]
    );

    res.json(transactions);
  } catch (error) {
    console.error("Get Transactions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Deduct balance for service usage - DEPRECATED: Use walletController.deductFromWallet
export const deductBalance = async (req, res) => {
  const { amount, service, description, txnRef } = req.body;

  try {
    validateAmount(amount);
    
    const { deductFromWallet } = await import("./walletController.js");
    const result = await deductFromWallet(
      req.user.id, 
      amount, 
      txnRef || `deduct_${Date.now()}`,
      description || service
    );
    
    res.json({ 
      message: "Balance deducted successfully", 
      newBalance: result.newBalance 
    });
  } catch (error) {
    console.error("Deduct Balance Error:", error);
    res.status(400).json({ message: error.message });
  }
};