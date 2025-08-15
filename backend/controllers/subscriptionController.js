import db from "../config/db.js";

// Subscription plans
const SUBSCRIPTION_PLANS = {
  basic: { name: "Basic Plan", price: 999, duration: 30 },
  premium: { name: "Premium Plan", price: 1999, duration: 30 },
  enterprise: { name: "Enterprise Plan", price: 4999, duration: 30 }
};

// Create subscription
export const createSubscription = async (req, res) => {
  const { planType } = req.body;

  if (!SUBSCRIPTION_PLANS[planType]) {
    return res.status(400).json({ message: "Invalid subscription plan" });
  }

  try {
    const plan = SUBSCRIPTION_PLANS[planType];
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration);

    const [result] = await db.query(
      "INSERT INTO subscriptions (user_id, plan_name, amount, start_date, end_date) VALUES (?, ?, ?, ?, ?)",
      [req.user.id, plan.name, plan.price, startDate, endDate]
    );

    // Update wallet validity
    await db.query(
      "UPDATE wallets SET valid_until = ? WHERE user_id = ?",
      [endDate, req.user.id]
    );

    res.json({
      message: "Subscription created successfully",
      subscriptionId: result.insertId,
      plan: plan.name,
      validUntil: endDate
    });
  } catch (error) {
    console.error("Subscription Error:", error);
    res.status(500).json({ message: "Server error" });
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

// Check subscription validity
export const checkSubscriptionValidity = async (userId) => {
  try {
    const [subscription] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active' AND end_date >= CURDATE() ORDER BY end_date DESC LIMIT 1",
      [userId]
    );

    return subscription.length > 0;
  } catch (error) {
    console.error("Check Subscription Error:", error);
    return false;
  }
};

// Cancel subscription
export const cancelSubscription = async (req, res) => {
  try {
    await db.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    res.json({ message: "Subscription cancelled successfully" });
  } catch (error) {
    console.error("Cancel Subscription Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available plans
export const getSubscriptionPlans = async (req, res) => {
  res.json(SUBSCRIPTION_PLANS);
};