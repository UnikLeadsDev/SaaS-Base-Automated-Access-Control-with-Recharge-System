// pages/Wallet.jsx
import { useState } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useWallet } from "../../context/WalletContext";
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
    return token && token.startsWith("mock_jwt_token_");
  };

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
      if (isMockToken()) {
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
    addAmount(parseFloat(amount) / 100, "Wallet Recharge");

    // ✅ Step 5: Navigate to Receipt page
    navigate("/receipt", {
      state: {
        txnId: response.razorpay_payment_id,
        amount: parseFloat(amount) / 100,
        paymentMode: "razorpay",
      },
    });
  } catch (error) {
    console.error(error);
    toast.error("Payment verification or receipt creation failed");
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
      console.error(error);
      toast.error("Failed to initiate payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6 flex justify-between items-center">
          <div>
            <h3 className="text-lg font-medium text-gray-900">Wallet Balance</h3>
            <p className="text-sm text-gray-500">Your current wallet balance</p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                ₹{balance?.toFixed(2) || "0.00"}
              </div>
              <div className="text-sm text-green-600">Status: active</div>
            </div>
            <WalletIcon className="h-12 w-12 text-gray-400" />
          </div>
        </div>
        <div className="px-4 py-3">
          <button
            onClick={() => setShowRecharge(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md shadow hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2 inline" /> Recharge Wallet
          </button>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex justify-center items-start pt-20 z-50">
          <div className="bg-white rounded-md shadow-lg p-6 w-96">
            <h3 className="text-lg font-medium mb-4">Recharge Wallet</h3>
            <input
              type="number"
              value={rechargeAmount}
              onChange={(e) => setRechargeAmount(e.target.value)}
              className="w-full px-3 py-2 border rounded-md mb-4"
              placeholder="Enter amount"
              min="1"
            />
            <div className="flex space-x-3">
              <button
                onClick={handleRecharge}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <CreditCard className="h-4 w-4 mr-2 inline" />
                {loading ? "Processing..." : "Pay Now"}
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
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex items-center mb-4">
          <History className="h-5 w-5 text-gray-400 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">
            Transaction History
          </h3>
        </div>
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
