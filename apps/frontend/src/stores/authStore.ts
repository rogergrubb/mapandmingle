import { create } from 'zustand';
import { User } from '../types';
import api from '../lib/api';
import { wsClient } from '../lib/websocket';

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  updateProfile: (data: Partial<User>) => Promise<void>;
  fetchUser: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string, userId?: string) => void;
}

interface RegisterData {
  email: string;
  password: string;
  username: string;
  displayName: string;
}

// Helper to check if a token is valid
const isValidToken = (token: string | null): boolean => {
  if (!token) return false;
  if (token === 'undefined' || token === 'null') return false;
  if (token.length < 10) return false;
  return true;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: isValidToken(localStorage.getItem('token')) ? localStorage.getItem('token') : null,
  isAuthenticated: isValidToken(localStorage.getItem('token')),
  isLoading: false,

  login: async (email: string, password: string) => {
    set({ isLoading: true });
    try {
      const response: any = await api.post('/api/auth/login', { email, password });
      const { accessToken, refreshToken, user } = response;
      const token = accessToken;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', user.id);
      
      set({ user, token, isAuthenticated: true, isLoading: false });
      
      wsClient.connect(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  register: async (data: RegisterData) => {
    set({ isLoading: true });
    try {
      const response: any = await api.post('/api/auth/register', data);
      const { accessToken, refreshToken, user } = response;
      const token = accessToken;
      
      localStorage.setItem('token', token);
      localStorage.setItem('refreshToken', refreshToken);
      localStorage.setItem('userId', user.id);
      
      set({ user, token, isAuthenticated: true, isLoading: false });
      
      wsClient.connect(token);
    } catch (error) {
      set({ isLoading: false });
      throw error;
    }
  },

  logout: () => {
    console.log('Logout called');
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('userId');
    wsClient.disconnect();
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: async (data: Partial<User>) => {
    try {
      const response: any = await api.patch('/api/users/me', data);
      set({ user: response });
    } catch (error) {
      throw error;
    }
  },

  fetchUser: async () => {
    // Read token directly from localStorage
    const token = localStorage.getItem('token');
    
    // Validate token before proceeding
    if (!isValidToken(token)) {
      console.log('No valid token found, clearing auth state');
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('userId');
      set({ isAuthenticated: false, user: null, token: null });
      return;
    }
    
    // Don't set isAuthenticated: true until we verify the user exists
    set({ token });
    
    try {
      console.log('Fetching user with token...');
      const user: any = await api.get('/api/users/me');
      
      if (user && user.id) {
        console.log('User fetched successfully:', user.id);
        localStorage.setItem('userId', user.id);
        set({ user, isAuthenticated: true });
        
        // Connect WebSocket only after successful auth
        wsClient.connect(token!);
      } else {
        console.log('No user data returned, clearing auth');
        get().logout();
      }
    } catch (error: any) {
      console.error('fetchUser error:', error);
      
      // Check for specific error types
      const status = error?.response?.status;
      const isNetworkError = !error.response && error.message?.includes('Network');
      
      if (status === 401 || status === 403) {
        // Token is definitely invalid - the api.ts would have tried refresh already
        console.log('Auth failed with', status, '- logging out');
        get().logout();
      } else if (status === 404) {
        // User doesn't exist in database
        console.log('User not found - logging out');
        get().logout();
      } else if (isNetworkError) {
        // Network error - keep user logged in but show offline state
        console.log('Network error - keeping session');
        set({ isAuthenticated: true }); // Optimistically keep logged in
      } else {
        // Other errors (500, etc) - keep user logged in
        console.log('Server error - keeping session');
        set({ isAuthenticated: true });
      }
    }
  },

  setTokens: (accessToken: string, refreshToken: string, userId?: string) => {
    console.log('setTokens called');
    
    // Validate tokens before storing
    if (!isValidToken(accessToken)) {
      console.error('Invalid access token, not storing');
      return;
    }
    
    // Store in localStorage first
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    
    // Then update zustand state
    set({ token: accessToken, isAuthenticated: true });
    
    // Connect WebSocket
    wsClient.connect(accessToken);
  },
}));
