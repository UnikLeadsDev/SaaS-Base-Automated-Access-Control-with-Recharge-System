import axios from 'axios';
import db from '../config/db.js';

class OTPService {
  constructor() {
    this.msg91AuthKey = process.env.MSG91_AUTH_KEY;
    this.msg91BaseUrl = "https://control.msg91.com/api";
    this.otpTemplateId = process.env.MSG91_OTP_TEMPLATE_ID;
    this.senderId = process.env.MSG91_SENDER_ID || 'UNIKLD';
  }

  // Send OTP via MSG91
  async sendOTP(mobile, otp = null) {
    try {
      // Generate 6-digit OTP if not provided
      const generatedOTP = otp || Math.floor(100000 + Math.random() * 900000).toString();
      
      // Store OTP in database with expiry
      const expiryTime = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes
      // Clear any existing pending OTPs for this mobile
      await db.query(
        'DELETE FROM otp_verifications WHERE mobile = ? AND status = "pending"',
        [mobile]
      );
      
      // Insert new OTP
      await db.query(
        'INSERT INTO otp_verifications (mobile, otp, expires_at, attempts, status) VALUES (?, ?, ?, 0, "pending")',
        [mobile, generatedOTP, expiryTime]
      );

      // For development, skip actual SMS sending
      if (process.env.NODE_ENV === 'development') {
        console.log(`Development Mode - OTP for ${mobile}: ${generatedOTP}`);
        return { 
          success: true, 
          message: 'OTP sent successfully (Development Mode)',
          otp: generatedOTP // Only in development
        };
      }

      // Send OTP via MSG91 in production using DLT template
      const formattedMobile = mobile.startsWith('91') ? mobile : `91${mobile}`;
      const url = `https://control.msg91.com/api/v5/flow/`;
      
      const payload = {
        template_id: this.otpTemplateId,
        sender: this.senderId,
        short_url: "0",
        mobiles: formattedMobile,
        var1: generatedOTP
      };
      
      console.log('MSG91 Request URL:', url);
      console.log('MSG91 Request Payload:', JSON.stringify(payload, null, 2));
      console.log('MSG91 Auth Key:', this.msg91AuthKey ? 'Present' : 'Missing');
      console.log('Sending OTP to:', formattedMobile, 'OTP:', generatedOTP);
      
      const response = await axios.post(url, payload, {
        headers: {
          'authkey': this.msg91AuthKey,
          'Content-Type': 'application/json'
        }
      });

      console.log('MSG91 API Response Status:', response.status);
      console.log('MSG91 API Response Data:', JSON.stringify(response.data, null, 2));
      console.log('MSG91 API Response Headers:', response.headers);
      
      if (response.status === 200 && response.data) {
        return { 
          success: true, 
          message: 'OTP sent successfully via MSG91',
          requestId: response.data.request_id || response.data.data?.request_id
        };
      } else {
        throw new Error(JSON.stringify(response.data) || 'Failed to send OTP');
      }
    } catch (error) {
      console.error('Send OTP Error Details:', {
        message: error.message,
        code: error.code,
        errno: error.errno,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage,
        stack: error.stack
      });
      return { 
        success: false, 
        message: error.message || 'Failed to send OTP' 
      };
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