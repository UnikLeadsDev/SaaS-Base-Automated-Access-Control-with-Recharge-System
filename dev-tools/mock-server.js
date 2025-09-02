/**
 * ⚠️  DEVELOPMENT ONLY - DO NOT USE IN PRODUCTION ⚠️
 * 
 * This mock server contains:
 * - Hardcoded credentials
 * - No authentication validation
 * - Insecure data storage
 * - Debug endpoints
 * 
 * For development and testing purposes only!
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Secure CORS configuration
const corsOptions = {
  origin: ['http://localhost:3000', 'http://localhost:5173', 'http://127.0.0.1:3000', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With']
};
app.use(cors(corsOptions));
app.use(express.json());

// Enhanced auth middleware for mock server
const requireAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Authorization required' });
  }
  
  const token = authHeader.replace('Bearer ', '');
  // Validate token format (mock validation)
  if (!token || token.length < 10 || !/^[a-zA-Z0-9_-]+$/.test(token)) {
    return res.status(401).json({ message: 'Invalid token format' });
  }
  
  // Set mock user context
  req.user = { id: 1, role: token.includes('admin') ? 'admin' : 'user' };
  next();
};

// Enhanced admin role check for mock server
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

// Mock database
let users = [
  {
    user_id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh@dsa.com',
    phone: '9876543210',
    role: 'DSA',
    balance: 2500,
    status: 'active',
    created_at: '2024-01-15',
    last_login: '2024-01-20'
  },
  {
    user_id: 2,
    name: 'Priya Sharma', 
    email: 'priya@nbfc.com',
    phone: '9876543211',
    role: 'NBFC',
    balance: 15000,
    status: 'active',
    created_at: '2024-01-10',
    last_login: '2024-01-19'
  },
  {
    user_id: 3,
    name: 'Amit Singh',
    email: 'amit@coop.com',
    phone: '9876543212', 
    role: 'Co-op',
    balance: 75,
    status: 'blocked',
    created_at: '2024-01-05',
    last_login: '2024-01-18'
  }
];

let transactions = [];
let nextUserId = 4;
let nextTxnId = 1;
let otpStore = {}; // Store OTPs temporarily

// Admin Stats
app.get('/api/admin/stats', requireAuth, requireAdmin, (req, res) => {
  const stats = {
    totalUsers: users.length,
    totalRevenue: transactions.reduce((sum, t) => sum + (t.amount || 0), 0),
    totalApplications: transactions.length,
    lowBalanceUsers: users.filter(u => u.balance < 100).length,
    monthlyRevenue: 45600,
    activeUsers: users.filter(u => u.status === 'active').length,
    successRate: 94.5,
    avgTransactionValue: 125
  };
  res.json(stats);
});

// Get Users
app.get('/api/admin/users', requireAuth, requireAdmin, (req, res) => {
  res.json({ users });
});

// Update User Status
app.put('/api/admin/users/:id/status', requireAuth, requireAdmin, (req, res) => {
  // Enhanced CSRF protection for mock server
  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken || csrfToken.length < 10 || !/^csrf_[a-zA-Z0-9_-]+$/.test(csrfToken)) {
    return res.status(403).json({ message: 'CSRF token required' });
  }
  
  const userId = parseInt(req.params.id);
  const { status } = req.body;
  
  // Validate input
  if (!userId || isNaN(userId) || !['active', 'blocked'].includes(status)) {
    return res.status(400).json({ message: 'Invalid input parameters' });
  }
  
  const user = users.find(u => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.status = status;
  res.json({ message: `User ${status} successfully`, user });
});

// Delete User
app.delete('/api/admin/users/:id', requireAuth, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// Manual Payment
app.post('/api/admin/manual-payment', requireAuth, requireAdmin, (req, res) => {
  // Enhanced CSRF protection for mock server
  const csrfToken = req.headers['x-csrf-token'];
  if (!csrfToken || csrfToken.length < 10 || !/^csrf_[a-zA-Z0-9_-]+$/.test(csrfToken)) {
    return res.status(403).json({ message: 'CSRF token required' });
  }
  
  const { userId, amount, txnRef, source, reason } = req.body;
  
  const user = users.find(u => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.balance += amount;
  
  const transaction = {
    id: nextTxnId++,
    user_id: userId,
    amount,
    txn_ref: txnRef,
    source,
    reason,
    type: 'credit',
    created_at: new Date().toISOString()
  };
  
  transactions.push(transaction);
  res.json({ message: 'Payment added successfully', transaction });
});

// Reset Password
app.post('/api/admin/users/:id/reset-password', requireAuth, requireAdmin, (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.user_id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ message: 'Password reset email sent successfully' });
});

// Search Transaction
app.get('/api/admin/transaction/:id', requireAuth, requireAdmin, (req, res) => {
  const txnId = req.params.id;
  const transaction = transactions.find(t => t.txn_ref === txnId || t.id.toString() === txnId);
  
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  
  const user = users.find(u => u.user_id === transaction.user_id);
  res.json({
    transaction: {
      ...transaction,
      name: user?.name,
      email: user?.email,
      current_balance: user?.balance
    }
  });
});

// Update Transaction
app.put('/api/admin/transaction/:id', requireAuth, requireAdmin, (req, res) => {
  const txnId = req.params.id;
  const { status, amount, reason } = req.body;
  
  const transaction = transactions.find(t => t.txn_ref === txnId);
  if (!transaction) {
    return res.status(404).json({ message: 'Transaction not found' });
  }
  
  transaction.status = status;
  if (amount) transaction.amount = parseFloat(amount);
  if (reason) transaction.reason = reason;
  
  res.json({ message: 'Transaction updated successfully', transaction });
});

// Send OTP - Rate limited endpoint
app.post('/api/auth/send-otp', (req, res) => {
  const { phone, type } = req.body;
  
  if (!phone || phone.length !== 10) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }
  
  // Generate 6-digit OTP
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  
  // Store OTP with expiry (5 minutes)
  otpStore[phone] = {
    otp,
    type,
    expires: Date.now() + 5 * 60 * 1000,
    verified: false
  };
  
  console.log(`OTP for ${String(phone).replace(/[\r\n\t\x00-\x1f\x7f-\x9f]/g, '')}: ${otp}`);
  res.json({ message: 'OTP sent successfully', phone });
});

// Verify OTP - Authentication required for sensitive operations
app.post('/api/auth/verify-otp', requireAuth, (req, res) => {
  const { phone, otp, type } = req.body;
  
  const storedOtp = otpStore[phone];
  
  if (!storedOtp) {
    return res.status(400).json({ message: 'OTP not found or expired' });
  }
  
  if (storedOtp.expires < Date.now()) {
    otpStore[phone] = undefined;
    delete otpStore[phone];
    return res.status(400).json({ message: 'OTP expired' });
  }
  
  if (storedOtp.otp !== otp || storedOtp.type !== type) {
    return res.status(400).json({ message: 'Invalid OTP' });
  }
  
  storedOtp.verified = true;
  res.json({ message: 'OTP verified successfully' });
});

// Reset Password - Authentication and authorization required
app.post('/api/auth/reset-password', requireAuth, requireAdmin, (req, res) => {
  const { phone, newPassword } = req.body;
  
  const storedOtp = otpStore[phone];
  
  if (!storedOtp || !storedOtp.verified) {
    return res.status(400).json({ message: 'OTP not verified' });
  }
  
  // Find user by phone (assuming phone is stored in user data)
  const user = users.find(u => u.phone === phone || u.email.includes(phone));
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  // In real implementation, hash the password
  user.password = newPassword;
  
  // Clean up OTP
  otpStore[phone] = undefined;
  delete otpStore[phone];
  
  res.json({ message: 'Password reset successfully' });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin endpoints available`);
});