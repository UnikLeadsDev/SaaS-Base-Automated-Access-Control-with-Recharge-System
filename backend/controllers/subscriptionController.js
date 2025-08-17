import db from "../config/db.js";

// Create subscription
export const createSubscription = async (req, res) => {
  const { planName, amount, duration } = req.body;

  if (!planName || !amount || !duration) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + duration);

    const [result] = await db.query(
      "INSERT INTO subscriptions (user_id, plan_name, amount, start_date, end_date, status) VALUES (?, ?, ?, ?, ?, 'active')",
      [req.user.id, planName, amount, startDate.toISOString().split('T')[0], endDate.toISOString().split('T')[0]]
    );

    res.json({
      message: "Subscription created successfully",
      subscriptionId: result.insertId
    });
  } catch (error) {
    console.error("Create Subscription Error:", error);
    res.status(500).json({ message: "Failed to create subscription" });
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json(subscriptions);
  } catch (error) {
    console.error("Get Subscriptions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};