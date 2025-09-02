import { useState, useEffect } from 'react';
import { AlertCircle, Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useWallet } from '../../context/WalletContext';
import { handleApiError } from '../../utils/errorHandler';
import apiWrapper from '../../utils/apiWrapper';
import FormEligibilityCheck from './FormEligibilityCheck';
import API_BASE_URL from '../../config/api';

const LoanForm = () => {
  const { balance, transactions, deductAmount, addAmount } = useWallet();
  const [formType, setFormType] = useState('basic');
  const [eligibility, setEligibility] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    loanAmount: '',
    purpose: '',
    aadhaar: '',
    pan: '',
    bankAccount: ''
  });

  const handleEligibilityChange = (eligibilityData) => {
    setEligibility(eligibilityData);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    


    if (!eligibility) {
      toast.error('Please wait while we check your eligibility');
      return;
    }

    if (!eligibility.eligible) {
      toast.error('Form submission blocked. Please check eligibility requirements.');
      return;
    }

    setLoading(true);
    
    try {
      const endpoint = formType === 'basic' ? '/forms/basic' : '/forms/realtime';
      const token = localStorage.getItem('token');
      
      const response = await apiWrapper.post(`${API_BASE_URL}${endpoint}`, {
        ...formData
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
     if (response.data.success) {
  const rate = eligibility.rates?.[formType] || (formType === 'basic' ? 5 : 50);
  const formTypeText = formType === 'basic' ? 'Basic Form' : 'Realtime Validation';

  // Generate a unique txn ID for wallet deduction
  const txnId = `wallet_txn_${Date.now()}`;

  // Deduct amount from wallet
  const success = await deductAmount(rate, formTypeText, txnId);

  if (!success) {
    toast.error("Failed to deduct wallet balance. Form submission canceled.");
    return;
  }

  toast.success(`Form submitted successfully! ₹${rate} deducted. New balance: ₹${balance - rate}`);

  // Reset form
  setFormData({
    applicantName: '',
    loanAmount: '',
    purpose: '',
    aadhaar: '',
    pan: '',
    bankAccount: ''
  });
}

    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const isFormDisabled = () => {
    return !eligibility?.eligible;
  };

  const getFormRate = () => {
    if (!eligibility?.rates) return formType === 'basic' ? 5 : 50;
    return eligibility.rates[formType];
  };

  const canSelectFormType = (type) => {
    if (!eligibility) return false;
    const requiredAmount = type === 'basic' ? (eligibility.rates?.basic || 5) : (eligibility.rates?.realtime || 50);
    return eligibility.accessType === 'subscription' || eligibility.balance >= requiredAmount;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Loan Application Form</h2>

        {/* Live Eligibility Check */}
        <FormEligibilityCheck 
          formType={formType} 
          onEligibilityChange={handleEligibilityChange} 
        />

        {eligibility && (
          <>
            {/* Form Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Form Type
              </label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formType === 'basic' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${!canSelectFormType('basic') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => canSelectFormType('basic') && setFormType('basic')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Basic Form</h3>
                      <p className="text-sm text-gray-600">Standard loan processing</p>
                      <p className="text-lg font-bold text-green-600">₹{eligibility?.rates?.basic || 5}</p>
                    </div>
                    {!canSelectFormType('basic') && <Lock className="h-5 w-5 text-red-500" />}
                  </div>
                </div>

                <div 
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    formType === 'realtime' 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-300 hover:border-gray-400'
                  } ${!canSelectFormType('realtime') ? 'opacity-50 cursor-not-allowed' : ''}`}
                  onClick={() => canSelectFormType('realtime') && setFormType('realtime')}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-medium">Realtime Validation</h3>
                      <p className="text-sm text-gray-600">Aadhaar, PAN, Bank verification</p>
                      <p className="text-lg font-bold text-blue-600">₹{eligibility?.rates?.realtime || 50}</p>
                    </div>
                    {!canSelectFormType('realtime') && <Lock className="h-5 w-5 text-red-500" />}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* Form Fields */}
        {eligibility && (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Applicant Name *
              </label>
              <input
                type="text"
                name="applicantName"
                value={formData.applicantName}
                onChange={handleInputChange}
                disabled={isFormDisabled()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Loan Amount *
              </label>
              <input
                type="number"
                name="loanAmount"
                value={formData.loanAmount}
                onChange={handleInputChange}
                disabled={isFormDisabled()}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purpose *
            </label>
            <textarea
              name="purpose"
              value={formData.purpose}
              onChange={handleInputChange}
              disabled={isFormDisabled()}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
              required
            />
          </div>

          {/* Realtime Validation Fields */}
          {formType === 'realtime' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Aadhaar Number *
                </label>
                <input
                  type="text"
                  name="aadhaar"
                  value={formData.aadhaar}
                  onChange={handleInputChange}
                  disabled={isFormDisabled()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PAN Number *
                </label>
                <input
                  type="text"
                  name="pan"
                  value={formData.pan}
                  onChange={handleInputChange}
                  disabled={isFormDisabled()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Account *
                </label>
                <input
                  type="text"
                  name="bankAccount"
                  value={formData.bankAccount}
                  onChange={handleInputChange}
                  disabled={isFormDisabled()}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  required
                />
              </div>
            </div>
          )}

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-gray-600">
              {eligibility?.accessType === 'subscription' ? (
                'No charge - Subscription active'
              ) : (
                `This form will cost ₹${getFormRate()}`
              )}
              {eligibility?.demoMode && (
                <span className="ml-2 text-orange-600">(Demo Mode)</span>
              )}
            </div>
            
            <button
              type="submit"
              disabled={isFormDisabled() || loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};

export default LoanForm;