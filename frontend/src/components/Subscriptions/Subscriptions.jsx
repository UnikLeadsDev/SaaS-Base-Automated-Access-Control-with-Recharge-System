import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { CreditCard, Calendar, CheckCircle } from 'lucide-react';
import API_BASE_URL from '../../config/api.js';

const Subscriptions = () => {
  const [subscriptions, setSubscriptions] = useState([]);
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [loading, setLoading] = useState(false);
  const [paymentLoading, setPaymentLoading] = useState(false);

  useEffect(() => {
    fetchPlans();
    fetchSubscriptions();
  }, []);

  const token = localStorage.getItem('token');
  const isMockToken = token && token.startsWith('mock_jwt_token_');

  // Fetch all available subscription plans
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
      const activeSub = data.subscriptions?.find(s => s.status === 'active');
      if (activeSub) setCurrentSubscription(activeSub);
    }
  } catch (err) { console.error(err); }
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
      { planId: plan.plan_id }, // note: plan.plan_id
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
      description: `Subscription to ${plan.name}`,
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


  return (
    <div className="space-y-6">

      {/* Current Subscription */}
      {currentSubscription && (
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-bold mb-4">Current Subscription</h2>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex justify-between">
            <div>
              <h3 className="font-semibold text-green-900">{currentSubscription.plan_name}</h3>
              <p className="text-sm text-green-700">Status: {currentSubscription.status}</p>
              <p className="text-sm text-green-700">
                Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Available Plans */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-2xl font-bold mb-6">Subscription Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {plans?.map(plan => (
            <div key={plan.id} className="border p-6 rounded-lg">
              <div className="flex justify-between mb-4">
                <h3 className="font-semibold">{plan.name}</h3>
                <span className="text-indigo-600 font-bold">₹{plan.amount}</span>
              </div>
              <div className="mb-4">
                <div className="flex items-center text-sm text-gray-500 mb-2">
                  <Calendar className="h-4 w-4 mr-1" />
                  {plan.duration} days validity
                </div>
                <ul className="space-y-1">
                  {plan.features?.map((f, i) => (
                    <li key={i} className="flex items-center text-sm text-gray-600">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-1" /> {f}
                    </li>
                  ))}
                </ul>
              </div>
              <button
                onClick={() => subscribeToPlan(plan)}
                disabled={paymentLoading || loading || isMockToken}
                className={`w-full inline-flex justify-center items-center px-4 py-2 rounded-md text-white ${
                  isMockToken ? 'bg-gray-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'
                }`}
              >
                <CreditCard className="h-4 w-4 mr-2" />
                {isMockToken ? 'Subscribe (Demo Mode)' : 'Subscribe Now'}
              </button>
            </div>
          ))}
        </div>
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
                    <td className="px-6 py-4 text-sm">₹{sub.amount}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sub.start_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">{new Date(sub.end_date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        sub.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>{sub.status}</span>
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
