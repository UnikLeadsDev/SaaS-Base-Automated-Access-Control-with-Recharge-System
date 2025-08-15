import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { Wallet as WalletIcon, Plus, History, CreditCard } from 'lucide-react';
import API_BASE_URL from '../../config/api';

const Wallet = () => {
  const [walletData, setWalletData] = useState({
    balance: 0,
    status: 'active',
    validUntil: null
  });
  const [transactions, setTransactions] = useState([]);
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);

  useEffect(() => {
    fetchWalletData();
    fetchTransactions();
  }, []);

  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setWalletData(response.data);
    } catch (error) {
      toast.error('Failed to fetch wallet data');
    }
  };

  const fetchTransactions = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTransactions(response.data);
    } catch (error) {
      console.error('Failed to fetch transactions');
    }
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount < 1) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      // Create payment order
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { amount: parseFloat(rechargeAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = orderResponse.data;

      // Initialize Razorpay
      const options = {
        key,
        amount,
        currency,
        name: 'SaaS Base',
        description: 'Wallet Recharge',
        order_id: orderId,
        handler: async (response) => {
          try {
            // Verify payment
            await axios.post(
              `${API_BASE_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            toast.success('Payment successful! Wallet recharged.');
            setRechargeAmount('');
            setShowRecharge(false);
            fetchWalletData();
            fetchTransactions();
          } catch (error) {
            toast.error('Payment verification failed');
          }
        },
        prefill: {
          name: 'User Name',
          email: 'user@example.com',
        },
        theme: {
          color: '#4F46E5',
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      toast.error('Failed to initiate payment');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg leading-6 font-medium text-gray-900">
                Wallet Balance
              </h3>
              <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>Your current wallet balance and status</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="text-3xl font-bold text-green-600">
                  ₹{walletData.balance?.toFixed(2) || '0.00'}
                </div>
                <div className={`text-sm ${walletData.status === 'active' ? 'text-green-600' : 'text-red-600'}`}>
                  Status: {walletData.status}
                </div>
              </div>
              <WalletIcon className="h-12 w-12 text-gray-400" />
            </div>
          </div>
          
          <div className="mt-5">
            <button
              onClick={() => setShowRecharge(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Recharge Wallet
            </button>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Recharge Wallet</h3>
                <button
                  onClick={() => setShowRecharge(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₹)
                </label>
                <input
                  type="number"
                  value={rechargeAmount}
                  onChange={(e) => setRechargeAmount(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                  placeholder="Enter amount"
                  min="1"
                />
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={handleRecharge}
                  disabled={loading}
                  className="flex-1 inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                >
                  <CreditCard className="h-4 w-4 mr-2" />
                  {loading ? 'Processing...' : 'Pay Now'}
                </button>
                <button
                  onClick={() => setShowRecharge(false)}
                  className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Transaction History */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center mb-4">
            <History className="h-5 w-5 text-gray-400 mr-2" />
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Transaction History
            </h3>
          </div>
          
          <div className="overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reference
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((txn) => (
                  <tr key={txn.txn_id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(txn.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        txn.type === 'credit' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {txn.type === 'credit' ? 'Credit' : 'Debit'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ₹{txn.amount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {txn.txn_ref || '-'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {transactions.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                No transactions found
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Wallet;