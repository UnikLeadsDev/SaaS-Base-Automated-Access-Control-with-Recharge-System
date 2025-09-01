import { useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const GoogleAuth = () => {
  const { simpleLogin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Load Google Identity Services
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    script.onload = () => {
      window.google.accounts.id.initialize({
        client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID || 'demo-client-id',
        callback: handleCredentialResponse,
      });

      window.google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        { 
          theme: 'outline', 
          size: 'large',
          width: 300,
          text: 'continue_with'
        }
      );
    };

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handleCredentialResponse = async (response) => {
    try {
      // Decode JWT token (in production, verify on backend)
      const payload = JSON.parse(atob(response.credential.split('.')[1]));
      
      const userData = {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        role: 'DSA'
      };

      await simpleLogin(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login failed:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Welcome</h2>
          <p className="mt-2 text-gray-600">Sign in to continue</p>
        </div>
        
        <div className="flex justify-center">
          <div id="google-signin-button"></div>
        </div>
      </div>
    </div>
  );
};

export default GoogleAuth;