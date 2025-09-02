import axios from 'axios';
import API_BASE_URL from '../config/api';

class CSRFManager {
  constructor() {
    this.token = null;
    this.setupAxiosInterceptor();
  }

  async getToken() {
    if (!this.token) {
      await this.fetchToken();
    }
    return this.token;
  }

  async fetchToken() {
    try {
      const response = await axios.get(`${API_BASE_URL}/security/csrf-token`, {
        withCredentials: true
      });
      this.token = response.data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      this.token = null;
    }
  }

  setupAxiosInterceptor() {
    // Request interceptor to add CSRF token
    axios.interceptors.request.use(async (config) => {
      // Only add CSRF token for state-changing requests
      if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase())) {
        // Skip for auth login/register
        if (!config.url?.includes('/auth/login') && !config.url?.includes('/auth/register')) {
          const token = await this.getToken();
          if (token) {
            config.headers['X-CSRF-Token'] = token;
          }
        }
      }
      return config;
    });

    // Response interceptor to handle CSRF errors
    axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.data?.code === 'CSRF_INVALID' || error.response?.data?.code === 'CSRF_MISSING') {
          // Refresh token and retry
          await this.fetchToken();
          const originalRequest = error.config;
          if (this.token && !originalRequest._retry) {
            originalRequest._retry = true;
            originalRequest.headers['X-CSRF-Token'] = this.token;
            return axios(originalRequest);
          }
        }
        return Promise.reject(error);
      }
    );
  }

  clearToken() {
    this.token = null;
  }
}

export const csrfManager = new CSRFManager();