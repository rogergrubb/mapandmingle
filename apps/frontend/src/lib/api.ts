import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://mapandmingle-api-492171901610.us-west1.run.app';

export const api = axios.create({
  baseURL: API_URL,
  // Don't set default Content-Type - let axios auto-detect for FormData
});

// Request interceptor to add auth token and handle Content-Type
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Only set Content-Type to JSON if not FormData
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    // For FormData, axios will automatically set multipart/form-data with boundary
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response.data as any,
  async (error) => {
    if (error.response?.status === 401) {
      // Try to refresh token
      const refreshToken = localStorage.getItem('refreshToken');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_URL}/api/auth/refresh`, {
            refreshToken,
          });
          const { token } = response.data;
          localStorage.setItem('token', token);
          
          // Retry original request
          error.config.headers.Authorization = `Bearer ${token}`;
          return axios(error.config);
        } catch (refreshError) {
          // Refresh failed, logout
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
      } else {
        // No refresh token, logout
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
