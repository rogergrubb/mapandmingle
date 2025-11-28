import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Image,
  Dimensions,
  PanResponder,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

const { width } = Dimensions.get('window');

interface ProximityUser {
  id: string;
  displayName: string;
  avatar?: string;
  activityIntent?: string;
  chatReadiness: 'open' | 'maybe' | 'busy';
  distance: number;
  sharedInterests: string[];
}

interface ProximityAlertProps {
  user: ProximityUser;
  onWave: (userId: string) => void;
  onDismiss: () => void;
  onViewProfile: (userId: string) => void;
  autoHideDelay?: number;
}

export default function ProximityAlert({
  user,
  onWave,
  onDismiss,
  onViewProfile,
  autoHideDelay = 10000,
}: ProximityAlertProps) {
  const router = useRouter();
  const [isVisible, setIsVisible] = useState(true);
  const [hasWaved, setHasWaved] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(0)).current;

  // Pan responder for swipe to dismiss
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10 && gestureState.dy < 0;
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy < 0) {
          slideAnim.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy < -50 || gestureState.vy < -0.5) {
          handleDismiss();
        } else {
          Animated.spring(slideAnim, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
        }
      },
    })
  ).current;

  // Auto-hide timer
  useEffect(() => {
    const timer = setTimeout(() => {
      handleDismiss();
    }, autoHideDelay);

    return () => clearTimeout(timer);
  }, [autoHideDelay]);

  // Entrance animation
  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 8,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.02,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();

    return () => pulse.stop();
  }, []);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsVisible(false);
      onDismiss();
    });
  };

  const handleWave = () => {
    if (hasWaved) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setHasWaved(true);

    // Wave animation
    Animated.sequence([
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(waveAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();

    onWave(user.id);

    // Auto dismiss after wave
    setTimeout(handleDismiss, 2000);
  };

  const handleViewProfile = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewProfile(user.id);
  };

  // Chat readiness styling
  const readinessConfig = {
    open: { color: '#22C55E', label: 'Open to chat' },
    maybe: { color: '#F59E0B', label: 'Maybe later' },
    busy: { color: '#EF4444', label: 'Busy' },
  };
  const readiness = readinessConfig[user.chatReadiness];

  // Format distance
  const formatDistance = (meters: number): string => {
    if (meters < 50) return 'Very close!';
    if (meters < 100) return `${Math.round(meters)}m away`;
    if (meters < 500) return `${Math.round(meters)}m away`;
    return `${(meters / 1000).toFixed(1)}km away`;
  };

  if (!isVisible) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        opacity: fadeAnim,
        transform: [
          { translateY: slideAnim },
          { scale: pulseAnim },
        ],
        zIndex: 1000,
      }}
    >
      <BlurView intensity={90} className="rounded-2xl overflow-hidden">
        <LinearGradient
          colors={['rgba(255, 107, 157, 0.1)', 'rgba(255, 255, 255, 0.95)']}
          className="p-4"
        >
          {/* Swipe indicator */}
          <View className="items-center mb-2">
            <View className="w-8 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Alert Content */}
          <View className="flex-row items-center">
            {/* Avatar */}
            <TouchableOpacity onPress={handleViewProfile}>
              <View className="relative">
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-14 h-14 rounded-full bg-gray-200"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-xl font-bold text-primary-500">
                      {user.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
                
                {/* Status indicator */}
                <View 
                  className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
                  style={{ backgroundColor: readiness.color }}
                />
              </View>
            </TouchableOpacity>

            {/* User Info */}
            <TouchableOpacity 
              onPress={handleViewProfile}
              className="flex-1 ml-3"
            >
              <View className="flex-row items-center">
                <Text className="font-bold text-gray-900">{user.displayName}</Text>
                <View className="ml-2 px-2 py-0.5 rounded-full bg-primary-100">
                  <Text className="text-xs font-medium text-primary-600">
                    {formatDistance(user.distance)}
                  </Text>
                </View>
              </View>
              
              {user.activityIntent && (
                <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>
                  {user.activityIntent}
                </Text>
              )}

              {/* Shared Interests */}
              {user.sharedInterests.length > 0 && (
                <View className="flex-row items-center mt-1">
                  <Ionicons name="heart" size={12} color="#FF6B9D" />
                  <Text className="text-xs text-gray-500 ml-1">
                    {user.sharedInterests.length} shared interest{user.sharedInterests.length > 1 ? 's' : ''}
                  </Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Wave Button */}
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: waveAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '20deg'],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                onPress={handleWave}
                disabled={hasWaved}
                className={`w-12 h-12 rounded-full items-center justify-center ${
                  hasWaved ? 'bg-green-100' : 'bg-primary-500'
                }`}
                style={{
                  shadowColor: hasWaved ? '#22C55E' : '#FF6B9D',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 4,
                }}
              >
                {hasWaved ? (
                  <Ionicons name="checkmark" size={24} color="#22C55E" />
                ) : (
                  <Ionicons name="hand-left" size={24} color="white" />
                )}
              </TouchableOpacity>
            </Animated.View>
          </View>

          {/* Wave Confirmation */}
          {hasWaved && (
            <Animated.View
              style={{
                opacity: fadeAnim,
              }}
              className="mt-3 pt-3 border-t border-gray-100"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
                <Text className="text-green-600 font-medium ml-1">
                  Wave sent! They'll be notified.
                </Text>
              </View>
            </Animated.View>
          )}

          {/* Chat Readiness Badge */}
          <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <View className="flex-row items-center">
              <View 
                className="w-2 h-2 rounded-full mr-2"
                style={{ backgroundColor: readiness.color }}
              />
              <Text className="text-xs text-gray-500">{readiness.label}</Text>
            </View>
            
            <TouchableOpacity 
              onPress={handleDismiss}
              className="flex-row items-center"
            >
              <Text className="text-xs text-gray-400">Swipe up to dismiss</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </BlurView>
    </Animated.View>
  );
}

// Container component to manage multiple proximity alerts
interface ProximityAlertContainerProps {
  alerts: ProximityUser[];
  onWave: (userId: string) => void;
  onViewProfile: (userId: string) => void;
  onDismissAll: () => void;
}

export function ProximityAlertContainer({
  alerts,
  onWave,
  onViewProfile,
  onDismissAll,
}: ProximityAlertContainerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const currentAlert = alerts.find(
    (alert, index) => index >= currentIndex && !dismissedIds.has(alert.id)
  );

  const handleDismiss = () => {
    if (currentAlert) {
      setDismissedIds((prev) => new Set([...prev, currentAlert.id]));
    }

    const remainingAlerts = alerts.filter(
      (alert) => !dismissedIds.has(alert.id) && alert.id !== currentAlert?.id
    );

    if (remainingAlerts.length === 0) {
      onDismissAll();
    }
  };

  if (!currentAlert) return null;

  return (
    <ProximityAlert
      key={currentAlert.id}
      user={currentAlert}
      onWave={onWave}
      onDismiss={handleDismiss}
      onViewProfile={onViewProfile}
    />
  );
}
