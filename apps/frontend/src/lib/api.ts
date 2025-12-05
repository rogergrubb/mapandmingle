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

// Helper to decode JWT and check expiration
const isTokenExpiringSoon = (token: string): boolean => {
  try {
    // Decode the JWT payload (middle part)
    const payload = JSON.parse(atob(token.split('.')[1]));
    const exp = payload.exp;
    if (!exp) return false;
    
    // Check if token expires in the next 30 minutes (1800 seconds)
    const now = Math.floor(Date.now() / 1000);
    const timeUntilExpiry = exp - now;
    
    console.log(`Token expires in ${Math.floor(timeUntilExpiry / 60)} minutes`);
    
    return timeUntilExpiry < 1800; // Less than 30 minutes
  } catch (e) {
    console.error('Failed to decode token:', e);
    return false;
  }
};

// Proactive token refresh
const refreshTokenIfNeeded = async (): Promise<string | null> => {
  const token = localStorage.getItem('token');
  const refreshToken = localStorage.getItem('refreshToken');
  
  if (!isValidToken(token) || !isValidToken(refreshToken)) {
    return null;
  }
  
  if (isTokenExpiringSoon(token!)) {
    console.log('Token expiring soon, refreshing proactively...');
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
        console.log('Token refreshed proactively!');
        return newToken;
      }
    } catch (error) {
      console.error('Proactive token refresh failed:', error);
    }
  }
  
  return token;
};

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    // Proactively refresh token if expiring soon
    let token = await refreshTokenIfNeeded();
    
    if (!token) {
      token = localStorage.getItem('token');
    }
    
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
        // Clear invalid tokens
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        console.log('Attempting token refresh after 401...');
        const response = await axios.post(`${API_URL}/api/auth/refresh`, {
          refreshToken,
        });
        
        const newToken = response.data.accessToken || response.data.token;
        const newRefreshToken = response.data.refreshToken;
        
        if (newToken) {
          console.log('Token refreshed successfully!');
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
        console.error('Token refresh failed:', refreshError);
        processQueue(refreshError, null);
        isRefreshing = false;
        
        // Clear tokens and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('userId');
        window.location.href = '/login';
        
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// Also set up a background refresh check every 10 minutes
setInterval(async () => {
  const token = localStorage.getItem('token');
  if (isValidToken(token)) {
    await refreshTokenIfNeeded();
  }
}, 10 * 60 * 1000); // Every 10 minutes

export default api;
