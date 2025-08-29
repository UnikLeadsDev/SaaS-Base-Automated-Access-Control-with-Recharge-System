import cron from 'node-cron';
import db from '../config/db.js';
import notificationService from '../services/notificationService.js';

// Check for low balance and subscription expiry daily at 9 AM
export const startCronJobs = () => {
  cron.schedule('0 9 * * *', async () => {
    console.log('Running daily alerts check...');
    await checkLowBalanceAlerts();
    await checkSubscriptionExpiry();
    await markExpiredSubscriptions();
  });

  // Process notification queue every minute
  cron.schedule('* * * * *', async () => {
    const notificationService = (await import('../services/notificationService.js')).default;
    await notificationService.processQueue();
  });

  console.log('✅ Cron jobs scheduled');
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

const checkSubscriptionExpiry = async () => {
  try {
    // Alert users N days before expiry based on plan settings
    const [users] = await db.query(`
      SELECT u.user_id, u.name, u.mobile, s.end_date, s.plan_name, sp.grace_period_days
      FROM users u 
      JOIN subscriptions s ON u.user_id = s.user_id 
      JOIN subscription_plans sp ON s.plan_id = sp.plan_id
      WHERE s.status = 'active' 
      AND DATEDIFF(s.end_date, CURDATE()) <= sp.grace_period_days
      AND DATEDIFF(s.end_date, CURDATE()) > 0
    `);

    for (const user of users) {
      await notificationService.sendSubscriptionExpiryAlert(
        user.mobile, 
        user.name, 
        user.plan_name, 
        user.end_date
      );
    }

    console.log(`✅ Subscription expiry alerts sent to ${users.length} users`);
  } catch (error) {
    console.error('❌ Subscription expiry alert error:', error);
  }
};

const markExpiredSubscriptions = async () => {
  try {
    // Move expired subscriptions to grace period
    const [expiredResult] = await db.query(`
      UPDATE subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.plan_id
      SET s.status = 'grace', 
          s.grace_end_date = DATE_ADD(s.end_date, INTERVAL sp.grace_period_days DAY)
      WHERE s.status = 'active' 
      AND s.end_date < CURDATE()
    `);

    // Mark grace period as fully expired
    const [graceExpiredResult] = await db.query(`
      UPDATE subscriptions 
      SET status = 'expired'
      WHERE status = 'grace' 
      AND grace_end_date < CURDATE()
    `);

    console.log(`✅ Marked ${expiredResult.affectedRows} subscriptions as grace, ${graceExpiredResult.affectedRows} as expired`);
  } catch (error) {
    console.error('❌ Subscription expiry marking error:', error);
  }
};