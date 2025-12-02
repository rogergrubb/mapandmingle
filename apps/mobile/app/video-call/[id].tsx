import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  Alert,
  StatusBar,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { RTCView, MediaStream } from 'react-native-webrtc';
import { useAuthStore } from '../../src/stores/auth';
import api from '../../src/lib/api';
import WebRTCService, { CallState } from '../../src/lib/webrtc';

const { width, height } = Dimensions.get('window');

interface CallParticipant {
  id: string;
  name: string;
  avatar: string | null;
}

interface CallData {
  id: string;
  callerId: string;
  calleeId: string;
  status: string;
  startedAt?: string;
  endedAt?: string;
}

export default function VideoCallScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, token } = useAuthStore();

  // Call state
  const [callState, setCallState] = useState<CallState>('idle');
  const [callData, setCallData] = useState<CallData | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [participant, setParticipant] = useState<CallParticipant | null>(null);
  
  // Streams
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  // Refs
  const webrtcRef = useRef<WebRTCService | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const selfVideoScale = useRef(new Animated.Value(1)).current;
  const connectionDots = useRef(new Animated.Value(0)).current;

  // Fetch participant info
  useEffect(() => {
    const fetchParticipant = async () => {
      try {
        const userData = await api.get(`/api/users/${otherUserId}`);
        setParticipant({
          id: userData.id,
          name: userData.name || userData.profile?.displayName || 'User',
          avatar: userData.profile?.avatar || null,
        });
      } catch (error) {
        console.error('Error fetching participant:', error);
        setParticipant({
          id: otherUserId || '',
          name: 'User',
          avatar: null,
        });
      }
    };
    
    if (otherUserId) {
      fetchParticipant();
    }
  }, [otherUserId]);

  // Initialize WebRTC
  useEffect(() => {
    const initCall = async () => {
      try {
        // Create WebRTC service with callbacks
        const webrtc = new WebRTCService({
          onLocalStream: (stream) => {
            console.log('[VideoCall] Local stream received');
            setLocalStream(stream);
          },
          onRemoteStream: (stream) => {
            console.log('[VideoCall] Remote stream received');
            setRemoteStream(stream);
          },
          onCallStateChange: (state) => {
            console.log('[VideoCall] State changed:', state);
            setCallState(state);
          },
          onError: (error) => {
            console.error('[VideoCall] Error:', error);
            Alert.alert('Call Error', error.message);
          },
          onIceCandidate: (candidate) => {
            // Send ICE candidate to remote peer via signaling
            sendSignal('ice-candidate', { candidate });
          },
        });

        webrtcRef.current = webrtc;

        // Initialize local media
        await webrtc.initLocalStream(true, true);
        
        // Connect to signaling server
        connectSignaling();
        
        // Initiate call via API
        initiateCall();

      } catch (error) {
        console.error('[VideoCall] Init error:', error);
        Alert.alert('Error', 'Failed to initialize video call');
        router.back();
      }
    };

    initCall();

    return () => {
      cleanup();
    };
  }, []);

  // Connect to WebSocket for signaling
  const connectSignaling = useCallback(() => {
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://mapandmingle-api-492171901610.us-west1.run.app/ws';
    
    try {
      const ws = new WebSocket(`${wsUrl}?token=${token}`);
      
      ws.onopen = () => {
        console.log('[VideoCall] Signaling connected');
        // Authenticate
        ws.send(JSON.stringify({ type: 'auth', userId: user?.id }));
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleSignalingMessage(message);
        } catch (error) {
          console.error('[VideoCall] Error parsing message:', error);
        }
      };
      
      ws.onerror = (error) => {
        console.error('[VideoCall] Signaling error:', error);
      };
      
      ws.onclose = () => {
        console.log('[VideoCall] Signaling disconnected');
      };
      
      wsRef.current = ws;
    } catch (error) {
      console.error('[VideoCall] Error connecting to signaling:', error);
    }
  }, [token, user?.id]);

  // Handle incoming signaling messages
  const handleSignalingMessage = useCallback(async (message: any) => {
    console.log('[VideoCall] Received signal:', message.type);
    
    switch (message.type) {
      case 'webrtc_offer':
        // Incoming call - handle offer
        if (webrtcRef.current && message.offer) {
          const answer = await webrtcRef.current.handleOffer(message.offer);
          sendSignal('answer', { answer });
        }
        break;
        
      case 'webrtc_answer':
        // Call answered - handle answer
        if (webrtcRef.current && message.answer) {
          await webrtcRef.current.handleAnswer(message.answer);
        }
        break;
        
      case 'webrtc_ice_candidate':
        // ICE candidate received
        if (webrtcRef.current && message.candidate) {
          await webrtcRef.current.addIceCandidate(message.candidate);
        }
        break;
        
      case 'call_declined':
        Alert.alert('Call Declined', 'The user declined your call');
        router.back();
        break;
        
      case 'call_ended':
        handleEndCall();
        break;
    }
  }, []);

  // Send signaling message
  const sendSignal = useCallback((type: string, data: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({
        type: `webrtc_${type}`,
        targetUserId: otherUserId,
        callId: callData?.id,
        ...data,
      }));
    }
  }, [otherUserId, callData?.id]);

  // Initiate call via API
  const initiateCall = async () => {
    try {
      setCallState('connecting');
      
      // Create call record
      const call = await api.post('/api/video-calls', {
        calleeId: otherUserId,
      });
      
      setCallData(call);
      
      // Create and send offer
      if (webrtcRef.current) {
        const offer = await webrtcRef.current.startCall();
        sendSignal('offer', { offer, callId: call.id });
      }
      
    } catch (error: any) {
      console.error('[VideoCall] Error initiating call:', error);
      if (error.status === 403) {
        Alert.alert('Cannot Call', 'This user has blocked you or you have blocked them');
      } else {
        Alert.alert('Error', 'Failed to initiate call');
      }
      router.back();
    }
  };

  // Call duration timer
  useEffect(() => {
    if (callState === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callState]);

  // Pulse animation for ringing state
  useEffect(() => {
    if (callState === 'ringing' || callState === 'connecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      const dots = Animated.loop(
        Animated.timing(connectionDots, {
          toValue: 3,
          duration: 1500,
          useNativeDriver: false,
        })
      );
      dots.start();

      return () => {
        pulse.stop();
        dots.stop();
      };
    }
  }, [callState]);

  // Auto-hide controls
  useEffect(() => {
    if (callState === 'connected' && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        hideControls();
      }, 5000);
    }

    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [callState, showControls]);

  const hideControls = () => {
    Animated.timing(controlsOpacity, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => setShowControls(false));
  };

  const toggleControls = () => {
    if (showControls) {
      hideControls();
    } else {
      setShowControls(true);
      Animated.timing(controlsOpacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    try {
      if (callData?.id) {
        await api.put(`/api/video-calls/${callData.id}/end`);
      }
    } catch (error) {
      console.error('[VideoCall] Error ending call:', error);
    }
    
    cleanup();
    router.back();
  };

  const cleanup = () => {
    webrtcRef.current?.destroy();
    webrtcRef.current = null;
    
    wsRef.current?.close();
    wsRef.current = null;
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
  };

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    webrtcRef.current?.toggleAudio(!newMuted);
  };

  const handleToggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const newVideoOff = !isVideoOff;
    setIsVideoOff(newVideoOff);
    webrtcRef.current?.toggleVideo(!newVideoOff);
  };

  const handleToggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeakerOn(!isSpeakerOn);
    // Note: Speaker toggle would require native audio routing module
  };

  const handleFlipCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    webrtcRef.current?.switchCamera();
    
    Animated.sequence([
      Animated.timing(selfVideoScale, {
        toValue: 0.8,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(selfVideoScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderConnectionDots = () => {
    const dotCount = Math.floor((connectionDots as any)._value || 0) + 1;
    return '.'.repeat(Math.min(dotCount, 3));
  };

  // Connecting/Ringing State
  if (callState !== 'connected' && callState !== 'ended') {
    return (
      <View className="flex-1 bg-gray-900">
        <StatusBar barStyle="light-content" />
        
        <LinearGradient
          colors={['#1a1a2e', '#16213e', '#0f3460']}
          className="flex-1 items-center justify-center"
        >
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => router.back()}
            className="absolute top-14 left-4 p-3 rounded-full bg-white/10"
          >
            <Ionicons name="chevron-back" size={24} color="white" />
          </TouchableOpacity>

          {/* Self Preview (small) */}
          {localStream && !isVideoOff && (
            <View className="absolute top-14 right-4 w-24 h-32 rounded-xl overflow-hidden border-2 border-white/30">
              <RTCView
                streamURL={localStream.toURL()}
                style={{ width: '100%', height: '100%' }}
                objectFit="cover"
                mirror={true}
              />
            </View>
          )}

          {/* Avatar */}
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="mb-8"
          >
            <View className="w-32 h-32 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 items-center justify-center shadow-2xl">
              <View className="w-28 h-28 rounded-full bg-gray-800 items-center justify-center">
                <Text className="text-4xl font-bold text-white">
                  {participant?.name?.charAt(0) || 'U'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Name & Status */}
          <Text className="text-2xl font-bold text-white mb-2">
            {participant?.name || 'Connecting...'}
          </Text>
          <Text className="text-gray-400 text-lg">
            {callState === 'connecting' 
              ? `Connecting${renderConnectionDots()}`
              : callState === 'ringing'
              ? 'Ringing...'
              : 'Starting call...'}
          </Text>

          {/* End Call Button */}
          <TouchableOpacity
            onPress={handleEndCall}
            className="absolute bottom-16 bg-red-500 w-16 h-16 rounded-full items-center justify-center shadow-lg"
            style={{
              shadowColor: '#EF4444',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.5,
              shadowRadius: 8,
            }}
          >
            <Ionicons name="call" size={28} color="white" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Connected State - Full Video Call UI
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={toggleControls}
      className="flex-1 bg-black"
    >
      <StatusBar barStyle="light-content" />

      {/* Remote Video (Full Screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={{ width: '100%', height: '100%' }}
          objectFit="cover"
          zOrder={0}
        />
      ) : (
        <View className="flex-1 items-center justify-center bg-gray-900">
          <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center">
            <Text className="text-3xl font-bold text-white">
              {participant?.name?.charAt(0) || 'U'}
            </Text>
          </View>
          <Text className="text-white mt-4 text-lg">{participant?.name}</Text>
          <Text className="text-gray-400 mt-2">Camera off</Text>
        </View>
      )}

      {/* Self Video (Picture-in-Picture) */}
      <Animated.View
        style={{
          position: 'absolute',
          top: Platform.OS === 'ios' ? 60 : 40,
          right: 16,
          transform: [{ scale: selfVideoScale }],
        }}
        className="w-28 h-40 rounded-2xl overflow-hidden border-2 border-white/30 shadow-lg"
      >
        {localStream && !isVideoOff ? (
          <RTCView
            streamURL={localStream.toURL()}
            style={{ width: '100%', height: '100%' }}
            objectFit="cover"
            mirror={true}
            zOrder={1}
          />
        ) : (
          <View className="flex-1 bg-gray-800 items-center justify-center">
            <Ionicons name="videocam-off" size={24} color="#9CA3AF" />
          </View>
        )}
        
        {isMuted && (
          <View className="absolute bottom-2 right-2 bg-red-500 rounded-full p-1">
            <Ionicons name="mic-off" size={12} color="white" />
          </View>
        )}
      </Animated.View>

      {/* Controls Overlay */}
      {showControls && (
        <Animated.View
          style={{ opacity: controlsOpacity }}
          className="absolute inset-0"
        >
          {/* Top Bar */}
          <LinearGradient
            colors={['rgba(0,0,0,0.7)', 'transparent']}
            className="absolute top-0 left-0 right-0 pt-14 pb-8 px-4"
          >
            <View className="flex-row items-center justify-between">
              <TouchableOpacity
                onPress={() => router.back()}
                className="p-2"
              >
                <Ionicons name="chevron-back" size={28} color="white" />
              </TouchableOpacity>
              
              <View className="items-center">
                <Text className="text-white font-semibold text-lg">
                  {participant?.name}
                </Text>
                <Text className="text-green-400 text-sm">
                  {formatDuration(callDuration)}
                </Text>
              </View>
              
              <TouchableOpacity
                onPress={handleFlipCamera}
                className="p-2"
              >
                <Ionicons name="camera-reverse" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Bottom Controls */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.8)']}
            className="absolute bottom-0 left-0 right-0 pt-20 pb-12 px-6"
          >
            <View className="flex-row items-center justify-around">
              {/* Mute Button */}
              <TouchableOpacity
                onPress={handleToggleMute}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isMuted ? 'bg-red-500' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Video Button */}
              <TouchableOpacity
                onPress={handleToggleVideo}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isVideoOff ? 'bg-red-500' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isVideoOff ? 'videocam-off' : 'videocam'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* End Call Button */}
              <TouchableOpacity
                onPress={handleEndCall}
                className="w-16 h-16 rounded-full bg-red-500 items-center justify-center shadow-lg"
                style={{
                  shadowColor: '#EF4444',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.5,
                  shadowRadius: 8,
                }}
              >
                <Ionicons
                  name="call"
                  size={28}
                  color="white"
                  style={{ transform: [{ rotate: '135deg' }] }}
                />
              </TouchableOpacity>

              {/* Speaker Button */}
              <TouchableOpacity
                onPress={handleToggleSpeaker}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isSpeakerOn ? 'bg-blue-500' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={24}
                  color="white"
                />
              </TouchableOpacity>

              {/* Flip Camera Button */}
              <TouchableOpacity
                onPress={handleFlipCamera}
                className="w-14 h-14 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="camera-reverse-outline" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}
