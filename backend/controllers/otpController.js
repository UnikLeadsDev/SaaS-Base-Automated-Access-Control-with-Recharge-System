import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import otpService from '../services/otpService.js';
import crypto from 'crypto';

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
    // Check if user exists with this mobile number
    const [user] = await db.query(
      'SELECT user_id, name, email, role, status FROM users WHERE mobile = ? AND status = "active"',
      [mobile]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active account found with this mobile number'
      });
    }

    // Send OTP using the service
    const result = await otpService.sendOTP(mobile);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'OTP sent successfully',
        mobile: mobile.replace(/(\d{6})(\d{4})/, '******$2')
      });
    } else {
      res.status(400).json({
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
    // Verify OTP using the service
    const otpResult = await otpService.verifyOTP(mobile, otp);
    
    if (!otpResult.success) {
      return res.status(400).json({
        success: false,
        message: otpResult.message
      });
    }

    // Get user details
    const [user] = await db.query(
      'SELECT user_id, name, email, mobile, role, status FROM users WHERE mobile = ? AND status = "active"',
      [mobile]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const userData = user[0];

    // Update last login
    await db.query('UPDATE users SET last_login = NOW() WHERE user_id = ?', [userData.user_id]);

    // Generate JWT token
    const token = jwt.sign(
      { 
        id: userData.user_id, 
        email: userData.email, 
        role: userData.role 
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Generate session token
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // Log login history and create session
    try {
      const userAgent = req.headers['user-agent'] || 'Unknown';
      const ipAddress = req.ip || req.connection.remoteAddress || 'Unknown';

      await db.query(
        'INSERT INTO login_history (user_id, ip_address, browser, login_method) VALUES (?, ?, ?, ?)',
        [userData.user_id, ipAddress, userAgent, 'otp']
      );

      await db.query(
        'INSERT INTO user_sessions (user_id, session_token, ip_address, browser, expires_at) VALUES (?, ?, ?, ?, ?)',
        [userData.user_id, sessionToken, ipAddress, userAgent, expiresAt]
      );
    } catch (e) {
      console.warn('Failed to log session:', e.message);
    }

    // Get wallet info
    const [wallet] = await db.query(
      'SELECT balance, status FROM wallets WHERE user_id = ?',
      [userData.user_id]
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      sessionToken,
      user: {
        id: userData.user_id,
        name: userData.name,
        email: userData.email,
        mobile: userData.mobile,
        role: userData.role,
        walletBalance: wallet[0]?.balance || 0,
        walletStatus: wallet[0]?.status || 'active'
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

  if (!mobile || !/^[6-9]\d{9}$/.test(mobile)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Valid mobile number required' 
    });
  }

  try {
    // Check if user exists
    const [user] = await db.query(
      'SELECT user_id FROM users WHERE mobile = ? AND status = "active"',
      [mobile]
    );

    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No active account found with this mobile number'
      });
    }

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