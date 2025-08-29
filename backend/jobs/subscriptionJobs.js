import cron from "node-cron";
import db from "../config/db.js";

// Daily job to update subscription statuses and handle renewals
export const startSubscriptionJobs = () => {
  // Run daily at 1 AM to update subscription statuses
  cron.schedule('0 1 * * *', async () => {
    console.log('Running daily subscription status update...');
    await updateSubscriptionStatuses();
    await processRenewalQueue();
    await sendExpiryNotifications();
  });

  // Run every hour to process pending renewals
  cron.schedule('0 * * * *', async () => {
    console.log('Processing subscription renewal queue...');
    await processRenewalQueue();
  });
};

// Update subscription statuses based on current date
const updateSubscriptionStatuses = async () => {
  try {
    const connection = await db.getConnection();
    
    // Move expired subscriptions to expired status
    await connection.query(
      `UPDATE subscriptions 
       SET status = 'expired' 
       WHERE status IN ('active', 'grace') 
       AND grace_end_date < CURDATE()`
    );

    // Move active subscriptions to grace period
    await connection.query(
      `UPDATE subscriptions 
       SET status = 'grace' 
       WHERE status = 'active' 
       AND end_date < CURDATE() 
       AND grace_end_date >= CURDATE()`
    );

    connection.release();
    console.log('Subscription statuses updated successfully');
  } catch (error) {
    console.error('Update Subscription Statuses Error:', error);
  }
};

// Process automatic renewal queue
const processRenewalQueue = async () => {
  try {
    const connection = await db.getConnection();
    
    // Get pending renewals that are due
    const [renewals] = await connection.query(
      `SELECT rq.*, u.email, u.name, sp.plan_name
       FROM subscription_renewal_queue rq
       JOIN users u ON rq.user_id = u.user_id
       JOIN subscription_plans sp ON rq.plan_id = sp.plan_id
       WHERE rq.status = 'pending' 
       AND rq.renewal_date <= CURDATE()
       AND rq.retry_count < rq.max_retries
       ORDER BY rq.created_at ASC
       LIMIT 10`
    );

    for (const renewal of renewals) {
      await processAutoRenewal(connection, renewal);
    }

    connection.release();
    console.log(`Processed ${renewals.length} renewal requests`);
  } catch (error) {
    console.error('Process Renewal Queue Error:', error);
  }
};

// Process individual auto renewal
const processAutoRenewal = async (connection, renewal) => {
  try {
    await connection.beginTransaction();

    // Check user preferences for auto-renewal
    const [preferences] = await connection.query(
      "SELECT auto_renewal FROM user_subscription_preferences WHERE user_id = ?",
      [renewal.user_id]
    );

    if (!preferences[0]?.auto_renewal) {
      // Mark as completed but not renewed
      await connection.query(
        "UPDATE subscription_renewal_queue SET status = 'completed', processed_at = NOW() WHERE queue_id = ?",
        [renewal.queue_id]
      );
      await connection.commit();
      return;
    }

    // Check wallet balance
    const [wallet] = await connection.query(
      "SELECT balance FROM wallets WHERE user_id = ?",
      [renewal.user_id]
    );

    if (wallet[0].balance < renewal.amount) {
      // Insufficient balance - schedule retry
      await connection.query(
        `UPDATE subscription_renewal_queue 
         SET retry_count = retry_count + 1, 
             next_retry_at = DATE_ADD(NOW(), INTERVAL 1 DAY),
             error_message = 'Insufficient wallet balance'
         WHERE queue_id = ?`,
        [renewal.queue_id]
      );
      await connection.commit();
      return;
    }

    // Deduct amount from wallet
    await connection.query(
      "UPDATE wallets SET balance = balance - ? WHERE user_id = ?",
      [renewal.amount, renewal.user_id]
    );

    // Create new subscription
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 30); // Assuming monthly renewal
    
    const graceEndDate = new Date(endDate);
    graceEndDate.setDate(graceEndDate.getDate() + 7);

    await connection.query(
      `INSERT INTO subscriptions (user_id, plan_id, plan_name, amount, start_date, end_date, grace_end_date, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active')`,
      [renewal.user_id, renewal.plan_id, renewal.plan_name, renewal.amount,
       startDate.toISOString().split('T')[0],
       endDate.toISOString().split('T')[0],
       graceEndDate.toISOString().split('T')[0]]
    );

    // Record transaction
    await connection.query(
      "INSERT INTO transactions (user_id, amount, type, txn_ref, payment_mode) VALUES (?, ?, 'debit', ?, 'auto_renewal')",
      [renewal.user_id, renewal.amount, `auto_renewal_${renewal.queue_id}`]
    );

    // Mark renewal as completed
    await connection.query(
      "UPDATE subscription_renewal_queue SET status = 'completed', processed_at = NOW() WHERE queue_id = ?",
      [renewal.queue_id]
    );

    await connection.commit();
    console.log(`Auto-renewed subscription for user ${renewal.user_id}`);

  } catch (error) {
    await connection.rollback();
    
    // Update retry count and error message
    await connection.query(
      `UPDATE subscription_renewal_queue 
       SET retry_count = retry_count + 1, 
           next_retry_at = DATE_ADD(NOW(), INTERVAL 1 HOUR),
           error_message = ?
       WHERE queue_id = ?`,
      [error.message, renewal.queue_id]
    );
    
    console.error(`Auto-renewal failed for user ${renewal.user_id}:`, error);
  }
};

// Send expiry notifications
const sendExpiryNotifications = async () => {
  try {
    // Get subscriptions expiring in notification period
    const [expiringSubscriptions] = await db.query(
      `SELECT s.*, u.email, u.name, u.mobile, usp.notification_days_before
       FROM subscriptions s
       JOIN users u ON s.user_id = u.user_id
       JOIN user_subscription_preferences usp ON s.user_id = usp.user_id
       WHERE s.status = 'active'
       AND DATEDIFF(s.end_date, CURDATE()) <= usp.notification_days_before
       AND DATEDIFF(s.end_date, CURDATE()) > 0`
    );

    for (const subscription of expiringSubscriptions) {
      const daysRemaining = Math.ceil((new Date(subscription.end_date) - new Date()) / (1000 * 60 * 60 * 24));
      
      const message = `Your ${subscription.plan_name} subscription expires in ${daysRemaining} days. Renew now to continue access.`;
      
      // Queue notification
      await db.query(
        `INSERT INTO notification_queue (user_id, channel, message_type, recipient, message)
         VALUES (?, 'sms', 'expiry_alert', ?, ?)`,
        [subscription.user_id, subscription.mobile, message]
      );
    }

    console.log(`Queued ${expiringSubscriptions.length} expiry notifications`);
  } catch (error) {
    console.error('Send Expiry Notifications Error:', error);
  }
};