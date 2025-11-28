import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

const { width } = Dimensions.get('window');

interface WaveButtonProps {
  userId: string;
  userName: string;
  hasWaved?: boolean;
  onWaveComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
  variant?: 'default' | 'outline' | 'minimal';
}

interface WaveReceivedToastProps {
  visible: boolean;
  senderName: string;
  senderAvatar?: string;
  onRespond: () => void;
  onDismiss: () => void;
}

// Wave Button Component
export default function WaveButton({
  userId,
  userName,
  hasWaved = false,
  onWaveComplete,
  size = 'medium',
  variant = 'default',
}: WaveButtonProps) {
  const [isWaving, setIsWaving] = useState(false);
  const [waved, setWaved] = useState(hasWaved);
  
  // Animations
  const waveAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleWave = async () => {
    if (waved || isWaving) return;

    setIsWaving(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Wave animation (hand shake)
    Animated.sequence([
      Animated.timing(waveAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: -1, duration: 100, useNativeDriver: true }),
      Animated.timing(waveAnim, { toValue: 0, duration: 100, useNativeDriver: true }),
    ]).start();

    // Scale animation
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.9, duration: 100, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 50, friction: 5, useNativeDriver: true }),
    ]).start();

    try {
      await api.post(`/api/users/${userId}/wave`);
      setWaved(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onWaveComplete?.();
    } catch (error) {
      console.error('Wave error:', error);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsWaving(false);
    }
  };

  const sizeStyles = {
    small: { button: 'w-10 h-10', icon: 18, text: 'text-xs' },
    medium: { button: 'w-12 h-12', icon: 22, text: 'text-sm' },
    large: { button: 'w-14 h-14', icon: 26, text: 'text-base' },
  };

  const styles = sizeStyles[size];

  const rotation = waveAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });

  if (variant === 'minimal') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handleWave}
          disabled={waved || isWaving}
          className="flex-row items-center"
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons
              name={waved ? 'checkmark-circle' : 'hand-left'}
              size={styles.icon}
              color={waved ? '#22C55E' : '#FF6B9D'}
            />
          </Animated.View>
          <Text className={`ml-1 ${styles.text} ${waved ? 'text-green-600' : 'text-primary-500'} font-medium`}>
            {waved ? 'Waved!' : 'Wave'}
          </Text>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  if (variant === 'outline') {
    return (
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <TouchableOpacity
          onPress={handleWave}
          disabled={waved || isWaving}
          className={`${styles.button} rounded-full border-2 items-center justify-center ${
            waved ? 'border-green-500 bg-green-50' : 'border-primary-500 bg-white'
          }`}
        >
          <Animated.View style={{ transform: [{ rotate: rotation }] }}>
            <Ionicons
              name={waved ? 'checkmark' : 'hand-left'}
              size={styles.icon}
              color={waved ? '#22C55E' : '#FF6B9D'}
            />
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    );
  }

  // Default filled variant
  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        onPress={handleWave}
        disabled={waved || isWaving}
        className={`${styles.button} rounded-full items-center justify-center ${
          waved ? 'bg-green-500' : 'bg-primary-500'
        }`}
        style={{
          shadowColor: waved ? '#22C55E' : '#FF6B9D',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.3,
          shadowRadius: 4,
          elevation: 4,
        }}
      >
        <Animated.View style={{ transform: [{ rotate: rotation }] }}>
          <Ionicons
            name={waved ? 'checkmark' : 'hand-left'}
            size={styles.icon}
            color="white"
          />
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

// Wave Received Toast Component
export function WaveReceivedToast({
  visible,
  senderName,
  senderAvatar,
  onRespond,
  onDismiss,
}: WaveReceivedToastProps) {
  const slideAnim = useRef(new Animated.Value(-100)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after 8 seconds
      const timer = setTimeout(() => {
        handleDismiss();
      }, 8000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleDismiss = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onDismiss());
  };

  if (!visible) return null;

  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: 60,
        left: 16,
        right: 16,
        transform: [{ translateY: slideAnim }],
        opacity: fadeAnim,
        zIndex: 1000,
      }}
    >
      <View className="bg-white rounded-2xl shadow-xl p-4">
        <View className="flex-row items-center">
          {/* Wave Icon Animation */}
          <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Text className="text-2xl">👋</Text>
          </View>

          {/* Message */}
          <View className="flex-1">
            <Text className="font-bold text-gray-900">
              {senderName} waved at you!
            </Text>
            <Text className="text-sm text-gray-500">
              Say hi back or start a conversation
            </Text>
          </View>

          {/* Dismiss */}
          <TouchableOpacity onPress={handleDismiss} className="p-2">
            <Ionicons name="close" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="flex-row mt-3 space-x-2">
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRespond();
              handleDismiss();
            }}
            className="flex-1"
          >
            <LinearGradient
              colors={['#FF6B9D', '#FF8FB1']}
              className="py-3 rounded-xl items-center"
            >
              <Text className="text-white font-semibold">Wave Back 👋</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              // Navigate to chat
              handleDismiss();
            }}
            className="flex-1 py-3 rounded-xl bg-gray-100 items-center"
          >
            <Text className="text-gray-700 font-semibold">Message</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
}

// Quick Actions Menu for interactions
interface QuickActionsMenuProps {
  userId: string;
  userName: string;
  onWave: () => void;
  onMessage: () => void;
  onViewProfile: () => void;
  visible: boolean;
  onClose: () => void;
  position: { x: number; y: number };
}

export function QuickActionsMenu({
  userId,
  userName,
  onWave,
  onMessage,
  onViewProfile,
  visible,
  onClose,
  position,
}: QuickActionsMenuProps) {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  const actions = [
    { icon: 'hand-left', label: 'Wave', color: '#FF6B9D', onPress: onWave },
    { icon: 'chatbubble', label: 'Message', color: '#3B82F6', onPress: onMessage },
    { icon: 'person', label: 'Profile', color: '#8B5CF6', onPress: onViewProfile },
  ];

  return (
    <>
      {/* Backdrop */}
      <TouchableOpacity
        className="absolute inset-0"
        activeOpacity={1}
        onPress={onClose}
      />

      {/* Menu */}
      <Animated.View
        style={{
          position: 'absolute',
          left: Math.min(position.x, width - 180),
          top: position.y,
          transform: [{ scale: scaleAnim }],
          opacity: fadeAnim,
        }}
        className="bg-white rounded-2xl shadow-2xl p-2"
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={action.label}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              action.onPress();
              onClose();
            }}
            className={`flex-row items-center px-4 py-3 ${
              index < actions.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${action.color}20` }}
            >
              <Ionicons name={action.icon as any} size={18} color={action.color} />
            </View>
            <Text className="font-medium text-gray-900">{action.label}</Text>
          </TouchableOpacity>
        ))}
      </Animated.View>
    </>
  );
}
