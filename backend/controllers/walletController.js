import db from "../config/db.js";
import notificationService from "../services/notificationService.js";
import { withTransaction } from "../utils/transaction.js";
import { v4 as uuidv4 } from "uuid";

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

    const [created] = await db.query(
      "SELECT balance, status FROM wallets WHERE user_id = ?",
      [userId]
    );
    return created[0];
  }

  return wallet[0];
};

// Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user.id);

    res.json({
      balance: wallet.balance,
      status: wallet.status,
      validUntil: null
    });
  } catch (error) {
    console.error("Get Wallet Error:", error);
    res.status(500).json({ message: req.t('error.server') });
  }
};

// Get wallet balance with access check for dashboard
export const getWalletBalanceCheck = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user.id);

    const basicRate = parseFloat(process.env.BASIC_FORM_RATE) || 0;
    const realtimeRate = parseFloat(process.env.REALTIME_VALIDATION_RATE) || 0;

    res.json({
      balance: wallet.balance,
      status: wallet.status,
      validUntil: null,
      accessType: 'prepaid',
      canSubmitBasic: wallet.balance >= basicRate,
      canSubmitRealtime: wallet.balance >= realtimeRate,
      rates: {
        basic: basicRate,
        realtime: realtimeRate
      }
    });
  } catch (error) {
    console.error("Get Wallet Balance Check Error:", error);
    res.status(500).json({ message: req.t('error.server') });
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

    // Low balance notification
    const threshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    if (updatedWallet[0].balance <= threshold) {
      const [user] = await connection.query(
        "SELECT mobile FROM users WHERE user_id = ?",
        [userId]
      );
      if (user[0]?.mobile) {
        await notificationService.sendLowBalanceAlert(user[0].mobile, updatedWallet[0].balance);
      }
    }

    return { success: true, newBalance: updatedWallet[0].balance };
  });
};

// Add amount to wallet (atomic & idempotent)
export const addToWallet = async (userId, amount, txnRef, paymentMode = 'razorpay') => {
  if (!userId || amount <= 0 || isNaN(amount) || !txnRef) {
    throw new Error('Invalid input: userId required and amount must be positive');
  }

  return await withTransaction(async (connection) => {
    // Check for existing transaction
    const [existing] = await connection.query(
      "SELECT amount FROM transactions WHERE txn_ref = ? AND type = 'credit'",
      [txnRef]
    );
    if (existing.length > 0) {
      const [wallet] = await connection.query(
        "SELECT balance FROM wallets WHERE user_id = ?",
        [userId]
      );
      return { success: true, newBalance: wallet[0].balance, message: 'Transaction already processed' };
    }

    // Ensure wallet exists
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

    // Add balance
    await connection.query(
      "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE user_id = ?",
      [amount, userId]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, 'credit', ?, ?)",
      [userId, amount, txnRef, paymentMode]
    );

    // Updated balance
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );

    // Send payment success notification
    const [user] = await connection.query(
      "SELECT mobile FROM users WHERE user_id = ?",
      [userId]
    );
    if (user[0]?.mobile) {
      await notificationService.sendPaymentSuccess(user[0].mobile, amount, updatedWallet[0].balance);
    }

    return { success: true, newBalance: updatedWallet[0].balance };
  });
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
    console.error("Transaction History Error:", error);
    res.status(500).json({ message: req.t('error.server') });
  }
};