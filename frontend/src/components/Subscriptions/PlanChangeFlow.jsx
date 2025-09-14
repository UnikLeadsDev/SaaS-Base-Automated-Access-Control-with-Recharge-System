import { useState, useEffect } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Calculator, CreditCard } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const PlanChangeFlow = ({ currentSubscription, onPlanChanged }) => {
  const [plans, setPlans] = useState([]);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [prorationDetails, setProrationDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      if (response.data.success) {
        setPlans(response.data.plans.filter(plan => plan.plan_id !== currentSubscription?.plan_id));
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
    }
  };

  const calculateProration = async (newPlanId) => {
    if (!currentSubscription) return;
    
    setCalculating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API_BASE_URL}/subscription/calculate-proration`, {
        currentSubscriptionId: currentSubscription.sub_id,
        newPlanId: newPlanId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setProrationDetails(response.data.proration);
      }
    } catch (error) {
      toast.error('Failed to calculate proration');
      console.error('Proration calculation error:', error);
    } finally {
      setCalculating(false);
    }
  };

  const handlePlanChange = async (newPlanId) => {
    if (!currentSubscription) return;
    
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create order for plan change
      const response = await axios.post(`${API_BASE_URL}/subscription/change-plan`, {
        currentSubscriptionId: currentSubscription.sub_id,
        newPlanId: newPlanId
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const { orderId, amount, currency, key, isUpgrade } = response.data;

      if (amount <= 0) {
        // Downgrade or no payment required
        toast.success('Plan changed successfully!');
        onPlanChanged?.();
        return;
      }

      // Payment required for upgrade
      const options = {
        key,
        amount,
        currency,
        name: 'SaaS Base',
        description: `Plan ${isUpgrade ? 'Upgrade' : 'Change'}`,
        order_id: orderId,
        handler: async (res) => {
          try {
            const verifyResponse = await axios.post(`${API_BASE_URL}/subscription/verify-plan-change`, {
              razorpay_order_id: res.razorpay_order_id,
              razorpay_payment_id: res.razorpay_payment_id,
              razorpay_signature: res.razorpay_signature,
              subscriptionId: currentSubscription.sub_id,
              newPlanId: newPlanId
            }, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (verifyResponse.data.success) {
              toast.success('Plan changed successfully!');
              onPlanChanged?.();
            } else {
              toast.error('Payment verification failed');
            }
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: localStorage.getItem('userName'),
          email: localStorage.getItem('userEmail')
        },
        theme: { color: '#4F46E5' },
        modal: {
          ondismiss: () => setLoading(false)
        }
      };

      new window.Razorpay(options).open();
    } catch (error) {
      toast.error('Failed to initiate plan change');
      console.error('Plan change error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    calculateProration(plan.plan_id);
  };

  const isUpgrade = (plan) => {
    return currentSubscription && plan.amount > currentSubscription.amount;
  };

  const isDowngrade = (plan) => {
    return currentSubscription && plan.amount < currentSubscription.amount;
  };

  if (!currentSubscription) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">No active subscription found. Please subscribe to a plan first.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Change Subscription Plan</h3>
        <Calculator className="h-5 w-5 text-indigo-600" />
      </div>

      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Current Plan</h4>
        <p className="text-blue-800">{currentSubscription.plan_name} - ${currentSubscription.amount}</p>
        <p className="text-sm text-blue-600">
          Valid until: {new Date(currentSubscription.end_date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        {plans.map(plan => (
          <div
            key={plan.plan_id}
            className={`border rounded-lg p-4 cursor-pointer transition-all ${
              selectedPlan?.plan_id === plan.plan_id 
                ? 'border-indigo-500 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onClick={() => handlePlanSelect(plan)}
          >
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">{plan.plan_name}</h4>
              <div className="flex items-center">
                {isUpgrade(plan) && <ArrowUpCircle className="h-4 w-4 text-green-500 mr-1" />}
                {isDowngrade(plan) && <ArrowDownCircle className="h-4 w-4 text-orange-500 mr-1" />}
                <span className="font-bold text-indigo-600">${plan.amount}</span>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-2">{plan.duration_days} days validity</p>
            <div className="flex items-center text-xs">
              <span className={`px-2 py-1 rounded-full ${
                isUpgrade(plan) ? 'bg-green-100 text-green-700' :
                isDowngrade(plan) ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-700'
              }`}>
                {isUpgrade(plan) ? 'Upgrade' : isDowngrade(plan) ? 'Downgrade' : 'Same Tier'}
              </span>
            </div>
          </div>
        ))}
      </div>

      {selectedPlan && (
        <div className="border-t pt-6">
          <h4 className="font-medium text-gray-800 mb-4">Proration Details</h4>
          
          {calculating ? (
            <div className="animate-pulse bg-gray-200 h-20 rounded-lg"></div>
          ) : prorationDetails ? (
            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Current plan remaining value:</span>
                  <span>${prorationDetails.remainingValue}</span>
                </div>
                <div className="flex justify-between">
                  <span>New plan cost:</span>
                  <span>${prorationDetails.newPlanCost}</span>
                </div>
                <div className="flex justify-between font-medium border-t pt-2">
                  <span>{prorationDetails.amountToPay > 0 ? 'Amount to pay:' : 'Refund amount:'}</span>
                  <span className={prorationDetails.amountToPay > 0 ? 'text-red-600' : 'text-green-600'}>
                    ${Math.abs(prorationDetails.amountToPay)}
                  </span>
                </div>
              </div>
            </div>
          ) : null}

          <button
            onClick={() => handlePlanChange(selectedPlan.plan_id)}
            disabled={loading || calculating}
            className="w-full inline-flex justify-center items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            <CreditCard className="h-4 w-4 mr-2" />
            {loading ? 'Processing...' : `Change to ${selectedPlan.plan_name}`}
          </button>
        </div>
      )}
    </div>
  );
};

export default PlanChangeFlow;