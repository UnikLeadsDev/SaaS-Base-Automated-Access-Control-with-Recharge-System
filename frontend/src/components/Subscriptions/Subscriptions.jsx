import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { CreditCard, Calendar, CheckCircle, Settings, X, AlertCircle, BarChart3, ArrowUpDown } from 'lucide-react';
import API_BASE_URL from '../../config/api.js';
import EmptyBox from '../Common/EmptyBox';
import SubscriptionUsage from './SubscriptionUsage';
import SubscriptionPreferences from './SubscriptionPreferences';
import PlanChangeFlow from './PlanChangeFlow';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [preferences, setPreferences] = useState({ auto_renewal: false, preferred_plan_id: null, notification_days_before: 7 });
  const [showPreferences, setShowPreferences] = useState(false);
  const [showUsage, setShowUsage] = useState(false);
  const [showPlanChange, setShowPlanChange] = useState(false);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
    fetchPreferences();
  }, []);

  const token = localStorage.getItem('token');
  const isMockToken = token && token.startsWith('mock_jwt_token_');

  const fetchPlans = async () => {
    if (!token || isMockToken) return;

    try {
      const { data } = await axios.get(`${API_BASE_URL}/subscription/plans`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setPlans(data.plans || []);
    } catch (err) { console.error(err); }
  };

  const fetchSubscriptions = async () => {
    if (!token || isMockToken) return;

    try {
      const { data } = await axios.get(`${API_BASE_URL}/subscription/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        setSubscriptions(data.subscriptions || []);
        const activeSub = data.subscriptions?.find(s => ['active', 'grace'].includes(s.status));
        if (activeSub) setCurrentSubscription(activeSub);
      }
    } catch (err) { console.error(err); }
  };

  const fetchPreferences = async () => {
    if (!token || isMockToken) return;

    try {
      const { data } = await axios.get(`${API_BASE_URL}/subscription/preferences`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) setPreferences(data.preferences);
    } catch (err) { console.error(err); }
  };

  const updatePreferences = async () => {
    try {
      const { data } = await axios.put(`${API_BASE_URL}/subscription/preferences`, preferences, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Preferences updated successfully');
        setShowPreferences(false);
      }
    } catch (err) {
      toast.error('Failed to update preferences');
    }
  };

  const cancelSubscription = async (subId) => {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    try {
      const { data } = await axios.put(`${API_BASE_URL}/subscription/cancel/${subId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (data.success) {
        toast.success('Subscription cancelled successfully');
        fetchSubscriptions();
      }
    } catch (err) {
      toast.error('Failed to cancel subscription');
    }
  };

  const subscribeToPlan = async (plan) => {
    if (!token || isMockToken) {
      toast.error('Real payment required.');
      return;
    }
    setPaymentLoading(true);

    try {
      const { data } = await axios.post(
        `${API_BASE_URL}/subscription/create`,
        { planId: plan.plan_id },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );

      const { orderId, amount, currency, key } = data;

      const options = {
        key,
        amount,
        currency,
        name: 'SaaS Base',
        description: `Subscription to ${plan.plan_name}`,
        order_id: orderId,
        handler: async (res) => {
          try {
            const verify = await axios.post(
              `${API_BASE_URL}/subscription/verify-payment`,
              {
                razorpay_order_id: res.razorpay_order_id,
                razorpay_payment_id: res.razorpay_payment_id,
                razorpay_signature: res.razorpay_signature,
                planId: plan.plan_id
              },
              { 
                headers: { 
                  Authorization: `Bearer ${token}`,
                  'X-Requested-With': 'XMLHttpRequest'
                } 
              }
            );
            if (verify.data.success) {
              toast.success('Subscription activated!');
              fetchSubscriptions();
            } else toast.error('Payment verification failed');
          } catch { toast.error('Payment verification failed'); }
          finally { setPaymentLoading(false); }
        },
        prefill: { name: localStorage.getItem('userName'), email: localStorage.getItem('userEmail') },
        theme: { color: '#4F46E5' },
        modal: { ondismiss: () => setPaymentLoading(false) }
      };

      new window.Razorpay(options).open();
    } catch (err) { toast.error('Failed to initiate payment'); setPaymentLoading(false); }
  };

  const handlePlanChanged = () => {
    fetchSubscriptions();
    setShowPlanChange(false);
  };

  return (
    <div className="space-y-6">

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="bg-white shadow rounded-lg p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Current Subscription</h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowUsage(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-blue-100 hover:bg-blue-200 rounded-md"
              >
                <BarChart3 className="h-4 w-4 mr-1" /> Usage
              </button>
              <button
                onClick={() => setShowPlanChange(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-green-100 hover:bg-green-200 rounded-md"
              >
                <ArrowUpDown className="h-4 w-4 mr-1" /> Change Plan
              </button>
              <button
                onClick={() => setShowPreferences(true)}
                className="inline-flex items-center px-3 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                <Settings className="h-4 w-4 mr-1" /> Preferences
              </button>
            </div>
          </div>
          <div className={`border rounded-lg p-4 flex justify-between ${
            currentSubscription.status === 'active' ? 'bg-green-50 border-green-200' : 
            currentSubscription.status === 'grace' ? 'bg-yellow-50 border-yellow-200' : 'bg-red-50 border-red-200'
          }`}>
            <div>
              <h3 className={`font-semibold ${
                currentSubscription.status === 'active' ? 'text-green-900' : 
                currentSubscription.status === 'grace' ? 'text-yellow-900' : 'text-red-900'
              }`}>{currentSubscription.plan_name}</h3>
              <p className={`text-sm ${
                currentSubscription.status === 'active' ? 'text-green-700' : 
                currentSubscription.status === 'grace' ? 'text-yellow-700' : 'text-red-700'
              }`}>Status: {currentSubscription.status.toUpperCase()}</p>
              <p className={`text-sm ${
                currentSubscription.status === 'active' ? 'text-green-700' : 
                currentSubscription.status === 'grace' ? 'text-yellow-700' : 'text-red-700'
              }`}>
                Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
              </p>
              {currentSubscription.status === 'grace' && (
                <p className="text-sm text-yellow-700 flex items-center mt-1">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  Grace period - Renew soon to avoid service interruption
                </p>
              )}
            </div>
            {currentSubscription.status === 'active' && (
              <button
                onClick={() => cancelSubscription(currentSubscription.sub_id)}
                className="text-red-600 hover:text-red-800 text-sm font-medium"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
        {plans?.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {plans.map(plan => {
              const isCurrentPlan = currentSubscription?.plan_id === plan.plan_id;
              const features = [
                `${plan.duration_days} days validity`,
                plan.basic_form_limit === -1 ? 'Unlimited basic forms' : `${plan.basic_form_limit} basic forms`,
                plan.realtime_form_limit === -1 ? 'Unlimited realtime forms' : `${plan.realtime_form_limit} realtime forms`,
                plan.api_access ? 'API Access' : 'No API Access',
                plan.priority_support ? 'Priority Support' : 'Standard Support'
              ];
              
              return (
                <div key={plan.plan_id} className={`border p-6 rounded-lg ${isCurrentPlan ? 'border-green-500 bg-green-50' : ''}`}>
                  <div className="flex justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">{plan.plan_name}</h3>
                      {isCurrentPlan && <span className="text-xs text-green-600 font-medium">Current Plan</span>}
                    </div>
                    <span className="text-indigo-600 font-bold">${plan.amount}</span>
                  </div>
                  <div className="mb-4">
                    <ul className="space-y-1">
                      {features.map((f, i) => (
                        <li key={i} className="flex items-center text-sm text-gray-600">
                          <CheckCircle className="h-4 w-4 text-green-500 mr-2" /> {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    onClick={() => subscribeToPlan(plan)}
                    disabled={paymentLoading || loading || isMockToken || isCurrentPlan}
                    className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white ${
                      isCurrentPlan ? 'bg-gray-400 cursor-not-allowed' :
                      isMockToken ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                    }`}
                  >
                    <CreditCard className="h-4 w-4 mr-2" />
                    {isCurrentPlan ? 'Active Plan' : isMockToken ? 'Subscribe (Demo Mode)' : 'Subscribe Now'}
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyBox message="" size={100} />
        )}
      </div>

      {/* User Subscriptions */}
      {subscriptions?.length > 0 && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Your Subscriptions</h3>
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
                {subscriptions?.map(sub => (
                  <tr key={sub.sub_id}>
                    <td className="px-6 py-4 text-sm font-medium">{sub.plan_name}</td>
                    <td className="px-6 py-4 text-sm">${sub.amount}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 
                        sub.status === 'grace' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>{sub.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage Modal */}
      {showUsage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Subscription Usage Analytics</h3>
              <button onClick={() => setShowUsage(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <SubscriptionUsage />
            </div>
          </div>
        </div>
      )}

      {/* Plan Change Modal */}
      {showPlanChange && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Change Subscription Plan</h3>
              <button onClick={() => setShowPlanChange(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <PlanChangeFlow 
                currentSubscription={currentSubscription} 
                onPlanChanged={handlePlanChanged}
              />
            </div>
          </div>
        </div>
      )}

      {/* Preferences Modal */}
      {showPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b">
              <h3 className="text-lg font-semibold">Subscription Preferences</h3>
              <button onClick={() => setShowPreferences(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6">
              <SubscriptionPreferences />
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Subscriptions;