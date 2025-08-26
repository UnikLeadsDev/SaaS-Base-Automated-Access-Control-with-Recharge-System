import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import API_BASE_URL from '../../config/api';
import previewImage from '../../assets/preview.webp';
import companyLogo from '../../assets/Unik leads png.png';
import './Register.css';

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
      await axios.post(`${API_BASE_URL}/auth/register`, {
        name: formData.name,
        email: formData.email,
        mobile: formData.mobile,
        role: formData.role,
        password: formData.password
      });
      
      toast.success('Registration successful! Please login.');
      navigate('/login');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-wrapper">
        {/* Left Side - Form Section */}
        <div className="form-section">
          <div className="form-header">
            <img src={companyLogo} alt="Unik Leads" className="company-logo" />
            <h1 className="welcome-text">
              Join <span className="brand-name">SaaS Base</span>
            </h1>
            <p className="subtitle">Create your account</p>
          </div>
          
          <form onSubmit={handleSubmit} className="register-form">
            <div className="form-group">
              <label htmlFor="name" className="form-label">
                Full Name <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name" 
                  required
                  value={formData.name}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            
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
              <label htmlFor="mobile" className="form-label">
                Mobile Number
              </label>
              <div className="input-wrapper">
                <input 
                  id="mobile"
                  name="mobile"
                  type="tel"
                  placeholder="Enter your mobile number" 
                  value={formData.mobile}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            
            <div className="form-group">
              <label htmlFor="role" className="form-label">
                Role <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <select 
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="form-select"
                  disabled={loading}
                >
                  <option value="DSA">DSA</option>
                  <option value="NBFC">NBFC</option>
                  <option value="Co-op">Co-op Bank</option>
                </select>
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
            
            <div className="form-group">
              <label htmlFor="confirmPassword" className="form-label">
                Confirm Password <span className="required">*</span>
              </label>
              <div className="input-wrapper">
                <input 
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password" 
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input"
                  disabled={loading}
                />
              </div>
            </div>
            
            <button 
              type="submit"
              disabled={loading}
              className={`register-button ${loading ? 'loading' : ''}`}
            >
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Creating Account...
                </>
              ) : (
                'Create Account'
              )}
            </button>
            
            <div className="login-section">
              <p className="login-text">
                Already have an account? {' '}
                <Link to="/login" className="login-link">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
        
        {/* Right Side - Image Section */}
        <div className="image-section">
          <div className="image-wrapper">
            <img 
              src={previewImage}
              alt="Register Illustration" 
              className="register-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;