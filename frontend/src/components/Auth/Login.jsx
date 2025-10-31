import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import OTPLogin from './OTPLogin';

import toast from 'react-hot-toast';
import { Eye, EyeOff, Smartphone } from 'lucide-react';
import previewImage from '../../assets/preview.webp';
import companyLogo from '../../assets/Unik leads png.png';
import './Login.css';

const Login = () => {
  const{user}=useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [showOTPLogin, setShowOTPLogin] = useState(false);

  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id',
        callback: handleGoogleResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-btn'),
        { theme: 'outline', size: 'large', width: 300 }
      );
    };

    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      const userData = {
        name: payload.name,
        email: payload.email
      };
      await googleLogin(userData);
      toast.success('Google login successful!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
      toast.error('Google login failed. Please try again.');
    }
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  try {
    const { user } = await login(formData.email, formData.password);
    // login returns { success, token, user }

    toast.success('Login successful!');

    if (user?.role === 'admin') {
      navigate('/admin'); // admin redirect
    } else {
      navigate('/dashboard'); // end-user redirect
    }
  } catch (error) {
    toast.error(error.response?.data?.message || 'Login failed');
  } finally {
    setLoading(false);
  }
};


  const handleOTPSuccess = (user, token) => {
    toast.success('OTP Login successful!');
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
    <div className="login-container">
      <div className="login-wrapper">
        {/* Left Side - Image Section */}
        <div className="image-section">
          <div className="image-wrapper">
            <img 
              src={previewImage}
              alt="Login Illustration" 
              className="login-image"
            />
          </div>
        </div>
        
        {/* Right Side - Form Section */}
        <div className="form-section">
          <div className="form-header">
            <img src={companyLogo} alt="Unik Leads" className="company-logo" />
            <h1 className="welcome-text">
              Welcome 
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
              <div className="input-wrapper password-wrapper">
                <input 
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password" 
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="form-input password-input"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div className="form-options">
              <label className="checkbox-label">
                <input 
                  type="checkbox" 
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="checkbox-input"
                />
                <span className="checkbox-text">Remember me</span>
              </label>
              
              <Link to="/forgot-password" className="forgot-link">
                Forgot Password?
              </Link>
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
            
          
            
            {/* <button 
              type="button"
              onClick={() => setShowOTPLogin(true)}
              className="otp-login-button"
            >
              <Smartphone size={20} />
              Login with OTP
            </button> */}
            
           
            
            {/* <div className="flex justify-center">
              <div id="google-signin-btn"></div>
            </div> */}
            
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
      </div>
    </div>
  );
};

export default Login;