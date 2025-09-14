import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import { SubscriptionProvider } from './context/SubscriptionContext';

import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import LoanForm from './components/Forms/LoanForm';
import Wallet from './components/Wallet/Wallet';
import Receipt from './components/Receipt/Receipt';
import Subscriptions from './components/Subscriptions/Subscriptions';
import Support from './components/Support/Support';
import AdminDashboard from './components/Admin/AdminDashboard';
import BillingDashboard from './components/Billing/BillingDashboard';
import Layout from './components/Layout/Layout';
import EmptyBoxDemo from './components/Demo/EmptyBoxDemo';
import Profile from './components/Profile/Profile';
import AdminLayout from './components/Admin/AdminLayout';
import './App.css';

// Suppress console errors
const originalConsoleError = console.error;
console.error = (...args) => {
  const message = args[0]?.toString?.() || '';
  if (message.includes('attribute width: Expected length') ||
      message.includes('Request failed with status code 500') ||
      message.includes('API Error')) return;
  originalConsoleError.apply(console, args);
};

function App() {
  // Move ProtectedRoute inside App function so it has access to context
  function ProtectedRoute({ children, adminOnly = false }) {
    const { user, loading } = useAuth();
    
    if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
    if (!user) return <Navigate to="/login" />;
    if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
    
    return children;
  }

  return (
    <AuthProvider>
      <SubscriptionProvider>
        <WalletProvider>
          <Router>
        <div className=" min-h-screen w-screen bg-gray-50">
          <Toaster position="top-right" />
          <Routes>

            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={<Navigate to="/dashboard" />} />
            
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Layout><Dashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/forms" element={
              <ProtectedRoute>
                <Layout><LoanForm /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/wallet" element={
              <ProtectedRoute>
                <Layout><Wallet /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/receipt" element={
              <ProtectedRoute>
                <Layout><Receipt /></Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout><Profile /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/subscriptions" element={
              <ProtectedRoute>
                <Layout><Subscriptions /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/support" element={
              <ProtectedRoute>
                <Layout><Support /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/billing" element={
              <ProtectedRoute>
                <Layout><BillingDashboard /></Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            } />
            
            <Route path="/demo/emptybox" element={
              <ProtectedRoute>
                <Layout><EmptyBoxDemo /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
          </Router>
        </WalletProvider>
      </SubscriptionProvider>
    </AuthProvider>
  );
}

export default App;
