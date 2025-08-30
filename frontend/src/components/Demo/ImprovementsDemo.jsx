import { useState } from 'react';
import { AlertTriangle, CheckCircle, Wallet, CreditCard } from 'lucide-react';
import FormEligibilityCheck from '../Forms/FormEligibilityCheck';

const ImprovementsDemo = () => {
  const [selectedFormType, setSelectedFormType] = useState('basic');
  const [eligibility, setEligibility] = useState(null);

  const handleEligibilityChange = (eligibilityData) => {
    setEligibility(eligibilityData);
  };

  const isDemoMode = () => {
    const token = localStorage.getItem('token');
    return token && (token.startsWith('mock_jwt_token_') || token.includes('demo'));
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-4">System Improvements Demo</h2>
        
        {/* Improvement 1: Centralized Error Handling */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            1. Centralized API Error Handling
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-2">
              All API errors now provide structured guidance to users:
            </p>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• <strong>INSUFFICIENT_BALANCE:</strong> Shows exact shortfall and recharge guidance</li>
              <li>• <strong>NO_SUBSCRIPTION:</strong> Suggests subscription for unlimited access</li>
              <li>• <strong>WALLET_INACTIVE:</strong> Directs to support for activation</li>
            </ul>
          </div>
        </div>

        {/* Improvement 2: Live Balance/Eligibility Check */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            2. Live Balance & Eligibility Check
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-700 mb-3">
              Real-time eligibility checking before form submission:
            </p>
            
            {/* Form Type Selector */}
            <div className="mb-4">
              <label className="block text-sm font-medium mb-2">Select Form Type:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedFormType('basic')}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedFormType === 'basic' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Basic (₹5)
                </button>
                <button
                  onClick={() => setSelectedFormType('realtime')}
                  className={`px-3 py-1 rounded text-sm ${
                    selectedFormType === 'realtime' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  Realtime (₹50)
                </button>
              </div>
            </div>

            {/* Live Eligibility Check Component */}
            <FormEligibilityCheck 
              formType={selectedFormType} 
              onEligibilityChange={handleEligibilityChange} 
            />
          </div>
        </div>

        {/* Improvement 3: Demo Mode Detection */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
            3. Demo Mode Payment Handling
          </h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm text-gray-700">
                Current Mode: 
              </p>
              <span className={`px-2 py-1 rounded text-xs font-semibold ${
                isDemoMode() 
                  ? 'bg-orange-100 text-orange-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {isDemoMode() ? 'Demo Mode' : 'Live Mode'}
              </span>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Wallet className={`h-4 w-4 ${isDemoMode() ? 'text-gray-400' : 'text-blue-600'}`} />
                <button 
                  className={`px-3 py-1 rounded text-sm ${
                    isDemoMode() 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                  disabled={isDemoMode()}
                >
                  {isDemoMode() ? 'Recharge (Demo Mode)' : 'Recharge Wallet'}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <CreditCard className={`h-4 w-4 ${isDemoMode() ? 'text-gray-400' : 'text-purple-600'}`} />
                <button 
                  className={`px-3 py-1 rounded text-sm ${
                    isDemoMode() 
                      ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                      : 'bg-purple-600 text-white hover:bg-purple-700'
                  }`}
                  disabled={isDemoMode()}
                >
                  {isDemoMode() ? 'Subscribe (Demo Mode)' : 'Subscribe'}
                </button>
              </div>
            </div>
            
            {isDemoMode() && (
              <div className="mt-3 p-2 bg-orange-50 border border-orange-200 rounded">
                <p className="text-xs text-orange-700">
                  <AlertTriangle className="h-3 w-3 inline mr-1" />
                  Payments are disabled in demo mode to prevent confusion
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Summary */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-semibold text-blue-900 mb-2">Key Benefits:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✅ Users get clear guidance when access is blocked</li>
            <li>✅ Real-time balance checking prevents failed submissions</li>
            <li>✅ Demo mode clearly indicates when payments are disabled</li>
            <li>✅ Consistent error handling across all components</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ImprovementsDemo;