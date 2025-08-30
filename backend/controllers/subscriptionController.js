import db from "../config/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

export const createSubscription = async (req, res) => {
  const { planId } = req.body;

  try {
    const [plans] = await db.query(
      "SELECT * FROM subscription_plans WHERE plan_id = ? AND status = 'active'",
      [planId]
    );

    if (!plans.length) return res.status(404).json({ message: "Plan not found" });

    const plan = plans[0];

    const order = await razorpay.orders.create({
      amount: plan.amount * 100, // in paise
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: { user_id: req.user.id, plan_id: planId }
    });

    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create subscription order" });
  }
};


// Verify subscription payment
export const verifySubscriptionPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    const [plans] = await connection.query(
      "SELECT * FROM subscription_plans WHERE plan_id = ?", [planId]
    );

    if (!plans.length) throw new Error("Plan not found");

    const plan = plans[0];
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amount = payment.amount / 100;

    // Deactivate existing subscriptions
    await connection.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status IN ('active', 'grace')",
      [req.user.id]
    );

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date(startDate.getTime() + plan.duration_days * 24 * 60 * 60 * 1000);
    const graceEndDate = new Date(endDate.getTime() + plan.grace_period_days * 24 * 60 * 60 * 1000);

    const [result] = await connection.query(
  `INSERT INTO subscriptions 
     (user_id, plan_id, plan_name, amount, start_date, end_date, grace_end_date) 
   VALUES (?, ?, ?, ?, ?, ?, ?)`,
  [
    req.user.id,
    plan.plan_id,
    plan.plan_name, // add this
    amount,
    startDate.toISOString().split('T')[0],
    endDate.toISOString().split('T')[0],
    graceEndDate.toISOString().split('T')[0]
  ]
);

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, 'credit', ?, 'subscription')",
      [req.user.id, amount, razorpay_payment_id]
    );

    await connection.commit();

    res.json({ 
      success: true,
      message: "Subscription activated successfully", 
      subscription: {
        id: result.insertId,
        planName: plan.plan_name,
        startDate: startDate.toISOString().split('T')[0],
        endDate: endDate.toISOString().split('T')[0],
        amount
      }
    });
  } catch (error) {
    await connection.rollback();
    console.error("Subscription Payment Error:", error);
    res.status(500).json({ message: error.message || "Payment verification failed" });
  } finally {
    connection.release();
  }
};

// Get subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const [plans] = await db.query(
      "SELECT * FROM subscription_plans WHERE status = 'active' ORDER BY amount ASC"
    );

    res.json({ success: true, plans });
  } catch (error) {
    console.error("Get Plans Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getUserSubscriptions = async (req, res) => {
  try {
    const [subs] = await db.query(
      `SELECT sub_id, plan_name, amount, start_date, end_date, status
       FROM subscriptions WHERE user_id = ? ORDER BY start_date DESC`,
      [req.user.id]
    );

    res.json({ success: true, subscriptions: subs });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


// Get subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const [subscriptions] = await db.query(
      `SELECT s.*, sp.plan_name FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.plan_id
       WHERE s.user_id = ? AND s.status IN ('active', 'grace')
       AND CURDATE() <= COALESCE(s.grace_end_date, s.end_date)
       ORDER BY s.end_date DESC LIMIT 1`,
      [req.user.id]
    );

    if (!subscriptions.length) {
      return res.json({ 
        success: true, 
        hasActiveSubscription: false,
        subscription: null 
      });
    }

    const sub = subscriptions[0];
    const today = new Date();
    const endDate = new Date(sub.end_date);
    const graceEndDate = new Date(sub.grace_end_date);
    
    let status = 'active';
    if (today > endDate && today <= graceEndDate) {
      status = 'grace';
    } else if (today > graceEndDate) {
      status = 'expired';
    }

    res.json({ 
      success: true, 
      hasActiveSubscription: status !== 'expired',
      subscription: {
        ...sub,
        currentStatus: status,
        daysRemaining: Math.max(0, Math.ceil((endDate - today) / (1000 * 60 * 60 * 24))),
        graceDaysRemaining: Math.max(0, Math.ceil((graceEndDate - today) / (1000 * 60 * 60 * 24)))
      }
    });
  } catch (error) {
    console.error("Get Subscription Status Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Check subscription access
export const checkSubscriptionAccess = async (req, res) => {
  const { formType } = req.params;
  
  try {
    const [result] = await db.query(
      "SELECT check_subscription_access(?, ?) as hasAccess",
      [req.user.id, formType]
    );
    
    res.json({ 
      success: true, 
      hasAccess: Boolean(result[0].hasAccess),
      formType 
    });
  } catch (error) {
    console.error("Check Access Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Update preferences
export const updatePreferences = async (req, res) => {
  const { autoRenewal, preferredPlanId, notificationDays } = req.body;
  
  try {
    await db.query(
      `UPDATE user_preferences 
       SET auto_renewal = ?, preferred_plan_id = ?, notification_days_before = ?
       WHERE user_id = ?`,
      [autoRenewal, preferredPlanId, notificationDays, req.user.id]
    );
    
    res.json({ success: true, message: "Preferences updated" });
  } catch (error) {
    console.error("Update Preferences Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};