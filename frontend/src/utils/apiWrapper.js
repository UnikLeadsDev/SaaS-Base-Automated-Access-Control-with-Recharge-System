import axios from 'axios';
import { getMockResponse } from './mockApi.js';

// Enhanced axios wrapper that falls back to mock data when backend is unavailable
const apiWrapper = {
  async get(url, config = {}) {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      // Suppress console errors for expected failures
      const originalConsoleError = console.error;
      console.error = () => {};
      
      // Don't use mock data for auth errors - let them propagate
      if (error.response?.status === 401) {
        console.error = originalConsoleError;
        throw error;
      }
      
      console.error = originalConsoleError;
      
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404 || !error.response) {
        return {
          data: getMockResponse(url),
          status: 200,
          statusText: 'OK (Mock)'
        };
      }
      throw error;
    }
  },

  async post(url, data, config = {}) {
    try {
      const response = await axios.post(url, data, config);
      return response;
    } catch (error) {
      // Don't use mock data for auth errors - let them propagate
      if (error.response?.status === 401) {
        throw error;
      }
      
      if (error.code === 'ERR_NETWORK' || error.response?.status === 404 || !error.response) {
        console.warn(`Backend unavailable for ${url}, using mock response`);
        return {
          data: { success: true, message: 'Mock response - backend unavailable' },
          status: 200,
          statusText: 'OK (Mock)'
        };
      }
      throw error;
    }
  }
};

export default apiWrapper;