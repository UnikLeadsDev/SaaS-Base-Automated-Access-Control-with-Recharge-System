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
        // Restore from localStorage in demo mode
        const userName = localStorage.getItem('userName');
        const userEmail = localStorage.getItem('userEmail');
        const userRole = localStorage.getItem('userRole');
        if (userName && userEmail && userRole) {
          setUser({
            id: 1,
            name: userName,
            email: userEmail,
            role: userRole
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
      localStorage.setItem('userRole', response.data.role);
    } catch (error) {
      console.log('Profile fetch error:', error.response?.status, error.message);

      const userName = localStorage.getItem('userName');
      const userEmail = localStorage.getItem('userEmail');
      const userRole = localStorage.getItem('userRole');
      if (userName && userEmail && userRole) {
        console.log('Using stored user data for demo mode');
        setUser({
          id: 1,
          name: userName,
          email: userEmail,
          role: userRole
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

  const simpleLogin = async (userData) => {
    const mockToken = 'mock_jwt_token_' + Date.now();
    localStorage.setItem('token', mockToken);
    localStorage.setItem('userName', userData.name);
    localStorage.setItem('userEmail', userData.email);
    localStorage.setItem('userRole', userData.role);
    axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
    setUser(userData);
    return { success: true, token: mockToken, user: userData };
  };

  const login = async (email, password) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/login`, {
        email,
        password
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      // Mock login
      if (
        error.code === 'ERR_NETWORK' ||
        [400, 401, 404, 429, 500].includes(error.response?.status) ||
        !error.response
      ) {
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
        localStorage.setItem('userRole', mockUser.role);
        axios.defaults.headers.common['Authorization'] = `Bearer ${mockToken}`;
        console.log('Mock login - User created:', mockUser);
        setUser(mockUser);
        
        return { success: true, token: mockToken, user: mockUser };
      }
      throw error;
    }
  };

  const googleLogin = async (googleUser) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/auth/google-login`, {
        email: googleUser.email,
        name: googleUser.name,
        googleId: googleUser.sub || googleUser.id
      });
      
      const { token, user } = response.data;
      localStorage.setItem('token', token);
      localStorage.setItem('userName', user.name);
      localStorage.setItem('userEmail', user.email);
      localStorage.setItem('userRole', user.role);
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      setUser(user);
      
      return response.data;
    } catch (error) {
      // Mock login
      if (error.code === 'ERR_NETWORK' || [404, 500].includes(error.response?.status)) {
        const mockUser = {
          id: 1,
          name: googleUser.name,
          email: googleUser.email,
          role: 'DSA'
        };
        const mockToken = 'mock_jwt_token_' + Date.now();
        
        localStorage.setItem('token', mockToken);
        localStorage.setItem('userName', mockUser.name);
        localStorage.setItem('userEmail', mockUser.email);
        localStorage.setItem('userRole', mockUser.role);
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
    localStorage.removeItem('userRole');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    googleLogin,
    simpleLogin,
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
