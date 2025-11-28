import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useOnboarding } from './_layout';

interface ActivityIntent {
  id: string;
  label: string;
  emoji: string;
}

const ACTIVITY_INTENTS: ActivityIntent[] = [
  { id: 'walk_and_talk', label: 'Walk and talk', emoji: '🚶' },
  { id: 'dog_owners', label: 'Dog owners welcome', emoji: '🐕' },
  { id: 'coffee_chat', label: 'Coffee chat', emoji: '☕' },
  { id: 'workout_buddy', label: 'Workout buddy', emoji: '💪' },
  { id: 'brainstorm', label: 'Brainstorm session', emoji: '💡' },
  { id: 'deep_conversation', label: 'Deep conversation only', emoji: '🧠' },
  { id: 'casual_hangout', label: 'Casual hangout', emoji: '😎' },
  { id: 'food', label: 'Looking for food', emoji: '🍕' },
  { id: 'study', label: 'Study session', emoji: '📚' },
  { id: 'photography', label: 'Photography walk', emoji: '📷' },
  { id: 'music', label: 'Live music', emoji: '🎵' },
  { id: 'bar_hopping', label: 'Bar hopping', emoji: '🍻' },
  { id: 'creative', label: 'Creative collaboration', emoji: '🎨' },
  { id: 'exploring', label: 'Just exploring', emoji: '🗺️' },
  { id: 'networking', label: 'Professional networking', emoji: '💼' },
  { id: 'language', label: 'Language exchange', emoji: '🗣️' },
  { id: 'gaming', label: 'Gaming meetup', emoji: '🎮' },
  { id: 'art_culture', label: 'Art and culture', emoji: '🏛️' },
];

interface IntentCardProps {
  intent: ActivityIntent;
  selected: boolean;
  onPress: () => void;
  index: number;
}

function IntentCard({ intent, selected, onPress, index }: IntentCardProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 40, withSpring(1, { damping: 12 }));
    opacity.value = withDelay(index * 40, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.intentCard, selected && styles.intentCardSelected]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.intentEmoji}>{intent.emoji}</Text>
        <Text style={[styles.intentLabel, selected && styles.intentLabelSelected]}>
          {intent.label}
        </Text>
        {selected && (
          <View style={styles.selectedIndicator}>
            <Ionicons name="checkmark" size={14} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function ActivityIntentScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string | null>(data.activityIntent);

  const handleSelect = (id: string) => {
    // Single selection - toggle off if same, otherwise set new
    setSelected(prev => prev === id ? null : id);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ activityIntent: selected });
    router.push('/onboarding/privacy');
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateData({ activityIntent: null });
    router.push('/onboarding/privacy');
  };

  return (
    <View style={styles.container}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          router.back();
        }}
      >
        <Ionicons name="arrow-back" size={24} color="white" />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 6 of 7</Text>
        <Text style={styles.title}>What's your vibe{'\n'}right now?</Text>
        <Text style={styles.subtitle}>
          Pick one activity you're open to today. You can change this anytime.
        </Text>
      </View>

      {/* Intent grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.intentGrid}
        showsVerticalScrollIndicator={false}
      >
        {ACTIVITY_INTENTS.map((intent, index) => (
          <IntentCard
            key={intent.id}
            intent={intent}
            selected={selected === intent.id}
            onPress={() => handleSelect(intent.id)}
            index={index}
          />
        ))}
        
        {/* Bottom spacing */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Info card */}
      <View style={styles.infoCard}>
        <Ionicons name="information-circle" size={20} color="#8B5CF6" />
        <Text style={styles.infoText}>
          This shows on your profile and helps you find people with similar vibes. 
          You can update it daily!
        </Text>
      </View>

      {/* Bottom buttons */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.skipButton}
          onPress={handleSkip}
          activeOpacity={0.7}
        >
          <Text style={styles.skipButtonText}>Skip for now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.continueButton,
            !selected && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!selected}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 60,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 24,
    marginBottom: 20,
  },
  header: {
    paddingHorizontal: 24,
    marginBottom: 20,
  },
  step: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '600',
    marginBottom: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: 'white',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  scrollView: {
    flex: 1,
  },
  intentGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  intentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  intentCardSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  intentEmoji: {
    fontSize: 20,
    marginRight: 8,
  },
  intentLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  intentLabelSelected: {
    color: 'white',
    fontWeight: '600',
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 24,
    marginBottom: 16,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 10,
    lineHeight: 18,
  },
  bottomSection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 50,
    gap: 12,
  },
  skipButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  skipButtonText: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 16,
    fontWeight: '600',
  },
  continueButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
    shadowOpacity: 0,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
