import db from "../config/db.js";

// Check subscription access for form submissions
export const checkSubscriptionAccess = (formType) => {
  return async (req, res, next) => {
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
    // 1. Get wallet balance
    const [result] = await db.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [req.user.id]
    );

    const balance = parseFloat(result[0]?.balance || 0);

    // 2. (Optional) Check if user has active subscription
    const [subResult] = await db.query(
      "SELECT * FROM subscriptions WHERE user_id = ? AND status = 'active'",
      [req.user.id]
    );

    const hasSubscription = subResult.length > 0;

    // 3. Rates (could be static or from DB/config)
    const rates = {
      basic: 5,
      realtime: 50
    };

    // 4. Guidance (only if not eligible)
    let guidance = {};
    if (!hasSubscription) {
      const shortfallBasic = Math.max(0, rates.basic - balance);
      const shortfallRealtime = Math.max(0, rates.realtime - balance);

      guidance = {
        basic: shortfallBasic > 0 ? {
          reason: "insufficient_balance",
          required: rates.basic,
          shortfall: shortfallBasic,
          action: "recharge"
        } : null,
        realtime: shortfallRealtime > 0 ? {
          reason: "insufficient_balance",
          required: rates.realtime,
          shortfall: shortfallRealtime,
          action: "recharge"
        } : null
      };
    }

    // 5. Response payload
    return res.json({
      success: true,
      balance,
      accessType: hasSubscription ? "subscription" : "wallet",
      canSubmitBasic: hasSubscription || balance >= rates.basic,
      canSubmitRealtime: hasSubscription || balance >= rates.realtime,
      demoMode: false,           // or derive from env/config
      paymentsEnabled: true,     // or derive from env/config
      rates,
      guidance
    });

  } catch (err) {
    console.error("Balance check error:", err);
    res.status(500).json({ success: false, message: "Balance check failed" });
  }
};

