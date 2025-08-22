import { createContext, useContext, useState } from 'react';

const WalletContext = createContext();

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

export const WalletProvider = ({ children }) => {
  const [balance, setBalance] = useState(500.00);
  const [transactions, setTransactions] = useState([
    { txn_id: 1, amount: 1000, type: 'credit', date: '2024-01-15', txn_ref: 'TXN001' },
    { txn_id: 2, amount: 5, type: 'debit', date: '2024-01-14', txn_ref: 'FORM001' }
  ]);

  const deductAmount = (amount, description) => {
    const newBalance = balance - amount;
    setBalance(newBalance);
    
    // Add transaction
    const newTransaction = {
      txn_id: Date.now(),
      amount: amount,
      type: 'debit',
      date: new Date().toISOString().split('T')[0],
      txn_ref: description
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newBalance;
  };

  const addAmount = (amount, description) => {
    const newBalance = balance + amount;
    setBalance(newBalance);
    
    // Add transaction
    const newTransaction = {
      txn_id: Date.now(),
      amount: amount,
      type: 'credit',
      date: new Date().toISOString().split('T')[0],
      txn_ref: description
    };
    
    setTransactions(prev => [newTransaction, ...prev]);
    return newBalance;
  };

  const value = {
    balance,
    transactions,
    deductAmount,
    addAmount
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};