import axios from 'axios';
import { getMockResponse } from './mockApi.js';

// Enhanced axios wrapper with centralized error handling
const apiWrapper = {
  async get(url, config = {}) {
    try {
      const response = await axios.get(url, config);
      return response;
    } catch (error) {
      // Handle structured API errors first
      if (error.response?.data?.errorCode) {
        throw error; // Let caller handle with centralized error handler
      }
      
      // Don't use mock data for auth errors - let them propagate
      if (error.response?.status === 401) {
        throw error;
      }

      // For auth endpoints, do not mock 404 either; surface the error
      const isAuthEndpoint = url.includes('/auth/');
      if (isAuthEndpoint && (error.response?.status === 404)) {
        throw error;
      }
      
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
      // Handle structured API errors first
      if (error.response?.data?.errorCode) {
        throw error; // Let caller handle with centralized error handler
      }
      
      // Don't use mock data for auth errors - let them propagate
      if (error.response?.status === 401) {
        throw error;
      }

      // For auth endpoints, do not mock 404 either; surface the error
      const isAuthEndpoint = url.includes('/auth/');
      if (isAuthEndpoint && (error.response?.status === 404)) {
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