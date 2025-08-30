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
  <div className="min-h-screen grid grid-cols-1 md:grid-cols-2 bg-gray-100">
    {/* Left: Login Form */}
    <div className="flex items-center justify-center px-4 sm:px-6 py-8 bg-white">
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full max-w-md space-y-6"
      >
        {/* Branding */}
        <div className="text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-indigo-600">SaaS Base</h1>
          <h2 className="mt-2 text-lg sm:text-xl font-semibold text-gray-800">Welcome back</h2>
          <p className="mt-2 text-sm text-gray-600">Login to your Dashboard</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email address"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loading}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Enter your password"
              required
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-md border px-3 py-2 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500 disabled:bg-gray-100"
              disabled={loading}
            />
          </div>

          {/* Terms */}
          <div className="flex items-start">
            <input
              type="checkbox"
              checked={agreeToTerms}
              onChange={(e) => setAgreeToTerms(e.target.checked)}
              className="h-4 w-4 mt-1 text-indigo-600 border-gray-300 rounded"
            />
            <span className="ml-2 text-sm text-gray-600">
              I agree to the{" "}
              <Link to="/terms" className="text-indigo-600 hover:underline">
                Terms & Conditions
              </Link>
            </span>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading || !formData.email || !formData.password}
            className="w-full flex justify-center items-center bg-indigo-600 hover:bg-indigo-700 text-white rounded-md py-2 text-sm font-medium shadow-sm transition disabled:opacity-60"
          >
            {loading ? (
              <>
                <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full mr-2"></span>
                Signing in...
              </>
            ) : (
              "Sign in"
            )}
          </button>

          {/* OTP Login */}
          <button
            type="button"
            onClick={() => setShowOTPLogin(true)}
            className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
          >
            <Smartphone className="h-4 w-4 mr-2" />
            Login with OTP
          </button>

          {/* Signup */}
          <p className="text-center text-sm text-gray-600">
            Don’t have an account?{" "}
            <Link to="/register" className="text-indigo-600 hover:underline">
              Create Account
            </Link>
          </p>
        </form>
      </motion.div>
    </div>

    {/* Right: Stats Section (hidden on small) */}
    <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 to-pink-500 text-white px-6 lg:px-12 space-y-6">
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