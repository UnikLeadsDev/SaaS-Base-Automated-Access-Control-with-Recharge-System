import { useState, useEffect } from 'react';
import { AlertCircle, Lock, CheckCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const LoanForm = () => {
  const [formType, setFormType] = useState('basic');
  const [accessStatus, setAccessStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    applicantName: '',
    loanAmount: '',
    purpose: '',
    aadhaar: '',
    pan: '',
    bankAccount: ''
  });

  useEffect(() => {
    checkAccess();
  }, []);

  const checkAccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/wallet/balance-check`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAccessStatus(response.data);
    } catch (error) {
      toast.error('Failed to check access status');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!accessStatus) {
      toast.error('Please wait while we check your access status');
      return;
    }

    const canSubmit = formType === 'basic' ? accessStatus.canSubmitBasic : accessStatus.canSubmitRealtime;
    
    if (!canSubmit) {
      toast.error('Insufficient balance. Please recharge your wallet.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const endpoint = formType === 'basic' ? `${API_BASE_URL}/forms/basic` : `${API_BASE_URL}/forms/realtime`;
      
      const response = await axios.post(endpoint, formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      toast.success('Form submitted successfully!');
      
      // Reset form and refresh access status
      setFormData({
        applicantName: '',
        loanAmount: '',
        purpose: '',
        aadhaar: '',
        pan: '',
        bankAccount: ''
      });
      
      await checkAccess(); // Refresh balance after submission
      
    } catch (error) {
      if (error.response?.data?.accessBlocked) {
        toast.error(error.response.data.message);
        await checkAccess(); // Refresh status
      } else {
        toast.error('Form submission failed');
      }
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
    if (!accessStatus) return true;
    return formType === 'basic' ? !accessStatus.canSubmitBasic : !accessStatus.canSubmitRealtime;
  };

  const getFormRate = () => {
    if (!accessStatus?.rates) return 0;
    return formType === 'basic' ? accessStatus.rates.basic : accessStatus.rates.realtime;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Loan Application Form</h2>

        {/* Access Status Banner */}
        {accessStatus && (
          <div className={`mb-6 p-4 rounded-lg border ${
            accessStatus.accessType === 'subscription' 
              ? 'bg-green-50 border-green-200' 
              : accessStatus.balance > 0 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-center">
              {accessStatus.accessType === 'subscription' ? (
                <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
              ) : accessStatus.balance > 0 ? (
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
              ) : (
                <Lock className="h-5 w-5 text-red-600 mr-2" />
              )}
              <div>
                <p className="font-medium">
                  {accessStatus.accessType === 'subscription' 
                    ? 'Subscription Active - Unlimited Forms' 
                    : `Wallet Balance: ₹${accessStatus.balance}`}
                </p>
                {accessStatus.accessType !== 'subscription' && (
                  <p className="text-sm text-gray-600">
                    Basic Form: ₹{accessStatus.rates?.basic} | Realtime Validation: ₹{accessStatus.rates?.realtime}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

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
              } ${!accessStatus?.canSubmitBasic ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => accessStatus?.canSubmitBasic && setFormType('basic')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Basic Form</h3>
                  <p className="text-sm text-gray-600">Standard loan processing</p>
                  <p className="text-lg font-bold text-green-600">₹{accessStatus?.rates?.basic || 5}</p>
                </div>
                {!accessStatus?.canSubmitBasic && <Lock className="h-5 w-5 text-red-500" />}
              </div>
            </div>

            <div 
              className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                formType === 'realtime_validation' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-300 hover:border-gray-400'
              } ${!accessStatus?.canSubmitRealtime ? 'opacity-50 cursor-not-allowed' : ''}`}
              onClick={() => accessStatus?.canSubmitRealtime && setFormType('realtime_validation')}
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium">Realtime Validation</h3>
                  <p className="text-sm text-gray-600">Aadhaar, PAN, Bank verification</p>
                  <p className="text-lg font-bold text-blue-600">₹{accessStatus?.rates?.realtime || 50}</p>
                </div>
                {!accessStatus?.canSubmitRealtime && <Lock className="h-5 w-5 text-red-500" />}
              </div>
            </div>
          </div>
        </div>

        {/* Form Fields */}
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
          {formType === 'realtime_validation' && (
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
              {accessStatus?.accessType === 'subscription' ? (
                'No charge - Subscription active'
              ) : (
                `This form will cost ₹${getFormRate()}`
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

        {isFormDisabled() && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <p className="text-sm text-red-800">
              Form submission is blocked due to insufficient balance. Please recharge your wallet to continue.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoanForm;