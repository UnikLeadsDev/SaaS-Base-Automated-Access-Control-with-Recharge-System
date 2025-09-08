import { useState, useEffect } from 'react';
import { BarChart3, Calendar, TrendingUp, FileText } from 'lucide-react';
import axios from 'axios';
import API_BASE_URL from '../../config/api';

const SubscriptionUsage = () => {
  const [usage, setUsage] = useState({
    formsSubmittedThisMonth: 0,
    remainingDays: 0,
    basicFormsUsed: 0,
    realtimeFormsUsed: 0,
    basicFormsLimit: 0,
    realtimeFormsLimit: 0,
    totalSpent: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsageData();
  }, []);

  const fetchUsageData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const response = await axios.get(`${API_BASE_URL}/subscription/usage`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch usage data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="animate-pulse bg-gray-200 h-48 rounded-lg"></div>;
  }

  const getUsagePercentage = (used, limit) => {
    if (limit === -1) return 0; // Unlimited
    return limit > 0 ? Math.min((used / limit) * 100, 100) : 0;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-800">Subscription Usage</h3>
        <BarChart3 className="h-5 w-5 text-indigo-600" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <FileText className="h-8 w-8 text-blue-600" />
            <span className="text-2xl font-bold text-blue-600">{usage.formsSubmittedThisMonth}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Forms This Month</p>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <Calendar className="h-8 w-8 text-green-600" />
            <span className="text-2xl font-bold text-green-600">{usage.remainingDays}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Days Remaining</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <span className="text-2xl font-bold text-purple-600">₹{usage.totalSpent}</span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total Spent</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <BarChart3 className="h-8 w-8 text-orange-600" />
            <span className="text-2xl font-bold text-orange-600">
              {usage.basicFormsUsed + usage.realtimeFormsUsed}
            </span>
          </div>
          <p className="text-sm text-gray-600 mt-2">Total Forms</p>
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Basic Forms</span>
            <span className="text-sm text-gray-600">
              {usage.basicFormsUsed} / {usage.basicFormsLimit === -1 ? '∞' : usage.basicFormsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getUsagePercentage(usage.basicFormsUsed, usage.basicFormsLimit)}%` }}
            ></div>
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Realtime Forms</span>
            <span className="text-sm text-gray-600">
              {usage.realtimeFormsUsed} / {usage.realtimeFormsLimit === -1 ? '∞' : usage.realtimeFormsLimit}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getUsagePercentage(usage.realtimeFormsUsed, usage.realtimeFormsLimit)}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionUsage;