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
    // Check if user exists
    const [users] = await db.query(
      'SELECT user_id, name, status FROM users WHERE mobile = ?',
      [mobile]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Mobile number not registered' 
      });
    }

    const user = users[0];
    
    if (user.status !== 'active') {
      return res.status(403).json({ 
        success: false, 
        message: 'Account is blocked. Contact support.' 
      });
    }

    // Send OTP
    const result = await otpService.sendOTP(mobile);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        mobile: mobile.replace(/(\d{6})(\d{4})/, '******$2') // Mask mobile
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: result.message 
      });
    }
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
    // Verify OTP
    const otpResult = await otpService.verifyOTP(mobile, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({ 
        success: false, 
        message: otpResult.message 
      });
    }

    // Get user details
    const [users] = await db.query(
      'SELECT user_id, name, email, mobile, role, status FROM users WHERE mobile = ?',
      [mobile]
    );

    if (users.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }

    const user = users[0];

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: user.user_id, 
        email: user.email, 
        role: user.role,
        mobile: user.mobile 
      },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: user.role
      }
    });
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