import db from "../config/db.js";

// Middleware to check subscription access for form submissions
export const checkSubscriptionAccess = (formType) => {
  return async (req, res, next) => {
    try {
      // Check if user has active subscription with access to this form type
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

      // Track usage if access is granted
      await trackFormUsage(req.user.id, formType);
      
      next();
    } catch (error) {
      console.error("Subscription Access Check Error:", error);
      res.status(500).json({ 
        success: false, 
        message: "Access verification failed" 
      });
    }
  };
};

// Track form usage for subscription analytics
const trackFormUsage = async (userId, formType) => {
  try {
    // Get current active subscription
    const [subscriptions] = await db.query(
      `SELECT sub_id FROM subscriptions 
       WHERE user_id = ? AND status IN ('active', 'grace')
       AND (end_date >= CURDATE() OR grace_end_date >= CURDATE())
       ORDER BY end_date DESC LIMIT 1`,
      [userId]
    );

    if (subscriptions.length > 0) {
      const subscriptionId = subscriptions[0].sub_id;
      const today = new Date().toISOString().split('T')[0];

      // Insert or update usage record
      await db.query(
        `INSERT INTO subscription_usage (user_id, subscription_id, form_type, forms_used, usage_date)
         VALUES (?, ?, ?, 1, ?)
         ON DUPLICATE KEY UPDATE forms_used = forms_used + 1`,
        [userId, subscriptionId, formType, today]
      );
    }
  } catch (error) {
    console.error("Track Form Usage Error:", error);
    // Don't fail the request if usage tracking fails
  }
};

// Check if user has any active subscription
export const requireActiveSubscription = async (req, res, next) => {
  try {
    const [subscriptions] = await db.query(
      `SELECT COUNT(*) as count FROM subscriptions 
       WHERE user_id = ? AND status IN ('active', 'grace')
       AND (end_date >= CURDATE() OR grace_end_date >= CURDATE())`,
      [req.user.id]
    );

    if (subscriptions[0].count === 0) {
      return res.status(403).json({
        success: false,
        message: "Active subscription required",
        code: 'NO_ACTIVE_SUBSCRIPTION'
      });
    }

    next();
  } catch (error) {
    console.error("Active Subscription Check Error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Subscription verification failed" 
    });
  }
};