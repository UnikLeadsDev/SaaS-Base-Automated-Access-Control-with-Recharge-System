import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import fs from "fs";
import dotenv from "dotenv";

dotenv.config();

const ENV_PATH = ".env";

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    let totalUsers = 0, totalRevenue = 0, totalApplications = 0;
    let lowBalanceUsers = 0, activeSessions = 0, suspiciousLogins = 0;

    // Detailed data
    let lowBalanceUserList = [], applicationList = [], revenueList = [];

    try {
      const [users] = await db.query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
      totalUsers = users[0]?.count || 0;
    } catch (e) { console.warn('Users table issue:', e.message); }

    // Enhanced revenue tracking
    let monthlyRevenue = 0, subscriptionRevenue = 0, walletRevenue = 0;
    try {
      const [revenue] = await db.query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit'");
      totalRevenue = revenue[0]?.total || 0;
    } catch (e) { console.warn('Transactions table issue:', e.message); }

    try {
      const [apps] = await db.query("SELECT COUNT(*) as count FROM applications");
      totalApplications = apps[0]?.count || 0;

      // actual applications
      const [appsDetails] = await db.query(
        "SELECT a.app_id, a.user_id, u.name, u.email, a.form_type, a.submitted_at " +
        "FROM applications a JOIN users u ON a.user_id = u.user_id " +
        "ORDER BY a.submitted_at DESC LIMIT 20"
      );
      applicationList = appsDetails;
    } catch (e) { console.warn('Applications table issue:', e.message); }

    try {
      const lowBalanceThreshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
      const [lowBalance] = await db.query("SELECT COUNT(*) as count FROM wallets WHERE balance < ?", [lowBalanceThreshold]);
      lowBalanceUsers = lowBalance[0]?.count || 0;

      // actual low balance users
      const [lowBalanceDetails] = await db.query(
        "SELECT w.user_id, u.name, u.email, w.balance " +
        "FROM wallets w JOIN users u ON w.user_id = u.user_id " +
        "WHERE w.balance < ? ORDER BY w.balance ASC LIMIT 20",
        [lowBalanceThreshold]
      );
      lowBalanceUserList = lowBalanceDetails;
    } catch (e) { console.warn('Wallets table issue:', e.message); }

    try {
      const [sessions] = await db.query("SELECT COUNT(*) as count FROM user_sessions WHERE expires_at > NOW()");
      activeSessions = sessions[0]?.count || 0;
    } catch (e) { console.warn('Sessions table issue:', e.message); }

    try {
      const [suspicious] = await db.query("SELECT COUNT(*) as count FROM login_history WHERE is_suspicious = 1 AND DATE(login_time) = CURDATE()");
      suspiciousLogins = suspicious[0]?.count || 0;
    } catch (e) { console.warn('Login history table issue:', e.message); }

    // Usage analytics
    let totalForms = 0, basicForms = 0, realtimeForms = 0, activeSubscriptions = 0;
    try {
      const [forms] = await db.query("SELECT COUNT(*) as count FROM applications");
      totalForms = forms[0]?.count || 0;
      
      const [basic] = await db.query("SELECT COUNT(*) as count FROM applications WHERE form_type = 'basic'");
      basicForms = basic[0]?.count || 0;
      
      const [realtime] = await db.query("SELECT COUNT(*) as count FROM applications WHERE form_type = 'realtime'");
      realtimeForms = realtime[0]?.count || 0;
      
      const [activeSubs] = await db.query("SELECT COUNT(*) as count FROM subscriptions WHERE status = 'active'");
      activeSubscriptions = activeSubs[0]?.count || 0;
    } catch (e) { console.warn('Usage analytics issue:', e.message); }

    res.json({
      success: true,
      stats: { totalUsers, totalRevenue, totalApplications, lowBalanceUsers, activeSessions, suspiciousLogins }
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get all users with enhanced details
export const getAllUsers = async (req, res) => {
  try {

    const { page = 1, limit = 10, search = '', role = '', status = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    let params = [];
    
    if (search) {
      whereClause += " AND (u.name LIKE ? OR u.email LIKE ?)";
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (role) {
      whereClause += " AND u.role = ?";
      params.push(role);
    }
    
    if (status) {
      whereClause += " AND u.status = ?";
      params.push(status);
    }

    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.mobile, u.role, u.status, 
             DATE(u.created_at) as join_date, 
             COALESCE(w.balance, 0) as balance,
             u.last_login
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      ${whereClause}
      ORDER BY u.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [totalCount] = await db.query(`
      SELECT COUNT(*) as count FROM users u ${whereClause}
    `, params);

    res.json({ 
      success: true,
      users, 
      total: totalCount[0]?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Create/Invite new user
export const createUser = async (req, res) => {
  try {
    const { name, email, mobile, role, password } = req.body;
    
    // Check if user exists
    const [existing] = await db.query("SELECT user_id FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    
    // Use provided password or generate temporary one
    const userPassword = password || crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(userPassword, 10);
    
    // Create user
    const [result] = await db.query(
      "INSERT INTO users (name, email, mobile, role, password, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [name, email, mobile, role, hashedPassword]
    );
    
    // Create wallet for non-admin users
    if (role !== 'admin') {
      await db.query(
        "INSERT INTO wallets (user_id, balance) VALUES (?, 0)",
        [result.insertId]
      );
    }
    
    res.json({ 
      message: "User created successfully", 
      userId: result.insertId,
      password: password ? null : userPassword
    });
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user details
export const updateUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const { name, email, mobile, role, status, password } = req.body;
    
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      await db.query(
        "UPDATE users SET name = ?, email = ?, mobile = ?, role = ?, status = ?, password = ? WHERE user_id = ?",
        [name, email, mobile, role, status, hashedPassword, userId]
      );
    } else {
      await db.query(
        "UPDATE users SET name = ?, email = ?, mobile = ?, role = ?, status = ? WHERE user_id = ?",
        [name, email, mobile, role, status, userId]
      );
    }
    
    res.json({ message: "User updated successfully" });
  } catch (error) {
    console.error("Update User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'blocked', 'pending'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query("UPDATE users SET status = ? WHERE user_id = ?", [status, userId]);
    
    // If blocking user, terminate all sessions
    if (status === 'blocked') {
      await db.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    }
    
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Update User Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Delete related data
      await connection.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM login_history WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM transactions WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM wallets WHERE user_id = ?", [userId]);
      await connection.query("DELETE FROM api_keys WHERE user_id = ?", [userId]);
      
      // Delete user
      await connection.query("DELETE FROM users WHERE user_id = ?", [userId]);
      
      await connection.commit();
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Delete User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset user password
export const resetUserPassword = async (req, res) => {
  try {
    const { userId } = req.params;
    
    const newPassword = crypto.randomBytes(8).toString('hex');
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    await db.query(
      "UPDATE users SET password = ? WHERE user_id = ?",
      [hashedPassword, userId]
    );
    
    // Terminate all sessions
    await db.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    
    res.json({ message: "Password reset successfully", newPassword });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get login history
export const getLoginHistory = async (req, res) => {
  try {

    const { userId, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "";
    let params = [];
    
    if (userId) {
      whereClause = "WHERE lh.user_id = ?";
      params.push(userId);
    }
    
    let history = [];
    try {
      const [result] = await db.query(`
        SELECT lh.*, u.name, u.email
        FROM login_history lh
        JOIN users u ON lh.user_id = u.user_id
        ${whereClause}
        ORDER BY lh.login_time DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);
      history = result;
    } catch (e) {
      console.warn('Login history table not found:', e.message);
    }
    
    res.json({ success: true, history });
  } catch (error) {
    console.error("Get Login History Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Mark login as suspicious
export const markSuspiciousLogin = async (req, res) => {
  try {
    const { loginId } = req.params;
    const { is_suspicious } = req.body;
    
    await db.query(
      "UPDATE login_history SET is_suspicious = ? WHERE id = ?",
      [is_suspicious ? 1 : 0, loginId]
    );
    
    res.json({ message: "Login status updated" });
  } catch (error) {
    console.error("Mark Suspicious Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get active sessions
export const getActiveSessions = async (req, res) => {
  try {

    let sessions = [];
    try {
      const [result] = await db.query(`
        SELECT s.*, u.name, u.email
        FROM user_sessions s
        JOIN users u ON s.user_id = u.user_id
        WHERE (s.expires_at IS NULL OR s.expires_at > NOW())
        ORDER BY s.created_at DESC
      `);
      sessions = result;
    } catch (e) {
      console.warn('User sessions table not found:', e.message);
    }
    
    res.json({ success: true, sessions });
  } catch (error) {
    console.error("Get Active Sessions Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Terminate session
export const terminateSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    await db.query("DELETE FROM user_sessions WHERE id = ?", [sessionId]);
    
    res.json({ message: "Session terminated" });
  } catch (error) {
    console.error("Terminate Session Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Terminate all user sessions
export const terminateAllUserSessions = async (req, res) => {
  try {
    const { userId } = req.params;
    
    await db.query("DELETE FROM user_sessions WHERE user_id = ?", [userId]);
    
    res.json({ message: "All user sessions terminated" });
  } catch (error) {
    console.error("Terminate All Sessions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get billing history
export const getBillingHistory = async (req, res) => {
  try {

    const { userId, startDate, endDate, type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    let params = [];
    
    if (userId) {
      whereClause += " AND t.user_id = ?";
      params.push(userId);
    }
    
    if (startDate) {
      whereClause += " AND DATE(t.created_at) >= ?";
      params.push(startDate);
    }
    
    if (endDate) {
      whereClause += " AND DATE(t.created_at) <= ?";
      params.push(endDate);
    }
    
    if (type) {
      whereClause += " AND t.type = ?";
      params.push(type);
    }
    
    let transactions = [];
    try {
      const [result] = await db.query(`
        SELECT t.*, u.name, u.email
        FROM transactions t
        JOIN users u ON t.user_id = u.user_id
        ${whereClause}
        ORDER BY t.created_at DESC
        LIMIT ? OFFSET ?
      `, [...params, parseInt(limit), offset]);
      transactions = result;
    } catch (e) {
      console.warn('Transactions table issue:', e.message);
    }
    
    res.json({ success: true, transactions });
  } catch (error) {
    console.error("Get Billing History Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Manual balance update
export const manualBalanceUpdate = async (req, res) => {
  try {
    const { userId, amount, type, reason } = req.body;
    
    if (!['credit', 'debit'].includes(type)) {
      return res.status(400).json({ message: "Invalid transaction type" });
    }
    
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();
      
      // Create transaction
      const txnRef = `MANUAL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await connection.query(
        "INSERT INTO transactions (user_id, amount, type, payment_mode, txn_ref, description) VALUES (?, ?, ?, 'manual', ?, ?)",
        [userId, Math.abs(amount), type, txnRef, reason]
      );
      
      // Update wallet
      const balanceChange = type === 'credit' ? Math.abs(amount) : -Math.abs(amount);
      await connection.query(
        "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
        [balanceChange, userId]
      );
      
      await connection.commit();
      res.json({ message: "Balance updated successfully" });
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error("Manual Balance Update Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Utility to update env file
function updateEnvFile(updates) {
  let envConfig = fs.readFileSync(ENV_PATH, "utf-8").split("\n");

  for (let key in updates) {
    const regex = new RegExp(`^${key}=.*$`, "m");
    const newLine = `${key}=${updates[key]}`;
    let found = false;

    envConfig = envConfig.map(line => {
      if (line.startsWith(`${key}=`)) {
        found = true;
        return newLine;
      }
      return line;
    });

    if (!found) {
      envConfig.push(newLine);
    }
  }

  fs.writeFileSync(ENV_PATH, envConfig.join("\n"));
}

// Get API Keys
export const getApiKeys = async (req, res) => {
  try {
    res.json({
      razorpayKeyId: process.env.RAZORPAY_KEY_ID,
      razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET,
      msg91AuthKey: process.env.MSG91_AUTH_KEY,
      msg91OtpTemplateId: process.env.MSG91_OTP_TEMPLATE_ID
    });
  } catch (error) {
    console.error("Error fetching API keys:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update API Keys
export const updateApiKeys = async (req, res) => {
  try {
    const { razorpayKeyId, razorpayKeySecret, msg91AuthKey, msg91OtpTemplateId } = req.body;

    const updates = {};
    if (razorpayKeyId) updates.RAZORPAY_KEY_ID = razorpayKeyId;
    if (razorpayKeySecret) updates.RAZORPAY_KEY_SECRET = razorpayKeySecret;
    if (msg91AuthKey) updates.MSG91_AUTH_KEY = msg91AuthKey;
    if (msg91OtpTemplateId) updates.MSG91_OTP_TEMPLATE_ID = msg91OtpTemplateId;

    // Update in .env file
    updateEnvFile(updates);

    // Refresh process.env
    dotenv.config();

    res.json({ message: "API keys updated successfully" });
  } catch (error) {
    console.error("Error updating API keys:", error);
    res.status(500).json({ message: "Server error" });
  }
};


// Search transaction by ID
export const searchTransaction = async (req, res) => {
  const { transactionId } = req.params;

  try {
    const [transaction] = await db.query(`
      SELECT t.txn_id, t.user_id, t.amount, t.type, t.payment_mode, t.txn_ref, t.created_at,
             u.name, u.email, u.role,
             w.balance as current_balance
      FROM transactions t
      JOIN users u ON t.user_id = u.user_id
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE t.txn_ref = ? OR t.txn_id = ?
    `, [transactionId, transactionId]);

    if (transaction.length === 0) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    res.json({ transaction: transaction[0] });
  } catch (error) {
    console.error("Search Transaction Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all subscriptions for admin
export const getAllSubscriptions = async (req, res) => {
  try {
    const { page = 1, limit = 10, status = '', planId = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = "WHERE 1=1";
    let params = [];
    
    if (status) {
      whereClause += " AND s.status = ?";
      params.push(status);
    }
    
    if (planId) {
      whereClause += " AND s.plan_id = ?";
      params.push(planId);
    }

    const [subscriptions] = await db.query(`
      SELECT s.sub_id, s.user_id, u.name, u.email, s.plan_name, s.amount,
             s.start_date, s.end_date, s.status, s.created_at
      FROM subscriptions s
      JOIN users u ON s.user_id = u.user_id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);

    const [totalCount] = await db.query(`
      SELECT COUNT(*) as count FROM subscriptions s
      JOIN users u ON s.user_id = u.user_id
      ${whereClause}
    `, params);

    res.json({ 
      success: true,
      subscriptions, 
      total: totalCount[0]?.count || 0,
      page: parseInt(page),
      limit: parseInt(limit)
    });
  } catch (error) {
    console.error("Get Subscriptions Error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Override subscription status
export const overrideSubscription = async (req, res) => {
  try {
    const { subscriptionId } = req.params;
    const { status, endDate, reason } = req.body;
    
    if (!['active', 'expired', 'cancelled', 'grace'].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }
    
    let updateQuery = "UPDATE subscriptions SET status = ?";
    let params = [status];
    
    if (endDate) {
      updateQuery += ", end_date = ?";
      params.push(endDate);
    }
    
    updateQuery += " WHERE sub_id = ?";
    params.push(subscriptionId);
    
    await db.query(updateQuery, params);
    
    // Log admin action
    await db.query(
      "INSERT INTO admin_actions (admin_id, action_type, target_id, description) VALUES (?, 'subscription_override', ?, ?)",
      [req.user.id, subscriptionId, reason || `Status changed to ${status}`]
    );
    
    res.json({ message: "Subscription updated successfully" });
  } catch (error) {
    console.error("Override Subscription Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Manage subscription plans
export const createSubscriptionPlan = async (req, res) => {
  try {
    const { planName, amount, durationDays, gracePeriodDays, features } = req.body;
    
    const [result] = await db.query(
      "INSERT INTO subscription_plans (plan_name, amount, duration_days, grace_period_days, features) VALUES (?, ?, ?, ?, ?)",
      [planName, amount, durationDays, gracePeriodDays, JSON.stringify(features)]
    );
    
    res.json({ message: "Plan created successfully", planId: result.insertId });
  } catch (error) {
    console.error("Create Plan Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateSubscriptionPlan = async (req, res) => {
  try {
    const { planId } = req.params;
    const { planName, amount, durationDays, gracePeriodDays, features, status } = req.body;
    
    await db.query(
      "UPDATE subscription_plans SET plan_name = ?, amount = ?, duration_days = ?, grace_period_days = ?, features = ?, status = ? WHERE plan_id = ?",
      [planName, amount, durationDays, gracePeriodDays, JSON.stringify(features), status, planId]
    );
    
    res.json({ message: "Plan updated successfully" });
  } catch (error) {
    console.error("Update Plan Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update payment by transaction ID
export const updatePaymentByTransactionId = async (req, res) => {
  const { transactionId } = req.params;
  const { status, amount, reason } = req.body;

  if (!['success', 'failed', 'pending'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();

    // Find transaction
    const [transaction] = await connection.query(
      "SELECT * FROM transactions WHERE txn_ref = ? OR txn_id = ?",
      [transactionId, transactionId]
    );

    if (transaction.length === 0) {
      await connection.rollback();
      return res.status(404).json({ message: "Transaction not found" });
    }

    const txn = transaction[0];
    
    // Update receipt status if exists
    await connection.query(
      "UPDATE receipts SET status = ? WHERE txn_id = ?",
      [status, txn.txn_ref]
    );

    // If marking as failed and was previously successful, reverse the transaction
    if (status === 'failed' && txn.type === 'credit') {
      // Debit the amount back
      await connection.query(
        "INSERT INTO transactions (user_id, amount, type, payment_mode, txn_ref) VALUES (?, ?, 'debit', 'reversal', ?)",
        [txn.user_id, txn.amount, `reversal_${txn.txn_ref}`]
      );
      
      // Update wallet balance
      await connection.query(
        "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
        [txn.amount, txn.user_id]
      );
    }

    // If marking as success and amount provided, update the transaction
    if (status === 'success' && amount && parseFloat(amount) !== txn.amount) {
      const amountDiff = parseFloat(amount) - txn.amount;
      
      // Update transaction amount
      await connection.query(
        "UPDATE transactions SET amount = ? WHERE txn_id = ?",
        [amount, txn.txn_id]
      );
      
      // Adjust wallet balance
      if (txn.type === 'credit') {
        await connection.query(
          "UPDATE wallets SET balance = balance + ? WHERE user_id = ?",
          [amountDiff, txn.user_id]
        );
      }
    }

    await connection.commit();
    res.json({ message: "Payment updated successfully" });
  } catch (error) {
    await connection.rollback();
    console.error("Update Payment Error:", error);
    res.status(500).json({ message: "Server error" });
  } finally {
    connection.release();
  }
};