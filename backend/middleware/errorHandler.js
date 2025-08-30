// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Access control errors with guidance
  if (err.code === 'INSUFFICIENT_BALANCE') {
    return res.status(403).json({
      success: false,
      message: 'Insufficient wallet balance',
      errorCode: 'INSUFFICIENT_BALANCE',
      required: err.required,
      current: err.current,
      guidance: {
        action: 'recharge',
        message: `Please recharge your wallet with ₹${err.required - err.current} to continue`,
        rechargeUrl: '/recharge'
      }
    });
  }

  if (err.code === 'NO_SUBSCRIPTION') {
    return res.status(403).json({
      success: false,
      message: 'No active subscription',
      errorCode: 'NO_SUBSCRIPTION',
      guidance: {
        action: 'subscribe',
        message: 'Subscribe to a plan for unlimited access',
        subscribeUrl: '/subscriptions'
      }
    });
  }

  if (err.code === 'WALLET_INACTIVE') {
    return res.status(403).json({
      success: false,
      message: 'Wallet is inactive',
      errorCode: 'WALLET_INACTIVE',
      guidance: {
        action: 'contact_support',
        message: 'Please contact support to activate your wallet',
        supportUrl: '/support'
      }
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errorCode: err.code || 'INTERNAL_ERROR'
  });
};

// Helper to create structured errors
export const createError = (code, message, status = 400, extra = {}) => {
  const error = new Error(message);
  error.code = code;
  error.status = status;
  Object.assign(error, extra);
  return error;
};