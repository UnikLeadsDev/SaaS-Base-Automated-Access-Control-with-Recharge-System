import axios from 'axios';
import db from '../config/db.js';
import { MSG91_TEMPLATES } from '../templates/msg91-templates.js';

class NotificationService {
  constructor() {
    this.msg91AuthKey = process.env.MSG91_AUTH_KEY;
    this.msg91BaseUrl = "https://control.msg91.com/api";
    this.enableSMS = process.env.ENABLE_SMS !== 'false';
    this.enableWhatsApp = process.env.ENABLE_WHATSAPP === 'true';
    this.enableEmail = process.env.ENABLE_EMAIL === 'true';
  }

  /**
   * Queue notification for reliable delivery
   * userId can be null if not applicable
   */
async queueNotification(userId, channel, messageType, recipient, message, templateId = null) {
  try {
    // Only check userId if it’s provided
    if (userId) {
      const [rows] = await db.query('SELECT user_id FROM users WHERE user_id = ?', [userId]);
      if (rows.length === 0) {
        console.warn(`User ${userId} not found. Notification skipped.`);
        return; // Skip inserting to avoid foreign key error
      }
    }

    // Insert into notification_queue
    await db.query(`
      INSERT INTO notification_queue 
      (user_id, channel, message_type, recipient, message, template_id, status) 
      VALUES (?, ?, ?, ?, ?, ?, 'pending')
    `, [userId || null, channel, messageType, recipient, message, templateId]);

    // Trigger queue processing asynchronously
    this.processQueue();

  } catch (error) {
    console.error('Queue notification error:', error);
  }
}


  /**
   * Process pending notifications
   */
  async processQueue() {
    try {
      const [pending] = await db.query(`
        SELECT * FROM notification_queue 
        WHERE status = 'pending' 
        OR (status = 'failed' AND retry_count < max_retries AND next_retry_at <= NOW())
        ORDER BY created_at ASC LIMIT 10
      `);

      for (const notification of pending) {
        await this.processNotification(notification);
      }
    } catch (error) {
      console.error('Process queue error:', error);
    }
  }

  /**
   * Process a single notification
   */
  async processNotification(notification) {
    try {
      await db.query('UPDATE notification_queue SET status = "processing" WHERE queue_id = ?', [notification.queue_id]);

      let result;
      switch (notification.channel) {
        case 'sms':
          result = await this.sendSMSDirect(notification.recipient, notification.message, notification.template_id);
          break;
        case 'whatsapp':
          result = await this.sendWhatsAppDirect(notification.recipient, notification.message, notification.template_id);
          break;
        case 'email':
          result = await this.sendEmailDirect(notification.recipient, notification.message);
          break;
        default:
          throw new Error(`Unsupported channel: ${notification.channel}`);
      }

      if (result.success) {
        await db.query('UPDATE notification_queue SET status = "sent", sent_at = NOW() WHERE queue_id = ?', [notification.queue_id]);
        await this.logNotification(notification.user_id, notification.channel, notification.message_type, notification.message, 'sent');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      const retryCount = (notification.retry_count || 0) + 1;
      const nextRetry = new Date(Date.now() + Math.pow(2, retryCount) * 60000); // exponential backoff

      await db.query(`
        UPDATE notification_queue 
        SET status = 'failed', retry_count = ?, next_retry_at = ?, error_message = ?
        WHERE queue_id = ?
      `, [retryCount, nextRetry, error.message, notification.queue_id]);

      await this.logNotification(notification.user_id, notification.channel, notification.message_type, notification.message, 'failed');
    }
  }

  /**
   * Send SMS directly via MSG91
   */
  async sendSMSDirect(mobile, message, templateId = null) {
    if (!this.enableSMS) return { success: true, message: 'SMS disabled' };

    try {
      const url = `${this.msg91BaseUrl}/sendhttp.php`;
      const params = {
        authkey: this.msg91AuthKey,
        mobiles: mobile,
        message: message,
        sender: "SAASBS",
        route: "4",
        country: "91"
      };

      if (templateId) params.DLT_TE_ID = templateId;

      const response = await axios.get(url, { params });
      return { success: true, response: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send WhatsApp message via MSG91
   */
  async sendWhatsAppDirect(mobile, message, templateId = null) {
    if (!this.enableWhatsApp) return { success: true, message: 'WhatsApp disabled' };

    try {
      const url = `${this.msg91BaseUrl}/v5/whatsapp/whatsapp-outbound-message/`;
      const payload = {
        integrated_number: process.env.MSG91_WHATSAPP_NUMBER,
        content_type: "template",
        payload: {
          to: mobile,
          type: "template",
          template: {
            name: templateId || "default_template",
            language: { code: "en" },
            components: [{ type: "body", parameters: [{ type: "text", text: message }] }]
          }
        }
      };

      const response = await axios.post(url, payload, {
        headers: { 'authkey': this.msg91AuthKey, 'Content-Type': 'application/json' }
      });

      return { success: true, response: response.data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Send Email (mock or real implementation)
   */
  async sendEmailDirect(email, message) {
    if (!this.enableEmail) return { success: true, message: 'Email disabled' };

    console.log(`Email to ${email}: ${message}`);
    return { success: true, message: 'Email sent (mock)' };
  }

  /**
   * Log notification to notifications table
   */
  async logNotification(userId, channel, messageType, message, status) {
    try {
      await db.query(
        "INSERT INTO notifications (user_id, channel, message_type, message, status) VALUES (?, ?, ?, ?, ?)",
        [userId || null, channel, messageType, message, status]
      );
    } catch (error) {
      console.error("Notification Log Error:", error);
    }
  }

  /**
   * Generic notification sender
   */
  async sendNotification(type, mobile, data, userId = null) {
    const templates = {
      welcome: { template: MSG91_TEMPLATES.WELCOME, message: `Welcome ${data.name}! Your SaaS Base account has been created successfully.` },
      payment_success: { template: MSG91_TEMPLATES.PAYMENT_SUCCESS, message: `Payment of ₹${data.amount} received${data.newBalance ? `. New balance: ₹${data.newBalance}` : ''}.` },
      low_balance: { template: MSG91_TEMPLATES.LOW_BALANCE, message: `Alert: Wallet balance is ₹${data.balance}. Please recharge.` },
      expiry_alert: { template: MSG91_TEMPLATES.SUBSCRIPTION_EXPIRY, message: `Hi ${data.name}, your ${data.planName} expires on ${data.expiryDate}. Renew now.` },
      form_submitted: { template: MSG91_TEMPLATES.FORM_SUBMITTED, message: `Your form "${data.formName}" has been submitted successfully.` }
    };

    const config = templates[type];
    if (!config) return;

    await this.queueNotification(userId, 'sms', type, mobile, config.message, config.template?.SMS);
    if (this.enableWhatsApp && ['welcome', 'form_submitted'].includes(type)) {
      await this.queueNotification(userId, 'whatsapp', type, mobile, config.message, config.template?.WHATSAPP);
    }
  }

  // Convenience methods
  async sendWelcomeMessage(mobile, name, userId = null) {
    return this.sendNotification('welcome', mobile, { name }, userId);
  }

  async sendPaymentSuccess(mobile, amount, newBalance, userId = null) {
    return this.sendNotification('payment_success', mobile, { amount, newBalance }, userId);
  }

  async sendLowBalanceAlert(mobile, currentBalance, userId = null) {
    return this.sendNotification('low_balance', mobile, { balance: currentBalance }, userId);
  }

  async sendSubscriptionExpiryAlert(mobile, name, planName, expiryDate, userId = null) {
    return this.sendNotification('expiry_alert', mobile, { name, planName, expiryDate }, userId);
  }

  // Real-time subscription expiry notifications
  async sendRealTimeExpiryAlert(userId, daysRemaining) {
    try {
      const [users] = await db.query(
        "SELECT u.name, u.mobile, s.plan_name FROM users u JOIN subscriptions s ON u.user_id = s.user_id WHERE u.user_id = ? AND s.status = 'active'",
        [userId]
      );
      
      if (users.length > 0) {
        const user = users[0];
        const message = `Urgent: Your ${user.plan_name} expires in ${daysRemaining} day(s). Renew now to avoid service interruption.`;
        
        await this.queueNotification(userId, 'sms', 'urgent_expiry', user.mobile, message);
        
        if (this.enableWhatsApp) {
          await this.queueNotification(userId, 'whatsapp', 'urgent_expiry', user.mobile, message);
        }
      }
    } catch (error) {
      console.error('Real-time expiry alert error:', error);
    }
  }

  // Batch process expiry notifications
  async processExpiryNotifications() {
    try {
      const [expiringSubscriptions] = await db.query(`
        SELECT s.user_id, u.mobile, u.name, s.plan_name, s.end_date,
               DATEDIFF(s.end_date, CURDATE()) as days_remaining
        FROM subscriptions s
        JOIN users u ON s.user_id = u.user_id
        WHERE s.status = 'active'
        AND DATEDIFF(s.end_date, CURDATE()) IN (7, 3, 1)
        AND u.mobile IS NOT NULL
      `);

      for (const sub of expiringSubscriptions) {
        await this.sendRealTimeExpiryAlert(sub.user_id, sub.days_remaining);
      }

      console.log(`Processed ${expiringSubscriptions.length} expiry notifications`);
    } catch (error) {
      console.error('Batch expiry notification error:', error);
    }
  }

  async sendFormSubmitted(mobile, formName, userId = null) {
    return this.sendNotification('form_submitted', mobile, { formName }, userId);
  }
}

export default new NotificationService();
