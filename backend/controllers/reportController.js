import db from '../config/db.js';

// Daily credits/debits report
export const getDailyTransactionReport = async (req, res) => {
  try {
    const { date = new Date().toISOString().split('T')[0] } = req.query;

    const [report] = await db.query(`
      SELECT 
        DATE(created_at) as date,
        SUM(CASE WHEN type = 'credit' THEN amount ELSE 0 END) as total_credits,
        SUM(CASE WHEN type = 'debit' THEN amount ELSE 0 END) as total_debits,
        COUNT(CASE WHEN type = 'credit' THEN 1 END) as credit_count,
        COUNT(CASE WHEN type = 'debit' THEN 1 END) as debit_count,
        COUNT(*) as total_transactions
      FROM transactions 
      WHERE DATE(created_at) = ?
      GROUP BY DATE(created_at)
    `, [date]);

    res.json({
      date,
      report: report[0] || {
        date,
        total_credits: 0,
        total_debits: 0,
        credit_count: 0,
        debit_count: 0,
        total_transactions: 0
      }
    });
  } catch (error) {
    console.error('Daily report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Monthly Recurring Revenue (MRR) from subscriptions
export const getMRRReport = async (req, res) => {
  try {
    const [mrr] = await db.query(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        SUM(CASE 
          WHEN plan_name LIKE '%Monthly%' THEN amount 
          WHEN plan_name LIKE '%Yearly%' THEN amount/12 
          ELSE amount 
        END) as mrr,
        COUNT(*) as new_subscriptions,
        SUM(amount) as total_revenue
      FROM subscriptions 
      WHERE status IN ('active', 'grace')
      AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m')
      ORDER BY month DESC
    `);

    // Current active MRR
    const [currentMRR] = await db.query(`
      SELECT 
        SUM(CASE 
          WHEN sp.duration_days <= 31 THEN sp.amount 
          ELSE sp.amount / (sp.duration_days / 30)
        END) as current_mrr,
        COUNT(*) as active_subscriptions
      FROM subscriptions s
      JOIN subscription_plans sp ON s.plan_id = sp.plan_id
      WHERE s.status IN ('active', 'grace')
    `);

    res.json({
      currentMRR: currentMRR[0]?.current_mrr || 0,
      activeSubscriptions: currentMRR[0]?.active_subscriptions || 0,
      monthlyTrend: mrr
    });
  } catch (error) {
    console.error('MRR report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Outstanding balances by role
export const getOutstandingBalancesByRole = async (req, res) => {
  try {
    const [balances] = await db.query(`
      SELECT 
        u.role,
        COUNT(*) as user_count,
        SUM(w.balance) as total_balance,
        AVG(w.balance) as avg_balance,
        MIN(w.balance) as min_balance,
        MAX(w.balance) as max_balance,
        COUNT(CASE WHEN w.balance = 0 THEN 1 END) as zero_balance_count,
        COUNT(CASE WHEN w.balance < 100 THEN 1 END) as low_balance_count
      FROM users u
      JOIN wallets w ON u.user_id = w.user_id
      WHERE u.status = 'active'
      GROUP BY u.role
      ORDER BY total_balance DESC
    `);

    res.json({ balancesByRole: balances });
  } catch (error) {
    console.error('Outstanding balances report error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enhanced transaction history with pagination and filters
export const getTransactionHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type,
      payment_mode,
      start_date,
      end_date,
      user_id
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    // Non-admin users can only see their own transactions
    if (req.user.role !== 'admin') {
      whereClause += ' AND t.user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      whereClause += ' AND t.user_id = ?';
      params.push(user_id);
    }

    // Build filters
    if (type) {
      whereClause += ' AND type = ?';
      params.push(type);
    }
    if (payment_mode) {
      whereClause += ' AND payment_mode = ?';
      params.push(payment_mode);
    }
    if (start_date) {
      whereClause += ' AND DATE(t.created_at) >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND DATE(t.created_at) <= ?';
      params.push(end_date);
    }

    // Select fields based on role (limit PII for non-admin)
    const selectFields = req.user.role === 'admin' 
      ? 't.*, u.name, u.role'
      : 't.txn_id, t.amount, t.type, t.payment_mode, t.created_at';

    const [transactions] = await db.query(`
      SELECT ${selectFields}
      FROM transactions t
      ${req.user.role === 'admin' ? 'JOIN users u ON t.user_id = u.user_id' : ''}
      WHERE ${whereClause}
      ORDER BY t.created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total
      FROM transactions t
      WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Transaction history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Enhanced receipts with pagination and filters
export const getReceiptHistory = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      payment_mode,
      status,
      start_date,
      end_date,
      user_id
    } = req.query;

    const offset = (page - 1) * limit;
    let whereClause = '1=1';
    const params = [];

    // Non-admin users can only see their own receipts
    if (req.user.role !== 'admin') {
      whereClause += ' AND user_id = ?';
      params.push(req.user.id);
    } else if (user_id) {
      whereClause += ' AND user_id = ?';
      params.push(user_id);
    }

    // Build filters
    if (payment_mode) {
      whereClause += ' AND payment_mode = ?';
      params.push(payment_mode);
    }
    if (status) {
      whereClause += ' AND status = ?';
      params.push(status);
    }
    if (start_date) {
      whereClause += ' AND receipt_date >= ?';
      params.push(start_date);
    }
    if (end_date) {
      whereClause += ' AND receipt_date <= ?';
      params.push(end_date);
    }

    // Select fields based on role (limit PII for non-admin)
    const selectFields = req.user.role === 'admin' 
      ? '*'
      : 'receipt_id, txn_id, amount, payment_mode, status, receipt_date, created_at';

    const [receipts] = await db.query(`
      SELECT ${selectFields} FROM receipts
      WHERE ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), parseInt(offset)]);

    const [countResult] = await db.query(`
      SELECT COUNT(*) as total FROM receipts WHERE ${whereClause}
    `, params);

    const total = countResult[0].total;
    const totalPages = Math.ceil(total / limit);

    res.json({
      receipts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Receipt history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};