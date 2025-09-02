import db from "../config/db.js";
import secureLog from "../utils/secureLogger.js";

// Debug endpoint to check system health for payment processing
export const checkPaymentSystemHealth = async (req, res) => {
  const healthCheck = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks: {}
  };

  try {
    // Check database connection
    try {
      await db.query('SELECT 1');
      healthCheck.checks.database = { status: 'ok', message: 'Database connection successful' };
    } catch (dbError) {
      healthCheck.checks.database = { 
        status: 'error', 
        message: 'Database connection failed',
        error: dbError.message 
      };
    }

    // Check Razorpay configuration
    const razorpayConfig = {
      keyId: !!process.env.RAZORPAY_KEY_ID,
      keySecret: !!process.env.RAZORPAY_KEY_SECRET,
      webhookSecret: !!process.env.RAZORPAY_WEBHOOK_SECRET
    };
    
    if (razorpayConfig.keyId && razorpayConfig.keySecret && razorpayConfig.webhookSecret) {
      healthCheck.checks.razorpay = { status: 'ok', message: 'Razorpay configuration complete' };
    } else {
      healthCheck.checks.razorpay = { 
        status: 'warning', 
        message: 'Razorpay configuration incomplete',
        config: razorpayConfig
      };
    }

    // Check required tables exist
    const requiredTables = ['users', 'wallets', 'transactions'];
    const tableChecks = {};
    
    for (const table of requiredTables) {
      try {
        const [result] = await db.query(
          `SELECT COUNT(*) as count FROM information_schema.tables 
           WHERE table_schema = DATABASE() AND table_name = ?`,
          [table]
        );
        tableChecks[table] = result[0].count > 0 ? 'exists' : 'missing';
      } catch (error) {
        tableChecks[table] = 'error';
      }
    }
    
    healthCheck.checks.tables = { 
      status: Object.values(tableChecks).every(status => status === 'exists') ? 'ok' : 'error',
      tables: tableChecks
    };

    // Check user authentication
    const userId = req.user?.id || req.user?.user_id;
    if (userId) {
      try {
        const [user] = await db.query('SELECT user_id, status FROM users WHERE user_id = ?', [userId]);
        if (user.length > 0) {
          healthCheck.checks.authentication = { 
            status: 'ok', 
            message: 'User authenticated successfully',
            userId: userId,
            userStatus: user[0].status
          };
        } else {
          healthCheck.checks.authentication = { 
            status: 'error', 
            message: 'User not found in database' 
          };
        }
      } catch (error) {
        healthCheck.checks.authentication = { 
          status: 'error', 
          message: 'Authentication check failed',
          error: error.message
        };
      }
    } else {
      healthCheck.checks.authentication = { 
        status: 'error', 
        message: 'No user ID in request' 
      };
    }

    // Overall status
    const allChecks = Object.values(healthCheck.checks);
    const hasErrors = allChecks.some(check => check.status === 'error');
    const hasWarnings = allChecks.some(check => check.status === 'warning');
    
    healthCheck.overallStatus = hasErrors ? 'error' : (hasWarnings ? 'warning' : 'ok');

    res.json(healthCheck);
  } catch (error) {
    secureLog.error('Health check failed', { error: error.message });
    res.status(500).json({
      timestamp: new Date().toISOString(),
      overallStatus: 'error',
      message: 'Health check failed',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Internal error'
    });
  }
};

// Debug endpoint to test payment verification flow
export const testPaymentVerification = async (req, res) => {
  if (process.env.NODE_ENV === 'production') {
    return res.status(403).json({ message: 'Debug endpoints not available in production' });
  }

  const { testAmount = 100 } = req.body;
  const userId = req.user?.id || req.user?.user_id;

  if (!userId) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  try {
    // Test wallet operations
    const testTxnRef = `test_${Date.now()}_${userId}`;
    
    // Import addToWallet function
    const { addToWallet } = await import('./walletController.js');
    
    // Test adding to wallet
    const result = await addToWallet(userId, testAmount, testTxnRef, 'test');
    
    res.json({
      message: 'Payment verification test successful',
      testAmount,
      userId,
      testTxnRef,
      result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    secureLog.error('Payment verification test failed', { 
      error: error.message, 
      userId, 
      testAmount 
    });
    
    res.status(500).json({
      message: 'Payment verification test failed',
      error: error.message,
      userId,
      testAmount,
      timestamp: new Date().toISOString()
    });
  }
};