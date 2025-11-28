import { useEffect } from 'react';
import { View, Text, Dimensions, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
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
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Circle pin positions (5 pins around center)
const CIRCLE_RADIUS = 80;
const PIN_COLORS = ['#FF6B9D', '#FFA07A', '#C084FC', '#FF6B9D', '#FFA07A'];
const PIN_ANGLES = [0, 72, 144, 216, 288]; // 360/5 = 72 degrees apart

// Calculate pin positions in a circle
const getPinPosition = (angle: number, radius: number) => {
  const radian = (angle - 90) * (Math.PI / 180); // Start from top
  return {
    x: Math.cos(radian) * radius,
    y: Math.sin(radian) * radius,
  };
};

// Individual dropping pin component
function DroppingPin({ 
  index, 
  color, 
  angle 
}: { 
  index: number; 
  color: string; 
  angle: number;
}) {
  const position = getPinPosition(angle, CIRCLE_RADIUS);
  const translateY = useSharedValue(-height);
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Stagger the drops - each pin drops 150ms after the previous
    const delay = 800 + (index * 150);
    
    // Drop with bounce
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 8,
        stiffness: 120,
        mass: 0.8,
      })
    );

    // Slight rotation during fall
    rotation.value = withDelay(
      delay,
      withSequence(
        withTiming(15, { duration: 200 }),
        withSpring(0, { damping: 10 })
      )
    );

    // Squish on landing
    scale.value = withDelay(
      delay + 300,
      withSequence(
        withTiming(1.3, { duration: 100 }),
        withSpring(1, { damping: 8 })
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: width / 2 + position.x - 20,
          top: height / 2 + position.y - 50,
        },
        animatedStyle,
      ]}
    >
      {/* Pin shape */}
      <View style={[styles.pin, { backgroundColor: color }]}>
        <Ionicons name="heart" size={18} color="white" />
      </View>
      {/* Pin point */}
      <View style={[styles.pinPoint, { borderTopColor: color }]} />
    </Animated.View>
  );
}

// Center "You" pin - drops last with dramatic effect
function CenterPin() {
  const translateY = useSharedValue(-height - 100);
  const scale = useSharedValue(1);
  const glowOpacity = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    // Drop after all other pins (800 + 5*150 + 200 buffer)
    const delay = 1750;

    // Dramatic drop with stronger bounce
    translateY.value = withDelay(
      delay,
      withSpring(0, {
        damping: 6,
        stiffness: 100,
        mass: 1,
      })
    );

    // Impact squish
    scale.value = withDelay(
      delay + 400,
      withSequence(
        withTiming(1.4, { duration: 80 }),
        withTiming(0.9, { duration: 80 }),
        withSpring(1, { damping: 6 })
      )
    );

    // Glow appears after landing
    glowOpacity.value = withDelay(
      delay + 600,
      withTiming(1, { duration: 400 })
    );

    // Subtle pulse animation
    pulseScale.value = withDelay(
      delay + 800,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 1000, easing: Easing.inOut(Easing.ease) }),
          withTiming(1, { duration: 1000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const pinStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
    transform: [{ scale: pulseScale.value }],
  }));

  return (
    <View style={styles.centerPinContainer}>
      {/* Glow ring */}
      <Animated.View style={[styles.glowRing, glowStyle]} />
      
      {/* The pin */}
      <Animated.View style={pinStyle}>
        <View style={[styles.pin, styles.centerPinHead]}>
          <Ionicons name="person" size={20} color="white" />
        </View>
        <View style={[styles.pinPoint, { borderTopColor: '#3B82F6' }]} />
      </Animated.View>
    </View>
  );
}

// Map background that drops down
function DroppingMap() {
  const translateY = useSharedValue(-height);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Map drops first
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 80,
      mass: 1,
    });
    opacity.value = withTiming(1, { duration: 600 });
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.mapContainer, animatedStyle]}>
      {/* Grid lines */}
      <View style={styles.gridContainer}>
        {/* Horizontal lines */}
        {Array.from({ length: 15 }).map((_, i) => (
          <View
            key={`h-${i}`}
            style={[
              styles.gridLine,
              styles.horizontalLine,
              { top: `${(i + 1) * 6.25}%` },
            ]}
          />
        ))}
        {/* Vertical lines */}
        {Array.from({ length: 10 }).map((_, i) => (
          <View
            key={`v-${i}`}
            style={[
              styles.gridLine,
              styles.verticalLine,
              { left: `${(i + 1) * 10}%` },
            ]}
          />
        ))}
      </View>

      {/* Subtle map texture overlay */}
      <View style={styles.mapOverlay} />
    </Animated.View>
  );
}

// Animated "Map" word
function AnimatedMapWord() {
  const letters = ['M', 'a', 'p'];
  const letterScales = letters.map(() => useSharedValue(0));
  const letterRotations = letters.map(() => useSharedValue(0));
  const letterTranslateY = letters.map(() => useSharedValue(-20));

  useEffect(() => {
    const startDelay = 2400;

    letters.forEach((_, i) => {
      const letterDelay = startDelay + (i * 80);
      
      // Pop in with scale
      letterScales[i].value = withDelay(
        letterDelay,
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      // Slide down
      letterTranslateY[i].value = withDelay(
        letterDelay,
        withSpring(0, { damping: 10 })
      );

      // Wiggle rotation - alternating directions
      letterRotations[i].value = withDelay(
        letterDelay,
        withSequence(
          withTiming(i % 2 === 0 ? 15 : -15, { duration: 100 }),
          withTiming(i % 2 === 0 ? -10 : 10, { duration: 100 }),
          withTiming(i % 2 === 0 ? 6 : -6, { duration: 80 }),
          withSpring(0, { damping: 8 })
        )
      );
    });
  }, []);

  return (
    <View style={styles.wordContainer}>
      {letters.map((letter, i) => {
        const letterStyle = useAnimatedStyle(() => ({
          transform: [
            { scale: letterScales[i].value },
            { rotate: `${letterRotations[i].value}deg` },
            { translateY: letterTranslateY[i].value },
          ],
          opacity: letterScales[i].value,
        }));

        return (
          <Animated.Text
            key={i}
            style={[styles.titleLetter, styles.mapLetter, letterStyle]}
          >
            {letter}
          </Animated.Text>
        );
      })}
    </View>
  );
}

// Animated "Mingle" word
function AnimatedMingleWord() {
  const letters = ['M', 'i', 'n', 'g', 'l', 'e'];
  const letterScales = letters.map(() => useSharedValue(0));
  const letterRotations = letters.map(() => useSharedValue(0));
  const letterTranslateY = letters.map(() => useSharedValue(-20));

  useEffect(() => {
    // Start after "Map" finishes
    const startDelay = 2700;

    letters.forEach((_, i) => {
      const letterDelay = startDelay + (i * 70);
      
      // Pop in with scale
      letterScales[i].value = withDelay(
        letterDelay,
        withSpring(1, { damping: 8, stiffness: 150 })
      );

      // Slide down
      letterTranslateY[i].value = withDelay(
        letterDelay,
        withSpring(0, { damping: 10 })
      );

      // Flutter/wiggle - more playful for "Mingle"
      letterRotations[i].value = withDelay(
        letterDelay,
        withSequence(
          withTiming(i % 2 === 0 ? -18 : 18, { duration: 80 }),
          withTiming(i % 2 === 0 ? 12 : -12, { duration: 80 }),
          withTiming(i % 2 === 0 ? -6 : 6, { duration: 60 }),
          withTiming(i % 2 === 0 ? 3 : -3, { duration: 50 }),
          withSpring(0, { damping: 10 })
        )
      );
    });
  }, []);

  return (
    <View style={styles.wordContainer}>
      {letters.map((letter, i) => {
        const letterStyle = useAnimatedStyle(() => ({
          transform: [
            { scale: letterScales[i].value },
            { rotate: `${letterRotations[i].value}deg` },
            { translateY: letterTranslateY[i].value },
          ],
          opacity: letterScales[i].value,
        }));

        return (
          <Animated.Text
            key={i}
            style={[styles.titleLetter, styles.mingleLetter, letterStyle]}
          >
            {letter}
          </Animated.Text>
        );
      })}
    </View>
  );
}

// Full title component
function AnimatedTitle() {
  return (
    <View style={styles.titleContainer}>
      <View style={styles.titleRow}>
        <AnimatedMapWord />
        <View style={styles.titleSpace} />
        <AnimatedMingleWord />
      </View>
      <TaglineText />
    </View>
  );
}

// Tagline with fade in
function TaglineText() {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);

  useEffect(() => {
    const delay = 3400;
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 12 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.Text style={[styles.tagline, style]}>
      Connect with people nearby
    </Animated.Text>
  );
}

// Enter button
function EnterButton({ onPress }: { onPress: () => void }) {
  const opacity = useSharedValue(0);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const delay = 3800;
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    scale.value = withDelay(delay, withSpring(1, { damping: 10 }));
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.buttonContainer, style]}>
      <TouchableOpacity
        onPress={onPress}
        style={styles.enterButton}
        activeOpacity={0.8}
      >
        <Text style={styles.enterButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </TouchableOpacity>
    </Animated.View>
  );
}

// Main splash screen
export default function SplashScreen() {
  const router = useRouter();

  const handleEnter = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace('/onboarding/welcome');
  };

  // Haptic feedback when center pin lands
  useEffect(() => {
    const timer = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    }, 2150); // When center pin lands

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      {/* Dark background */}
      <View style={styles.background} />

      {/* Dropping map */}
      <DroppingMap />

      {/* 5 circle pins */}
      {PIN_ANGLES.map((angle, index) => (
        <DroppingPin
          key={index}
          index={index}
          color={PIN_COLORS[index]}
          angle={angle}
        />
      ))}

      {/* Center "you" pin */}
      <CenterPin />

      {/* Animated title */}
      <AnimatedTitle />

      {/* Enter button */}
      <EnterButton onPress={handleEnter} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
  },
  background: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#0a0a0f',
  },
  mapContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#12121a',
  },
  gridContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  gridLine: {
    position: 'absolute',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
  },
  horizontalLine: {
    left: 0,
    right: 0,
    height: 1,
  },
  verticalLine: {
    top: 0,
    bottom: 0,
    width: 1,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  pin: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  pinPoint: {
    width: 0,
    height: 0,
    alignSelf: 'center',
    marginTop: -2,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 12,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  centerPinContainer: {
    position: 'absolute',
    left: width / 2 - 22,
    top: height / 2 - 55,
    alignItems: 'center',
  },
  centerPinHead: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3B82F6',
    borderWidth: 3,
    borderColor: 'white',
  },
  glowRing: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
    top: -25,
    left: -28,
  },
  titleContainer: {
    position: 'absolute',
    top: height * 0.12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  wordContainer: {
    flexDirection: 'row',
  },
  titleSpace: {
    width: 14,
  },
  titleLetter: {
    fontSize: 44,
    fontWeight: '800',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  mapLetter: {
    color: '#FF6B9D',
  },
  mingleLetter: {
    color: '#C084FC',
  },
  tagline: {
    marginTop: 16,
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: height * 0.12,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  enterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  enterButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
