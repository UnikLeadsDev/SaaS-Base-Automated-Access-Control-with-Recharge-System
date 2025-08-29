import cron from 'node-cron';
import db from '../config/db.js';
import notificationService from '../services/notificationService.js';

// Check for low balance and subscription expiry daily at 9 AM
export const startCronJobs = () => {
  // Daily maintenance at 1 AM
  cron.schedule('0 1 * * *', async () => {
    console.log('Running daily maintenance...');
    await checkLowBalanceAlerts();
    await updateSubscriptionStatuses();
    await sendExpiryNotifications();
  });

  // Process notification queue every minute
  cron.schedule('* * * * *', async () => {
    const notificationService = (await import('../services/notificationService.js')).default;
    await notificationService.processQueue();
  });

  console.log('✅ Optimized cron jobs scheduled');
};

const checkLowBalanceAlerts = async () => {
  try {
    const threshold = process.env.LOW_BALANCE_THRESHOLD || 100;
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.mobile, w.balance 
      FROM users u 
      JOIN wallets w ON u.user_id = w.user_id 
      WHERE w.balance < ? AND u.status = 'active'
    `, [threshold]);

    for (const user of users) {
      await notificationService.sendLowBalanceAlert(user.mobile, user.name, user.balance);
    }

    console.log(`✅ Low balance alerts sent to ${users.length} users`);
  } catch (error) {
    console.error('❌ Low balance alert error:', error);
  }
};

// Update subscription statuses
const updateSubscriptionStatuses = async () => {
  try {
    // Update expired subscriptions
    await db.query(
      `UPDATE subscriptions 
       SET status = 'expired' 
       WHERE status IN ('active', 'grace') 
       AND grace_end_date < CURDATE()`
    );

    // Update to grace period
    await db.query(
      `UPDATE subscriptions 
       SET status = 'grace' 
       WHERE status = 'active' 
       AND end_date < CURDATE() 
       AND grace_end_date >= CURDATE()`
    );

    console.log('✅ Subscription statuses updated');
  } catch (error) {
    console.error('❌ Status update error:', error);
  }
};

// Send expiry notifications
const sendExpiryNotifications = async () => {
  try {
    const [expiringSubscriptions] = await db.query(
      `SELECT s.user_id, u.mobile, u.name, sp.plan_name, s.end_date, up.notification_days_before
       FROM subscriptions s
       JOIN users u ON s.user_id = u.user_id
       JOIN subscription_plans sp ON s.plan_id = sp.plan_id
       JOIN user_preferences up ON s.user_id = up.user_id
       WHERE s.status = 'active'
       AND DATEDIFF(s.end_date, CURDATE()) <= up.notification_days_before
       AND DATEDIFF(s.end_date, CURDATE()) > 0`
    );

    for (const sub of expiringSubscriptions) {
      const daysRemaining = Math.ceil((new Date(sub.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      const message = `Your ${sub.plan_name} expires in ${daysRemaining} days. Renew now to continue access.`;
      
      await db.query(
        `INSERT INTO notification_queue (user_id, channel, message_type, recipient, message)
         VALUES (?, 'sms', 'expiry_alert', ?, ?)`,
        [sub.user_id, sub.mobile, message]
      );
    }

    console.log(`✅ Queued ${expiringSubscriptions.length} expiry notifications`);
  } catch (error) {
    console.error('❌ Notification error:', error);
  }
};