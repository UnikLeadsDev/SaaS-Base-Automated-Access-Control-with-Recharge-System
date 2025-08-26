import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import API_BASE_URL from '../../config/api';

const Register = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    mobile: '',
    role: 'DSA',
    password: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${API_BASE_URL}/auth/register`, formData);
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
   <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-gray-100">
  {/* Left: Form Section */}
  <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-6 bg-white">
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full max-w-md space-y-6"
    >
      {/* Branding */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-indigo-600">SaaS Base Registration</h1>
        <h2 className="mt-2 text-xl font-semibold text-gray-800">Keep your Wallet Updated</h2>
      </div>

      {/* Google Sign-in */}
      <button
        type="button"
        className="w-full py-2 px-4 border border-gray-300 rounded-md bg-white text-gray-700 hover:bg-gray-50 transition"
      >
        Sign in with Google
      </button>

      {/* Form */}
      <form className="space-y-4" onSubmit={handleSubmit}>
        {['name', 'email', 'mobile', 'password', 'confirmPassword'].map((field, index) => (
          <motion.input
            key={field}
            name={field}
            type={field.includes('password') ? 'password' : field === 'email' ? 'email' : 'text'}
            required
            value={formData[field]}
            onChange={handleChange}
            placeholder={
              field === 'confirmPassword'
                ? 'Confirm Password'
                : field.charAt(0).toUpperCase() + field.slice(1)
            }
            className="w-full px-4 py-2 border border-gray-300 rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.1 }}
          />
        ))}

        <motion.select
          name="role"
          value={formData.role}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-md text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
        >
          <option value="DSA">DSA</option>
          <option value="NBFC">NBFC</option>
          <option value="Co-op">Co-op Bank</option>
        </motion.select>

        <motion.button
          whileTap={{ scale: 0.95 }}
          type="submit"
          disabled={loading}
          className="w-full py-2 px-4 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
        >
          {loading ? 'Creating Account...' : 'Create Account'}
        </motion.button>

        <div className="text-center text-sm">
          <Link to="/login" className="text-indigo-600 hover:underline">
            Already have an account? Login Here
          </Link>
        </div>
      </form>
    </motion.div>
  </div>

  {/* Right: Stats Section */}
  <div className="hidden md:flex flex-col justify-center items-center bg-gradient-to-br from-purple-600 to-pink-500 text-white px-8 py-6 space-y-6">
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

export default Register;
