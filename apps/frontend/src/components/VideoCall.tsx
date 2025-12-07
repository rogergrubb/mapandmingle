import { useEffect, useRef, useState, useCallback } from 'react';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, Phone,
  User, X, Loader2 
} from 'lucide-react';
import { useCallStore } from '../stores/callStore';
import AgoraRTC, { 
  IAgoraRTCClient, 
  ICameraVideoTrack, 
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser 
} from 'agora-rtc-sdk-ng';

// Initialize Agora client
AgoraRTC.setLogLevel(3); // Warnings only

export function VideoCall() {
  const {
    callId,
    channelName,
    token,
    appId,
    uid,
    isVideo,
    remoteUserName,
    remoteUserImage,
    status,
    isCaller,
    isMuted,
    isVideoOff,
    acceptCall,
    rejectCall,
    endCall,
    toggleMute,
    toggleVideo,
  } = useCallStore();

  const [remoteUser, setRemoteUser] = useState<IAgoraRTCRemoteUser | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localVideoRef = useRef<HTMLDivElement>(null);
  const remoteVideoRef = useRef<HTMLDivElement>(null);
  const localTracksRef = useRef<{
    audio: IMicrophoneAudioTrack | null;
    video: ICameraVideoTrack | null;
  }>({ audio: null, video: null });
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize Agora client
  const initializeClient = useCallback(async () => {
    if (!appId || !channelName || uid === null) return;

    setIsConnecting(true);

    try {
      // Create client
      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      // Set up event handlers
      client.on('user-published', async (user, mediaType) => {
        await client.subscribe(user, mediaType);
        
        if (mediaType === 'video') {
          setRemoteUser(user);
          if (remoteVideoRef.current) {
            user.videoTrack?.play(remoteVideoRef.current);
          }
        }
        
        if (mediaType === 'audio') {
          user.audioTrack?.play();
        }
      });

      client.on('user-unpublished', (user, mediaType) => {
        if (mediaType === 'video') {
          setRemoteUser(null);
        }
      });

      client.on('user-left', () => {
        setRemoteUser(null);
        endCall();
      });

      // Join channel
      await client.join(appId, channelName, token || null, uid);

      // Create and publish local tracks
      const tracks = await AgoraRTC.createMicrophoneAndCameraTracks(
        {},
        { encoderConfig: '720p_2' }
      );

      localTracksRef.current = {
        audio: tracks[0],
        video: tracks[1],
      };

      // Play local video
      if (localVideoRef.current && isVideo) {
        tracks[1].play(localVideoRef.current);
      }

      // Publish tracks
      await client.publish(isVideo ? tracks : [tracks[0]]);

      setIsConnecting(false);

      // Start call timer
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Failed to initialize Agora:', error);
      setIsConnecting(false);
      endCall();
    }
  }, [appId, channelName, token, uid, isVideo, endCall]);

  // Join when call becomes active
  useEffect(() => {
    if (status === 'active' && appId && channelName) {
      initializeClient();
    }

    return () => {
      // Cleanup on unmount or status change
      if (clientRef.current) {
        localTracksRef.current.audio?.close();
        localTracksRef.current.video?.close();
        clientRef.current.leave();
        clientRef.current = null;
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status, appId, channelName, initializeClient]);

  // Handle mute toggle
  useEffect(() => {
    if (localTracksRef.current.audio) {
      localTracksRef.current.audio.setEnabled(!isMuted);
    }
  }, [isMuted]);

  // Handle video toggle
  useEffect(() => {
    if (localTracksRef.current.video) {
      localTracksRef.current.video.setEnabled(!isVideoOff);
    }
  }, [isVideoOff]);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Don't render if idle
  if (status === 'idle') {
    return null;
  }

  // Incoming call UI
  if (status === 'ringing' && !isCaller) {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
        {/* Caller info */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gray-700 ring-4 ring-white/20 animate-pulse">
            {remoteUserImage ? (
              <img src={remoteUserImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {remoteUserName || 'Unknown'}
          </h2>
          <p className="text-gray-400">
            Incoming {isVideo ? 'video' : 'voice'} call...
          </p>
        </div>

        {/* Answer/Decline buttons */}
        <div className="flex gap-8">
          <button
            onClick={() => callId && rejectCall(callId)}
            className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
          >
            <X size={28} className="text-white" />
          </button>
          <button
            onClick={() => callId && acceptCall(callId)}
            className="w-16 h-16 rounded-full bg-green-500 hover:bg-green-600 flex items-center justify-center transition-colors shadow-lg animate-bounce"
          >
            <Phone size={28} className="text-white" />
          </button>
        </div>
      </div>
    );
  }

  // Outgoing call UI (waiting for answer)
  if (status === 'calling') {
    return (
      <div className="fixed inset-0 z-[9999] bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex flex-col items-center justify-center">
        {/* Callee info */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 mx-auto mb-6 rounded-full overflow-hidden bg-gray-700 ring-4 ring-white/20">
            {remoteUserImage ? (
              <img src={remoteUserImage} alt="" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <User size={48} className="text-gray-400" />
              </div>
            )}
          </div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {remoteUserName || 'Unknown'}
          </h2>
          <p className="text-gray-400 flex items-center justify-center gap-2">
            <Loader2 size={16} className="animate-spin" />
            Calling...
          </p>
        </div>

        {/* Cancel button */}
        <button
          onClick={endCall}
          className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors shadow-lg"
        >
          <PhoneOff size={28} className="text-white" />
        </button>
      </div>
    );
  }

  // Active call UI
  return (
    <div className="fixed inset-0 z-[9999] bg-black">
      {/* Remote video (full screen) */}
      <div 
        ref={remoteVideoRef} 
        className="absolute inset-0 bg-gray-900"
      >
        {!remoteUser && (
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-700 mb-4">
              {remoteUserImage ? (
                <img src={remoteUserImage} alt="" className="w-full h-full object-cover" />
              ) : (
                <User size={40} className="w-full h-full p-6 text-gray-400" />
              )}
            </div>
            <p className="text-white font-medium">{remoteUserName}</p>
            {isConnecting && (
              <p className="text-gray-400 text-sm mt-2 flex items-center gap-2">
                <Loader2 size={14} className="animate-spin" />
                Connecting...
              </p>
            )}
          </div>
        )}
      </div>

      {/* Local video (PiP) */}
      {isVideo && !isVideoOff && (
        <div 
          ref={localVideoRef}
          className="absolute top-4 right-4 w-32 h-44 bg-gray-800 rounded-xl overflow-hidden shadow-2xl border-2 border-white/20"
        />
      )}

      {/* Call info bar */}
      <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-sm rounded-xl px-4 py-2">
        <p className="text-white font-medium">{remoteUserName}</p>
        <p className="text-gray-300 text-sm">{formatDuration(callDuration)}</p>
      </div>

      {/* Controls */}
      <div className="absolute bottom-8 left-0 right-0 flex justify-center gap-4">
        {/* Mute button */}
        <button
          onClick={toggleMute}
          className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
            isMuted 
              ? 'bg-white text-gray-900' 
              : 'bg-white/20 text-white hover:bg-white/30'
          }`}
        >
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
        </button>

        {/* Video toggle button */}
        {isVideo && (
          <button
            onClick={toggleVideo}
            className={`w-14 h-14 rounded-full flex items-center justify-center transition-colors ${
              isVideoOff 
                ? 'bg-white text-gray-900' 
                : 'bg-white/20 text-white hover:bg-white/30'
            }`}
          >
            {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
          </button>
        )}

        {/* End call button */}
        <button
          onClick={endCall}
          className="w-14 h-14 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center transition-colors"
        >
          <PhoneOff size={24} className="text-white" />
        </button>
      </div>
    </div>
  );
}

// Call notification checker - polls for incoming calls
export function CallNotificationChecker() {
  const { status, setIncomingCall } = useCallStore();

  useEffect(() => {
    if (status !== 'idle') return;

    const checkForCalls = async () => {
      try {
        const response = await fetch('/api/calls/incoming', {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`,
          },
        });
        
        if (response.ok) {
          const data = await response.json();
          if (data.calls && data.calls.length > 0) {
            setIncomingCall(data.calls[0]);
          }
        }
      } catch (error) {
        // Silently fail - user might not be authenticated
      }
    };

    const interval = setInterval(checkForCalls, 3000);
    return () => clearInterval(interval);
  }, [status, setIncomingCall]);

  return null;
}
