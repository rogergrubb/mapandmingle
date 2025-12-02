import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
  Alert,
  StatusBar,
  Image,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/auth';
import api from '../../src/lib/api';

// WebRTC imports
import {
  RTCPeerConnection,
  RTCView,
  mediaDevices,
  RTCIceCandidate,
  RTCSessionDescription,
  MediaStream,
} from 'react-native-webrtc';

const { width, height } = Dimensions.get('window');

// STUN/TURN servers for NAT traversal
const configuration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

interface OtherUser {
  id: string;
  name: string;
  avatar?: string;
}

export default function VideoCallScreen() {
  const { id: otherUserId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  // Call state
  const [callId, setCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'initializing' | 'connecting' | 'ringing' | 'connected' | 'ended'>('initializing');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isFrontCamera, setIsFrontCamera] = useState(true);
  const [showControls, setShowControls] = useState(true);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [isIncoming, setIsIncoming] = useState(false);

  // WebRTC state
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const iceCandidatesQueue = useRef<RTCIceCandidate[]>([]);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket for signaling
  useEffect(() => {
    const wsUrl = process.env.EXPO_PUBLIC_WS_URL || 'wss://api.mapmingle.app/ws';
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected for video call');
      ws.send(JSON.stringify({ type: 'auth', userId: user?.id }));
    };

    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data);
      await handleSignalingMessage(message);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    return () => {
      ws.close();
    };
  }, [user?.id]);

  // Handle incoming signaling messages
  const handleSignalingMessage = async (message: any) => {
    const { type, callId: msgCallId, payload, fromUserId, caller } = message;

    switch (type) {
      case 'incoming_call':
        // Incoming call notification
        setCallId(msgCallId);
        setIsIncoming(true);
        setCallStatus('ringing');
        setOtherUser(caller);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'call_answered':
        // Our call was answered
        setCallStatus('connected');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;

      case 'call_declined':
        // Our call was declined
        setCallStatus('ended');
        Alert.alert('Call Declined', 'The user declined your call');
        setTimeout(() => router.back(), 1500);
        break;

      case 'call_ended':
        // Other party ended the call
        setCallStatus('ended');
        cleanupCall();
        setTimeout(() => router.back(), 1500);
        break;

      case 'webrtc_offer':
        // Received offer - create answer
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(payload)
          );
          const answer = await peerConnection.current.createAnswer();
          await peerConnection.current.setLocalDescription(answer);
          sendSignal('answer', answer);

          // Process queued ICE candidates
          iceCandidatesQueue.current.forEach((candidate) => {
            peerConnection.current?.addIceCandidate(candidate);
          });
          iceCandidatesQueue.current = [];
        }
        break;

      case 'webrtc_answer':
        // Received answer to our offer
        if (peerConnection.current) {
          await peerConnection.current.setRemoteDescription(
            new RTCSessionDescription(payload)
          );

          // Process queued ICE candidates
          iceCandidatesQueue.current.forEach((candidate) => {
            peerConnection.current?.addIceCandidate(candidate);
          });
          iceCandidatesQueue.current = [];
        }
        break;

      case 'webrtc_ice-candidate':
        // Received ICE candidate
        const candidate = new RTCIceCandidate(payload);
        if (peerConnection.current?.remoteDescription) {
          await peerConnection.current.addIceCandidate(candidate);
        } else {
          iceCandidatesQueue.current.push(candidate);
        }
        break;
    }
  };

  // Send signaling message via API
  const sendSignal = async (type: string, payload: any) => {
    if (!callId) return;
    try {
      await api.post(`/api/video-calls/${callId}/signal`, { type, payload });
    } catch (error) {
      console.error('Failed to send signal:', error);
    }
  };

  // Initialize call
  useEffect(() => {
    if (!otherUserId) return;
    initializeCall();
    return () => cleanupCall();
  }, [otherUserId]);

  const initializeCall = async () => {
    try {
      // Fetch other user info
      const userData = await api.get(`/api/users/${otherUserId}`);
      setOtherUser({
        id: userData.id,
        name: userData.profile?.displayName || userData.name || 'User',
        avatar: userData.profile?.avatar,
      });

      // Get local media stream
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });
      setLocalStream(stream);

      // Create peer connection
      const pc = new RTCPeerConnection(configuration);
      peerConnection.current = pc;

      // Add local stream tracks
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      // Handle remote stream
      pc.ontrack = (event) => {
        if (event.streams && event.streams[0]) {
          setRemoteStream(event.streams[0]);
        }
      };

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', event.candidate);
        }
      };

      // Monitor connection state
      pc.onconnectionstatechange = () => {
        console.log('Connection state:', pc.connectionState);
        if (pc.connectionState === 'connected') {
          setCallStatus('connected');
        } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          handleEndCall();
        }
      };

      // Initiate the call (if not incoming)
      if (!isIncoming) {
        setCallStatus('connecting');
        const response = await api.post('/api/video-calls', { receiverId: otherUserId });
        setCallId(response.callId);
        setCallStatus('ringing');

        // Create and send offer
        const offer = await pc.createOffer({
          offerToReceiveAudio: true,
          offerToReceiveVideo: true,
        });
        await pc.setLocalDescription(offer);

        // Wait a moment for call to be registered, then send offer
        setTimeout(() => {
          sendSignal('offer', offer);
        }, 500);
      }
    } catch (error) {
      console.error('Failed to initialize call:', error);
      Alert.alert('Error', 'Failed to start video call');
      router.back();
    }
  };

  // Cleanup
  const cleanupCall = () => {
    if (localStream) {
      localStream.getTracks().forEach((track) => track.stop());
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // Pulse animation for ringing
  useEffect(() => {
    if (callStatus === 'ringing' || callStatus === 'connecting') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.2, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callStatus]);

  // Auto-hide controls
  useEffect(() => {
    if (callStatus === 'connected' && showControls) {
      controlsTimeoutRef.current = setTimeout(() => {
        Animated.timing(controlsOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => setShowControls(false));
      }, 5000);
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [showControls, callStatus]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScreenTap = () => {
    if (callStatus === 'connected') {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
      if (!showControls) {
        setShowControls(true);
        Animated.timing(controlsOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  const handleEndCall = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCallStatus('ended');

    if (callId) {
      try {
        await api.put(`/api/video-calls/${callId}/end`);
      } catch (error) {
        console.error('Failed to end call:', error);
      }
    }

    cleanupCall();
    setTimeout(() => router.back(), 1000);
  };

  const handleAnswerCall = async () => {
    if (!callId) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    try {
      await api.put(`/api/video-calls/${callId}/answer`);
      setCallStatus('connected');
    } catch (error) {
      console.error('Failed to answer call:', error);
    }
  };

  const handleDeclineCall = async () => {
    if (!callId) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await api.put(`/api/video-calls/${callId}/decline`);
    } catch (error) {
      console.error('Failed to decline call:', error);
    }

    cleanupCall();
    router.back();
  };

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (localStream) {
      localStream.getAudioTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const handleToggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (localStream) {
      localStream.getVideoTracks().forEach((track) => {
        track.enabled = !track.enabled;
      });
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleFlipCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          // @ts-ignore - _switchCamera exists on react-native-webrtc
          await videoTrack._switchCamera();
          setIsFrontCamera(!isFrontCamera);
        } catch (error) {
          console.error('Failed to switch camera:', error);
        }
      }
    }
  };

  const displayName = otherUser?.name || 'User';
  const avatarUrl = otherUser?.avatar;

  // Render incoming call UI
  if (isIncoming && callStatus === 'ringing') {
    return (
      <View style={styles.container}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
          <View style={styles.incomingCallContainer}>
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </Animated.View>

            <Text style={styles.callerName}>{displayName}</Text>
            <Text style={styles.incomingLabel}>Incoming video call...</Text>

            <View style={styles.incomingActions}>
              <TouchableOpacity style={styles.declineButton} onPress={handleDeclineCall}>
                <Ionicons name="close" size={32} color="#fff" />
              </TouchableOpacity>

              <TouchableOpacity style={styles.answerButton} onPress={handleAnswerCall}>
                <Ionicons name="videocam" size={32} color="#fff" />
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.container} activeOpacity={1} onPress={handleScreenTap}>
      <StatusBar barStyle="light-content" />

      {/* Remote Video (Full Screen) */}
      {remoteStream ? (
        <RTCView
          streamURL={remoteStream.toURL()}
          style={styles.remoteVideo}
          objectFit="cover"
          mirror={false}
        />
      ) : (
        <LinearGradient colors={['#1a1a2e', '#16213e', '#0f3460']} style={styles.gradient}>
          {/* Connecting/Ringing State */}
          <View style={styles.connectingContainer}>
            <Animated.View style={[styles.avatarContainer, { transform: [{ scale: pulseAnim }] }]}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarLarge} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>{displayName[0]?.toUpperCase()}</Text>
                </View>
              )}
            </Animated.View>

            <Text style={styles.callerName}>{displayName}</Text>
            <Text style={styles.statusText}>
              {callStatus === 'connecting' && 'Connecting...'}
              {callStatus === 'ringing' && 'Ringing...'}
              {callStatus === 'ended' && 'Call ended'}
            </Text>
          </View>
        </LinearGradient>
      )}

      {/* Local Video (Picture-in-Picture) */}
      {localStream && !isVideoOff && (
        <View style={styles.localVideoContainer}>
          <RTCView
            streamURL={localStream.toURL()}
            style={styles.localVideo}
            objectFit="cover"
            mirror={isFrontCamera}
          />
        </View>
      )}

      {/* Top Bar */}
      <Animated.View style={[styles.topBar, { opacity: controlsOpacity }]}>
        {callStatus === 'connected' && (
          <View style={styles.callInfo}>
            <View style={styles.callIndicator} />
            <Text style={styles.durationText}>{formatDuration(callDuration)}</Text>
          </View>
        )}
      </Animated.View>

      {/* Controls */}
      {showControls && (
        <Animated.View style={[styles.controls, { opacity: controlsOpacity }]}>
          <View style={styles.controlsRow}>
            <TouchableOpacity
              style={[styles.controlButton, isMuted && styles.controlButtonActive]}
              onPress={handleToggleMute}
            >
              <Ionicons name={isMuted ? 'mic-off' : 'mic'} size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.controlButton, isVideoOff && styles.controlButtonActive]}
              onPress={handleToggleVideo}
            >
              <Ionicons name={isVideoOff ? 'videocam-off' : 'videocam'} size={24} color="#fff" />
            </TouchableOpacity>

            <TouchableOpacity style={styles.controlButton} onPress={handleFlipCamera}>
              <Ionicons name="camera-reverse" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.endCallButton} onPress={handleEndCall}>
            <Ionicons name="call" size={32} color="#fff" style={{ transform: [{ rotate: '135deg' }] }} />
          </TouchableOpacity>
        </Animated.View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  gradient: {
    flex: 1,
  },
  remoteVideo: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  localVideoContainer: {
    position: 'absolute',
    top: 60,
    right: 16,
    width: 120,
    height: 160,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  localVideo: {
    flex: 1,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  callInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  callIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
  },
  durationText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 50,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  controlsRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  controlButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonActive: {
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  endCallButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomingCallContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarContainer: {
    marginBottom: 24,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  avatarText: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#fff',
  },
  callerName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  incomingLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: 60,
  },
  incomingActions: {
    flexDirection: 'row',
    gap: 60,
  },
  declineButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  answerButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#22c55e',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
