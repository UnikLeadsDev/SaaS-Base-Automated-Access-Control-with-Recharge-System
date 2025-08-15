import API_BASE_URL from '../config/api';

// Simple API test utility
export const testApiEndpoints = () => {
  console.log('API Base URL:', API_BASE_URL);
  
  // Test endpoints that should be accessible
  const endpoints = [
    '/auth/login',
    '/auth/register', 
    '/wallet/balance-check',
    '/wallet/balance',
    '/wallet/transactions',
    '/forms/basic',
    '/forms/realtime',
    '/subscription/current',
    '/support/tickets'
  ];
  
  endpoints.forEach(endpoint => {
    console.log('Full URL:', `${API_BASE_URL}${endpoint}`);
  });
};

export default testApiEndpoints;