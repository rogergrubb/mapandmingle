import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { api } from '../lib/api';

interface User {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
}

interface Profile {
  id: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  age: number | null;
  gender: string | null;
  interests: string[];
  subscriptionStatus: 'trial' | 'active' | 'expired' | 'canceled';
  trustScore: number;
  trustLevel: string;
  ghostMode: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  
  initialize: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
  
  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync('auth_token');
      if (token) {
        api.setToken(token);
        
        // Verify token and get user
        const response = await api.get<{ user: User & { profile: Profile } | null }>('/api/auth/session');
        
        if (response.user) {
          set({
            user: response.user,
            profile: response.user.profile,
            token,
            isAuthenticated: true,
            isLoading: false,
          });
          return;
        }
      }
      
      set({ isLoading: false });
    } catch (error) {
      console.error('Auth init error:', error);
      await SecureStore.deleteItemAsync('auth_token');
      set({ isLoading: false });
    }
  },
  
  login: async (email: string, password: string) => {
    const response = await api.post<{
      user: User;
      token: string;
    }>('/api/auth/login', { email, password });
    
    await SecureStore.setItemAsync('auth_token', response.token);
    api.setToken(response.token);
    
    // Fetch profile
    const profileResponse = await api.get<Profile>('/api/profile');
    
    set({
      user: response.user,
      profile: profileResponse,
      token: response.token,
      isAuthenticated: true,
    });
  },
  
  register: async (email: string, password: string, name?: string) => {
    const response = await api.post<{
      user: User;
      token: string;
    }>('/api/auth/register', { email, password, name });
    
    await SecureStore.setItemAsync('auth_token', response.token);
    api.setToken(response.token);
    
    // Fetch profile
    const profileResponse = await api.get<Profile>('/api/profile');
    
    set({
      user: response.user,
      profile: profileResponse,
      token: response.token,
      isAuthenticated: true,
    });
  },
  
  logout: async () => {
    try {
      await api.post('/api/auth/logout', {});
    } catch (error) {
      // Ignore logout errors
    }
    
    await SecureStore.deleteItemAsync('auth_token');
    api.setToken(null);
    
    set({
      user: null,
      profile: null,
      token: null,
      isAuthenticated: false,
    });
  },
  
  refreshProfile: async () => {
    try {
      const profileResponse = await api.get<Profile>('/api/profile');
      set({ profile: profileResponse });
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  },
}));
