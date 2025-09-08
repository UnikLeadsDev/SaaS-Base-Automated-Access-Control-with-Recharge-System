// context/WalletContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import API_BASE_URL from "../config/api";

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error("useWallet must be used within a WalletProvider");
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState(null);

  // 🔹 Detect mock token (from demo mode in AuthContext)
  const isMockToken = () => {
    const token = localStorage.getItem("token");
    return token && token.startsWith("mock_jwt_token_");
  };

  // 🔹 Fetch wallet balance + transactions + subscription
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token || isMockToken()) {
        // In demo mode: set mock subscription
        setSubscriptionStatus({
          hasActiveSubscription: true,
          plan_name: 'Demo Plan',
          daysRemaining: 30
        });
        return;
      }

      // balance
      const balanceRes = await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(parseFloat(balanceRes.data.balance) || 0);

      // transactions
      const txnRes = await axios.get(`${API_BASE_URL}/wallet/transactions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Loaded transactions:", txnRes.data?.length || 0);
      setTransactions(txnRes.data || []);
      
      // subscription status
      try {
        const subRes = await axios.get(`${API_BASE_URL}/subscription/status`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSubscriptionStatus(subRes.data);
      } catch (subError) {
        console.warn("Subscription status unavailable:", subError.message);
        setSubscriptionStatus({ hasActiveSubscription: false });
      }
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetchWalletData();
    }
  }, []);

  // Fetch data when user changes (login/logout)
  useEffect(() => {
    fetchWalletData();
  }, [localStorage.getItem("token")]);

  // ✅ Deduct amount
 // ✅ Deduct amount
const deductAmount = async (amount, description = "Deduction", paymentTxnId) => {
  if (amount > balance) {
    console.error("Insufficient funds");
    return false;
  }
  console.log("Deducting amount:", amount, "Description:", description, "PaymentTxnId:", paymentTxnId);

  setBalance((prev) => prev - amount);

  const newTxn = {
    type: "debit",
    amount,
    description,
    date: new Date().toISOString(),
    txnRef: paymentTxnId, // <-- actual payment transaction ID
  };

  setTransactions((prev) => [newTxn, ...prev]);

  // 🔹 Persist to backend
  try {
    const token = localStorage.getItem("token");
    if (!token || isMockToken()) return true; // skip in demo mode
    console.log("Sending transaction to backend:", newTxn);
    await axios.post(`http://localhost:5000/api/wallet/transactions`, newTxn, {
      headers: { Authorization: `Bearer ${token}` },
    });
  } catch (err) {
    console.error("Failed to save transaction:", err);
  }

  return true;
};


  // ✅ Add amount - only update after backend success
const addAmount = async (amount, description = "Top-up", txnRef) => {
  const token = localStorage.getItem("token");
  
  // In demo mode, update locally
  if (!token || isMockToken()) {
    setBalance((prev) => prev + amount);
    const newTxn = {
      type: "credit",
      amount,
      description,
      date: new Date().toISOString(),
      txnRef: txnRef || `demo_${Date.now()}`,
    };
    setTransactions((prev) => [newTxn, ...prev]);
    return true;
  }

  // For real payments, only update after backend confirms
  try {
    const newTxn = {
      type: "credit",
      amount,
      description,
      date: new Date().toISOString(),
      txnRef: txnRef,
    };

    // First save to backend
    await axios.post(`${API_BASE_URL}/wallet/transactions`, newTxn, {
      headers: { Authorization: `Bearer ${token}` },
    });

    // Only update local state after backend success
    setBalance((prev) => prev + amount);
    setTransactions((prev) => [newTxn, ...prev]);
    return true;
  } catch (err) {
    console.error("Failed to save transaction:", err);
    throw err; // Re-throw to let caller handle the error
  }
};


  // Check if user has access (subscription or sufficient balance)
  const hasAccess = (formType, requiredAmount = 0) => {
    if (isMockToken()) return true; // Demo mode
    if (subscriptionStatus?.hasActiveSubscription) return true;
    return balance >= requiredAmount;
  };

  return (
    <WalletContext.Provider
      value={{ 
        balance, 
        transactions, 
        subscriptionStatus,
        deductAmount, 
        addAmount, 
        fetchWalletData,
        hasAccess
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};
