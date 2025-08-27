import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const { login } = useAuth();
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

          {/* Google Sign-in (placeholder) */}
          <button
            type="button"
            className="w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition"
          >
            Sign in with Google
          </button>

          {/* Login Form */}
          <form className="space-y-4" onSubmit={handleSubmit}>
            {['email', 'password'].map((field, index) => (
              <motion.input
                key={field}
                name={field}
                type={field === 'password' ? 'password' : 'email'}
                required
                value={formData[field]}
                onChange={handleChange}
                placeholder={field === 'email' ? 'Email address' : 'Password'}
                className="w-full px-4 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                disabled={loading}
              />
            ))}

            {/* Terms & Conditions Checkbox */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center"
            >
              <input
                id="agreeToTerms"
                type="checkbox"
                checked={agreeToTerms}
                onChange={(e) => setAgreeToTerms(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="agreeToTerms" className="ml-2 block text-sm text-gray-900">
                I agree to the{' '}
                <Link to="/terms" className="text-indigo-600 hover:underline">
                  Terms & Conditions
                </Link>
              </label>
            </motion.div>

            <motion.button
              whileTap={{ scale: 0.95 }}
              type="submit"
              disabled={loading || !formData.email || !formData.password || !agreeToTerms}
              className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </motion.button>

            <div className="text-center text-sm">
              <Link to="/register" className="text-indigo-600 hover:underline">
                Don't have an account? Register here
              </Link>
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
