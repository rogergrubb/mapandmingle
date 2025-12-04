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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
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
    const token = get().token;
    if (!token) return;
    
    try {
      const user: any = await api.get('/api/users/me');
      if (user && user.id) {
        localStorage.setItem('userId', user.id);
      }
      set({ user, isAuthenticated: true });
      
      if (token) {
        wsClient.connect(token);
      }
    } catch (error: any) {
      // Only logout on definitive auth failures (401/403)
      // Don't logout on network errors or server errors (5xx)
      const status = error?.response?.status;
      if (status === 401 || status === 403) {
        console.log('Auth failed, logging out');
        get().logout();
      } else {
        // Keep user logged in but log the error
        console.error('Failed to fetch user (keeping session):', error);
      }
    }
  },

  setTokens: (accessToken: string, refreshToken: string, userId?: string) => {
    localStorage.setItem('token', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
    if (userId) {
      localStorage.setItem('userId', userId);
    }
    set({ token: accessToken, isAuthenticated: true });
    
    wsClient.connect(accessToken);
  },
}));
