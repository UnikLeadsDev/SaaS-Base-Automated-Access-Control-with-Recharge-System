import db from "../config/db.js";
import { deductFromWallet } from "../controllers/walletController.js";

// Check access for form submissions (subscription or wallet)
export const checkFormAccess = (formType) => {
  return async (req, res, next) => {
    try {
      // Check for active subscription first
      const [subscriptions] = await db.query(
        `SELECT s.*, sp.basic_form_limit, sp.realtime_form_limit 
         FROM subscriptions s
         JOIN subscription_plans sp ON s.plan_id = sp.plan_id
         WHERE s.user_id = ? AND s.status IN ('active', 'grace')
         AND CURDATE() <= COALESCE(s.grace_end_date, s.end_date)
         ORDER BY s.end_date DESC LIMIT 1`,
        [req.user.id]
      );

      if (subscriptions.length > 0) {
        const subscription = subscriptions[0];
        const hasAccess = formType === 'basic' ? 
          subscription.basic_form_limit !== 0 : 
          subscription.realtime_form_limit !== 0;

        if (!hasAccess) {
          return res.status(403).json({
            success: false,
            message: `Your subscription plan doesn't include ${formType} forms`,
            code: 'SUBSCRIPTION_LIMIT_EXCEEDED'
          });
        }

        // Track usage
        const today = new Date().toISOString().split('T')[0];
        await db.query(
          `INSERT INTO usage_tracking (user_id, subscription_id, form_type, usage_date)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE forms_used = forms_used + 1`,
          [req.user.id, subscription.sub_id, formType, today]
        );

        req.accessType = 'subscription';
        return next();
      }

      // No subscription, check wallet balance
      const [wallet] = await db.query(
        "SELECT balance FROM wallets WHERE user_id = ?",
        [req.user.id]
      );

      const balance = parseFloat(wallet[0]?.balance || 0);
      const rate = formType === 'basic' ? 
        (parseFloat(process.env.BASIC_FORM_RATE) || 5) : 
        (parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50);

      if (balance < rate) {
        return res.status(403).json({
          success: false,
          message: `Insufficient balance. Required: ₹${rate}, Available: ₹${balance}`,
          code: 'INSUFFICIENT_BALANCE',
          required: rate,
          available: balance
        });
      }

      req.accessType = 'wallet';
      req.formRate = rate;
      next();
    } catch (error) {
      console.error("Access Check Error:", error);
      res.status(500).json({ success: false, message: "Access verification failed" });
    }
  };
};

// Legacy function for backward compatibility
export const checkSubscriptionAccess = checkFormAccess;



export const checkBalance = async (req, res) => {
  try {
    // Get wallet balance and active subscription
    const [walletResult] = await db.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [req.user.id]
    );
    
    const [subscriptionResult] = await db.query(
      `SELECT s.*, sp.basic_form_limit, sp.realtime_form_limit 
       FROM subscriptions s
       JOIN subscription_plans sp ON s.plan_id = sp.plan_id
       WHERE s.user_id = ? AND s.status IN ('active', 'grace')
       AND CURDATE() <= COALESCE(s.grace_end_date, s.end_date)
       ORDER BY s.end_date DESC LIMIT 1`,
      [req.user.id]
    );

    const balance = parseFloat(walletResult[0]?.balance || 0);
    const hasSubscription = subscriptionResult.length > 0;
    const subscription = subscriptionResult[0];
    const rates = { 
      basic: parseFloat(process.env.BASIC_FORM_RATE) || 5, 
      realtime: parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50 
    };

    let canSubmitBasic = false;
    let canSubmitRealtime = false;
    let accessType = 'wallet';

    if (hasSubscription) {
      accessType = 'subscription';
      canSubmitBasic = subscription.basic_form_limit !== 0;
      canSubmitRealtime = subscription.realtime_form_limit !== 0;
    } else {
      canSubmitBasic = balance >= rates.basic;
      canSubmitRealtime = balance >= rates.realtime;
    }

    const guidance = hasSubscription ? {} : {
      basic: !canSubmitBasic ? {
        reason: "insufficient_balance",
        required: rates.basic,
        shortfall: rates.basic - balance,
        action: "recharge"
      } : null,
      realtime: !canSubmitRealtime ? {
        reason: "insufficient_balance",
        required: rates.realtime,
        shortfall: rates.realtime - balance,
        action: "recharge"
      } : null
    };

    res.json({
      success: true,
      balance,
      accessType,
      canSubmitBasic,
      canSubmitRealtime,
      demoMode: false,
      paymentsEnabled: true,
      rates,
      guidance,
      subscription: hasSubscription ? {
        planName: subscription.plan_name,
        status: subscription.status,
        endDate: subscription.end_date,
        graceEndDate: subscription.grace_end_date
      } : null
    });
  } catch (err) {
    console.error("Balance check error:", err);
    res.status(500).json({ success: false, message: "Balance check failed" });
  }
};

