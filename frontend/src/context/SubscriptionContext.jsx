import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import API_BASE_URL from '../config/api';

const SubscriptionContext = createContext();

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};

export const SubscriptionProvider = ({ children }) => {
  const [subscription, setSubscription] = useState(null);
  const [plans, setPlans] = useState([]);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);
  const [loading, setLoading] = useState(true);

  const isMockToken = () => {
    const token = localStorage.getItem('token');
    return token && token.startsWith('mock_jwt_token_');
  };

  const fetchSubscriptionStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      if (isMockToken()) {
        // Mock subscription for demo
        setSubscription({
          plan_name: 'Basic Plan',
          status: 'active',
          end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          daysRemaining: 30
        });
        setHasActiveSubscription(true);
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/subscription/status`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setSubscription(response.data.subscription);
        setHasActiveSubscription(response.data.hasActiveSubscription);
      }
    } catch (error) {
      console.error('Failed to fetch subscription status:', error);
      setHasActiveSubscription(false);
    } finally {
      setLoading(false);
    }
  };

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/subscription/plans`);
      if (response.data.success) {
        setPlans(response.data.plans);
      }
    } catch (error) {
      console.error('Failed to fetch plans:', error);
      // Mock plans for demo
      setPlans([
        { plan_id: 1, plan_name: 'Basic', amount: 999, duration_days: 30 },
        { plan_id: 2, plan_name: 'Pro', amount: 1999, duration_days: 30 },
        { plan_id: 3, plan_name: 'Enterprise', amount: 4999, duration_days: 30 }
      ]);
    }
  };

  const checkAccess = (formType) => {
    if (isMockToken()) return true; // Demo mode has full access
    return hasActiveSubscription;
  };

  const refreshSubscription = () => {
    fetchSubscriptionStatus();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchSubscriptionStatus();
      fetchPlans();
    } else {
      setLoading(false);
    }
  }, []);

  const value = {
    subscription,
    plans,
    hasActiveSubscription,
    loading,
    checkAccess,
    refreshSubscription,
    fetchPlans
  };

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
    </SubscriptionContext.Provider>
  );
};