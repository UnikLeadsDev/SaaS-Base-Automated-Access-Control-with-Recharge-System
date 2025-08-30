// pages/Wallet.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useWallet } from "../../context/WalletContext";
import { handleApiError } from "../../utils/errorHandler";
import {
  Wallet as WalletIcon,
  Plus,
  History,
  CreditCard,
} from "lucide-react";
import API_BASE_URL from "../../config/api";
import { useNavigate, useNavigation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";


const Wallet = () => {
  const {user} = useAuth();

  const { balance, transactions, deductAmount, addAmount } = useWallet();
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const navigate = useNavigate();

  const isMockToken = () => {
    const token = localStorage.getItem("token");
    return token && (token.startsWith("mock_jwt_token_") || token.includes('demo'));
  };

  const isDemoMode = isMockToken();

  const handleRecharge = async () => {
    console.log(transactions);
    if (!rechargeAmount || rechargeAmount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // Demo mode: simulate a successful recharge without backend calls
      if (isDemoMode) {
        const simulatedTxnId = "demo_txn_" + Date.now();
        const amountNum = parseFloat(rechargeAmount);

        addAmount(amountNum, "Wallet Recharge (Demo)");
        toast.success("Payment successful! Wallet recharged (Demo)");
        setRechargeAmount("");
        setShowRecharge(false);

        navigate("/receipt", {
          state: {
            txnId: simulatedTxnId,
            amount: amountNum,
            paymentMode: "demo",
          },
        });
        return;
      }

      const orderResponse = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { amount: parseFloat(rechargeAmount) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = orderResponse.data;

      const options = {
        key,
        amount,
        currency,
        name: "SaaS Base",
        description: "Wallet Recharge",
        order_id: orderId,
    handler: async (response) => {
  try {
    // ✅ Step 1: Verify payment with backend
    await axios.post(
      `${API_BASE_URL}/payment/verify`,
      {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // ✅ Step 2: Create receipt in DB
    // ✅ Step 2: Create receipt in DB
await axios.post(
  `${API_BASE_URL}/receipts/receipt`,
  {
    txnId: response.razorpay_payment_id,
    amount: parseFloat(amount) / 100,
    paymentMode: "razorpay",
    userName: user?.name,   // 👈 sending userName
    userEmail: user?.email, // 👈 sending userEmail
  },
  { headers: { Authorization: `Bearer ${token}` } }
);


    // ✅ Step 3: Success feedback
    toast.success("Payment successful! Wallet recharged.");
    setRechargeAmount("");
    setShowRecharge(false);

    // ✅ Step 4: Update balance in context
     const paymentTxnId = response.razorpay_payment_id;
    addAmount(parseFloat(amount) / 100, "Wallet Recharge", paymentTxnId);

    // ✅ Step 5: Navigate to Receipt page
    navigate("/receipt", {
      state: {
        txnId: response.razorpay_payment_id,
        amount: parseFloat(amount) / 100,
        paymentMode: "razorpay",
      },
    });
  } catch (error) {
    handleApiError(error);
  }
},

        prefill: {
          name: "User Name",
          email: "user@example.com",
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

 return (
  <div className="space-y-6">
    {/* Wallet Balance */}
    <div className="bg-white shadow rounded-lg">
      <div className="px-3 py-4 sm:p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        
        {/* Left: Wallet Icon + Heading */}
        <div className="flex items-center space-x-3 mb-4 sm:mb-0">
          <WalletIcon className="h-10 w-10 text-gray-400" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">Wallet Balance</h3>
            <p className="text-sm text-gray-500">Your current wallet balance</p>
          </div>
        </div>

        {/* Right: Balance + Button */}
        <div className="sm:text-right text-center w-full sm:w-auto">
          <div className="text-2xl sm:text-3xl font-bold text-green-600">
            ₹{balance?.toFixed(2) || "0.00"}
          </div>
          <div className="text-sm text-green-600 mb-3">Status: active</div>

          <button
            onClick={() => setShowRecharge(true)}
            className={`px-4 py-2 rounded-md shadow flex items-center justify-center w-full sm:w-auto mx-auto ${
              isDemoMode 
                ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
            disabled={isDemoMode}
          >
            <Plus className="h-4 w-4 mr-2" /> 
            {isDemoMode ? 'Recharge (Demo Mode)' : 'Recharge Wallet'}
          </button>

          {isDemoMode && (
            <p className="text-xs text-orange-600 mt-2">
              Payments disabled in demo mode
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Recharge Modal */}
    {showRecharge && (
      <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-start pt-20 z-50">
        <div className="bg-white rounded-md shadow-lg p-6 w-11/12 sm:w-96">
          <h3 className="text-lg font-medium mb-4">Recharge Wallet</h3>
          <input
            type="number"
            value={rechargeAmount}
            onChange={(e) => setRechargeAmount(e.target.value)}
            className="w-full px-3 py-2 border rounded-md mb-4"
            placeholder="Enter amount"
            min="1"
          />
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
            <button
              onClick={handleRecharge}
              disabled={loading || isDemoMode}
              className={`flex-1 px-4 py-2 rounded-md disabled:opacity-50 flex items-center justify-center ${
                isDemoMode 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-indigo-600 text-white hover:bg-indigo-700'
              }`}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {loading ? "Processing..." : isDemoMode ? "Demo Mode" : "Pay Now"}
            </button>
            <button
              onClick={() => setShowRecharge(false)}
              className="px-4 py-2 border rounded-md bg-white"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    )}

    {/* Transaction History */}
    <div className="bg-white shadow rounded-lg p-4 sm:p-6">
      <div className="flex items-center mb-4">
        <History className="h-5 w-5 text-gray-400 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Transaction History</h3>
      </div>

      {/* Mobile View: Cards */}
      <div className="sm:hidden space-y-4">
        {(transactions || []).map((txn) => (
          <div key={txn.txn_id} className="border rounded-md p-3">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Date:</span>
              {new Date(txn.date).toLocaleDateString()}
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Type:</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                txn.type === "credit"
                  ? "bg-green-100 text-green-800"
                  : "bg-red-100 text-red-800"
              }`}>
                {txn.type}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Amount:</span> ₹{txn.amount}
            </div>
            <div className="flex justify-between text-sm">
              <span className="font-medium">Reference:</span> {txn.txn_ref || "-"}
            </div>
          </div>
        ))}
      </div>

      {/* Desktop View: Table */}
      <div className="hidden sm:block">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium">Date</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium">Reference</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {(transactions || []).map((txn) => (
              <tr key={txn.txn_id}>
                <td className="px-6 py-4 text-sm">
                  {new Date(txn.date).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      txn.type === "credit"
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800"
                    }`}
                  >
                    {txn.type}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">₹{txn.amount}</td>
                <td className="px-6 py-4 text-sm">{txn.txn_ref || "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(!transactions || transactions.length === 0) && (
        <div className="text-center py-6 text-gray-500">
          No transactions found
        </div>
      )}
    </div>
  </div>
);

};

export default Wallet;
