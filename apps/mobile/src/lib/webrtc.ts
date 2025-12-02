import {
  RTCPeerConnection,
  RTCIceCandidate,
  RTCSessionDescription,
  mediaDevices,
  MediaStream,
  MediaStreamTrack,
} from 'react-native-webrtc';

// STUN/TURN servers for NAT traversal
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export type CallState = 'idle' | 'connecting' | 'ringing' | 'connected' | 'ended' | 'failed';

export interface WebRTCCallbacks {
  onLocalStream?: (stream: MediaStream) => void;
  onRemoteStream?: (stream: MediaStream) => void;
  onCallStateChange?: (state: CallState) => void;
  onError?: (error: Error) => void;
  onIceCandidate?: (candidate: RTCIceCandidate) => void;
}

export class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private pendingCandidates: RTCIceCandidate[] = [];
  private callbacks: WebRTCCallbacks = {};
  private callState: CallState = 'idle';

  constructor(callbacks: WebRTCCallbacks = {}) {
    this.callbacks = callbacks;
  }

  // Initialize local media stream (camera + microphone)
  async initLocalStream(videoEnabled: boolean = true, audioEnabled: boolean = true): Promise<MediaStream> {
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: audioEnabled,
        video: videoEnabled ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
          frameRate: { ideal: 30 },
        } : false,
      });
      
      this.localStream = stream;
      this.callbacks.onLocalStream?.(stream);
      return stream;
    } catch (error) {
      console.error('[WebRTC] Error getting local stream:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // Create peer connection
  private createPeerConnection(): RTCPeerConnection {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    // Add local tracks to peer connection
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        pc.addTrack(track, this.localStream!);
      });
    }

    // Handle ICE candidates
    pc.addEventListener('icecandidate', (event: any) => {
      if (event.candidate) {
        console.log('[WebRTC] ICE candidate:', event.candidate.candidate?.substring(0, 50));
        this.callbacks.onIceCandidate?.(event.candidate);
      }
    });

    // Handle connection state changes
    pc.addEventListener('connectionstatechange', () => {
      console.log('[WebRTC] Connection state:', pc.connectionState);
      switch (pc.connectionState) {
        case 'connecting':
          this.setCallState('connecting');
          break;
        case 'connected':
          this.setCallState('connected');
          break;
        case 'disconnected':
        case 'failed':
          this.setCallState('failed');
          break;
        case 'closed':
          this.setCallState('ended');
          break;
      }
    });

    // Handle ICE connection state changes
    pc.addEventListener('iceconnectionstatechange', () => {
      console.log('[WebRTC] ICE connection state:', pc.iceConnectionState);
    });

    // Handle remote tracks
    pc.addEventListener('track', (event: any) => {
      console.log('[WebRTC] Remote track received');
      if (event.streams && event.streams[0]) {
        this.remoteStream = event.streams[0];
        this.callbacks.onRemoteStream?.(event.streams[0]);
      }
    });

    this.peerConnection = pc;
    return pc;
  }

  // Start an outgoing call (caller creates offer)
  async startCall(): Promise<RTCSessionDescription> {
    try {
      this.setCallState('connecting');
      
      const pc = this.createPeerConnection();
      
      // Create offer
      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      
      await pc.setLocalDescription(offer);
      console.log('[WebRTC] Offer created');
      
      this.setCallState('ringing');
      return offer as RTCSessionDescription;
    } catch (error) {
      console.error('[WebRTC] Error starting call:', error);
      this.setCallState('failed');
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // Handle incoming call (callee receives offer, creates answer)
  async handleOffer(offer: RTCSessionDescription): Promise<RTCSessionDescription> {
    try {
      this.setCallState('ringing');
      
      const pc = this.createPeerConnection();
      
      await pc.setRemoteDescription(new RTCSessionDescription(offer));
      console.log('[WebRTC] Remote description set (offer)');
      
      // Process any pending ICE candidates
      await this.processPendingCandidates();
      
      // Create answer
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      console.log('[WebRTC] Answer created');
      
      return answer as RTCSessionDescription;
    } catch (error) {
      console.error('[WebRTC] Error handling offer:', error);
      this.setCallState('failed');
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // Handle answer from callee (caller receives answer)
  async handleAnswer(answer: RTCSessionDescription): Promise<void> {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }
      
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log('[WebRTC] Remote description set (answer)');
      
      // Process any pending ICE candidates
      await this.processPendingCandidates();
    } catch (error) {
      console.error('[WebRTC] Error handling answer:', error);
      this.callbacks.onError?.(error as Error);
      throw error;
    }
  }

  // Add ICE candidate from remote peer
  async addIceCandidate(candidate: RTCIceCandidate): Promise<void> {
    try {
      if (this.peerConnection?.remoteDescription) {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] ICE candidate added');
      } else {
        // Queue candidates if remote description not yet set
        this.pendingCandidates.push(candidate);
        console.log('[WebRTC] ICE candidate queued');
      }
    } catch (error) {
      console.error('[WebRTC] Error adding ICE candidate:', error);
    }
  }

  // Process pending ICE candidates
  private async processPendingCandidates(): Promise<void> {
    if (!this.peerConnection) return;
    
    for (const candidate of this.pendingCandidates) {
      try {
        await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        console.log('[WebRTC] Pending ICE candidate added');
      } catch (error) {
        console.error('[WebRTC] Error adding pending candidate:', error);
      }
    }
    this.pendingCandidates = [];
  }

  // Toggle audio mute
  toggleAudio(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Toggle video
  toggleVideo(enabled: boolean): void {
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach(track => {
        track.enabled = enabled;
      });
    }
  }

  // Switch camera (front/back)
  async switchCamera(): Promise<void> {
    if (!this.localStream) return;
    
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      // @ts-ignore - _switchCamera is a react-native-webrtc specific method
      videoTrack._switchCamera?.();
    }
  }

  // Set call state and notify
  private setCallState(state: CallState): void {
    this.callState = state;
    this.callbacks.onCallStateChange?.(state);
  }

  // Get current call state
  getCallState(): CallState {
    return this.callState;
  }

  // Get local stream
  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  // Get remote stream
  getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }

  // End call and cleanup
  endCall(): void {
    console.log('[WebRTC] Ending call');
    
    // Stop local stream tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Stop remote stream tracks
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
    
    this.pendingCandidates = [];
    this.setCallState('ended');
  }

  // Cleanup
  destroy(): void {
    this.endCall();
    this.callbacks = {};
  }
}

export default WebRTCService;
