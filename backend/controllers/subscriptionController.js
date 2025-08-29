import db from "../config/db.js";
import Razorpay from "razorpay";
import crypto from "crypto";
import { addToWallet } from "./walletController.js";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// Create subscription payment order
export const createSubscription = async (req, res) => {
  const { planId } = req.body;

  if (!planId) {
    return res.status(400).json({ message: "Plan ID is required" });
  }

  try {
    // Get plan details
    const [plans] = await db.query(
      "SELECT * FROM subscription_plans WHERE plan_id = ? AND status = 'active'",
      [planId]
    );

    if (plans.length === 0) {
      return res.status(404).json({ message: "Plan not found" });
    }

    const plan = plans[0];

    // Create Razorpay order for subscription
    const options = {
      amount: plan.amount * 100, // Convert to paise
      currency: "INR",
      receipt: `sub_${req.user.id}_${Date.now()}`,
      notes: {
        user_id: req.user.id,
        plan_id: planId,
        plan_name: plan.plan_name,
        type: 'subscription'
      }
    };

    const order = await razorpay.orders.create(options);
    
    res.json({
      success: true,
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      key: process.env.RAZORPAY_KEY_ID,
      plan
    });
  } catch (error) {
    console.error("Create Subscription Order Error:", error);
    res.status(500).json({ message: "Failed to create subscription order" });
  }
};

// Verify subscription payment and activate subscription
export const verifySubscriptionPayment = async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

  const connection = await db.getConnection();
  
  try {
    await connection.beginTransaction();

    // Verify signature
    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature !== razorpay_signature) {
      throw new Error("Invalid payment signature");
    }

    // Get plan details
    const [plans] = await connection.query(
      "SELECT * FROM subscription_plans WHERE plan_id = ?",
      [planId]
    );

    if (plans.length === 0) {
      throw new Error("Plan not found");
    }

    const plan = plans[0];
    const payment = await razorpay.payments.fetch(razorpay_payment_id);
    const amount = payment.amount / 100;

    // Deactivate existing active subscriptions
    await connection.query(
      "UPDATE subscriptions SET status = 'cancelled' WHERE user_id = ? AND status IN ('active', 'grace')",
      [req.user.id]
    );

    // Create new subscription with validity dates
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + plan.duration_days);
    
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + plan.grace_period_days);

    const [result] = await connection.query(
      `INSERT INTO subscriptions (user_id, plan_id, plan_name, amount, start_date, end_date, grace_end_date, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [req.user.id, plan.plan_id, plan.plan_name, amount, 
       startDate.toISOString().split('T')[0], 
       endDate.toISOString().split('T')[0],
       graceEndDate.toISOString().split('T')[0]]
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
    console.error("Subscription Payment Verification Error:", error);
    res.status(500).json({ message: error.message || "Subscription payment verification failed" });
  } finally {
    connection.release();
  }
};

// Get user subscriptions
export const getUserSubscriptions = async (req, res) => {
  try {
    const [subscriptions] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? ORDER BY created_at DESC",
      [req.user.id]
    );

    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Get Subscriptions Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get available subscription plans
export const getSubscriptionPlans = async (req, res) => {
  try {
    const [plans] = await db.query(
      "SELECT * FROM subscription_plans WHERE status = 'active' ORDER BY amount ASC"
    );

    const formattedPlans = plans.map(plan => ({
      id: plan.plan_id,
      name: plan.plan_name,
      amount: plan.amount,
      duration: plan.duration_days,
      gracePeriod: plan.grace_period_days,
      basicFormRate: plan.basic_form_rate,
      realtimeFormRate: plan.realtime_form_rate,
      features: getFeaturesByPlan(plan.plan_name)
    }));

    res.json({ success: true, plans: formattedPlans });
  } catch (error) {
    console.error("Get Plans Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get current user subscription status
export const getSubscriptionStatus = async (req, res) => {
  try {
    const [subscriptions] = await db.query(
      `SELECT s.*, sp.plan_name, sp.duration_days, sp.grace_period_days
       FROM subscriptions s
       LEFT JOIN subscription_plans sp ON s.plan_id = sp.plan_id
       WHERE s.user_id = ? AND s.status IN ('active', 'grace')
       AND (s.end_date >= CURDATE() OR s.grace_end_date >= CURDATE())
       ORDER BY s.end_date DESC LIMIT 1`,
      [req.user.id]
    );

    if (subscriptions.length === 0) {
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

// Helper function to get features by plan name
const getFeaturesByPlan = (planName) => {
  const features = {
    'Basic Monthly': ['Unlimited Basic Forms', 'Email Support', 'Basic Analytics'],
    'Premium Monthly': ['Unlimited All Forms', 'Priority Support', 'Advanced Analytics', 'API Access'],
    'Basic Yearly': ['Unlimited Basic Forms', 'Email Support', 'Basic Analytics', 'Annual Discount']
  };
  return features[planName] || ['Standard Features'];
};

// Helper function to send subscription notifications
const sendSubscriptionNotification = async (userId, planName, amount) => {
  try {
    const message = `Subscription to ${planName} activated successfully! Amount: ₹${amount} added to your wallet.`;
    
    await db.query(
      "INSERT INTO notifications (user_id, channel, message_type, message) VALUES (?, 'sms', 'payment_success', ?)",
      [userId, message]
    );
  } catch (error) {
    console.error("Subscription Notification Error:", error);
  }
};