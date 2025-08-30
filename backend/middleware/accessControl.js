import db from "../config/db.js";

// Constants for form rates (parsed once at module load)
const REALTIME_RATE = parseFloat(process.env.REALTIME_VALIDATION_RATE) || 50;
const BASIC_RATE = parseFloat(process.env.BASIC_FORM_RATE) || 5;

// Validate rates on module load
if (isNaN(REALTIME_RATE) || isNaN(BASIC_RATE)) {
  console.error('Invalid form rates in environment variables');
  process.exit(1);
}

// Helper function to get validated rates
const getRates = () => ({ basic: BASIC_RATE, realtime: REALTIME_RATE });

// Enhanced access control middleware with instant blocking
export const checkFormAccess = (formType) => {
  return async (req, res, next) => {
    try {
      if (!req.user || !req.user.id) {
        return res.status(401).json({ 
          message: "Authentication required",
          accessBlocked: true 
        });
      }
      
      const userId = req.user.id;
      
      // Get user wallet and subscription info in single query
      const [userAccess] = await db.query(`
        SELECT 
          w.balance, 
          w.status as wallet_status,
          s.sub_id,
          s.end_date as subscription_end,
          s.grace_end_date,
          s.status as subscription_status,
          sp.basic_form_rate as sub_basic_rate,
          sp.realtime_form_rate as sub_realtime_rate,
          u.status as user_status
        FROM users u
        LEFT JOIN wallets w ON u.user_id = w.user_id
        LEFT JOIN subscriptions s ON u.user_id = s.user_id 
          AND s.status IN ('active', 'grace')
        LEFT JOIN subscription_plans sp ON s.plan_id = sp.plan_id
        WHERE u.user_id = ?
        ORDER BY s.end_date DESC
        LIMIT 1
      `, [userId]);

      if (userAccess.length === 0) {
        return res.status(404).json({ 
          message: "User access information not found",
          accessBlocked: true 
        });
      }

      const access = userAccess[0];
      
      // Block if user is inactive
      if (access.user_status !== 'active') {
        return res.status(403).json({ 
          message: "Account is blocked. Contact support.",
          accessBlocked: true 
        });
      }

      // Check for active subscription with validity dates
      if (access.sub_id && access.subscription_status) {
        const today = new Date();
        const endDate = new Date(access.subscription_end);
        const graceEndDate = new Date(access.grace_end_date);
        
        let isValidSubscription = false;
        let subscriptionStatus = 'expired';
        
        if (today <= endDate) {
          isValidSubscription = true;
          subscriptionStatus = 'active';
        } else if (today <= graceEndDate) {
          isValidSubscription = true;
          subscriptionStatus = 'grace';
        }
        
        if (isValidSubscription) {
          // Use subscription rates (0 for unlimited) or fallback to plan rates
          const subRate = formType === 'realtime_validation' ? 
            (access.sub_realtime_rate || 0) : (access.sub_basic_rate || 0);
          
          req.formRate = subRate;
          req.accessType = 'subscription';
          req.subscriptionStatus = subscriptionStatus;
          req.accessGranted = true;
          return next();
        }
      }

      // Check prepaid wallet access
      const rate = formType === 'realtime_validation' ? REALTIME_RATE : BASIC_RATE;

      if (access.wallet_status !== 'active') {
        const error = new Error('Wallet is inactive');
        error.code = 'WALLET_INACTIVE';
        return next(error);
      }

      if (access.balance < rate) {
        const error = new Error('Insufficient balance');
        error.code = 'INSUFFICIENT_BALANCE';
        error.required = rate;
        error.current = access.balance;
        return next(error);
      }

      req.formRate = rate;
      req.accessType = 'prepaid';
      req.accessGranted = true;
      next();

    } catch (error) {
      console.error("Access Control Error:", error);
      res.status(500).json({ 
        message: "Access verification failed",
        accessBlocked: true 
      });
    }
  };
};

// Real-time balance check for UI
export const checkBalance = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: "Authentication required" });
    }

    // Check if token is demo/mock
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const isDemoMode = token?.startsWith('mock_') || token?.includes('demo');

    const [result] = await db.query(`
      SELECT 
        w.balance,
        w.status as wallet_status,
        s.sub_id,
        s.end_date as subscription_end,
        s.grace_end_date,
        s.status as subscription_status,
        s.plan_name,
        sp.basic_form_rate as sub_basic_rate,
        sp.realtime_form_rate as sub_realtime_rate
      FROM wallets w
      LEFT JOIN subscriptions s ON w.user_id = s.user_id 
        AND s.status IN ('active', 'grace')
      LEFT JOIN subscription_plans sp ON s.plan_id = sp.plan_id
      WHERE w.user_id = ?
      ORDER BY s.end_date DESC
      LIMIT 1
    `, [req.user.id]);

    if (result.length === 0) {
      return res.status(404).json({ message: "Wallet not found" });
    }

    const rates = getRates();
    const data = result[0];
    
    // Check subscription validity
    let hasActiveSubscription = false;
    let subscriptionStatus = null;
    let accessType = 'prepaid';
    
    if (data.sub_id) {
      const today = new Date();
      const endDate = new Date(data.subscription_end);
      const graceEndDate = new Date(data.grace_end_date);
      
      if (today <= endDate) {
        hasActiveSubscription = true;
        subscriptionStatus = 'active';
        accessType = 'subscription';
      } else if (today <= graceEndDate) {
        hasActiveSubscription = true;
        subscriptionStatus = 'grace';
        accessType = 'subscription';
      }
    }
    
    // Determine form submission eligibility
    const basicRate = hasActiveSubscription ? (data.sub_basic_rate || 0) : rates.basic;
    const realtimeRate = hasActiveSubscription ? (data.sub_realtime_rate || 0) : rates.realtime;
    
    const canSubmitBasic = hasActiveSubscription || data.balance >= rates.basic;
    const canSubmitRealtime = hasActiveSubscription || data.balance >= rates.realtime;

    // Generate guidance for blocked access
    const guidance = {};
    if (!canSubmitBasic && !hasActiveSubscription) {
      guidance.basic = {
        blocked: true,
        reason: 'insufficient_balance',
        required: rates.basic,
        shortfall: rates.basic - data.balance,
        action: 'recharge'
      };
    }
    if (!canSubmitRealtime && !hasActiveSubscription) {
      guidance.realtime = {
        blocked: true,
        reason: 'insufficient_balance',
        required: rates.realtime,
        shortfall: rates.realtime - data.balance,
        action: 'recharge'
      };
    }

    res.json({
      balance: data.balance,
      walletStatus: data.wallet_status,
      accessType,
      subscriptionEnd: data.subscription_end,
      subscriptionStatus,
      subscriptionPlan: data.plan_name,
      canSubmitBasic,
      canSubmitRealtime,
      rates: {
        basic: basicRate,
        realtime: realtimeRate,
        originalBasic: rates.basic,
        originalRealtime: rates.realtime
      },
      guidance,
      demoMode: isDemoMode,
      paymentsEnabled: !isDemoMode
    });
  } catch (error) {
    console.error("Balance Check Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};