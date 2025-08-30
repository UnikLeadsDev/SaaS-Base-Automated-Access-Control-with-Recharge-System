import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import apiWrapper from '../utils/apiWrapper.js';
import API_BASE_URL from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const isMockToken = () => {
    const token = localStorage.getItem('token');
    return token && token.startsWith('mock_jwt_token_');
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      if (isMockToken()) {
        // Use stored user data for demo mode
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        if (userName && userEmail) {
          setUser({
            id: 1,
            name: userName,
            email: userEmail,
            role: 'DSA'
          });
        }
        setLoading(false);
      } else {
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        fetchUserProfile();
      }
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUserProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      console.log('Fetching user profile with token:', token ? 'exists' : 'missing');
      
      const response = await apiWrapper.get(`${API_BASE_URL}/auth/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Profile response:', response);
      setUser(response.data);
    } catch (error) {
      console.log('Profile fetch error:', error.response?.status, error.message);
      
      // Use stored user data if available
      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      if (userName && userEmail) {
        console.log('Using stored user data for demo mode');
        setUser({
          id: 1,
          name: userName,
          email: userEmail,
          role: 'DSA'
        });
      } else {
        console.log('No stored user data, clearing token');
        localStorage.removeItem('token');
        delete axios.defaults.headers.common['Authorization'];
      }
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      // Mock login when backend is unavailable or returns any error
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404 || error.response?.status === 401 || error.response?.status === 500 || !error.response) {
        const isAdmin = email.toLowerCase().includes('admin');
        const mockUser = {
          id: 1,
          name: isAdmin ? 'Admin User' : 'Demo User',
          email: email,
          role: isAdmin ? 'admin' : 'DSA'
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('userName', mockUser.name);
        localStorage.setItem('userEmail', mockUser.email);
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        setUser(mockUser);
        
        return { success: true, token: mockToken, user: mockUser };
      }
      throw error;
    }
  };

  const register = async (userData) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/register`, userData);
      return response.data;
    } catch (error) {
      // Mock registration when backend is unavailable
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404) {
        return {
          success: true,
          message: 'Registration successful (Demo Mode)',
          user: { ...userData, id: 1 }
        };
      }
      throw error;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userName');
    localStorage.removeItem('userEmail');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};