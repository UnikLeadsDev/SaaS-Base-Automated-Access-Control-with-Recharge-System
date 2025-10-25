import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { useSubscription } from '../../context/SubscriptionContext';
import { Wallet,  Calendar, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import apiWrapper from '../../utils/apiWrapper.js';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';
import EmptyBox from '../Common/EmptyBox';
import SubscriptionUsage from '../Subscriptions/SubscriptionUsage';

const Dashboard = () => {
  const { user } = useAuth();
  const { transactions } = useWallet();
  const { hasActiveSubscription } = useSubscription();
  const [stats, setStats] = useState({
    balance: 0,
    totalApplications: 0,
    recentTransactions: [],
    accessType: 'prepaid',
    canSubmitBasic: false,
    canSubmitRealtime: false,
    rates: { basic: 5, realtime: 50 }
  });
  const [loading, setLoading] = useState(true);

  const isMockToken = () => {
    const token = localStorage.getItem('token');
    return token && token.startsWith('mock_jwt_token_');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token && user && !isMockToken()) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [transactions, user]); // re-run when transactions change

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch both wallet and subscription data
      const [walletResponse, subscriptionResponse] = await Promise.all([
        apiWrapper.get(`${API_BASE_URL}/wallet/balance-check`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        apiWrapper.get(`${API_BASE_URL}/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` }
        }).catch(() => ({ data: { hasActiveSubscription: false } }))
      ]);

      const walletData = walletResponse.data;
      const subscriptionData = subscriptionResponse.data;

      setStats({
        balance: parseFloat(walletData.balance || 0),
        accessType: subscriptionData.hasActiveSubscription ? 'subscription' : 'wallet',
        canSubmitBasic: walletData.canSubmitBasic,
        canSubmitRealtime: walletData.canSubmitRealtime,
        rates: walletData.rates || { basic: 5, realtime: 50 },
        totalApplications: 0,
        recentTransactions: transactions.slice(0, 5),
        subscription: subscriptionData.subscription
      });
    } catch (err) {
      if (err?.response?.status === 401) {
        toast.error('Session expired or unauthorized. Please log in again.');
      } else {
        toast.error('Failed to fetch dashboard data');
      }
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
  <div className="min-h-screen bg-gray-50 p-2 sm:p-4 lg:p-6">
    {/* Top Section */}
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 sm:mb-8">
      <div>
        <p className="text-sm sm:text-lg font-medium text-indigo-600 mb-1 sm:mb-2">Welcome, {user?.name} ({user?.role})</p>
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-800">Unik Leads Dashboard</h1>
      </div>
      {/* Optional: Add search, notifications, settings icons here */}
    </div>

    {/* Overview Cards */}
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-xs sm:text-sm">Wallet Balance</span>
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2">₹ {stats.balance}</p>
      </div>

      <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <FileText className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-xs sm:text-sm">Applications</span>
        </div>
        <p className="text-lg sm:text-xl lg:text-2xl font-bold mt-1 sm:mt-2">{stats.totalApplications}</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-3 sm:p-4 lg:p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-2 sm:gap-4">
          <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="text-xs sm:text-sm">Access Type</span>
        </div>
        <p className="text-base sm:text-lg font-semibold mt-1 sm:mt-2 capitalize">{stats.accessType}</p>
      </div>

      <div className={`p-3 sm:p-4 lg:p-5 rounded-xl shadow-md ${stats.canSubmitBasic ? 'bg-green-100' : 'bg-red-100'}`}>
        <div className="flex items-center gap-2 sm:gap-4">
          <AlertCircle className={`h-5 w-5 sm:h-6 sm:w-6 ${stats.canSubmitBasic ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-xs sm:text-sm text-gray-700">Form Access</span>
        </div>
        <p className={`text-base sm:text-lg font-bold mt-1 sm:mt-2 ${stats.canSubmitBasic ? 'text-green-700' : 'text-red-700'}`}>
          {stats.canSubmitBasic ? 'Active' : 'Blocked'}
        </p>
        {stats.subscription && (
          <p className="text-xs text-gray-600 mt-1">
            {stats.subscription.planName} - {stats.subscription.status}
          </p>
        )}
      </div>
    </div>

    {/* Subscription Usage Analytics */}
    {hasActiveSubscription && (
      <div className="mb-6 sm:mb-8">
        <SubscriptionUsage />
      </div>
    )}

    {/* Two-Column Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
      {/* Form Access Status */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Form Access Status</h3>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Basic Form (₹{stats.rates?.basic})</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.canSubmitBasic ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {stats.canSubmitBasic ? 'Available' : 'Blocked'}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-gray-700">Realtime Validation (₹{stats.rates?.realtime})</span>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${
              stats.canSubmitRealtime ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
              {stats.canSubmitRealtime ? 'Available' : 'Blocked'}
            </span>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white p-4 sm:p-6 rounded-xl shadow-md">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((txn) => (
              <div key={txn.txn_id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </p>
                 <p className="flex items-center space-x-1 text-xs text-gray-500">
  <Calendar className="h-3 w-3 text-indigo-500" />
  <span>{txn.date ? new Date(txn.date).toLocaleDateString("en-IN") : "—"}</span>
</p>
                </div>
                <span className={`px-2 py-1 rounded text-xs font-medium ${
                  txn.type === 'credit' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {txn.type}
                </span>
              </div>
            ))
          ) : (
            <EmptyBox message="" size={80} />
          )}
        </div>
      </div>
    </div>
  </div>
);

};

export default Dashboard;
