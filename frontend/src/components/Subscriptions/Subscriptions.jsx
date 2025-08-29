import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import apiWrapper from '../../utils/apiWrapper.js';
import { CreditCard, Calendar, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../config/api.js';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchSubscriptions();
    fetchPlans();
    fetchCurrentSubscription();
  }, []);

  const isMockToken = () => {
    const token = localStorage.getItem('token');
    return token && token.startsWith('mock_jwt_token_');
  };

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isMockToken()) return;
      
      const response = await apiWrapper.get(`${API_BASE_URL}/subscription/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setSubscriptions(response.data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    }
  };

  const fetchPlans = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isMockToken()) {
        // Demo plans for mock mode
        setPlans([
          { id: 1, name: 'Basic Plan', amount: 999, duration: 30, features: ['Unlimited Basic Forms', 'Email Support'] },
          { id: 2, name: 'Premium Plan', amount: 1999, duration: 30, features: ['Unlimited All Forms', 'Priority Support', 'Analytics'] }
        ]);
        return;
      }
      
      const response = await apiWrapper.get(`${API_BASE_URL}/subscription/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setPlans(response.data.plans || []);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token || isMockToken()) return;
      
      const response = await apiWrapper.get(`${API_BASE_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.data.success) {
        setCurrentSubscription(response.data.subscription);
      }
    } catch (error) {
      console.error('Failed to fetch current subscription:', error);
    }
  };

  const subscribeToPlan = async (plan) => {
    setPaymentLoading(true);
    try {
      const token = localStorage.getItem('token');

      // Block demo mode: require real payment
      if (!token || isMockToken()) {
        toast.error('Real payment required. Please log in against the backend to subscribe.');
        setPaymentLoading(false);
        return;
      }
      
      // Create Razorpay order (real flow)
      const response = await axios.post(
        `${API_BASE_URL}/subscription/create`,
        { planId: plan.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = response.data;

      // Initialize Razorpay
      const options = {
        key: key,
        amount: amount,
        currency: currency,
        name: 'SaaS Base',
        description: `Subscription to ${plan.name}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            // Verify payment (activates subscription and credits wallet server-side)
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/subscription/verify-payment`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                planId: plan.id
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            if (verifyResponse.data?.success) {
              toast.success('Subscription activated successfully');
              fetchSubscriptions();
              fetchCurrentSubscription();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          } finally {
            setPaymentLoading(false);
          }
        },
        prefill: {
          name: localStorage.getItem('userName') || '',
          email: localStorage.getItem('userEmail') || ''
        },
        theme: {
          color: '#4F46E5'
        },
        modal: {
          ondismiss: function() {
            setPaymentLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
      
    } catch (error) {
      toast.error('Failed to initiate payment');
      setPaymentLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Subscription Status */}
      {currentSubscription && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Current Subscription</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-green-900">{currentSubscription.plan_name}</h3>
                <p className="text-sm text-green-700">
                  Status: <span className="capitalize">{currentSubscription.currentStatus}</span>
                </p>
                <p className="text-sm text-green-700">
                  {currentSubscription.daysRemaining > 0 
                    ? `${currentSubscription.daysRemaining} days remaining`
                    : currentSubscription.graceDaysRemaining > 0
                    ? `Grace period: ${currentSubscription.graceDaysRemaining} days remaining`
                    : 'Expired'
                  }
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Valid until</p>
                <p className="font-semibold">{new Date(currentSubscription.end_date).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Subscription Plans</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <div key={plan.id} className="border border-gray-200 rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="text-2xl font-bold text-indigo-600">₹{plan.amount}</div>
              </div>
              
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  {plan.duration} days validity
                </div>
                
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
              
              <button
                onClick={() => subscribeToPlan(plan)}
                disabled={paymentLoading || loading || isMockToken()}
                className={`w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md disabled:opacity-50 ${
                  isMockToken() 
                    ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                    : 'text-white bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isMockToken() ? 'Subscribe (Demo Mode)' : 'Subscribe Now'}
              </button>
              {isMockToken() && (
                <p className="text-xs text-orange-600 mt-2 text-center">
                  Payments disabled in demo mode
                </p>
              )}
            </div>
          ))}
        </div>
      </div>

      {subscriptions.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Active Subscriptions</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Plan</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Start Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">End Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {subscriptions.map((sub) => (
                  <tr key={sub.sub_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{sub.plan_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{sub.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subscriptions;