import { useState, useEffect, useRef } from 'react';
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
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/stores/auth';

const { width, height } = Dimensions.get('window');

interface CallParticipant {
  id: string;
  name: string;
  avatar: string;
  isMuted: boolean;
  isVideoOff: boolean;
}

export default function VideoCallScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  // Call state
  const [callStatus, setCallStatus] = useState<'connecting' | 'ringing' | 'connected' | 'ended'>('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [participant, setParticipant] = useState<CallParticipant | null>(null);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const controlsOpacity = useRef(new Animated.Value(1)).current;
  const selfVideoScale = useRef(new Animated.Value(1)).current;
  const connectionDots = useRef(new Animated.Value(0)).current;

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Mock participant data - in real app, fetch from API/WebRTC
  useEffect(() => {
    setParticipant({
      id: id || '1',
      name: 'Sarah Johnson',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200',
      isMuted: false,
      isVideoOff: false,
    });

    // Simulate connection
    const connectTimeout = setTimeout(() => {
      setCallStatus('ringing');
    }, 1500);

    const answerTimeout = setTimeout(() => {
      setCallStatus('connected');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }, 4000);

    return () => {
      clearTimeout(connectTimeout);
      clearTimeout(answerTimeout);
    };
  }, [id]);

  // Call duration timer
  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [callStatus]);

  // Pulse animation for ringing state
  useEffect(() => {
    if (callStatus === 'ringing') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [callStatus]);

  // Connection dots animation
  useEffect(() => {
    if (callStatus === 'connecting') {
      const dots = Animated.loop(
        Animated.timing(connectionDots, {
          toValue: 3,
          duration: 1500,
          useNativeDriver: false,
        })
      );
      dots.start();
      return () => dots.stop();
    }
  }, [callStatus]);

  // Auto-hide controls after inactivity
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
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, [showControls, callStatus]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleScreenTap = () => {
    if (callStatus === 'connected') {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
      
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

  const handleEndCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setCallStatus('ended');
    
    setTimeout(() => {
      router.back();
    }, 1000);
  };

  const handleToggleMute = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsMuted(!isMuted);
  };

  const handleToggleVideo = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsVideoOff(!isVideoOff);
  };

  const handleToggleSpeaker = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSpeakerOn(!isSpeakerOn);
  };

  const handleFlipCamera = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsFlipped(!isFlipped);
    
    // Animate self video
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
    const dotCount = Math.floor(connectionDots._value) + 1;
    return '.'.repeat(Math.min(dotCount, 3));
  };

  // Connecting/Ringing State
  if (callStatus !== 'connected' && callStatus !== 'ended') {
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

          {/* Avatar */}
          <Animated.View
            style={{ transform: [{ scale: pulseAnim }] }}
            className="mb-8"
          >
            <View className="w-32 h-32 rounded-full bg-gradient-to-br from-primary-400 to-secondary-500 items-center justify-center shadow-2xl">
              <View className="w-28 h-28 rounded-full bg-gray-800 items-center justify-center">
                <Text className="text-4xl font-bold text-white">
                  {participant?.name?.charAt(0) || 'S'}
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* Name & Status */}
          <Text className="text-2xl font-bold text-white mb-2">
            {participant?.name || 'Connecting...'}
          </Text>
          <Text className="text-gray-400 text-lg">
            {callStatus === 'connecting' 
              ? `Connecting${renderConnectionDots()}`
              : 'Ringing...'}
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

  // Ended State
  if (callStatus === 'ended') {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center">
        <StatusBar barStyle="light-content" />
        <Ionicons name="call" size={48} color="#EF4444" style={{ transform: [{ rotate: '135deg' }] }} />
        <Text className="text-white text-xl font-semibold mt-4">Call Ended</Text>
        <Text className="text-gray-400 mt-2">Duration: {formatDuration(callDuration)}</Text>
      </View>
    );
  }

  // Connected State - Full Video Call UI
  return (
    <TouchableOpacity
      activeOpacity={1}
      onPress={handleScreenTap}
      className="flex-1 bg-gray-900"
    >
      <StatusBar barStyle="light-content" />

      {/* Remote Video (Full Screen) - Placeholder */}
      <View className="flex-1 bg-gray-800">
        {participant?.isVideoOff ? (
          <View className="flex-1 items-center justify-center bg-gray-900">
            <View className="w-24 h-24 rounded-full bg-gray-700 items-center justify-center">
              <Text className="text-3xl font-bold text-white">
                {participant.name.charAt(0)}
              </Text>
            </View>
            <Text className="text-white mt-4">{participant.name}</Text>
            <Text className="text-gray-400 text-sm">Camera off</Text>
          </View>
        ) : (
          <LinearGradient
            colors={['#2d3436', '#636e72', '#2d3436']}
            className="flex-1 items-center justify-center"
          >
            {/* Simulated remote video feed */}
            <View className="w-full h-full items-center justify-center">
              <View className="w-32 h-32 rounded-full bg-gray-700 items-center justify-center">
                <Text className="text-4xl font-bold text-white">
                  {participant?.name?.charAt(0) || 'U'}
                </Text>
              </View>
              <Text className="text-white text-lg mt-4">{participant?.name}</Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* Self Video (Picture-in-Picture) */}
      <Animated.View
        style={{ transform: [{ scale: selfVideoScale }] }}
        className="absolute top-16 right-4 w-28 h-40 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20"
      >
        {isVideoOff ? (
          <View className="flex-1 bg-gray-800 items-center justify-center">
            <Ionicons name="videocam-off" size={24} color="#9CA3AF" />
          </View>
        ) : (
          <LinearGradient
            colors={['#374151', '#1F2937']}
            className="flex-1 items-center justify-center"
          >
            <View className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center">
              <Text className="text-xl font-bold text-white">
                {user?.displayName?.charAt(0) || 'M'}
              </Text>
            </View>
            <Text className="text-white text-xs mt-1">You</Text>
          </LinearGradient>
        )}

        {/* Flip Camera Button */}
        <TouchableOpacity
          onPress={handleFlipCamera}
          className="absolute top-2 right-2 p-1 bg-black/30 rounded-full"
        >
          <Ionicons name="camera-reverse" size={16} color="white" />
        </TouchableOpacity>
      </Animated.View>

      {/* Top Bar - Call Info */}
      {showControls && (
        <Animated.View
          style={{ opacity: controlsOpacity }}
          className="absolute top-0 left-0 right-0"
        >
          <BlurView intensity={50} className="px-4 pt-14 pb-4">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
                <Text className="text-white font-medium">
                  {formatDuration(callDuration)}
                </Text>
              </View>
              <Text className="text-white font-semibold">
                {participant?.name}
              </Text>
              <TouchableOpacity className="p-2">
                <Ionicons name="ellipsis-horizontal" size={24} color="white" />
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Bottom Controls */}
      {showControls && (
        <Animated.View
          style={{ opacity: controlsOpacity }}
          className="absolute bottom-0 left-0 right-0"
        >
          <BlurView intensity={50} className="px-4 pt-4 pb-10">
            {/* Participant Status */}
            {participant?.isMuted && (
              <View className="flex-row items-center justify-center mb-4">
                <Ionicons name="mic-off" size={16} color="#9CA3AF" />
                <Text className="text-gray-400 text-sm ml-1">
                  {participant.name} is muted
                </Text>
              </View>
            )}

            {/* Control Buttons */}
            <View className="flex-row items-center justify-around">
              {/* Mute */}
              <TouchableOpacity
                onPress={handleToggleMute}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isMuted ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isMuted ? 'mic-off' : 'mic'}
                  size={24}
                  color={isMuted ? '#1F2937' : 'white'}
                />
              </TouchableOpacity>

              {/* Video Toggle */}
              <TouchableOpacity
                onPress={handleToggleVideo}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isVideoOff ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isVideoOff ? 'videocam-off' : 'videocam'}
                  size={24}
                  color={isVideoOff ? '#1F2937' : 'white'}
                />
              </TouchableOpacity>

              {/* End Call */}
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

              {/* Speaker */}
              <TouchableOpacity
                onPress={handleToggleSpeaker}
                className={`w-14 h-14 rounded-full items-center justify-center ${
                  isSpeakerOn ? 'bg-white' : 'bg-white/20'
                }`}
              >
                <Ionicons
                  name={isSpeakerOn ? 'volume-high' : 'volume-medium'}
                  size={24}
                  color={isSpeakerOn ? '#1F2937' : 'white'}
                />
              </TouchableOpacity>

              {/* Chat */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  // Open in-call chat
                }}
                className="w-14 h-14 rounded-full bg-white/20 items-center justify-center"
              >
                <Ionicons name="chatbubble" size={24} color="white" />
              </TouchableOpacity>
            </View>

            {/* Effects Bar */}
            <View className="flex-row items-center justify-center mt-4 space-x-6">
              <TouchableOpacity className="items-center">
                <Ionicons name="sparkles" size={20} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs mt-1">Effects</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                <Ionicons name="happy" size={20} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs mt-1">Reactions</Text>
              </TouchableOpacity>
              <TouchableOpacity className="items-center">
                <Ionicons name="grid" size={20} color="#9CA3AF" />
                <Text className="text-gray-400 text-xs mt-1">Layout</Text>
              </TouchableOpacity>
            </View>
          </BlurView>
        </Animated.View>
      )}

      {/* Connection Quality Indicator */}
      <View className="absolute top-16 left-4 flex-row items-center px-3 py-1 bg-black/40 rounded-full">
        <View className="flex-row space-x-0.5">
          <View className="w-1 h-2 bg-green-500 rounded-full" />
          <View className="w-1 h-3 bg-green-500 rounded-full" />
          <View className="w-1 h-4 bg-green-500 rounded-full" />
          <View className="w-1 h-5 bg-green-500 rounded-full" />
        </View>
        <Text className="text-white text-xs ml-2">Good</Text>
      </View>
    </TouchableOpacity>
  );
}
