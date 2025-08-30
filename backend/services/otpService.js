import axios from 'axios';
import db from '../config/db.js';

class OTPService {
  constructor() {
    this.msg91AuthKey = process.env.MSG91_AUTH_KEY;
    this.msg91BaseUrl = "https://control.msg91.com/api";
    this.otpTemplateId = process.env.MSG91_OTP_TEMPLATE_ID;
  }

async sendOTP(mobile, otp = null) {
  try {
    const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
    const generatedOTP = otp || Math.floor(100000 + Math.random() * 900000).toString();

    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);
    await db.query(`
      INSERT INTO otp_verifications (mobile, otp, expires_at, attempts, status) 
      VALUES (?, ?, ?, 0, 'pending')
      ON DUPLICATE KEY UPDATE 
      otp = VALUES(otp), 
      expires_at = VALUES(expires_at), 
      attempts = 0, 
      status = 'pending'
    `, [formattedMobile, generatedOTP, expiryTime]);

    const url = `${this.msg91BaseUrl}/v5/otp`;
    const payload = {
      template_id: this.otpTemplateId,
      mobile: formattedMobile,
      otp: generatedOTP,
      otp_expiry: 5
    };

    console.log("Sending OTP:", payload); // 👀 Debug

    const response = await axios.post(url, payload, {
      headers: {
        'Content-Type': 'application/json',
        'authkey': this.msg91AuthKey
      }
    });

    if (response.data.type === 'success') {
      return { success: true, message: 'OTP sent successfully', requestId: response.data.request_id };
    } else {
      throw new Error(response.data.message || 'Failed to send OTP');
    }
  } catch (error) {
    console.error('Send OTP Error:', error.response?.data || error.message);
    return { success: false, message: error.message || 'Failed to send OTP' };
  }
}


  // Verify OTP
  async verifyOTP(mobile, otp) {
    try {
      // Get OTP record
      const [otpRecords] = await db.query(`
        SELECT * FROM otp_verifications 
        WHERE mobile = ? AND status = 'pending' 
        ORDER BY created_at DESC LIMIT 1
      `, [mobile]);

      if (otpRecords.length === 0) {
        return { success: false, message: 'No pending OTP found' };
      }

      const otpRecord = otpRecords[0];
      
      // Check expiry
      if (new Date() > new Date(otpRecord.expires_at)) {
        await db.query(
          'UPDATE otp_verifications SET status = "expired" WHERE id = ?',
          [otpRecord.id]
        );
        return { success: false, message: 'OTP expired' };
      }

      // Check attempts
      if (otpRecord.attempts >= 3) {
        await db.query(
          'UPDATE otp_verifications SET status = "blocked" WHERE id = ?',
          [otpRecord.id]
        );
        return { success: false, message: 'Too many attempts. Please request new OTP' };
      }

      // Increment attempts
      await db.query(
        'UPDATE otp_verifications SET attempts = attempts + 1 WHERE id = ?',
        [otpRecord.id]
      );

      // Verify OTP
      if (otpRecord.otp === otp) {
        await db.query(
          'UPDATE otp_verifications SET status = "verified" WHERE id = ?',
          [otpRecord.id]
        );
        return { success: true, message: 'OTP verified successfully' };
      } else {
        return { success: false, message: 'Invalid OTP' };
      }
    } catch (error) {
      console.error('Verify OTP Error:', error);
      return { success: false, message: 'OTP verification failed' };
    }
  }

  // Resend OTP
  async resendOTP(mobile) {
    try {
      // Check if user can request new OTP (rate limiting)
      const [recentOTP] = await db.query(`
        SELECT * FROM otp_verifications 
        WHERE mobile = ? AND created_at > DATE_SUB(NOW(), INTERVAL 1 MINUTE)
        ORDER BY created_at DESC LIMIT 1
      `, [mobile]);

      if (recentOTP.length > 0) {
        return { 
          success: false, 
          message: 'Please wait 1 minute before requesting new OTP' 
        };
      }

      return await this.sendOTP(mobile);
    } catch (error) {
      console.error('Resend OTP Error:', error);
      return { success: false, message: 'Failed to resend OTP' };
    }
  }
}

export default new OTPService();