import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Modal,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalMeetups: number;
  lastMeetupDate?: string;
  streakMilestones: number[];
  nextMilestone: number;
}

interface StreakBadgeProps {
  streak: number;
  size?: 'small' | 'medium' | 'large';
  onPress?: () => void;
  showAnimation?: boolean;
}

interface StreakModalProps {
  visible: boolean;
  onClose: () => void;
  streakData: StreakData;
}

// Get streak tier based on count
const getStreakTier = (streak: number): { color: string; bgColor: string; label: string; emoji: string } => {
  if (streak >= 100) return { color: '#9333EA', bgColor: '#F3E8FF', label: 'Legendary', emoji: '👑' };
  if (streak >= 50) return { color: '#7C3AED', bgColor: '#EDE9FE', label: 'Epic', emoji: '💎' };
  if (streak >= 30) return { color: '#6366F1', bgColor: '#EEF2FF', label: 'Amazing', emoji: '⭐' };
  if (streak >= 14) return { color: '#0EA5E9', bgColor: '#E0F2FE', label: 'Great', emoji: '✨' };
  if (streak >= 7) return { color: '#22C55E', bgColor: '#DCFCE7', label: 'Nice', emoji: '🌟' };
  if (streak >= 3) return { color: '#F59E0B', bgColor: '#FEF3C7', label: 'Building', emoji: '🔥' };
  return { color: '#FF6B9D', bgColor: '#FFF1F3', label: 'Starting', emoji: '❤️' };
};

// Streak Badge Component
export default function StreakBadge({
  streak,
  size = 'medium',
  onPress,
  showAnimation = false,
}: StreakBadgeProps) {
  const tier = getStreakTier(streak);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (showAnimation) {
      // Pulse animation
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      // Glow animation
      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );
      glow.start();

      return () => {
        pulse.stop();
        glow.stop();
      };
    }
  }, [showAnimation]);

  const sizeStyles = {
    small: { container: 'w-8 h-8', text: 'text-xs', icon: 12 },
    medium: { container: 'w-10 h-10', text: 'text-sm', icon: 16 },
    large: { container: 'w-14 h-14', text: 'text-lg', icon: 20 },
  };

  const styles = sizeStyles[size];

  return (
    <TouchableOpacity onPress={onPress} disabled={!onPress} activeOpacity={0.7}>
      <Animated.View
        style={{
          transform: [{ scale: pulseAnim }],
          shadowColor: tier.color,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: showAnimation ? 0.4 : 0.2,
          shadowRadius: showAnimation ? 8 : 4,
          elevation: 4,
        }}
        className={`${styles.container} rounded-full items-center justify-center`}
      >
        <LinearGradient
          colors={[tier.color, tier.color + 'CC']}
          className={`${styles.container} rounded-full items-center justify-center`}
        >
          <Text className={`${styles.text} font-bold text-white`}>
            {streak}
          </Text>
        </LinearGradient>
        
        {/* Fire icon for streaks >= 3 */}
        {streak >= 3 && (
          <View className="absolute -top-1 -right-1">
            <Text style={{ fontSize: styles.icon }}>{tier.emoji}</Text>
          </View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

// Streak Detail Modal
export function StreakModal({ visible, onClose, streakData }: StreakModalProps) {
  const tier = getStreakTier(streakData.currentStreak);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  // Calculate progress to next milestone
  const progress = streakData.nextMilestone > 0
    ? (streakData.currentStreak / streakData.nextMilestone) * 100
    : 100;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 bg-black/50 justify-end"
      >
        <TouchableOpacity
          className="flex-1"
          onPress={handleClose}
          activeOpacity={1}
        />

        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-white rounded-t-3xl p-6 pb-10"
        >
          {/* Handle */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="items-center mb-6">
            <View
              className="w-20 h-20 rounded-full items-center justify-center mb-3"
              style={{ backgroundColor: tier.bgColor }}
            >
              <Text className="text-4xl">{tier.emoji}</Text>
            </View>
            <Text className="text-3xl font-bold text-gray-900">
              {streakData.currentStreak} Day Streak!
            </Text>
            <Text className="text-gray-500 mt-1">{tier.label} Mingler</Text>
          </View>

          {/* Progress to Next Milestone */}
          {streakData.nextMilestone > 0 && (
            <View className="mb-6">
              <View className="flex-row justify-between mb-2">
                <Text className="text-sm text-gray-500">Next milestone</Text>
                <Text className="text-sm font-semibold" style={{ color: tier.color }}>
                  {streakData.nextMilestone} days
                </Text>
              </View>
              <View className="h-3 bg-gray-100 rounded-full overflow-hidden">
                <Animated.View
                  className="h-full rounded-full"
                  style={{
                    width: `${Math.min(progress, 100)}%`,
                    backgroundColor: tier.color,
                  }}
                />
              </View>
              <Text className="text-xs text-gray-400 text-center mt-1">
                {streakData.nextMilestone - streakData.currentStreak} more days to go!
              </Text>
            </View>
          )}

          {/* Stats */}
          <View className="flex-row justify-around mb-6">
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {streakData.longestStreak}
              </Text>
              <Text className="text-xs text-gray-500">Longest Streak</Text>
            </View>
            <View className="w-px bg-gray-200" />
            <View className="items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {streakData.totalMeetups}
              </Text>
              <Text className="text-xs text-gray-500">Total Meetups</Text>
            </View>
          </View>

          {/* Milestones */}
          <View className="mb-4">
            <Text className="font-semibold text-gray-900 mb-3">Milestones</Text>
            <View className="flex-row flex-wrap">
              {[3, 7, 14, 30, 50, 100].map((milestone) => {
                const achieved = streakData.currentStreak >= milestone;
                const mileTier = getStreakTier(milestone);
                
                return (
                  <View
                    key={milestone}
                    className={`w-16 items-center mr-2 mb-3 p-2 rounded-xl ${
                      achieved ? '' : 'opacity-40'
                    }`}
                    style={{ backgroundColor: achieved ? mileTier.bgColor : '#F3F4F6' }}
                  >
                    <Text className="text-lg">{mileTier.emoji}</Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: achieved ? mileTier.color : '#9CA3AF' }}
                    >
                      {milestone}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>

          {/* Tips */}
          <View className="bg-gray-50 rounded-xl p-4">
            <View className="flex-row items-center mb-2">
              <Ionicons name="bulb" size={18} color="#F59E0B" />
              <Text className="font-semibold text-gray-900 ml-2">Keep it going!</Text>
            </View>
            <Text className="text-sm text-gray-600">
              Meet someone new today to maintain your streak. Even a quick coffee chat counts!
            </Text>
          </View>

          {/* Close Button */}
          <TouchableOpacity
            onPress={handleClose}
            className="mt-4 py-3 items-center"
          >
            <Text className="text-gray-500 font-medium">Close</Text>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Streak Celebration Animation (for new milestones)
interface StreakCelebrationProps {
  visible: boolean;
  milestone: number;
  onComplete: () => void;
}

export function StreakCelebration({ visible, milestone, onComplete }: StreakCelebrationProps) {
  const tier = getStreakTier(milestone);
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Animated.sequence([
        Animated.spring(scaleAnim, {
          toValue: 1.2,
          tension: 100,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();

      // Auto dismiss after 3 seconds
      setTimeout(onComplete, 3000);
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View className="absolute inset-0 items-center justify-center bg-black/70 z-50">
      <Animated.View
        style={{
          transform: [
            { scale: scaleAnim },
            {
              rotate: rotateAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0deg', '360deg'],
              }),
            },
          ],
        }}
      >
        <View
          className="w-32 h-32 rounded-full items-center justify-center"
          style={{ backgroundColor: tier.bgColor }}
        >
          <Text className="text-6xl">{tier.emoji}</Text>
        </View>
      </Animated.View>

      <Animated.View style={{ transform: [{ scale: scaleAnim }] }} className="mt-6">
        <Text className="text-white text-3xl font-bold text-center">
          {milestone} Day Streak!
        </Text>
        <Text className="text-white/80 text-center mt-2">
          You're a {tier.label} Mingler! 🎉
        </Text>
      </Animated.View>
    </View>
  );
}
