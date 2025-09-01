import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { motion } from 'framer-motion';
import API_BASE_URL from '../../config/api';
import previewImage from '../../assets/preview.webp';

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
      <div className="flex items-center justify-center px-4 sm:px-6 lg:px-8 py-4 bg-white">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-xs space-y-3"
        >
          {/* Branding */}
          <div className="text-center">
            <h1 className="text-2xl font-bold text-indigo-600">SaaS Base</h1>
            <h2 className="mt-1 text-lg font-semibold text-gray-800">Create Account</h2>
            <p className="mt-1 text-xs text-gray-600">Join our platform</p>
          </div>

          {/* Form */}
          <form className="space-y-2" onSubmit={handleSubmit}>
            <input
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder="Full Name"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />

            <input
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="Email Address"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />

            <input
              name="mobile"
              type="tel"
              value={formData.mobile}
              onChange={handleChange}
              placeholder="Mobile Number"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />

            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            >
              <option value="DSA">DSA</option>
              <option value="NBFC">NBFC</option>
              <option value="Co-op">Co-op Bank</option>
            </select>

            <input
              name="password"
              type="password"
              required
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />

            <input
              name="confirmPassword"
              type="password"
              required
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm Password"
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-indigo-500"
              disabled={loading}
            />

            <button
              type="submit"
              disabled={loading}
              className="w-full py-1.5 px-3 text-sm bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 transition disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Account'}
            </button>

            <div className="text-center text-xs">
              <Link to="/login" className="text-indigo-600 hover:underline">
                Already have an account? Login
              </Link>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Right: Image Section */}
      <div className="hidden md:flex items-center justify-center bg-gray-50 p-8">
        <img 
          src={previewImage} 
          alt="SaaS Platform Preview" 
          className="w-full h-auto max-w-lg object-contain rounded-lg shadow-lg"
        />
      </div>
    </div>
  );
};

export default Register;
