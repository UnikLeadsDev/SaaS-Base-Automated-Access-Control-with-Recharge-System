import db from "../config/db.js";
import notificationService from "../services/notificationService.js";
import { withTransaction } from "../utils/transaction.js";
import { v4 as uuidv4 } from "uuid";
import crypto from "crypto";

// Ensure wallet exists for a user and return current wallet row
const ensureWalletForUser = async (userId) => {
  const [wallet] = await db.query(
    "SELECT balance, status FROM wallets WHERE user_id = ?",
    [userId]
  );

  if (wallet.length === 0) {
    await db.query(
      "INSERT INTO wallets (user_id, balance, status) VALUES (?, 0, 'active')",
      [userId]
    );
    return { balance: 0, status: 'active' };
  }

  return wallet[0];
};


// Cached rates
const getRates = () => ({
  basic: parseFloat(process.env.BASIC_FORM_RATE) || 5,
  realtime: parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50,
});

// Common wallet response builder
const buildWalletResponse = (wallet, includeAccess = false) => {
  const response = {
    balance: parseFloat(wallet.balance),
    status: wallet.status,
    validUntil: null
  };

  if (includeAccess) {
    const rates = getRates();
    Object.assign(response, {
      accessType: 'subscription',
      canSubmitBasic: wallet.balance >= rates.basic,
      canSubmitRealtime: wallet.balance >= rates.realtime,
      demoMode: false,
      paymentsEnabled: true,
      rates
    });
  }

  return response;
};

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user.id);
    res.json(buildWalletResponse(wallet));
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ message: req.t('error.server') });
  }
};

// Get wallet balance with access check for dashboard
export const getWalletBalanceCheck = async (req, res) => {
  try {
    const userId =
      req.user?.id ||
      req.user?.user_id ||
      req.user?.data?.id ||
      req.user?.data?.user_id;

    if (!userId) {
      return res.status(400).json({ message: "User ID missing in request" });
    }

    await ensureWalletForUser(userId);
    const response = await buildWalletResponse(userId);

    res.json(response);
  } catch (error) {
    console.error("Get Wallet Balance Check Error:", error);
    res.status(500).json({ message: "Server error while checking subscription" });
  }
};


// Deduct amount from wallet (idempotent & atomic)
export const deductFromWallet = async (userId, amount, txnRef, description = null) => {
  console.log("Deducting from wallet:", { userId, amount, txnRef, description });
  if (!userId || amount <= 0 || isNaN(amount) || !txnRef) {
    throw new Error('Invalid input: userId and txnRef are required and amount must be positive');
  }

  return await withTransaction(async (connection) => {
    // Check for existing transaction (idempotent)
    const [existing] = await connection.query(
      "SELECT amount FROM transactions WHERE txn_ref = ? AND type = 'debit'",
      [txnRef]
    );
    if (existing.length > 0) {
      const [wallet] = await connection.query(
        "SELECT balance FROM wallets WHERE user_id = ?",
        [userId]
      );
      return { success: true, newBalance: wallet[0].balance, message: 'Transaction already processed' };
    }

    // Lock wallet row
    const [wallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    if (wallet.length === 0 || wallet[0].balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Deduct balance
    await connection.query(
      "UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?",
      [amount, userId]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, 'debit', ?, ?)",
      [userId, amount, txnRef, description || 'deduction']
    );

    // Updated balance
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );

    // Low balance notification (non-blocking)
    const threshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    if (updatedWallet[0].balance <= threshold) {
      const [user] = await connection.query(
        "SELECT mobile FROM users WHERE user_id = ?",
        [userId]
      );
      if (user[0]?.mobile) {
        notificationService.sendLowBalanceAlert(user[0].mobile, updatedWallet[0].balance, userId)
          .catch(err => console.error('Low balance notification failed:', err));
      }
    }

    return { success: true, newBalance: updatedWallet[0].balance };
  });
};

// Add amount to wallet (atomic & idempotent)
export const addToWallet = async (userId, amount, txnRef, paymentMode = 'razorpay') => {
  console.log("Adding to wallet:", { userId, amount, txnRef, paymentMode });

  if (!userId || amount <= 0 || isNaN(amount) || !txnRef) {
    throw new Error('Invalid input: userId required and amount must be positive');
  }

  const creditAmount = parseFloat(amount); // ✅ Only base amount (no GST)

  return await withTransaction(async (connection) => {
    // 🧩 Step 1: Prevent duplicate transaction entries
    const [existing] = await connection.query(
      "SELECT amount FROM transactions WHERE txn_ref = ? AND type = 'credit'",
      [txnRef]
    );
    if (existing.length > 0) {
      const [wallet] = await connection.query(
        "SELECT balance FROM wallets WHERE user_id = ?",
        [userId]
      );
      return { 
        success: true, 
        newBalance: wallet[0].balance, 
        message: 'Transaction already processed' 
      };
    }

    // 🧩 Step 2: Ensure wallet exists before update
    const [wallet] = await connection.query(
      "SELECT wallet_id FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );
    if (wallet.length === 0) {
      await connection.query(
        "INSERT INTO wallets (user_id, balance, status) VALUES (?, 0, 'active')",
        [userId]
      );
    }

    // 🧩 Step 3: Update wallet balance (only add base amount)
    await connection.query(
      "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE user_id = ?",
      [creditAmount, userId]
    );

    // 🧩 Step 4: Record the transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, 'credit', ?, ?)",
      [userId, creditAmount, txnRef, paymentMode]
    );

    // 🧩 Step 5: Fetch updated balance
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );

    // 🧩 Step 6: Notify user (optional)
    const [user] = await connection.query(
      "SELECT mobile FROM users WHERE user_id = ?",
      [userId]
    );
    if (user[0]?.mobile) {
      await notificationService.sendPaymentSuccess(
        user[0].mobile,
        creditAmount,
        updatedWallet[0].balance
      );
    }

    // ✅ Step 7: Return success
    return { success: true, newBalance: updatedWallet[0].balance };
  });
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    // Try with created_at first, fallback to txn_id if column doesn't exist
    let query = "SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50";
    let [transactions] = [];
    
    try {
      [transactions] = await db.query(query, [req.user.id]);
    } catch (columnError) {
      if (columnError.code === 'ER_BAD_FIELD_ERROR') {
        // Fallback to ordering by txn_id if created_at doesn't exist
        query = "SELECT * FROM transactions WHERE user_id = ? ORDER BY txn_id DESC LIMIT 50";
        [transactions] = await db.query(query, [req.user.id]);
      } else {
        throw columnError;
      }
    }

    res.json(transactions);
  } catch (error) {
    console.error("Transaction History Error:", error);
    res.status(500).json({ message: req.t('error.server') });
  }
};


export const deductWalletAmount = async (req, res) => {
  const userId = req.user.id; // comes from verifyToken middleware
  const { amount, description } = req.body;

  if (!amount || amount <= 0)
    return res.status(400).json({ success: false, message: "Invalid amount." });

  try {
    // 1️⃣ Fetch user's wallet
    const [walletRows] = await db.query(
      "SELECT balance, status, valid_until FROM wallets WHERE user_id = ?",
      [userId]
    );

    if (walletRows.length === 0)
      return res.status(404).json({ success: false, message: "Wallet not found." });

    const wallet = walletRows[0];

    if (wallet.status !== "active")
      return res.status(400).json({ success: false, message: "Wallet is not active." });

    if (wallet.valid_until && new Date(wallet.valid_until) < new Date())
      return res.status(400).json({ success: false, message: "Wallet validity expired." });

    const currentBalance = parseFloat(wallet.balance);
    if (currentBalance < amount)
      return res.status(400).json({ success: false, message: "Insufficient balance." });

    // 2️⃣ Deduct balance
    const newBalance = currentBalance - amount;
    await db.query("UPDATE wallets SET balance = ? WHERE user_id = ?", [
      newBalance,
      userId,
    ]);

    // 3️⃣ Log transaction
    const txn_ref = `TXN-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    await db.query(
      `INSERT INTO transactions 
       (user_id, amount, type, payment_mode, txn_ref)
       VALUES (?, ?, 'debit', 'wallet', ?)`,
      [userId, amount, txn_ref]
    );

    res.json({
      success: true,
      message: description || "Amount deducted successfully.",
      newBalance,
      txn_ref,
    });
  } catch (err) {
    console.error("❌ Wallet deduction error:", err);
    res.status(500).json({ success: false, message: "Server error during deduction." });
  }
};