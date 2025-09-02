import secureLog from "./secureLogger.js";

// Enhanced payment-specific logging utility
class PaymentLogger {
  static logPaymentAttempt(userId, orderId, amount) {
    secureLog.info('Payment attempt started', {
      userId,
      orderId,
      amount,
      timestamp: new Date().toISOString()
    });
  }

  static logPaymentVerificationStart(userId, paymentId, orderId, signature) {
    secureLog.info('Payment verification started', {
      userId,
      paymentId,
      orderId,
      hasSignature: !!signature,
      timestamp: new Date().toISOString()
    });
  }

  static logPaymentVerificationSuccess(userId, paymentId, amount, newBalance) {
    secureLog.info('Payment verification successful', {
      userId,
      paymentId,
      amount,
      newBalance,
      timestamp: new Date().toISOString()
    });
  }

  static logPaymentVerificationError(userId, paymentId, error, context = {}) {
    secureLog.error('Payment verification failed', {
      userId,
      paymentId,
      error: error.message,
      errorCode: error.code,
      errorStack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logWalletOperation(operation, userId, amount, txnRef, result) {
    secureLog.info(`Wallet ${operation}`, {
      operation,
      userId,
      amount,
      txnRef,
      success: result.success,
      newBalance: result.newBalance,
      message: result.message,
      timestamp: new Date().toISOString()
    });
  }

  static logWalletError(operation, userId, amount, txnRef, error) {
    secureLog.error(`Wallet ${operation} failed`, {
      operation,
      userId,
      amount,
      txnRef,
      error: error.message,
      errorCode: error.code,
      timestamp: new Date().toISOString()
    });
  }

  static logRazorpayError(operation, error, context = {}) {
    secureLog.error(`Razorpay ${operation} failed`, {
      operation,
      error: error.message,
      statusCode: error.statusCode,
      errorCode: error.code,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logDatabaseError(operation, error, context = {}) {
    secureLog.error(`Database ${operation} failed`, {
      operation,
      error: error.message,
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      context,
      timestamp: new Date().toISOString()
    });
  }

  static logConfigurationError(component, missingConfig) {
    secureLog.error(`Configuration error in ${component}`, {
      component,
      missingConfig,
      timestamp: new Date().toISOString()
    });
  }

  static logSecurityEvent(event, details) {
    secureLog.warn(`Security event: ${event}`, {
      event,
      details,
      timestamp: new Date().toISOString()
    });
  }
}

export default PaymentLogger;