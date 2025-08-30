// Frontend internationalization utility
const messages = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.wallet': 'Wallet',
    'nav.forms': 'Forms',
    'nav.support': 'Support',
    'nav.logout': 'Logout',
    
    // Auth
    'auth.login': 'Login',
    'auth.register': 'Register',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.name': 'Full Name',
    'auth.mobile': 'Mobile Number',
    'auth.role': 'Role',
    
    // Wallet
    'wallet.balance': 'Wallet Balance',
    'wallet.recharge': 'Recharge Wallet',
    'wallet.history': 'Transaction History',
    'wallet.insufficient': 'Insufficient Balance',
    
    // Forms
    'form.basic': 'Basic Form',
    'form.realtime': 'Realtime Validation',
    'form.submit': 'Submit Form',
    'form.applicant.name': 'Applicant Name',
    'form.loan.amount': 'Loan Amount',
    'form.purpose': 'Purpose',
    
    // Common
    'common.loading': 'Loading...',
    'common.submit': 'Submit',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.edit': 'Edit',
    'common.delete': 'Delete',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.export': 'Export',
    
    // Messages
    'message.success': 'Success',
    'message.error': 'Error',
    'message.warning': 'Warning',
    'message.info': 'Information'
  },
  
  hi: {
    // Navigation
    'nav.dashboard': 'डैशबोर्ड',
    'nav.wallet': 'वॉलेट',
    'nav.forms': 'फॉर्म',
    'nav.support': 'सहायता',
    'nav.logout': 'लॉगआउट',
    
    // Auth
    'auth.login': 'लॉगिन',
    'auth.register': 'पंजीकरण',
    'auth.email': 'ईमेल',
    'auth.password': 'पासवर्ड',
    'auth.name': 'पूरा नाम',
    'auth.mobile': 'मोबाइल नंबर',
    'auth.role': 'भूमिका',
    
    // Wallet
    'wallet.balance': 'वॉलेट बैलेंस',
    'wallet.recharge': 'वॉलेट रिचार्ज',
    'wallet.history': 'लेनदेन इतिहास',
    'wallet.insufficient': 'अपर्याप्त शेष राशि',
    
    // Forms
    'form.basic': 'बेसिक फॉर्म',
    'form.realtime': 'रियलटाइम सत्यापन',
    'form.submit': 'फॉर्म जमा करें',
    'form.applicant.name': 'आवेदक का नाम',
    'form.loan.amount': 'ऋण राशि',
    'form.purpose': 'उद्देश्य',
    
    // Common
    'common.loading': 'लोड हो रहा है...',
    'common.submit': 'जमा करें',
    'common.cancel': 'रद्द करें',
    'common.save': 'सेव करें',
    'common.edit': 'संपादित करें',
    'common.delete': 'हटाएं',
    'common.search': 'खोजें',
    'common.filter': 'फिल्टर',
    'common.export': 'निर्यात',
    
    // Messages
    'message.success': 'सफलता',
    'message.error': 'त्रुटि',
    'message.warning': 'चेतावनी',
    'message.info': 'जानकारी'
  }
};

class I18n {
  constructor() {
    this.currentLanguage = localStorage.getItem('language') || 'en';
  }

  setLanguage(lang) {
    this.currentLanguage = lang;
    localStorage.setItem('language', lang);
    window.dispatchEvent(new Event('languageChanged'));
  }

  t(key, params = {}) {
    let message = messages[this.currentLanguage]?.[key] || messages.en[key] || key;
    
    // Replace parameters
    Object.keys(params).forEach(param => {
      message = message.replace(`{${param}}`, params[param]);
    });
    
    return message;
  }

  getCurrentLanguage() {
    return this.currentLanguage;
  }

  getAvailableLanguages() {
    return Object.keys(messages);
  }
}

export const i18n = new I18n();
export const t = (key, params) => i18n.t(key, params);