import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { Wallet, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import apiWrapper from '../../utils/apiWrapper.js';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { balance, transactions } = useWallet();
  const [stats, setStats] = useState({
    balance: 0,
    totalApplications: 0,
    recentTransactions: [],
    accessType: 'prepaid',
    canSubmitBasic: false,
    canSubmitRealtime: false
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [balance, transactions]);

  const fetchDashboardData = async () => {
    // Always use mock data for demo mode
    setStats({
      balance: balance,
      accessType: 'prepaid',
      canSubmitBasic: balance >= 5,
      canSubmitRealtime: balance >= 50,
      rates: { basic: 5, realtime: 50 },
      totalApplications: 0,
      recentTransactions: transactions.slice(0, 5)
    });
    setLoading(false);
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Welcome, {user?.name}</h1>
        <p className="text-gray-600">Role: {user?.role}</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Wallet className="h-8 w-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Wallet Balance</p>
              <p className="text-2xl font-bold text-gray-900">₹{stats.balance}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="h-8 w-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Applications</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <TrendingUp className="h-8 w-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Access Type</p>
              <p className="text-lg font-bold text-gray-900 capitalize">{stats.accessType}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <AlertCircle className={`h-8 w-8 ${stats.canSubmitBasic ? 'text-green-600' : 'text-red-600'}`} />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Form Access</p>
              <p className={`text-lg font-bold ${stats.canSubmitBasic ? 'text-green-600' : 'text-red-600'}`}>
                {stats.canSubmitBasic ? 'Active' : 'Blocked'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Access Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Form Access Status</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span>Basic Form (₹{stats.rates?.basic})</span>
              <span className={`px-2 py-1 rounded text-sm ${
                stats.canSubmitBasic ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.canSubmitBasic ? 'Available' : 'Blocked'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span>Realtime Validation (₹{stats.rates?.realtime})</span>
              <span className={`px-2 py-1 rounded text-sm ${
                stats.canSubmitRealtime ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {stats.canSubmitRealtime ? 'Available' : 'Blocked'}
              </span>
            </div>
          </div>
          
          {!stats.canSubmitBasic && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
              <p className="text-sm text-yellow-800">
                Insufficient balance. Please recharge your wallet to continue.
              </p>
            </div>
          )}
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
          <div className="space-y-3">
            {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.map((txn) => (
                <div key={txn.txn_id} className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium">
                      {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(txn.date).toLocaleDateString()}
                    </p>
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${
                    txn.type === 'credit' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {txn.type}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-sm">No transactions yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;