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
   * High-level notifications
   */
  async sendWelcomeMessage(mobile, name, userId = null) {
    const template = MSG91_TEMPLATES.WELCOME;
    const message = `Welcome ${name}! Your SaaS Base account has been created successfully.`;
    await this.queueNotification(userId, 'sms', 'welcome', mobile, message, template?.SMS);
    if (this.enableWhatsApp) {
      await this.queueNotification(userId, 'whatsapp', 'welcome', mobile, message, template?.WHATSAPP);
    }
  }

  async sendPaymentSuccess(mobile, amount, newBalance, userId = null) {
    const template = MSG91_TEMPLATES.PAYMENT_SUCCESS;
    const message = `Payment of ₹${amount} received. New balance: ₹${newBalance}.`;
    await this.queueNotification(userId, 'sms', 'payment_success', mobile, message, template?.SMS);
  }

  async sendLowBalanceAlert(mobile, currentBalance, userId = null) {
    const template = MSG91_TEMPLATES.LOW_BALANCE;
    const message = `Alert: Wallet balance is ₹${currentBalance}. Please recharge.`;
    await this.queueNotification(userId, 'sms', 'low_balance', mobile, message, template?.SMS);
  }

  async sendSubscriptionExpiryAlert(mobile, name, planName, expiryDate, userId = null) {
    const template = MSG91_TEMPLATES.SUBSCRIPTION_EXPIRY;
    const message = `Hi ${name}, your ${planName} expires on ${expiryDate}. Renew now.`;
    await this.queueNotification(userId, 'sms', 'expiry_alert', mobile, message, template?.SMS);
  }

  async sendFormSubmitted(mobile, formName, userId = null) {
    const template = MSG91_TEMPLATES.FORM_SUBMITTED;
    const message = `Your form "${formName}" has been submitted successfully.`;
    await this.queueNotification(userId, 'sms', 'form_submitted', mobile, message, template?.SMS);
    if (this.enableWhatsApp) {
      await this.queueNotification(userId, 'whatsapp', 'form_submitted', mobile, message, template?.WHATSAPP);
    }
  }
}

export default new NotificationService();
