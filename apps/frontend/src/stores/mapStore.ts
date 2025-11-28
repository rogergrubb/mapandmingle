import { create } from 'zustand';
import { Pin, Hotspot } from '../types';
import api from '../lib/api';

interface MapState {
  pins: Pin[];
  hotspots: Hotspot[];
  userLocation: { latitude: number; longitude: number } | null;
  filter: 'all' | '24h' | 'week';
  showHotspots: boolean;
  isLoading: boolean;
  fetchPins: (bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  }) => Promise<void>;
  fetchHotspots: (location: { latitude: number; longitude: number; radius: number }) => Promise<void>;
  setFilter: (filter: 'all' | '24h' | 'week') => void;
  setShowHotspots: (show: boolean) => void;
  setUserLocation: (location: { latitude: number; longitude: number }) => void;
  likePin: (pinId: string) => Promise<void>;
  savePin: (pinId: string) => Promise<void>;
}

export const useMapStore = create<MapState>((set, get) => ({
  pins: [],
  hotspots: [],
  userLocation: null,
  filter: 'all',
  showHotspots: false,
  isLoading: false,

  fetchPins: async (bounds) => {
    set({ isLoading: true });
    try {
      const pins: any = await api.get('/api/pins', {
        params: {
          ...bounds,
          filter: get().filter,
        },
      });
      set({ pins, isLoading: false });
    } catch (error) {
      console.error('Error fetching pins:', error);
      set({ isLoading: false });
    }
  },

  fetchHotspots: async (location) => {
    try {
      const hotspots: any = await api.get('/api/hotspots', {
        params: location,
      });
      set({ hotspots });
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    }
  },

  setFilter: (filter) => {
    set({ filter });
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
}));
