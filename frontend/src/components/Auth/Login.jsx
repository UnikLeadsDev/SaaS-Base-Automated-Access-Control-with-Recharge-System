import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { Smartphone } from 'lucide-react';
import OTPLogin from './OTPLogin';
import previewImage from '../../assets/preview.webp';
import companyLogo from '../../assets/Unik leads png.png';
import './Login.css';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [showOTPLogin, setShowOTPLogin] = useState(false);
  const { login, setUser } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!agreeToTerms) {
      toast.error('Please agree to the Terms & Conditions');
      return;
    }
    
    setLoading(true);

    try {
      await login(formData.email, formData.password);
      toast.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleOTPSuccess = (user, token) => {
    setUser(user);
    navigate('/dashboard');
  };

  if (showOTPLogin) {
    return (
      <OTPLogin 
        onSuccess={handleOTPSuccess}
        onBack={() => setShowOTPLogin(false)}
      />
    );
  }

  return (
    <div className="h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-100 overflow-hidden">
      {/* Left: Login Form */}
      <div className="flex items-center justify-center px-6 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-md space-y-6"
        >
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-indigo-600">SaaS Base</h1>
            <h2 className="mt-2 text-xl font-semibold text-gray-800">Welcome back</h2>
            <p className="mt-2 text-sm text-gray-600">Login to your Dashboard</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label htmlFor="email" className="form-label">
                Email Address <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email address" 
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">
                Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password" 
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={agreeToTerms}
                  onChange={(e) => setAgreeToTerms(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">
                  I agree to the <Link to="/terms" className="terms-link">Terms & Conditions</Link>
                </span>
              </label>
            </div>
            
            <button 
              type="submit"
              disabled={loading || !formData.email || !formData.password}
              className={`login-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => setShowOTPLogin(true)}
                className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mb-4"
              >
                <Smartphone className="h-4 w-4 mr-2" />
                Login with OTP
              </button>
            </div>
            
            <div className="signup-section">
              <p className="signup-text">
                Don't have an account? {' '}
                <Link to="/register" className="signup-link">
                  Create Account
                </Link>
              </p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right: Stats Section */}
      <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 to-pink-500 text-white px-8 space-y-6">
        {/* Wallet & Access Control */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-full max-w-sm shadow-lg"
        >
          <h3 className="text-lg font-semibold">WALLET & ACCESS CONTROL</h3>
          <p className="text-sm mt-2">
            Prepaid wallet with Razorpay integration and automated access control.  
            Submissions are allowed only if balance or subscription is valid.
          </p>
        </motion.div>

        {/* Notifications & Billing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white/10 backdrop-blur-md rounded-xl p-6 w-full max-w-sm shadow-lg"
        >
          <h3 className="text-lg font-semibold">NOTIFICATIONS & BILLING</h3>
          <p className="text-sm mt-2">
            Automated SMS/Email/WhatsApp alerts via MSG91 for low balance, expiry,  
            and payments. Includes detailed reports and invoice generation.
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;