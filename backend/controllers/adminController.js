import db from "../config/db.js";

// Get all users
export const getAllUsers = async (req, res) => {
  try {
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.email, u.role, u.status, u.created_at,
             w.balance, w.status as wallet_status
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      ORDER BY u.created_at DESC
    `);

    res.json(users);
  } catch (error) {
    console.error("Get Users Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user details
export const getUserDetails = async (req, res) => {
  const { id } = req.params;

  try {
    const [user] = await db.query(`
      SELECT u.*, w.balance, w.status as wallet_status, w.valid_until
      FROM users u
      LEFT JOIN wallets w ON u.user_id = w.user_id
      WHERE u.user_id = ?
    `, [id]);

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    // Get recent transactions
    const [transactions] = await db.query(
      "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC LIMIT 10",
      [id]
    );

    // Get recent applications
    const [applications] = await db.query(
      "SELECT * FROM applications WHERE user_id = ? ORDER BY submitted_at DESC LIMIT 10",
      [id]
    );

    res.json({
      user: user[0],
      recentTransactions: transactions,
      recentApplications: applications
    });
  } catch (error) {
    console.error("Get User Details Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Block user
export const blockUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("UPDATE users SET status = 'blocked' WHERE user_id = ?", [id]);
    res.json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Block User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Unblock user
export const unblockUser = async (req, res) => {
  const { id } = req.params;

  try {
    await db.query("UPDATE users SET status = 'active' WHERE user_id = ?", [id]);
    res.json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Unblock User Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};