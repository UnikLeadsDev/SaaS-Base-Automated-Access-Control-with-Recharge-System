import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Users, DollarSign, FileText, AlertTriangle } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalRevenue: 0,
    totalApplications: 0,
    lowBalanceUsers: 0
  });
  const [users, setUsers] = useState([]);
  const [manualPayment, setManualPayment] = useState({
    userId: '',
    amount: '',
    txnRef: '',
    source: 'cash',
    reason: ''
  });
  const [transactionSearch, setTransactionSearch] = useState({
    transactionId: '',
    result: null,
    loading: false
  });
  const [paymentUpdate, setPaymentUpdate] = useState({
    transactionId: '',
    status: 'success',
    amount: '',
    reason: ''
  });

  useEffect(() => {
    fetchStats();
    fetchUsers();
  }, []);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats');
    }
  };

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:5000/api/admin/users', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUsers(response.data.users || response.data);
    } catch (error) {
      console.error('Failed to fetch users');
    }
  };

  const updateManualPayment = async () => {
    if (!manualPayment.userId || !manualPayment.amount || !manualPayment.txnRef) {
      toast.error('Please fill all fields');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:5000/api/admin/manual-payment',
        {
          userId: manualPayment.userId,
          amount: parseFloat(manualPayment.amount),
          txnRef: manualPayment.txnRef,
          source: manualPayment.source,
          reason: manualPayment.reason
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );
      
      toast.success('Manual payment updated successfully');
      setManualPayment({ userId: '', amount: '', txnRef: '', source: 'cash', reason: '' });
      fetchStats();
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment');
    }
  };

  const searchTransaction = async () => {
    if (!transactionSearch.transactionId.trim()) {
      toast.error('Please enter transaction ID');
      return;
    }

    setTransactionSearch(prev => ({ ...prev, loading: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:5000/api/admin/transaction/${transactionSearch.transactionId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      setTransactionSearch(prev => ({ 
        ...prev, 
        result: response.data.transaction,
        loading: false 
      }));
      
      // Pre-fill payment update form
      setPaymentUpdate({
        transactionId: response.data.transaction.txn_ref,
        status: 'success',
        amount: response.data.transaction.amount,
        reason: ''
      });
    } catch (error) {
      setTransactionSearch(prev => ({ ...prev, loading: false, result: null }));
      toast.error(error.response?.data?.message || 'Transaction not found');
    }
  };

  const updatePaymentStatus = async () => {
    if (!paymentUpdate.transactionId) {
      toast.error('Please search for a transaction first');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/admin/transaction/${paymentUpdate.transactionId}`,
        {
          status: paymentUpdate.status,
          amount: paymentUpdate.amount,
          reason: paymentUpdate.reason
        },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );
      
      toast.success('Payment status updated successfully');
      setPaymentUpdate({ transactionId: '', status: 'success', amount: '', reason: '' });
      setTransactionSearch({ transactionId: '', result: null, loading: false });
      fetchStats();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update payment status');
    }
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'active' ? 'blocked' : 'active';
      
      await axios.put(
        `http://localhost:5000/api/admin/users/${userId}/status`,
        { status: newStatus },
        { 
          headers: { 
            Authorization: `Bearer ${token}`,
            'X-Requested-With': 'XMLHttpRequest'
          } 
        }
      );
      
      toast.success(`User ${newStatus} successfully`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to update user status');
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <Users className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Users</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <DollarSign className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Total Revenue</dt>
                  <dd className="text-lg font-medium text-gray-900">₹{stats.totalRevenue}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FileText className="h-6 w-6 text-gray-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Applications</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.totalApplications}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white overflow-hidden shadow rounded-lg">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <AlertTriangle className="h-6 w-6 text-red-400" />
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">Low Balance</dt>
                  <dd className="text-lg font-medium text-gray-900">{stats.lowBalanceUsers}</dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Manual Payment Update */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Manual Payment Update</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <select
            value={manualPayment.userId}
            onChange={(e) => setManualPayment({ ...manualPayment, userId: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="">Select User</option>
            {(users || []).map((user) => (
              <option key={user.user_id} value={user.user_id}>
                {user.name} ({user.email})
              </option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Amount"
            value={manualPayment.amount}
            onChange={(e) => setManualPayment({ ...manualPayment, amount: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <input
            type="text"
            placeholder="Transaction Reference"
            value={manualPayment.txnRef}
            onChange={(e) => setManualPayment({ ...manualPayment, txnRef: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <select
            value={manualPayment.source}
            onChange={(e) => setManualPayment({ ...manualPayment, source: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="card">Card</option>
            <option value="netbanking">Net Banking</option>
            <option value="wallet">Wallet</option>
            <option value="other">Other</option>
          </select>
          <input
            type="text"
            placeholder="Reason (optional)"
            value={manualPayment.reason}
            onChange={(e) => setManualPayment({ ...manualPayment, reason: e.target.value })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
          <button
            onClick={updateManualPayment}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            Add Payment
          </button>
        </div>
      </div>

      {/* Transaction Search & Update */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Management</h3>
        
        {/* Search Transaction */}
        <div className="mb-6">
          <h4 className="text-md font-medium text-gray-700 mb-3">Search Transaction</h4>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Transaction ID or Reference"
              value={transactionSearch.transactionId}
              onChange={(e) => setTransactionSearch({ ...transactionSearch, transactionId: e.target.value })}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={searchTransaction}
              disabled={transactionSearch.loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
            >
              {transactionSearch.loading ? 'Searching...' : 'Search'}
            </button>
          </div>
        </div>

        {/* Transaction Details */}
        {transactionSearch.result && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="text-md font-medium text-gray-700 mb-3">Transaction Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-600">Transaction ID:</span>
                <p className="text-gray-900">{transactionSearch.result.txn_id}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Reference:</span>
                <p className="text-gray-900">{transactionSearch.result.txn_ref}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">User:</span>
                <p className="text-gray-900">{transactionSearch.result.name}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Email:</span>
                <p className="text-gray-900">{transactionSearch.result.email}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Amount:</span>
                <p className="text-gray-900">₹{transactionSearch.result.amount}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Type:</span>
                <p className="text-gray-900 capitalize">{transactionSearch.result.type}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Payment Mode:</span>
                <p className="text-gray-900 capitalize">{transactionSearch.result.payment_mode}</p>
              </div>
              <div>
                <span className="font-medium text-gray-600">Current Balance:</span>
                <p className="text-gray-900">₹{transactionSearch.result.current_balance}</p>
              </div>
            </div>
          </div>
        )}

        {/* Update Payment Status */}
        {transactionSearch.result && (
          <div>
            <h4 className="text-md font-medium text-gray-700 mb-3">Update Payment Status</h4>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <select
                value={paymentUpdate.status}
                onChange={(e) => setPaymentUpdate({ ...paymentUpdate, status: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="pending">Pending</option>
              </select>
              <input
                type="number"
                placeholder="Amount (optional)"
                value={paymentUpdate.amount}
                onChange={(e) => setPaymentUpdate({ ...paymentUpdate, amount: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <input
                type="text"
                placeholder="Reason"
                value={paymentUpdate.reason}
                onChange={(e) => setPaymentUpdate({ ...paymentUpdate, reason: e.target.value })}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
              <button
                onClick={updatePaymentStatus}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
              >
                Update Status
              </button>
              <button
                onClick={() => {
                  setTransactionSearch({ transactionId: '', result: null, loading: false });
                  setPaymentUpdate({ transactionId: '', status: 'success', amount: '', reason: '' });
                }}
                className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Clear
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Users Management */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Users Management</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {(users || []).map((user) => (
                <tr key={user.user_id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{user.name}</div>
                      <div className="text-sm text-gray-500">{user.email}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">₹{user.balance || 0}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => toggleUserStatus(user.user_id, user.status)}
                      className={`${
                        user.status === 'active' 
                          ? 'text-red-600 hover:text-red-900' 
                          : 'text-green-600 hover:text-green-900'
                      }`}
                    >
                      {user.status === 'active' ? 'Block' : 'Activate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;