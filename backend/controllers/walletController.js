import db from "../config/db.js";
import notificationService from "../services/notificationService.js";

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
    res.status(500).json({ message: "Server error" });
  }
};

// Get wallet balance with access check for dashboard
export const getWalletBalanceCheck = async (req, res) => {
  try {
    const wallet = await ensureWalletForUser(req.user.id);

    const basicRate = parseFloat(process.env.BASIC_FORM_RATE);
    const realtimeRate = parseFloat(process.env.REALTIME_VALIDATION_RATE);
    
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
    res.status(500).json({ message: "Server error" });
  }
};

// Deduct amount from wallet (atomic transaction)
export const deductFromWallet = async (userId, amount, txnRef = null) => {
  // Input validation
  if (!userId || amount <= 0 || isNaN(amount)) {
    throw new Error('Invalid input: userId required and amount must be positive');
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check current balance
    const [wallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ? FOR UPDATE",
      [userId]
    );

    if (wallet.length === 0 || wallet[0].balance < amount) {
      throw new Error("Insufficient balance");
    }

    // Deduct from wallet
    await connection.query(
      "UPDATE wallets SET balance = balance - ?, updated_at = NOW() WHERE user_id = ?",
      [amount, userId]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref) VALUES (?, ?, 'debit', ?)",
      [userId, amount, txnRef]
    );

    await connection.commit();
    
    // Send low balance alert if balance is below threshold
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );
    
    const newBalance = updatedWallet[0].balance;
    const threshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    
    if (newBalance <= threshold) {
      const [user] = await connection.query(
        "SELECT mobile FROM users WHERE user_id = ?",
        [userId]
      );
      
      if (user[0]?.mobile) {
        await notificationService.sendLowBalanceAlert(user[0].mobile, newBalance);
      }
    }
    
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Add amount to wallet (atomic transaction)
export const addToWallet = async (userId, amount, txnRef = null) => {
  // Input validation
  if (!userId || amount <= 0 || isNaN(amount)) {
    throw new Error('Invalid input: userId required and amount must be positive');
  }
  
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Check wallet exists
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

    // Add to wallet
    await connection.query(
      "UPDATE wallets SET balance = balance + ?, updated_at = NOW() WHERE user_id = ?",
      [amount, userId]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref) VALUES (?, ?, 'credit', ?)",
      [userId, amount, txnRef]
    );

    await connection.commit();
    
    // Send payment success SMS
    const [updatedWallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [userId]
    );
    
    const [user] = await connection.query(
      "SELECT mobile FROM users WHERE user_id = ?",
      [userId]
    );
    
    if (user[0]?.mobile) {
      await notificationService.sendPaymentSuccess(user[0].mobile, amount, updatedWallet[0].balance);
    }
    
    return true;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

// Get transaction history
export const getTransactionHistory = async (req, res) => {
  try {
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 50",
      [req.user.id]
    );

    res.json(transactions);
  } catch (error) {
    console.error("Transaction History Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};