import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import previewImage from '../../assets/preview.webp';
import companyLogo from '../../assets/Unik leads png.png';
import './Login.css';

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
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Form Section */}
        <div className="form-section">
          <div className="form-header">
            <img src={companyLogo} alt="Unik Leads" className="company-logo" />
            <h1 className="welcome-text">
              Welcome to <span className="brand-name">SaaS Base</span>
            </h1>
            <p className="subtitle">Login to your Dashboard</p>
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
            
            <div className="signup-section">
              <p className="signup-text">
                Don't have an account? {' '}
                <Link to="/register" className="signup-link">
                  Create Account
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
              alt="Login Illustration" 
              className="login-image"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;