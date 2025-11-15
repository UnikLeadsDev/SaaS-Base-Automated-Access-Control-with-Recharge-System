import db from "../config/db.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import notificationService from "../services/notificationService.js";
import crypto from "crypto";
import nodemailer from "nodemailer";

const otpStore = new Map();

// Register Controller
export const registerUser = async (req, res) => {
  const { name, email, mobile, role, password } = req.body;

  if (!name || !email || !role || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if email exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    console.log(existingUser)
    console.log(existingUser.length)
    if (existingUser.length > 0) {
      return res.status(400).json({ message: "Email already exists" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user
    await db.query(
      "INSERT INTO users (name, email, mobile, role, status, password) VALUES (?, ?, ?, ?, 'active', ?)",
      [name, email, mobile, role, hashedPassword]
    );

    // Send welcome SMS
    if (mobile) {
      await notificationService.sendWelcomeMessage(mobile, name);
    }

    res.status(201).json({ message: "User registered successfully" });

  } catch (error) {
    console.error("Register Error:", error.code || 'REGISTRATION_ERROR');
    console.error("Stack:", error.name || 'UNKNOWN_ERROR');
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Login Controller
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Check if user exists and is active
    const [user] = await db.query(
      "SELECT * FROM users WHERE email = ? AND status = 'active'",
      [email]
    );
    if (user.length === 0) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Validate password
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(400).json({ message: "Invalid email or password" });
    }

    // Update last login
    await db.query("UPDATE users SET last_login = NOW() WHERE user_id = ?", [
      user[0].user_id,
    ]);

    // ✅ Generate JWT token
    const token = jwt.sign(
      { id: user[0].user_id, email: user[0].email, role: user[0].role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // ✅ Generate a random unique session token
    const sessionToken = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Log login history and create session
    try {
      const userAgent = req.headers["user-agent"] || "Unknown";
      const ipAddress = req.ip || req.connection.remoteAddress || "Unknown";

      await db.query(
        "INSERT INTO login_history (user_id, ip_address, browser, login_method) VALUES (?, ?, ?, ?)",
        [user[0].user_id, ipAddress, userAgent, "email"]
      );

      await db.query(
        "INSERT INTO user_sessions (user_id, session_token, ip_address, browser, expires_at) VALUES (?, ?, ?, ?, ?)",
        [user[0].user_id, sessionToken, ipAddress, userAgent, expiresAt]
      );
    } catch (e) {
      console.warn("Failed to log session:", e.message);
    }

    // Get wallet info
    const [wallet] = await db.query(
      "SELECT balance, status FROM wallets WHERE user_id = ?",
      [user[0].user_id]
    );

    res.json({
      success: true,
      message: "Login successful",
      token, // JWT for client auth
      sessionToken, // session token stored in DB
      user: {
        id: user[0].user_id,
        name: user[0].name,
        email: user[0].email,
        role: user[0].role,
        walletBalance: wallet[0]?.balance || 0,
        walletStatus: wallet[0]?.status || "active",
      },
    });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};



// Google OAuth Login
export const googleLogin = async (req, res) => {
  const { email, name } = req.body;

  if (!email || !name) {
    return res.status(400).json({ message: "Email and name are required" });
  }

  try {
    // Check if user exists with this email
    const [existingUser] = await db.query(
      "SELECT * FROM users WHERE email = ? AND status = 'active'",
      [email]
    );

    let user;
    if (existingUser.length > 0) {
      // User exists, log them in
      user = existingUser[0];
      
      // Update last login
      await db.query(
        "UPDATE users SET updated_at = NOW() WHERE user_id = ?",
        [user.user_id]
      );
    } else {
      // Create new user with empty password for Google OAuth
      const result = await db.query(
        "INSERT INTO users (name, email, role, status, password) VALUES (?, ?, 'DSA', 'active', '')",
        [name, email]
      );
      
      const [newUser] = await db.query(
        "SELECT * FROM users WHERE user_id = ?",
        [result[0].insertId]
      );
      user = newUser[0];
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user.user_id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "24h" }
    );

    // Get wallet info
    const [wallet] = await db.query(
      "SELECT balance, status FROM wallets WHERE user_id = ?",
      [user.user_id]
    );

    res.json({
      success: true,
      message: "Google login successful",
      token,
      user: {
        id: user.user_id,
        name: user.name,
        email: user.email,
        role: user.role,
        walletBalance: wallet[0]?.balance || 0,
        walletStatus: wallet[0]?.status || "active",
      },
    });
  } catch (error) {
    console.error("Google Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user profile
export const getUserProfile = async (req, res) => {
  try {
    const [user] = await db.query(
      "SELECT u.user_id, u.name, u.email, u.mobile, u.role, u.status, w.balance, w.valid_until FROM users u LEFT JOIN wallets w ON u.user_id = w.user_id WHERE u.user_id = ?",
      [req.user.id]
    );

    if (user.length === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user[0]);
  } catch (error) {
    console.error("Get Profile Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const sendForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Check if user exists
    const [user] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (user.length === 0) {
      return res.status(404).json({ message: "No account found with this email" });
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // Set expiry time (5 minutes from now)
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    // Delete old OTPs for this email
    await db.query("DELETE FROM password_reset_otps WHERE email = ?", [email]);

    // Insert new OTP
    await db.query(
      "INSERT INTO password_reset_otps (email, otp, expires_at) VALUES (?, ?, ?)",
      [email, otp, expiresAt]
    );

    // ✅ Configure mail transport using .env variables
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email content
    const mailOptions = {
      from: `"SaaS Base" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset OTP - SaaS Base",
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Password Reset Verification</h2>
          <p>Dear user,</p>
          <p>Your One-Time Password (OTP) for resetting your password is:</p>
          <h1 style="color: #007BFF; letter-spacing: 4px;">${otp}</h1>
          <p>This OTP will expire in <b>5 minutes</b>.</p>
          <p>If you did not request this, please ignore this email.</p>
          <hr />
          <p style="font-size: 12px; color: #888;">This is an automated message. Please do not reply.</p>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.json({ message: "OTP sent to email successfully" });
  } catch (err) {
    console.error("Error in sendForgotPasswordOTP:", err);
    res.status(500).json({ message: "Error sending OTP", error: err.message });
  }
};

export const verifyForgotPasswordOTP = async (req, res) => {
  console.log("Verifying OTP with data:", req.body);
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      return res.status(400).json({ message: "Email and OTP are required" });
    }

    const [rows] = await db.query(
      "SELECT otp, expires_at FROM password_reset_otps WHERE email = ? ORDER BY id DESC LIMIT 1",
      [email]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: "No OTP found for this email" });
    }

    const storedOtp = rows[0].otp;
    const expiresAt = new Date(rows[0].expires_at);

    if (storedOtp.toString() !== otp.toString()) {
      return res.status(400).json({ message: "Invalid OTP" });
    }

    if (expiresAt < new Date()) {
      return res.status(400).json({ message: "OTP has expired" });
    }

    await db.query("DELETE FROM password_reset_otps WHERE email = ?", [email]);

    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    console.error("Error verifying OTP:", err);
    res.status(500).json({ message: "Error verifying OTP", error: err.message });
  }
};



// Function to reset password
export const resetPassword = async (req, res) => {
  try {
    const { email, newPassword } = req.body;
    console.log("Resetting password for:", email);
    console.log("New password received.",newPassword);

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await db.query("UPDATE users SET password = ? WHERE email = ?", [hashedPassword, email]);

    // Remove OTP after successful reset
    await db.query("DELETE FROM password_reset_otps WHERE email = ?", [email]);

    res.json({ message: "Password reset successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error resetting password" });
  }
};