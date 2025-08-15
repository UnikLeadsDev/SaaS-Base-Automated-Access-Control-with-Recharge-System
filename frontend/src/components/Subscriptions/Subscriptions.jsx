import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { CreditCard, Check, X } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const Subscriptions = () => {
  const { user } = useAuth();
  const [subscriptions, setSubscriptions] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(true);

  const plans = [
    {
      id: 'basic',
      name: 'Basic Plan',
      price: 999,
      duration: 30,
      features: ['Unlimited Basic Forms', 'Email Support', 'Basic Analytics'],
      formTypes: ['basic']
    },
    {
      id: 'premium',
      name: 'Premium Plan', 
      price: 2999,
      duration: 30,
      features: ['Unlimited All Forms', 'Priority Support', 'Advanced Analytics', 'Realtime Validation'],
      formTypes: ['basic', 'realtime_validation']
    },
    {
      id: 'enterprise',
      name: 'Enterprise Plan',
      price: 9999,
      duration: 30,
      features: ['Everything in Premium', 'Dedicated Support', 'Custom Integrations', 'API Access'],
      formTypes: ['basic', 'realtime_validation', 'custom']
    }
  ];

  useEffect(() => {
    fetchSubscriptions();
  }, []);

  const fetchSubscriptions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/subscription/current`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setCurrentSubscription(response.data);
    } catch (error) {
      console.error('Failed to fetch subscriptions:', error);
    } finally {
      setLoading(false);
    }
  };

  const subscribeToPlan = async (plan) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/subscription/create`, {
        planName: plan.name,
        amount: plan.price,
        duration: plan.duration
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Redirect to payment
      window.location.href = response.data.paymentUrl;
    } catch (error) {
      toast.error('Failed to create subscription');
    }
  };

  const cancelSubscription = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/subscription/cancel`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      toast.success('Subscription cancelled successfully');
      fetchSubscriptions();
    } catch (error) {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Subscription Plans</h1>
        <p className="text-gray-600">Choose the plan that best fits your needs</p>
      </div>

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">Current Subscription</h3>
          <div className="flex justify-between items-center">
            <div>
              <p className="font-medium">{currentSubscription.plan_name}</p>
              <p className="text-sm text-gray-600">
                Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
              </p>
              <p className="text-sm text-gray-600">
                Status: <span className="capitalize">{currentSubscription.status}</span>
              </p>
            </div>
            <button
              onClick={cancelSubscription}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Cancel Subscription
            </button>
          </div>
        </div>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <div key={plan.id} className="bg-white rounded-lg shadow-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <div className="mt-4">
                <span className="text-3xl font-bold text-gray-900">₹{plan.price}</span>
                <span className="text-gray-600">/{plan.duration} days</span>
              </div>
            </div>

            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-green-500 mr-2" />
                  <span className="text-gray-700">{feature}</span>
                </li>
              ))}
            </ul>

            <button
              onClick={() => subscribeToPlan(plan)}
              disabled={currentSubscription?.status === 'active'}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {currentSubscription?.status === 'active' ? 'Current Plan' : 'Subscribe Now'}
            </button>
          </div>
        ))}
      </div>

      {/* Prepaid Option */}
      <div className="mt-8 bg-gray-50 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Prefer Pay-Per-Use?</h3>
        <p className="text-gray-600 mb-4">
          You can also use our prepaid wallet system:
        </p>
        <ul className="space-y-2 mb-4">
          <li className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span>Basic Form: ₹5 per submission</span>
          </li>
          <li className="flex items-center">
            <Check className="h-4 w-4 text-green-500 mr-2" />
            <span>Realtime Validation: ₹50 per submission</span>
          </li>
        </ul>
        <button
          onClick={() => window.location.href = '/wallet'}
          className="bg-green-600 text-white py-2 px-4 rounded hover:bg-green-700"
        >
          Recharge Wallet
        </button>
      </div>
    </div>
  );
};

export default Subscriptions;