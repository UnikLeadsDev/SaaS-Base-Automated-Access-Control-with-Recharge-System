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