import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useWallet } from '../../context/WalletContext';
import { Wallet, FileText, AlertCircle, TrendingUp } from 'lucide-react';
import apiWrapper from '../../utils/apiWrapper.js';
import toast from 'react-hot-toast';
import API_BASE_URL from '../../config/api';

const Dashboard = () => {
  const { user } = useAuth();
  const { transactions } = useWallet(); // keep transactions from context if you want
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

  useEffect(() => {
    fetchDashboardData();
  }, [transactions]); // re-run when transactions change

  const fetchDashboardData = async () => {
    try {
      const response = await apiWrapper.get(`${API_BASE_URL}/wallet/balance`);
      // backend returns: { balance: "105.00", status: "active", validUntil: null }
      const data = response.data;

      const balance = parseFloat(data.balance); // convert string → number

      setStats({
        balance: balance,
        accessType: data.status === 'active' ? 'prepaid' : 'blocked',
        canSubmitBasic: balance >= 5,
        canSubmitRealtime: balance >= 50,
        rates: { basic: 5, realtime: 50 },
        totalApplications: 0, // if you have API for this, replace here
        recentTransactions: transactions.slice(0, 5) // still using context for txn
      });
    } catch (err) {
      toast.error("Failed to fetch wallet balance");
      console.error("Error fetching wallet balance:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64">Loading...</div>;
  }

  return (
  <div className="min-h-screen bg-gray-50 p-6">
    {/* Top Section */}
    <div className="flex justify-between items-center mb-8">
      <div>
        <h1 className="text-3xl  font-bold text-gray-800">Recharge Wallet Dashboard</h1>
        <p className="text-sm text-gray-500">Welcome, <span className="font-medium">{user?.name}</span> ({user?.role})</p>
      </div>
      {/* Optional: Add search, notifications, settings icons here */}
    </div>

    {/* Overview Cards */}
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <Wallet className="h-6 w-6" />
          <span className="text-sm">Wallet Balance</span>
        </div>
        <p className="text-2xl font-bold mt-2">₹{stats.balance}</p>
      </div>

      <div className="bg-gradient-to-r from-green-400 to-teal-500 text-white p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <FileText className="h-6 w-6" />
          <span className="text-sm">Applications</span>
        </div>
        <p className="text-2xl font-bold mt-2">{stats.totalApplications}</p>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-5 rounded-xl shadow-md">
        <div className="flex items-center gap-4">
          <TrendingUp className="h-6 w-6" />
          <span className="text-sm">Access Type</span>
        </div>
        <p className="text-lg font-semibold mt-2 capitalize">{stats.accessType}</p>
      </div>

      <div className={`p-5 rounded-xl shadow-md ${stats.canSubmitBasic ? 'bg-green-100' : 'bg-red-100'}`}>
        <div className="flex items-center gap-4">
          <AlertCircle className={`h-6 w-6 ${stats.canSubmitBasic ? 'text-green-600' : 'text-red-600'}`} />
          <span className="text-sm text-gray-700">Form Access</span>
        </div>
        <p className={`text-lg font-bold mt-2 ${stats.canSubmitBasic ? 'text-green-700' : 'text-red-700'}`}>
          {stats.canSubmitBasic ? 'Active' : 'Blocked'}
        </p>
      </div>
    </div>

    {/* Two-Column Section */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Access Status */}
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Form Access Status</h3>
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
      <div className="bg-white p-6 rounded-xl shadow-md">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Recent Transactions</h3>
        <div className="space-y-4">
          {stats.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.map((txn) => (
              <div key={txn.txn_id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    {txn.type === 'credit' ? '+' : '-'}₹{txn.amount}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(txn.date).toLocaleDateString()}
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
            <p className="text-gray-500 text-sm">No transactions yet</p>
          )}
        </div>
      </div>
    </div>
  </div>
);

};

export default Dashboard;
