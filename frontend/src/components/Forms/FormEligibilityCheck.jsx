import { useState, useEffect } from 'react';
import { AlertCircle, Wallet, CreditCard } from 'lucide-react';
import apiWrapper from '../../utils/apiWrapper';
import { handleApiError } from '../../utils/errorHandler';
import API_BASE_URL from '../../config/api';

const FormEligibilityCheck = ({ formType, onEligibilityChange }) => {
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkEligibility();
  }, [formType]);

const checkEligibility = async () => {
  try {
    const token = localStorage.getItem('token');
    const response = await apiWrapper.get(`${API_BASE_URL}/wallet/check-balance`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    const data = response.data;
    console.log("check-balance response", data);

    // Always allow form submission if user has sufficient balance
    const basicCost = data.rates?.basic || 5;
    const realtimeCost = data.rates?.realtime || 50;
    const requiredAmount = formType === 'basic' ? basicCost : realtimeCost;
    
    const isEligible = data.accessType === 'subscription' || data.balance >= requiredAmount;

    const eligibilityData = {
      eligible: isEligible,
      balance: data.balance,
      accessType: data.accessType,
      demoMode: data.demoMode,
      paymentsEnabled: data.paymentsEnabled,
      rates: data.rates
    };

    setEligibility(eligibilityData);
    onEligibilityChange?.(eligibilityData);
  } catch (error) {
    const errorInfo = handleApiError(error, false);
    setEligibility({ 
      eligible: false, 
      error: true, 
      errorMessage: errorInfo.message
    });
  } finally {
    setLoading(false);
  }
};


  if (loading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          <span className="text-blue-700">Checking eligibility...</span>
        </div>
      </div>
    );
  }

  if (!eligibility) return null;

  if (eligibility.error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">Unable to check eligibility</span>
        </div>
      </div>
    );
  }

  if (eligibility.eligible) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-green-600 rounded-full flex items-center justify-center">
            <div className="h-2 w-2 bg-white rounded-full"></div>
          </div>
          <span className="text-green-700 font-medium">Form submission enabled</span>
        </div>
        <div className="mt-2 text-sm text-green-600">
          {eligibility.accessType === 'subscription' ? (
            'Unlimited access via subscription'
          ) : (
            `Current balance: ₹${eligibility.balance} | Cost: ₹${eligibility.rates?.[formType] || 0}`
          )}
        </div>
        {eligibility.demoMode && (
          <div className="mt-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
            Demo mode active - payments disabled
          </div>
        )}
      </div>
    );
  }

  // Not eligible - show guidance
  const guidance = eligibility.guidance;
  return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <AlertCircle className="h-5 w-5 text-red-600" />
        <span className="text-red-700 font-medium">Form submission blocked</span>
      </div>
      
      {guidance && (
        <div className="space-y-2">
          <div className="text-sm text-red-600">
            <strong>Reason:</strong> {guidance.reason === 'insufficient_balance' ? 'Insufficient wallet balance' : guidance.reason}
          </div>
          
          {guidance.required && (
            <div className="text-sm text-red-600">
              <strong>Required:</strong> ₹{guidance.required} | 
              <strong> Current:</strong> ₹{eligibility.balance} | 
              <strong> Shortfall:</strong> ₹{guidance.shortfall}
            </div>
          )}
          
          <div className="flex gap-2 mt-3">
            {guidance.action === 'recharge' && (
              <button 
                onClick={() => window.location.href = '/wallet'}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                  eligibility.paymentsEnabled 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'bg-gray-400 text-gray-200 cursor-not-allowed'
                }`}
                disabled={!eligibility.paymentsEnabled}
              >
                <Wallet className="h-4 w-4" />
                {eligibility.paymentsEnabled ? 'Recharge Wallet' : 'Recharge (Demo Mode)'}
              </button>
            )}
            
            <button 
              onClick={() => window.location.href = '/subscriptions'}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm ${
                eligibility.paymentsEnabled 
                  ? 'bg-purple-600 text-white hover:bg-purple-700' 
                  : 'bg-gray-400 text-gray-200 cursor-not-allowed'
              }`}
              disabled={!eligibility.paymentsEnabled}
            >
              <CreditCard className="h-4 w-4" />
              {eligibility.paymentsEnabled ? 'Subscribe for Unlimited' : 'Subscribe (Demo Mode)'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FormEligibilityCheck;