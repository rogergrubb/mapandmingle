import { create } from 'zustand';
import api from '../lib/api';

interface CallState {
  // Current call info
  callId: string | null;
  channelName: string | null;
  token: string | null;
  appId: string | null;
  uid: number | null;
  isVideo: boolean;
  
  // Call parties
  remoteUserId: string | null;
  remoteUserName: string | null;
  remoteUserImage: string | null;
  
  // Call status
  status: 'idle' | 'calling' | 'ringing' | 'active' | 'ended';
  isCaller: boolean;
  
  // UI state
  isMuted: boolean;
  isVideoOff: boolean;
  
  // Actions
  initiateCall: (userId: string, userName: string, userImage: string | null, isVideo: boolean) => Promise<void>;
  acceptCall: (callId: string) => Promise<void>;
  rejectCall: (callId: string) => Promise<void>;
  endCall: () => Promise<void>;
  setIncomingCall: (call: IncomingCall) => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  reset: () => void;
}

interface IncomingCall {
  callId: string;
  channelName: string;
  callerId: string;
  callerName: string;
  callerImage: string | null;
  isVideo: boolean;
}

const initialState = {
  callId: null,
  channelName: null,
  token: null,
  appId: null,
  uid: null,
  isVideo: true,
  remoteUserId: null,
  remoteUserName: null,
  remoteUserImage: null,
  status: 'idle' as const,
  isCaller: false,
  isMuted: false,
  isVideoOff: false,
};

export const useCallStore = create<CallState>((set, get) => ({
  ...initialState,

  initiateCall: async (userId, userName, userImage, isVideo) => {
    if (!userId) {
      console.error('Cannot initiate call: userId is required');
      alert('Cannot start call: User not found');
      return;
    }
    
    try {
      set({
        status: 'calling',
        isCaller: true,
        isVideo,
        remoteUserId: userId,
        remoteUserName: userName,
        remoteUserImage: userImage,
      });

      const response = await api.post('/api/calls/initiate', {
        calleeId: userId,
        isVideo,
      });

      // Handle both response.data and direct response formats
      const data = response.data || response;
      
      if (!data || !data.callId) {
        throw new Error('Invalid response from server');
      }

      const { callId, channelName, token, appId, uid } = data;

      set({
        callId,
        channelName,
        token,
        appId,
        uid,
      });

      // Poll for call acceptance
      const pollInterval = setInterval(async () => {
        const currentState = get();
        if (currentState.status !== 'calling') {
          clearInterval(pollInterval);
          return;
        }

        try {
          const statusResponse = await api.get(`/api/calls/${callId}/status`);
          if (statusResponse.data.status === 'active') {
            set({ status: 'active' });
            clearInterval(pollInterval);
          } else if (statusResponse.data.status === 'ended') {
            get().reset();
            clearInterval(pollInterval);
          }
        } catch {
          // Call ended or error
          get().reset();
          clearInterval(pollInterval);
        }
      }, 2000);

      // Auto-end after 60 seconds if not answered
      setTimeout(() => {
        const currentState = get();
        if (currentState.status === 'calling' && currentState.callId === callId) {
          get().endCall();
        }
      }, 60000);

    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
      console.error('Failed to initiate call:', errorMessage, error.response?.data);
      alert(`Could not start call: ${errorMessage}`);
      get().reset();
      throw error;
    }
  },

  acceptCall: async (callId) => {
    try {
      const response = await api.post(`/api/calls/${callId}/accept`);
      const { channelName, token, appId, uid, isVideo } = response.data;

      set({
        callId,
        channelName,
        token,
        appId,
        uid,
        isVideo,
        status: 'active',
        isCaller: false,
      });
    } catch (error) {
      console.error('Failed to accept call:', error);
      get().reset();
      throw error;
    }
  },

  rejectCall: async (callId) => {
    try {
      await api.post(`/api/calls/${callId}/reject`);
      get().reset();
    } catch (error) {
      console.error('Failed to reject call:', error);
      get().reset();
    }
  },

  endCall: async () => {
    const { callId } = get();
    try {
      if (callId) {
        await api.post(`/api/calls/${callId}/end`);
      }
    } catch (error) {
      console.error('Failed to end call:', error);
    } finally {
      get().reset();
    }
  },

  setIncomingCall: (call) => {
    set({
      callId: call.callId,
      channelName: call.channelName,
      remoteUserId: call.callerId,
      remoteUserName: call.callerName,
      remoteUserImage: call.callerImage,
      isVideo: call.isVideo,
      status: 'ringing',
      isCaller: false,
    });
  },

  toggleMute: () => {
    set((state) => ({ isMuted: !state.isMuted }));
  },

  toggleVideo: () => {
    set((state) => ({ isVideoOff: !state.isVideoOff }));
  },

  reset: () => {
    set(initialState);
  },
}));
