import { create } from 'zustand';
import { Pin, Hotspot } from '../types';
import api from '../lib/api';

interface MapState {
  pins: Pin[];
  hotspots: Hotspot[];
  userLocation: { latitude: number; longitude: number } | null;
  filter: 'all' | '24h' | 'week';
  lookingForFilter: string | null; // 'everybody', 'dating', 'friends', 'networking', 'events', 'travel'
  showHotspots: boolean;
  isLoading: boolean;
  fetchPins: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
    zoom?: number;
  }) => Promise<void>;
  fetchHotspots: (location: { latitude: number; longitude: number; radius: number }) => Promise<void>;
  setFilter: (filter: 'all' | '24h' | 'week') => void;
  setLookingForFilter: (lookingFor: string | null) => void;
  setShowHotspots: (show: boolean) => void;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  likePin: (pinId: string) => Promise<void>;
  savePin: (pinId: string) => Promise<void>;
  addPin: (pinData: Partial<Pin>) => Promise<Pin>;
}

export const useMapStore = create<MapState>((set, get) => ({
  pins: [],
  hotspots: [],
  userLocation: null,
  filter: 'all',
  lookingForFilter: 'everybody', // Default to showing everybody
  showHotspots: false,
  isLoading: false,

  fetchPins: async (bounds) => {
    set({ isLoading: true });
    try {
      const lookingFor = get().lookingForFilter;
      const response: any = await api.get('/api/pins', {
        params: {
          ...bounds,
          filter: get().filter,
          ...(lookingFor && lookingFor !== 'everybody' ? { lookingFor } : {}),
        },
      });
      // Ensure pins is always an array
      const pins = Array.isArray(response) ? response : (response?.data || response?.pins || []);
      set({ pins, isLoading: false });
    } catch (error) {
      console.error('Error fetching pins:', error);
      set({ pins: [], isLoading: false });
    }
  },

  fetchHotspots: async (location) => {
    try {
      const response: any = await api.get('/api/hotspots', {
        params: location,
      });
      // Ensure hotspots is always an array
      const hotspots = Array.isArray(response) ? response : (response?.data || response?.hotspots || []);
      set({ hotspots });
    } catch (error) {
      console.error('Error fetching hotspots:', error);
      set({ hotspots: [] });
    }
  },

  setFilter: (filter) => {
    set({ filter });
  },

  setLookingForFilter: (lookingFor) => {
    set({ lookingForFilter: lookingFor });
  },

  setShowHotspots: (show) => {
    set({ showHotspots: show });
  },

  setUserLocation: (location) => {
    set({ userLocation: location });
  },

  likePin: async (pinId) => {
    try {
      await api.post(`/api/pins/${pinId}/like`);
      set((state) => ({
        pins: state.pins.map((pin) =>
          pin.id === pinId
            ? { ...pin, likes: pin.likes + (pin.isLiked ? -1 : 1), isLiked: !pin.isLiked }
            : pin
        ),
      }));
    } catch (error) {
      console.error('Error liking pin:', error);
    }
  },

  savePin: async (pinId) => {
    try {
      await api.post(`/api/pins/${pinId}/save`);
      set((state) => ({
        pins: state.pins.map((pin) =>
          pin.id === pinId ? { ...pin, isSaved: !pin.isSaved } : pin
        ),
      }));
    } catch (error) {
      console.error('Error saving pin:', error);
    }
  },

  addPin: async (pinData) => {
    try {
      const newPin: any = await api.post('/api/pins', pinData);
      set((state) => ({
        pins: [...state.pins, newPin],
      }));
      return newPin;
    } catch (error) {
      console.error('Error creating pin:', error);
      throw error;
    }
  },
}));
