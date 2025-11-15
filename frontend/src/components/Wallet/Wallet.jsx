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
  const [showQRModal, setShowQRModal] = useState(false);
  const [showPaytmVerifyModal, setShowPaytmVerifyModal] = useState(false);
const [upiId, setUpiId] = useState("");
const [txnId, setTxnId] = useState("");
const [txnDate, setTxnDate] = useState("");
const [txnAmount, setTxnAmount] = useState("");
const [verifying, setVerifying] = useState(false);
const [otpModalOpen, setOtpModalOpen] = useState(false);
const [otp, setOtp] = useState("");


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

      const baseAmount = parseFloat(rechargeAmount);
      const gstRate = 18; // GST %
      const gstAmount = (baseAmount * gstRate) / 100;
      const totalAmount = baseAmount + gstAmount; // For Razorpay

      // // DEMO MODE
      // if (isDemoMode) {
      //   const simulatedTxnId = "demo_txn_" + Date.now();
      //   await addAmount(baseAmount, "Wallet Recharge (Demo)");

      //   setPaymentDialog({
      //     open: true,
      //     success: true,
      //     txnId: simulatedTxnId,
      //     amount: baseAmount,
      //     paymentMode: "demo",
      //   });

      //   setRechargeAmount("");
      //   setShowRecharge(false);
      //   setLoading(false);
      //   return;
      // }
      // REAL PAYMENT FLOW
      const orderResponse = await axios.post(
        `${API_BASE_URL}/payment/create-order`,
        { amount: totalAmount }, // total includes GST
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const { orderId, amount, currency, key } = orderResponse.data;
      console.log("Razorpay Order Created:", orderResponse.data);

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
    await axios.post(
      `${API_BASE_URL}/payment/verify`,
      {
        razorpay_order_id: response.razorpay_order_id,
        razorpay_payment_id: response.razorpay_payment_id,
        razorpay_signature: response.razorpay_signature,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    console.log("Payment verified successfully:", baseAmount, totalAmount);
    await addAmount(
      totalAmount - gstAmount, // credited to wallet
      "Wallet Recharge",
      response.razorpay_payment_id,
      totalAmount // this is just a reference field (118)
    );
    await fetchWalletData();


    toast.success("Wallet updated successfully!");

    // ✅ Step 3: Generate invoice including GST (shows ₹118)
    const userId = localStorage.getItem("userId");
    const userName = localStorage.getItem("userName");
    const userEmail = localStorage.getItem("userEmail");

    const invoiceData = {
      userId: parseInt(userId),
      userName: userName || "N/A",
      userEmail: userEmail || "N/A",
      invoiceNumber: "INV-" + Date.now(),
      invoiceDate: new Date().toISOString().slice(0, 10),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      subtotal: baseAmount, // 100
      gstRate,
      gstAmount: gstAmount.toFixed(2), // 18
      totalAmount: totalAmount.toFixed(2), // 118
      status: "paid",
      paymentTerms: "Net 30",
      notes: "Wallet Recharge via Razorpay",
      paymentTxnId: response.razorpay_payment_id,
    };

    await axios.post(`${API_BASE_URL}/billing/invoice`, invoiceData, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // ✅ Step 4: Show user confirmation dialog
    setPaymentDialog({
      open: true,
      success: true,
      txnId: response.razorpay_payment_id,
      amount: baseAmount, // show 100 in confirmation
      totalPaid: totalAmount, // optional if you display total paid
      paymentMode: "razorpay",
    });

    setRechargeAmount("");
    setShowRecharge(false);
  } catch (error) {
    console.error("Payment processing error:", error);
    setPaymentDialog({ open: true, success: false });
    toast.error("Payment verification failed. Please contact support.");
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

 // 🧾 QR Payment Handler (Manual / Offline)
const handleQRPayment = async () => {
  try {
    if (!rechargeAmount || rechargeAmount < 1) {
      toast.error("Please enter a valid amount");
      return;
    }

    setShowRecharge(false);
    setLoading(true);

    const baseAmount = parseFloat(rechargeAmount);
    const gstRate = 18;
    const gstAmount = (baseAmount * gstRate) / 100;
    const totalAmount = baseAmount + gstAmount;

    // 👇 Step 1: Simulate QR transaction ID
    const simulatedTxnId = "qr_txn_" + Date.now();

    // 👇 Step 2: Save transaction info for OTP verification phase
    setTxnId(simulatedTxnId);
    setTxnAmount(totalAmount.toFixed(2));
    setTxnDate(new Date().toISOString());

    // 👇 Step 3: Show OTP modal
    setOtpModalOpen(true);

    toast.success("QR Payment initiated. Please verify OTP to complete the transaction.");
  } catch (error) {
    console.error("QR Payment Error:", error);
    handleApiError(error);
    toast.error("Failed to initiate QR Payment. Please try again.");
  } finally {
    setLoading(false);
  }
};


// const handleVerifyPaytmPayment = async () => {
//   if (!txnId) {
//     toast.error("Please enter the Transaction ID");
//     return;
//   }

//   try {
//     setVerifying(true);
//     const token = localStorage.getItem("token");

//     const response = await axios.post(
//       `${API_BASE_URL}/payment/verify-qr-payment`,
//       { orderId: txnId },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );

//     if (response.data.success) {
//       toast.success("Payment verified successfully!");
//       // Optionally add amount to wallet
//       await addAmount(parseFloat(txnAmount), "Paytm QR Recharge", txnId, txnAmount);
//       await fetchWalletData();
//       setShowPaytmVerifyModal(false);
//       setTxnId("");
//       setTxnAmount("");
//       setUpiId("");
//       setTxnDate("");
//     } else {
//       toast.error("Payment verification failed!");
//     }
//   } catch (error) {
//     handleApiError(error);
//   } finally {
//     setVerifying(false);
//   }
// };
const handleRequestOTP = async () => {
  if (!txnId || !upiId || !txnAmount || !txnDate) {
    toast.error("Please fill all required fields");
    return;
  }

  try {
    setVerifying(true);
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${API_BASE_URL}/payment/request-verification-otp`,
      { txnId, txnAmount, upiId, txnDate }, // ✅ include txnDate
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data.success) {
      toast.success("OTP sent to your registered email");
      setOtpModalOpen(true);
    } else {
      toast.error(response.data.message || "Failed to send OTP");
    }
  } catch (error) {
    handleApiError(error);
  } finally {
    setVerifying(false);
  }
};



const handleVerifyOTP = async () => {
  if (!otp) {
    toast.error("Please enter the OTP");
    return;
  }

  try {
    setVerifying(true);
    const token = localStorage.getItem("token");

    const response = await axios.post(
      `${API_BASE_URL}/payment/verify-otp`,
      { txnId, txnDate, otp },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.data?.success === true) {
      toast.success("OTP verified successfully!");

      try {
        // 🟢 Add wallet amount
        const baseAmount = parseFloat(txnAmount) / 1.18; // remove GST to get base
        const gstRate = 18;
        const gstAmount = (baseAmount * gstRate) / 100;
        const totalAmount = baseAmount + gstAmount;

        await addAmount(baseAmount, "Wallet Recharge (QR Payment)", txnId, totalAmount);

        // 🧾 Generate invoice after successful OTP verification
        const userId = localStorage.getItem("userId");
        const userName = localStorage.getItem("userName");
        const userEmail = localStorage.getItem("userEmail");

        const invoiceData = {
          userId: parseInt(userId),
          userName: userName || "N/A",
          userEmail: userEmail || "N/A",
          invoiceNumber: "INV-" + Date.now(),
          invoiceDate: new Date().toISOString().slice(0, 10),
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
          subtotal: baseAmount,
          gstRate,
          gstAmount: gstAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          status: "paid",
          paymentTerms: "Net 30",
          notes: "Wallet Recharge via QR Payment (OTP Verified)",
          paymentTxnId: txnId,
        };

        await axios.post(`${API_BASE_URL}/billing/invoice`, invoiceData, {
          headers: { Authorization: `Bearer ${token}` },
        });

        // 🔄 Refresh wallet and UI
        await fetchWalletData();
        setOtpModalOpen(false);
        setShowPaytmVerifyModal(false);
        setTxnId("");
        setTxnAmount("");
        setTxnDate("");
        setOtp("");
        setPaymentDialog({ open: true, success: true, txnId, amount: baseAmount, paymentMode: "qr" });

        toast.success("Wallet recharged successfully via QR!");
      } catch (walletError) {
        console.error("Wallet update or invoice creation failed:", walletError);
        toast.error("OTP verified, but failed to update wallet or generate invoice.");
      }
    } else {
      toast.error(response.data?.message || "Invalid OTP. Please try again.");
    }
  } catch (error) {
    handleApiError(error);
  } finally {
    setVerifying(false);
  }
};








  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Wallet Balance */}
      <div className="bg-white shadow rounded-lg">
        <div className="p-4 sm:p-6">
          {/* Heading */}
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">Your wallet current balance</h2>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
            {/* Left: Logo, Amount, Status */}
            <div className="flex items-center space-x-3 sm:space-x-4">
              <WalletIcon className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              <div>
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-600">
                  ₹ {balance?.toFixed(2) || "0.00"}
                </div>
                <div className="text-xs sm:text-sm text-green-600 flex items-center">
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
            <div className="flex flex-col items-start sm:items-end">
              <button
                onClick={() => setShowRecharge(true)}
                className={`px-3 sm:px-4 py-2 rounded-md shadow flex items-center text-sm sm:text-base ${isDemoMode
                  ? "bg-gray-400 text-gray-200 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                disabled={isDemoMode}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{isDemoMode ? "Recharge (Demo Mode)" : "Recharge Wallet"}</span>
                <span className="sm:hidden">Recharge</span>
              </button>

              {isDemoMode && (
                <p className="text-xs text-orange-600 mt-2">Payments disabled in demo mode</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Recharge Modal */}
      {/* Recharge Modal */}
     {showRecharge && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="bg-white rounded-md shadow-lg p-6 w-11/12 sm:w-96 relative">
      <h3 className="text-lg font-medium mb-4 text-center">Recharge Wallet</h3>

      {/* ❌ Cancel / Close Button (Top-right corner) */}
      <button
        onClick={() => setShowRecharge(false)}
        className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 text-xl font-semibold"
      >
        ×
      </button>

      {/* Amount Input */}
      <input
        type="number"
        value={rechargeAmount}
        onChange={(e) => setRechargeAmount(e.target.value)}
        className="w-full px-3 py-2 border rounded-md mb-4"
        placeholder="Enter amount"
        min="1"
      />

      {/* 💰 Price Breakdown */}
      {rechargeAmount > 0 && (
        <div className="border border-gray-200 rounded-md p-3 mb-4 bg-gray-50 text-sm text-gray-700">
          <div className="flex justify-between mb-1">
            <span>Subtotal:</span>
            <span>₹ {parseFloat(rechargeAmount).toFixed(2)}</span>
          </div>
          <div className="flex justify-between mb-1">
            <span>GST (18%):</span>
            <span>
              ₹ {((parseFloat(rechargeAmount) * 18) / 100).toFixed(2)}
            </span>
          </div>
          <hr className="my-2 border-gray-300" />
          <div className="flex justify-between font-semibold text-gray-900">
            <span>Total Payable:</span>
            <span>
              ₹{" "}
              {(
                parseFloat(rechargeAmount) +
                (parseFloat(rechargeAmount) * 18) / 100
              ).toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Payment Buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
        {/* 💳 Pay via Razorpay */}
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
          {loading ? "Processing..." : isDemoMode ? "Demo Mode" : "Pay via Razorpay"}
        </button>

        {/* 🧾 Pay via QR */}
        <button
          onClick={() => setShowQRModal(true)}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-md flex items-center justify-center border border-gray-300 text-gray-700 bg-gray-50 hover:bg-gray-100 transition"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-2"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.8}
              d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h2v2h-2zM18 14h2v2h-2zM14 18h2v2h-2zM18 18h2v2h-2z"
            />
          </svg>
          Pay via QR
        </button>
      </div>

      {/* Cancel button at bottom */}
      <button
        onClick={() => setShowRecharge(false)}
        className="mt-4 w-full border border-gray-300 text-gray-700 py-2 rounded-md hover:bg-gray-100"
      >
        Cancel
      </button>
    </div>
  </div>
)}


{/* 🧾 QR Payment Modal */}
{showQRModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 sm:w-96 text-center">
      <h3 className="text-lg font-semibold mb-4">Pay via QR Code</h3>

      {/* QR Image */}
      <img
        src="src/assets/qrpayment.svg"
        alt="Paytm QR"
        className="w-60 h-60 mx-auto mb-4 border rounded-lg"
      />

      <p className="text-gray-600 text-sm mb-2">
        Scan this QR using any UPI app (Paytm, Google Pay, PhonePe, etc.)
      </p>

      <p className="text-gray-800 font-semibold mb-4">
        Amount: ₹{(
                parseFloat(rechargeAmount) +
                (parseFloat(rechargeAmount) * 18) / 100
              ).toFixed(2)}
      </p>

      {/* Buttons */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {/* <button
          onClick={() => {
            setShowQRModal(false);
            handleQRPayment(); // ✅ call the function to create receipt, invoice, etc.
          }}
          className="flex-1 px-4 py-2 rounded-md bg-blue-600 text-white hover:bg-green-700"
        >
          I’ve Paid
        </button> */}

        <button
          onClick={() => setShowPaytmVerifyModal(true)}
          disabled={loading}
          className="flex-1 px-4 py-2 rounded-md flex items-center justify-center border border-gray-300 text-gray-700 bg-yellow-100 hover:bg-yellow-200 transition"
        >
          <CreditCard className="h-4 w-4 mr-2" />
          Verify Paytm Payment
        </button>


        <button
          onClick={() => setShowQRModal(false)}
          className="flex-1 px-4 py-2 rounded-md border border-gray-300 bg-white hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{showPaytmVerifyModal && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 sm:w-96">
      <h3 className="text-lg font-semibold text-center mb-4">Verify Paytm QR Payment</h3>

      <input
        type="text"
        value={upiId}
        onChange={(e) => setUpiId(e.target.value)}
        placeholder="Enter UPI ID"
        className="w-full border px-3 py-2 rounded-md mb-3"
      />

      <input
        type="text"
        value={txnId}
        onChange={(e) => setTxnId(e.target.value)}
        placeholder="Enter Transaction ID"
        className="w-full border px-3 py-2 rounded-md mb-3"
      />

      <input
        type="date"
        value={txnDate}
        onChange={(e) => setTxnDate(e.target.value)}
        className="w-full border px-3 py-2 rounded-md mb-3"
      />

      <input
        type="number"
        value={txnAmount}
        onChange={(e) => setTxnAmount(e.target.value)}
        placeholder="Enter Amount"
        className="w-full border px-3 py-2 rounded-md mb-3"
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={handleRequestOTP}
          disabled={verifying}
          className="flex-1 bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 mr-2"
        >
          {verifying ? "Verifying..." : "Verify Payment"}
        </button>

        <button
          onClick={() => setShowPaytmVerifyModal(false)}
          className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}

{otpModalOpen && (
  <div className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50">
    <div className="bg-white rounded-lg shadow-lg p-6 w-11/12 sm:w-96">
      <h3 className="text-lg font-semibold text-center mb-4">Enter OTP</h3>

      <input
        type="text"
        value={otp}
        onChange={(e) => setOtp(e.target.value)}
        placeholder="Enter 6-digit OTP"
        maxLength={6}
        className="w-full border px-3 py-2 rounded-md mb-3 text-center tracking-widest text-lg"
      />

      <div className="flex justify-between mt-4">
        <button
          onClick={()=>{handleVerifyOTP();
            handleQRPayment();
          }}
          disabled={verifying}
          className="flex-1 bg-green-600 text-white py-2 rounded-md hover:bg-green-700 mr-2"
        >
          {verifying ? "Verifying..." : "Verify OTP"}
        </button>

        <button
          onClick={() => setOtpModalOpen(false)}
          className="flex-1 border border-gray-300 py-2 rounded-md hover:bg-gray-100"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}






      {/* Transaction History */}
      <div className="bg-white shadow rounded-lg p-4 sm:p-6">
        <div className="flex items-center mb-3 sm:mb-4">
          <History className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 mr-2" />
          <h3 className="text-base sm:text-lg font-medium text-gray-900">Transaction History</h3>
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
                  className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.type === "credit"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                    }`}
                >
                  {txn.type}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="font-medium">Amount (incl. 18% GST):</span>
                ₹{(txn.amount * 1.18).toFixed(2)}
              </div>

              <div className="flex justify-between text-sm">
                <span className="font-medium">Status:</span>
                <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                  Completed
                </span>
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
                <th className="px-6 py-3 text-left text-xs font-medium">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium">Reference</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {(transactions || []).map((txn) => (
                <tr key={txn.txn_id}>
                  <td className="px-6 py-4 text-sm">
                    {new Date(txn.created_at || txn.date).toLocaleDateString()}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-semibold ${txn.type === "credit"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                        }`}
                    >
                      {txn.type}
                    </span>
                  </td>

                  <td className="px-6 py-4 text-sm">₹{txn.amount}</td>

                  <td className="px-6 py-4 text-sm">
                    {txn.type === "credit"
                      ? "Money Added in Wallet"
                      : "Debited for Subscription"}
                  </td>

                  <td className="px-6 py-4 text-sm">
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800">
                      Completed
                    </span>
                  </td>

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
                      navigate("/billing", {
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
