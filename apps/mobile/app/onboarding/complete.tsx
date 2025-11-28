import { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withSequence,
  withTiming,
  withRepeat,
  Easing,
} from 'react-native-reanimated';
import { useOnboarding } from './_layout';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';

const { width, height } = Dimensions.get('window');

// Confetti particle
function ConfettiParticle({ delay, startX, color }: { delay: number; startX: number; color: string }) {
  const translateY = useSharedValue(-50);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 200 }));
    translateY.value = withDelay(
      delay,
      withTiming(height + 50, {
        duration: 3000 + Math.random() * 2000,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 500 }),
          withTiming(-30, { duration: 500 })
        ),
        -1,
        true
      )
    );
    rotate.value = withDelay(
      delay,
      withRepeat(withTiming(360, { duration: 2000 }), -1)
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { translateX: translateX.value },
      { rotate: `${rotate.value}deg` },
    ],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: startX,
          top: 0,
          width: 10,
          height: 10,
          backgroundColor: color,
          borderRadius: 2,
        },
        style,
      ]}
    />
  );
}

// Generate confetti particles
function Confetti() {
  const colors = ['#FF6B9D', '#FFA07A', '#C084FC', '#10B981', '#F59E0B', '#3B82F6'];
  const particles = Array.from({ length: 30 }).map((_, i) => ({
    id: i,
    delay: Math.random() * 1000,
    startX: Math.random() * width,
    color: colors[Math.floor(Math.random() * colors.length)],
  }));

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {particles.map((p) => (
        <ConfettiParticle key={p.id} {...p} />
      ))}
    </View>
  );
}

export default function CompleteScreen() {
  const router = useRouter();
  const { data } = useOnboarding();
  const { refreshProfile } = useAuthStore();

  // Animations
  const checkScale = useSharedValue(0);
  const titleOpacity = useSharedValue(0);
  const contentOpacity = useSharedValue(0);
  const buttonOpacity = useSharedValue(0);

  useEffect(() => {
    // Celebration haptic
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Staggered animations
    checkScale.value = withDelay(300, withSpring(1, { damping: 8, stiffness: 100 }));
    titleOpacity.value = withDelay(600, withSpring(1));
    contentOpacity.value = withDelay(900, withSpring(1));
    buttonOpacity.value = withDelay(1200, withSpring(1));

    // Save profile data to backend
    saveProfile();
  }, []);

  const saveProfile = async () => {
    try {
      await api.put('/api/profile', {
        displayName: data.name,
        avatar: data.photo,
        age: parseInt(data.age),
        gender: data.gender,
        interests: JSON.stringify(data.interests),
        lookingFor: JSON.stringify(data.lookingFor),
        activityIntent: data.activityIntent,
        showAge: data.showAge,
        showDistance: data.showDistance,
        ghostMode: data.ghostModeEnabled,
      });
      
      await refreshProfile();
    } catch (error) {
      console.error('Error saving profile:', error);
      // Continue anyway - they can update later
    }
  };

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: (1 - titleOpacity.value) * 20 }],
  }));

  const contentStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateY: (1 - contentOpacity.value) * 20 }],
  }));

  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonOpacity.value,
    transform: [{ scale: buttonOpacity.value }],
  }));

  const handleStart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      {/* Confetti */}
      <Confetti />

      {/* Success checkmark */}
      <Animated.View style={[styles.checkContainer, checkStyle]}>
        <View style={styles.checkCircle}>
          <Ionicons name="checkmark" size={60} color="white" />
        </View>
      </Animated.View>

      {/* Title */}
      <Animated.View style={[styles.titleContainer, titleStyle]}>
        <Text style={styles.title}>You're all set!</Text>
        <Text style={styles.subtitle}>Welcome to Map Mingle, {data.name}</Text>
      </Animated.View>

      {/* Summary */}
      <Animated.View style={[styles.summaryContainer, contentStyle]}>
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Your Profile</Text>
          
          <View style={styles.summaryRow}>
            <Ionicons name="heart" size={18} color="#FF6B9D" />
            <Text style={styles.summaryText}>
              {data.interests.length} interests selected
            </Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Ionicons name="search" size={18} color="#FFA07A" />
            <Text style={styles.summaryText}>
              Looking for {data.lookingFor.join(', ')}
            </Text>
          </View>
          
          {data.activityIntent && (
            <View style={styles.summaryRow}>
              <Ionicons name="sparkles" size={18} color="#C084FC" />
              <Text style={styles.summaryText}>
                Vibe: {data.activityIntent.replace('_', ' ')}
              </Text>
            </View>
          )}
          
          <View style={styles.summaryRow}>
            <Ionicons name="shield-checkmark" size={18} color="#10B981" />
            <Text style={styles.summaryText}>
              Privacy settings configured
            </Text>
          </View>
        </View>

        {/* Trial info */}
        <View style={styles.trialCard}>
          <Ionicons name="gift" size={24} color="#F59E0B" />
          <View style={styles.trialContent}>
            <Text style={styles.trialTitle}>30 Days Free Premium!</Text>
            <Text style={styles.trialText}>
              Enjoy ghost mode, video calls, and more.
            </Text>
          </View>
        </View>
      </Animated.View>

      {/* Start button */}
      <Animated.View style={[styles.bottomSection, buttonStyle]}>
        <TouchableOpacity
          style={styles.startButton}
          onPress={handleStart}
          activeOpacity={0.8}
        >
          <Text style={styles.startButtonText}>Start Exploring</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 100,
    paddingHorizontal: 24,
  },
  checkContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  checkCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 12,
  },
  titleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  summaryContainer: {
    gap: 16,
  },
  summaryCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: 'white',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  summaryText: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
  },
  trialCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.2)',
  },
  trialContent: {
    marginLeft: 14,
    flex: 1,
  },
  trialTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F59E0B',
    marginBottom: 2,
  },
  trialText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
  },
  startButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 18,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  startButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
