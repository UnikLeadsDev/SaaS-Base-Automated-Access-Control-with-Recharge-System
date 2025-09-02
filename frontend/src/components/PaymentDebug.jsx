import React, { useState } from 'react';
import axios from 'axios';

const PaymentDebug = () => {
  const [healthStatus, setHealthStatus] = useState(null);
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only show in development
  if (import.meta.env.PROD) {
    return null;
  }

  const checkSystemHealth = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/debug/health', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHealthStatus(response.data);
    } catch (error) {
      setHealthStatus({
        overallStatus: 'error',
        message: error.response?.data?.message || error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const testPaymentFlow = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('/api/debug/test-payment', 
        { testAmount: 100 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setTestResult(response.data);
    } catch (error) {
      setTestResult({
        message: 'Test failed',
        error: error.response?.data?.error || error.message,
        timestamp: new Date().toISOString()
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ok': return 'text-green-600';
      case 'warning': return 'text-yellow-600';
      case 'error': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="bg-gray-100 p-4 rounded-lg border-2 border-dashed border-gray-300">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        🔧 Payment Debug Panel (Development Only)
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-2">
          <button
            onClick={checkSystemHealth}
            disabled={loading}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            {loading ? 'Checking...' : 'Check System Health'}
          </button>
          
          <button
            onClick={testPaymentFlow}
            disabled={loading}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
          >
            {loading ? 'Testing...' : 'Test Payment Flow'}
          </button>
        </div>

        {healthStatus && (
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">System Health Check</h4>
            <div className={`mb-2 ${getStatusColor(healthStatus.overallStatus)}`}>
              Overall Status: {healthStatus.overallStatus?.toUpperCase()}
            </div>
            
            {healthStatus.checks && (
              <div className="space-y-2">
                {Object.entries(healthStatus.checks).map(([key, check]) => (
                  <div key={key} className="text-sm">
                    <span className="font-medium">{key}:</span>
                    <span className={`ml-2 ${getStatusColor(check.status)}`}>
                      {check.status} - {check.message}
                    </span>
                    {check.error && (
                      <div className="text-red-500 text-xs ml-4">
                        Error: {check.error}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
            
            {healthStatus.message && (
              <div className="mt-2 text-sm text-gray-600">
                {healthStatus.message}
              </div>
            )}
          </div>
        )}

        {testResult && (
          <div className="bg-white p-4 rounded border">
            <h4 className="font-semibold mb-2">Payment Flow Test</h4>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentDebug;