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

  // 🔹 Fetch wallet balance + transactions
  const fetchWalletData = async () => {
    try {
      const token = localStorage.getItem("token");

      // balance
      const balanceRes = await axios.get(`${API_BASE_URL}/wallet/balance`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBalance(parseFloat(balanceRes.data.balance) || 0);

      // transactions
      const txnRes = await axios.get(`${API_BASE_URL}/wallet/transactions`, {
        
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("these are transaction",txnRes.data);
      setTransactions(txnRes.data || []);
    } catch (error) {
      console.error("Failed to fetch wallet data:", error);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  // ✅ Deduct amount
  const deductAmount = async (amount, description = "Deduction") => {
    if (amount > balance) {
      console.error("Insufficient funds");
      return false;
    }

    setBalance((prev) => prev - amount);

    const newTxn = {
      type: "debit",
      amount,
      description,
      date: new Date().toISOString(),
    };

    setTransactions((prev) => [newTxn, ...prev]);

    // 🔹 Persist to backend
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_BASE_URL}/wallet/transactions`, newTxn, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }

    return true;
  };

  // ✅ Add amount
  const addAmount = async (amount, description = "Top-up") => {
    setBalance((prev) => prev + amount);

    const newTxn = {
      type: "credit",
      amount,
      description,
      date: new Date().toISOString(),
    };

    setTransactions((prev) => [newTxn, ...prev]);

    // 🔹 Persist to backend
    try {
      const token = localStorage.getItem("token");
      await axios.post("http://localhost:5000/api/wallet/transactions", newTxn, {
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err) {
      console.error("Failed to save transaction:", err);
    }
  };

  return (
    <WalletContext.Provider
      value={{ balance, transactions, deductAmount, addAmount }}
    >
      {children}
    </WalletContext.Provider>
  );
};
