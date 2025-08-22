import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { WalletProvider } from './context/WalletContext';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import Dashboard from './components/Dashboard/Dashboard';
import LoanForm from './components/Forms/LoanForm';
import Wallet from './components/Wallet/Wallet';
import Subscriptions from './components/Subscriptions/Subscriptions';
import Support from './components/Support/Support';
import AdminDashboard from './components/Admin/AdminDashboard';
import Layout from './components/Layout/Layout';
import './App.css';

function ProtectedRoute({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex justify-center items-center h-screen">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/dashboard" />;
  
  return children;
}

function App() {
  return (
    <AuthProvider>
      <WalletProvider>
        <Router>
        <div className="min-h-screen bg-gray-50">
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
            
            <Route path="/admin" element={
              <ProtectedRoute adminOnly>
                <Layout><AdminDashboard /></Layout>
              </ProtectedRoute>
            } />
          </Routes>
        </div>
        </Router>
      </WalletProvider>
    </AuthProvider>
  );
}

export default App;
