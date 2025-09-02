// pages/Wallet.jsx
import { useState, useEffect } from "react";
import { toast } from "react-hot-toast";
import axios from "axios";
import { useWallet } from "../../context/WalletContext";
import { handleApiError } from "../../utils/errorHandler";
import { Wallet as WalletIcon, Plus, History, CreditCard, RefreshCw } from "lucide-react";
import API_BASE_URL from "../../config/api";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import EmptyBox from "../Common/EmptyBox";

const Wallet = () => {
  const { user } = useAuth();
  const { balance, transactions, addAmount, fetchWalletData } = useWallet();
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [showRecharge, setShowRecharge] = useState(false);
  const navigate = useNavigate();

  // Dialog state
  const [paymentDialog, setPaymentDialog] = useState({
    open: false,
    success: false,
    txnId: null,
    amount: null,
    paymentMode: null,
  });

  const isMockToken = () => {
    const token = localStorage.getItem("token");
    return token && (token.startsWith("mock_jwt_token_") || token.includes("demo"));
  };

  const isDemoMode = isMockToken();

  // Refresh wallet data when payment dialog closes successfully
  useEffect(() => {
    if (!paymentDialog.open && paymentDialog.success) {
      // Refresh wallet data after a short delay
      setTimeout(() => {
        fetchWalletData();
      }, 1000);
    }
  }, [paymentDialog.open, paymentDialog.success, fetchWalletData]);

  const handleRecharge = async () => {
    if (!rechargeAmount || rechargeAmount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("token");

      // DEMO MODE
      if (isDemoMode) {
        const simulatedTxnId = "demo_txn_" + Date.now();
        const amountNum = parseFloat(rechargeAmount);

        await addAmount(amountNum, "Wallet Recharge (Demo)");

        setPaymentDialog({
          open: true,
          success: true,
          txnId: simulatedTxnId,
          amount: amountNum,
          paymentMode: "demo",
        });

        setRechargeAmount("");
        setShowRecharge(false);
        setLoading(false);
        return;
      }

      // REAL PAYMENT FLOW
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
        name: "Unik Leads",
        description: "Wallet Recharge",
        order_id: orderId,
        handler: async (response) => {
          try {
            // Step 1: Verify payment with backend
            const verifyResponse = await axios.post(
              `${API_BASE_URL}/payment/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              },
              { headers: { Authorization: `Bearer ${token}` } }
            );

            // Payment was processed by Razorpay successfully
            // Show success even if backend has issues, but inform user
            setPaymentDialog({
              open: true,
              success: true,
              txnId: response.razorpay_payment_id,
              amount: parseFloat(amount) / 100,
              paymentMode: "razorpay",
            });

            toast.success("Payment successful! Processing wallet update...");

            // Try to update balance first
            try {
              await addAmount(parseFloat(amount) / 100, "Wallet Recharge", response.razorpay_payment_id);
              // Force refresh wallet data
              await fetchWalletData();
              toast.success("Wallet updated successfully!");
            } catch (walletError) {
              console.warn('Wallet update failed, but payment was successful:', walletError);
              // Still try to refresh in case backend processed it
              setTimeout(() => fetchWalletData(), 2000);
              toast.success("Payment successful! Wallet will be updated shortly.");
            }

            // Try to create receipt (optional)
            try {
              await axios.post(
                `${API_BASE_URL}/receipts/receipt`,
                {
                  txnId: response.razorpay_payment_id,
                  amount: parseFloat(amount) / 100,
                  paymentMode: "razorpay",
                  userName: user?.name,
                  userEmail: user?.email,
                },
                { headers: { Authorization: `Bearer ${token}` } }
              );
            } catch (receiptError) {
              console.warn('Receipt creation failed:', receiptError);
              // Don't show error to user as payment was successful
            }

            setRechargeAmount("");
            setShowRecharge(false);
          } catch (error) {
            console.error('Payment processing error:', error);
            
            // If it's a network error or 500, payment might have succeeded
            if (error.code === 'ERR_NETWORK' || error.response?.status >= 500) {
              setPaymentDialog({
                open: true,
                success: true,
                txnId: response.razorpay_payment_id,
                amount: parseFloat(amount) / 100,
                paymentMode: "razorpay",
              });
              toast.success("Payment completed! Wallet will be updated shortly.");
            } else {
              setPaymentDialog({ open: true, success: false });
              toast.error('Payment verification failed. Please contact support if amount was deducted.');
            }
          }
        },
        prefill: {
          name: user?.name || "User Name",
          email: user?.email || "user@example.com",
        },
        theme: { color: "#4F46E5" },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (error) {
      handleApiError(error);
      setPaymentDialog({ open: true, success: false });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Wallet Balance */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-3 py-4 sm:p-6">
          {/* Heading */}
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Your wallet current balance</h2>
          
          <div className="flex justify-between items-center">
            {/* Left: Logo, Amount, Status */}
            <div className="flex items-center space-x-4">
              <WalletIcon className="h-10 w-10 text-gray-400" />
              <div>
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  ₹ {balance?.toFixed(2) || "0.00"}
                </div>
                <div className="text-sm text-green-600 flex items-center">
                  Status: active
                  <button
                    onClick={fetchWalletData}
                    className="ml-2 p-1 text-gray-400 hover:text-gray-600"
                    title="Refresh balance"
                  >
                    <RefreshCw className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Only Recharge Button */}
            <div>
              <button
                onClick={() => setShowRecharge(true)}
                className={`px-4 py-2 rounded-md shadow flex items-center ${
                  isDemoMode
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
                }`}
                disabled={isDemoMode}
              >
                <Plus className="h-4 w-4 mr-2" />
                {isDemoMode ? "Recharge (Demo Mode)" : "Recharge Wallet"}
              </button>

              {isDemoMode && (
                <p className="text-xs text-orange-600 mt-2">Payments disabled in demo mode</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {showRecharge && (
        <div 
          className="fixed bg-black bg-opacity-50 flex justify-center items-start pt-20"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            margin: 0,
            padding: 0
          }}
        >
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
                    ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700"
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

        {/* Mobile */}
        <div className="sm:hidden space-y-4">
          {(transactions || []).map((txn) => (
            <div key={txn.txn_id} className="border rounded-md p-3">
              <div className="flex justify-between text-sm">
                <span className="font-medium">Date:</span>
                {new Date(txn.created_at || txn.date).toLocaleDateString()}
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Type:</span>
                <span
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${
                    txn.type === "credit"
                      ? "bg-green-100 text-green-800"
                      : "bg-red-100 text-red-800"
                  }`}
                >
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

        {/* Desktop */}
        <div className="hidden sm:block">
          <table className="min-w-full bg-white divide-y divide-gray-200">
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
                  <td className="px-6 py-4 text-sm">{new Date(txn.created_at || txn.date).toLocaleDateString()}</td>
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
          <EmptyBox message="" size={100} />
        )}
      </div>

      {/* Payment Result Dialog */}
      {paymentDialog.open && (
        <div 
          className="fixed bg-black bg-opacity-50 flex justify-center items-center"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            width: '100vw',
            height: '100vh',
            zIndex: 99999,
            margin: 0,
            padding: 0
          }}
        >
          <div className="bg-white rounded-2xl shadow-lg p-6 w-11/12 sm:w-96">
            {paymentDialog.success ? (
              <>
                {/* Success Icon */}
                <div className="flex justify-center mb-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-14 w-14 text-green-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 12l2 2l4-4m6 2a9 9 0 11-18 0a9 9 0 0118 0z"
                    />
                  </svg>
                </div>

                <h3 className="text-center text-lg font-medium text-gray-900">
                  Payment Success!
                </h3>
                <p className="text-center text-2xl font-bold text-gray-900 mt-2">
                  ₹{paymentDialog.amount}
                </p>

                <hr className="my-4" />

                <div className="space-y-2 text-sm text-gray-700">
                  <div className="flex justify-between">
                    <span>Ref Number</span>
                    <span className="font-medium">{paymentDialog.txnId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Time</span>
                    <span className="font-medium">{new Date().toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Payment Method</span>
                    <span className="font-medium">{paymentDialog.paymentMode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>User Name</span>
                    <span className="font-medium">{user?.name || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span className="font-medium">₹{paymentDialog.amount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Convenience Charges</span>
                    <span className="font-medium">₹{paymentDialog.adminFee || "0.00"}</span>
                  </div>
                </div>

                <div className="mt-6 flex justify-center">
                  <button
                    onClick={() => {
                      setPaymentDialog({ ...paymentDialog, open: false });
                      navigate("/receipt", {
                        state: {
                          txnId: paymentDialog.txnId,
                          amount: paymentDialog.amount,
                          paymentMode: paymentDialog.paymentMode,
                        },
                      });
                    }}
                    className="px-6 py-2 rounded-lg bg-green-500 text-white font-medium hover:bg-green-600"
                  >
                    Confirm
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3 className="text-lg font-medium text-red-600 mb-4 text-center">
                  Payment Failed
                </h3>
                <p className="text-gray-700 mb-6 text-center">
                  Something went wrong. Please try again.
                </p>
                <div className="flex justify-center">
                  <button
                    onClick={() => setPaymentDialog({ ...paymentDialog, open: false })}
                    className="px-6 py-2 rounded-lg bg-gray-500 text-white hover:bg-gray-600"
                  >
                    Close
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Wallet;
