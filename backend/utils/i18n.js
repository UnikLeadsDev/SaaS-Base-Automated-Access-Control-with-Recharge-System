// Internationalization utility
const messages = {
  en: {
    // Auth messages
    'auth.login.success': 'Login successful',
    'auth.login.invalid': 'Invalid email or password',
    'auth.register.success': 'User registered successfully',
    'auth.register.exists': 'Email already exists',
    'auth.token.invalid': 'Invalid token',
    'auth.access.denied': 'Access denied for your role',
    
    // Wallet messages
    'wallet.insufficient': 'Insufficient balance',
    'wallet.balance.low': 'Your wallet balance is low: ₹{balance}',
    'wallet.payment.success': 'Payment successful. Amount: ₹{amount}. New balance: ₹{balance}',
    'wallet.deduction.success': 'Amount deducted successfully',
    
    // Form messages
    'form.submit.success': 'Form submitted successfully',
    'form.submit.failed': 'Form submission failed',
    'form.validation.required': 'This field is required',
    'form.validation.email': 'Please enter a valid email',
    'form.validation.phone': 'Please enter a valid phone number',
    
    // Error messages
    'error.server': 'Internal server error',
    'error.validation': 'Validation failed',
    'error.not.found': 'Resource not found',
    'error.rate.limit': 'Too many requests. Please try again later',
    
    // Success messages
    'success.created': 'Created successfully',
    'success.updated': 'Updated successfully',
    'success.deleted': 'Deleted successfully'
  },
  
  hi: {
    // Auth messages
    'auth.login.success': 'लॉगिन सफल',
    'auth.login.invalid': 'अमान्य ईमेल या पासवर्ड',
    'auth.register.success': 'उपयोगकर्ता सफलतापूर्वक पंजीकृत',
    'auth.register.exists': 'ईमेल पहले से मौजूद है',
    'auth.token.invalid': 'अमान्य टोकन',
    'auth.access.denied': 'आपकी भूमिका के लिए पहुंच अस्वीकृत',
    
    // Wallet messages
    'wallet.insufficient': 'अपर्याप्त शेष राशि',
    'wallet.balance.low': 'आपका वॉलेट बैलेंस कम है: ₹{balance}',
    'wallet.payment.success': 'भुगतान सफल। राशि: ₹{amount}। नया बैलेंस: ₹{balance}',
    'wallet.deduction.success': 'राशि सफलतापूर्वक काटी गई',
    
    // Form messages
    'form.submit.success': 'फॉर्म सफलतापूर्वक जमा किया गया',
    'form.submit.failed': 'फॉर्म जमा करना असफल',
    'form.validation.required': 'यह फील्ड आवश्यक है',
    'form.validation.email': 'कृपया एक वैध ईमेल दर्ज करें',
    'form.validation.phone': 'कृपया एक वैध फोन नंबर दर्ज करें',
    
    // Error messages
    'error.server': 'आंतरिक सर्वर त्रुटि',
    'error.validation': 'सत्यापन असफल',
    'error.not.found': 'संसाधन नहीं मिला',
    'error.rate.limit': 'बहुत सारे अनुरोध। कृपया बाद में पुनः प्रयास करें',
    
    // Success messages
    'success.created': 'सफलतापूर्वक बनाया गया',
    'success.updated': 'सफलतापूर्वक अपडेट किया गया',
    'success.deleted': 'सफलतापूर्वक हटाया गया'
  }
};

export const t = (key, params = {}, lang = 'en') => {
  let message = messages[lang]?.[key] || messages.en[key] || key;
  
  // Replace parameters
  Object.keys(params).forEach(param => {
    message = message.replace(`{${param}}`, params[param]);
  });
  
  return message;
};

export const getLanguage = (req) => {
  return req.headers['accept-language']?.split(',')[0]?.split('-')[0] || 'en';
};

// Middleware to add i18n to request
export const i18nMiddleware = (req, res, next) => {
  req.lang = getLanguage(req);
  req.t = (key, params = {}) => t(key, params, req.lang);
  next();
};