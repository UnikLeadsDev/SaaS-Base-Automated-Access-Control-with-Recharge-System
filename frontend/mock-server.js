import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 5000;

// Enable CORS for all origins
app.use(cors());
app.use(express.json());

// Mock database
let users = [
  {
    user_id: 1,
    name: 'Rajesh Kumar',
    email: 'rajesh@dsa.com',
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

// Admin Stats
app.get('/api/admin/stats', (req, res) => {
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
app.get('/api/admin/users', (req, res) => {
  res.json({ users });
});

// Update User Status
app.put('/api/admin/users/:id/status', (req, res) => {
  const userId = parseInt(req.params.id);
  const { status } = req.body;
  
  const user = users.find(u => u.user_id === userId);
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  user.status = status;
  res.json({ message: `User ${status} successfully`, user });
});

// Delete User
app.delete('/api/admin/users/:id', (req, res) => {
  const userId = parseInt(req.params.id);
  const userIndex = users.findIndex(u => u.user_id === userId);
  
  if (userIndex === -1) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  users.splice(userIndex, 1);
  res.json({ message: 'User deleted successfully' });
});

// Manual Payment
app.post('/api/admin/manual-payment', (req, res) => {
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
app.post('/api/admin/users/:id/reset-password', (req, res) => {
  const userId = parseInt(req.params.id);
  const user = users.find(u => u.user_id === userId);
  
  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }
  
  res.json({ message: 'Password reset email sent successfully' });
});

// Search Transaction
app.get('/api/admin/transaction/:id', (req, res) => {
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
app.put('/api/admin/transaction/:id', (req, res) => {
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

app.listen(PORT, () => {
  console.log(`🚀 Mock API Server running on http://localhost:${PORT}`);
  console.log(`📊 Admin endpoints available`);
});