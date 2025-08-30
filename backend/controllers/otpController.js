import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import otpService from '../services/otpService.js';
import notificationService from '../services/notificationService.js';

// Send OTP for login
export const sendLoginOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid 10-digit mobile number required' 
    });
  }

  try {
    const testOTP = '123456';
    
    // Store OTP in database
    const expiryTime = new Date(Date.now() + 5 * 60 * 1000);
    await db.query(
      'DELETE FROM otp_verifications WHERE mobile = ? AND status = "pending"',
      [mobile]
    );
    await db.query(
      'INSERT INTO otp_verifications (mobile, otp, expires_at, attempts, status) VALUES (?, ?, ?, 0, "pending")',
      [mobile, testOTP, expiryTime]
    );
    
    console.log(`OTP for ${mobile}: ${testOTP}`);
    
    res.json({ 
      success: true, 
      message: 'OTP sent successfully (Use: 123456)',
      mobile: mobile.replace(/(\d{6})(\d{4})/, '******$2')
    });
  } catch (error) {
    console.error('Send Login OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    });
  }
};

// Verify OTP and login
export const verifyLoginOTP = async (req, res) => {
  const { mobile, otp } = req.body;

  if (!mobile || !otp) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mobile number and OTP required' 
    });
  }

  try {
    // For testing - accept any OTP
    if (otp === '123456') {
      // Generate test JWT token
      const token = jwt.sign(
        { 
          id: 1, 
          email: 'test@example.com', 
          role: 'DSA',
          mobile: mobile 
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      res.json({
        success: true,
        message: 'Login successful',
        token,
        user: {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          mobile: mobile,
          role: 'DSA'
        }
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP' 
      });
    }
  } catch (error) {
    console.error('Verify Login OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'OTP verification failed' 
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  const { mobile } = req.body;

  if (!mobile) {
    return res.status(400).json({ 
      success: false, 
      message: 'Mobile number required' 
    });
  }

  try {
    const result = await otpService.resendOTP(mobile);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'OTP resent successfully' 
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: result.message 
      });
    }
  } catch (error) {
    console.error('Resend OTP Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
};