import db from "../config/db.js";

// Check subscription access for form submissions
export const checkSubscriptionAccess = (formType) => {
  return async (req, res, next) => {
    console.log("this is id", req.user.id);
    try {
      const [result] = await db.query(
        "SELECT check_subscription_access(?, ?) as hasAccess",
        [req.user.id, formType]
      );

      if (!result[0].hasAccess) {
        return res.status(403).json({
          success: false,
          message: `Subscription required for ${formType} forms`,
          code: 'SUBSCRIPTION_REQUIRED'
        });
      }

      // Track usage
      const [subscriptions] = await db.query(
        `SELECT sub_id FROM subscriptions 
         WHERE user_id = ? AND status IN ('active', 'grace')
         AND CURDATE() <= COALESCE(grace_end_date, end_date)
         ORDER BY end_date DESC LIMIT 1`,
        [req.user.id]
      );

      if (subscriptions.length > 0) {
        const today = new Date().toISOString().split('T')[0];
        
        await db.query(
          `INSERT INTO usage_tracking (user_id, subscription_id, form_type, usage_date)
           VALUES (?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE forms_used = forms_used + 1`,
          [req.user.id, subscriptions[0].sub_id, formType, today]
        );
      }

      next();
    } catch (error) {
      console.error("Access Check Error:", error);
      res.status(500).json({ success: false, message: "Access verification failed" });
    }
  };
};



export const checkBalance = async (req, res) => {
  try {
    // Get wallet balance and subscription in single query
    const [result] = await db.query(
      `SELECT w.balance, 
              CASE WHEN s.sub_id IS NOT NULL THEN 1 ELSE 0 END as hasSubscription
       FROM wallets w
       LEFT JOIN subscriptions s ON w.user_id = s.user_id AND s.status = 'active'
       WHERE w.user_id = ?`,
      [req.user.id]
    );

    const balance = parseFloat(result[0]?.balance || 0);
    const hasSubscription = Boolean(result[0]?.hasSubscription);
    const rates = { basic: 5, realtime: 50 };

    const guidance = hasSubscription ? {} : {
      basic: balance < rates.basic ? {
        reason: "insufficient_balance",
        required: rates.basic,
        shortfall: rates.basic - balance,
        action: "recharge"
      } : null,
      realtime: balance < rates.realtime ? {
        reason: "insufficient_balance",
        required: rates.realtime,
        shortfall: rates.realtime - balance,
        action: "recharge"
      } : null
    };

    res.json({
      success: true,
      balance,
      accessType: hasSubscription ? "subscription" : "wallet",
      canSubmitBasic: hasSubscription || balance >= rates.basic,
      canSubmitRealtime: hasSubscription || balance >= rates.realtime,
      demoMode: false,
      paymentsEnabled: true,
      rates,
      guidance
    });
  } catch (err) {
    console.error("Balance check error:", err);
    res.status(500).json({ success: false, message: "Balance check failed" });
  }
};

