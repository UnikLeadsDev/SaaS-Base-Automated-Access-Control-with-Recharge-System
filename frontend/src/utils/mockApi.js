// Mock API responses when backend is not available
export const mockApiResponses = {
  '/api/wallet/balance': {
    success: true,
    balance: 500.00,
    status: 'active',
    validUntil: null
  },
  
  '/api/wallet/balance-check': {
    success: true,
    balance: 500.00,
    status: 'active',
    validUntil: null,
    accessType: 'prepaid',
    canSubmitBasic: true,
    canSubmitRealtime: true,
    rates: { basic: 5, realtime: 50 }
  },
  
  '/api/wallet/transactions': {
    success: true,
    transactions: [
      { txn_id: 1, amount: 1000, type: 'credit', date: '2024-01-15', txn_ref: 'TXN001' },
      { txn_id: 2, amount: 5, type: 'debit', date: '2024-01-14', txn_ref: 'FORM001' }
    ]
  },
  
  '/api/subscription/list': {
    success: true,
    subscriptions: []
  },
  
  '/api/subscription/plans': {
    success: true,
    plans: [
      { id: 1, name: 'Basic Plan', amount: 999, duration: 30, features: ['Unlimited Basic Forms', 'Email Support'] },
      { id: 2, name: 'Premium Plan', amount: 1999, duration: 30, features: ['Unlimited All Forms', 'Priority Support', 'Analytics'] }
    ]
  },
  
  '/api/support/tickets': {
    success: true,
    tickets: []
  },
  
  '/api/auth/profile': {
    success: true,
    id: 1,
    name: 'Demo User',
    email: 'demo@example.com',
    role: 'DSA'
  },
  
  '/api/auth/login': {
    success: true,
    token: 'mock_jwt_token',
    user: {
      id: 1,
      name: 'Demo User',
      email: 'demo@example.com',
      role: 'DSA'
    }
  }
};

export const getMockResponse = (url) => {
  const endpoint = url.replace('http://localhost:5000', '');
  return mockApiResponses[endpoint] || { success: false, message: 'Endpoint not found' };
};