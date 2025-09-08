import cron from 'node-cron';
import db from '../config/db.js';
import { processAutoRenewal } from '../controllers/subscriptionController.js';
import notificationService from '../services/notificationService.js';

// Check subscription expiry and send notifications
const checkSubscriptionExpiry = async () => {
  try {
    console.log('Running subscription expiry check...');
    
    // Update expired subscriptions
    await db.query(`
      UPDATE subscriptions 
      SET status = CASE 
        WHEN grace_end_date < CURDATE() THEN 'expired'
        WHEN end_date < CURDATE() AND grace_end_date >= CURDATE() THEN 'grace'
        ELSE status
      END
      WHERE status IN ('active', 'grace')
    `);

    // Get subscriptions expiring soon for notifications
    const [expiringSubscriptions] = await db.query(`
      SELECT s.user_id, s.sub_id, s.plan_name, s.end_date, u.mobile, u.email, u.name,
             up.notification_days_before, up.auto_renewal, up.preferred_plan_id
      FROM subscriptions s
      JOIN users u ON s.user_id = u.user_id
      LEFT JOIN user_preferences up ON s.user_id = up.user_id
      WHERE s.status = 'active' 
      AND DATEDIFF(s.end_date, CURDATE()) <= COALESCE(up.notification_days_before, 7)
      AND DATEDIFF(s.end_date, CURDATE()) >= 0
    `);

    for (const sub of expiringSubscriptions) {
      const daysLeft = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      // Send expiry notification
      if (sub.mobile) {
        await notificationService.sendExpiryAlert(
          sub.mobile, 
          sub.plan_name, 
          daysLeft, 
          sub.user_id
        );
      }

      // Process auto-renewal if enabled and expiring today
      if (sub.auto_renewal && daysLeft <= 1) {
        const renewed = await processAutoRenewal(sub.user_id, sub.preferred_plan_id);
        if (renewed) {
          console.log(`Auto-renewed subscription for user ${sub.user_id}`);
        }
      }
    }

    console.log(`Processed ${expiringSubscriptions.length} expiring subscriptions`);
  } catch (error) {
    console.error('Subscription expiry check error:', error);
  }
};

// Start subscription cron jobs
export const startSubscriptionCron = () => {
  // Run every day at 9 AM
  cron.schedule('0 9 * * *', checkSubscriptionExpiry, {
    scheduled: true,
    timezone: "Asia/Kolkata"
  });

  // Run every hour for grace period checks
  cron.schedule('0 * * * *', async () => {
    try {
      await db.query(`
        UPDATE subscriptions 
        SET status = 'expired'
        WHERE status = 'grace' AND grace_end_date < CURDATE()
      `);
    } catch (error) {
      console.error('Grace period check error:', error);
    }
  });

  console.log('Subscription cron jobs started');
};

export default { startSubscriptionCron, checkSubscriptionExpiry };