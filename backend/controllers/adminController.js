import db from "../config/db.js";

// Get admin dashboard stats
export const getAdminStats = async (req, res) => {
  try {
    // Total users
    const [totalUsers] = await db.query("SELECT COUNT(*) as count FROM users WHERE role != 'admin'");
    
    // Total revenue
    const [totalRevenue] = await db.query("SELECT SUM(amount) as total FROM transactions WHERE type = 'credit'");
    
    // Total applications
    const [totalApplications] = await db.query("SELECT COUNT(*) as count FROM applications");
    
    // Low balance users
    const lowBalanceThreshold = parseFloat(process.env.LOW_BALANCE_THRESHOLD) || 100;
    const [lowBalanceUsers] = await db.query("SELECT COUNT(*) as count FROM wallets WHERE balance < ?", [lowBalanceThreshold]);

    res.json({
      totalUsers: totalUsers[0].count,
      totalRevenue: totalRevenue[0].total || 0,
      totalApplications: totalApplications[0].count,
      lowBalanceUsers: lowBalanceUsers[0].count
    });
  } catch (error) {
    console.error("Admin Stats Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all users - aggregated data without PII
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.status, DATE(u.created_at) as join_date, w.balance
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE u.role != 'admin'
      ORDER BY u.created_at DESC
    `);

    res.json({ users, total: users.length });
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update user status
export const updateUserStatus = async (req, res) => {
  const { userId } = req.params;
  const { status } = req.body;

  if (!['active', 'blocked'].includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    await db.query("UPDATE users SET status = ? WHERE user_id = ?", [status, userId]);
    res.json({ message: "User status updated successfully" });
  } catch (error) {
    console.error("Update User Status Error:", error);
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

    // Log admin action
    await connection.query(
      "INSERT INTO admin_audit (admin_id, action, target_user_id, amount, txn_ref, reason) VALUES (?, 'payment_status_update', ?, ?, ?, ?)",
      [req.user.id, txn.user_id, amount || txn.amount, txn.txn_ref, reason || `Status updated to ${status}`]
    );

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