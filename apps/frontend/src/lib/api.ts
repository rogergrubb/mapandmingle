import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'https://mapandmingle-api-492171901610.us-west1.run.app';

export const api = axios.create({
  baseURL: API_URL,
  timeout: 30000,
});

// Track refresh state
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

// Helper to check valid token
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  if (token.length < 10) return false;
  return true;
};

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (isValidToken(token)) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    const userId = localStorage.getItem('userId');
    if (userId && userId !== 'undefined') {
      config.headers['X-User-Id'] = userId;
    }
    
    if (!(config.data instanceof FormData)) {
      config.headers['Content-Type'] = 'application/json';
    }
    
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data as any,
  async (error) => {
    const originalRequest = error.config;
    
    // Network error - don't try to refresh
    if (!error.response) {
      console.error('Network error:', error.message);
      return Promise.reject(error);
    }
    
    // Only handle 401 for non-auth endpoints, non-retried requests
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip refresh for auth endpoints
      if (originalRequest.url?.includes('/api/auth/')) {
        return Promise.reject(error);
      }
      
      // Queue request if already refreshing
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return axios(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }
      
      originalRequest._retry = true;
      isRefreshing = true;
      
      const refreshToken = localStorage.getItem('refreshToken');
      
      if (!isValidToken(refreshToken)) {
        isRefreshing = false;
        // Don't redirect - just reject and let the caller handle it
        return Promise.reject(error);
      }
      
      try {
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        
        const newToken = response.data.accessToken || response.data.token;
        const newRefreshToken = response.data.refreshToken;
        
        if (newToken) {
          localStorage.setItem('token', newToken);
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken);
          }
          
          api.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          
          processQueue(null, newToken);
          isRefreshing = false;
          
          return axios(originalRequest);
        } else {
          throw new Error('No token in refresh response');
        }
      } catch (refreshError) {
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Don't force redirect - just reject and let authStore handle it
        // The authStore.fetchUser will call logout() if appropriate
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

export default api;
