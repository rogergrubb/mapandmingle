import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
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

interface Interest {
  id: string;
  label: string;
  emoji: string;
  category: 'social' | 'active' | 'creative' | 'intellectual' | 'chill';
}

const INTERESTS: Interest[] = [
  // Social
  { id: 'coffee', label: 'Coffee', emoji: '☕', category: 'social' },
  { id: 'nightlife', label: 'Nightlife', emoji: '🍸', category: 'social' },
  { id: 'brunch', label: 'Brunch', emoji: '🥞', category: 'social' },
  { id: 'food', label: 'Foodie', emoji: '🍕', category: 'social' },
  { id: 'wine', label: 'Wine', emoji: '🍷', category: 'social' },
  { id: 'networking', label: 'Networking', emoji: '💼', category: 'social' },
  
  // Active
  { id: 'fitness', label: 'Fitness', emoji: '💪', category: 'active' },
  { id: 'hiking', label: 'Hiking', emoji: '🥾', category: 'active' },
  { id: 'running', label: 'Running', emoji: '🏃', category: 'active' },
  { id: 'yoga', label: 'Yoga', emoji: '🧘', category: 'active' },
  { id: 'cycling', label: 'Cycling', emoji: '🚴', category: 'active' },
  { id: 'sports', label: 'Sports', emoji: '⚽', category: 'active' },
  { id: 'dancing', label: 'Dancing', emoji: '💃', category: 'active' },
  
  // Creative
  { id: 'music', label: 'Music', emoji: '🎵', category: 'creative' },
  { id: 'art', label: 'Art', emoji: '🎨', category: 'creative' },
  { id: 'photography', label: 'Photography', emoji: '📷', category: 'creative' },
  { id: 'writing', label: 'Writing', emoji: '✍️', category: 'creative' },
  { id: 'film', label: 'Film', emoji: '🎬', category: 'creative' },
  
  // Intellectual
  { id: 'reading', label: 'Reading', emoji: '📚', category: 'intellectual' },
  { id: 'tech', label: 'Tech', emoji: '💻', category: 'intellectual' },
  { id: 'science', label: 'Science', emoji: '🔬', category: 'intellectual' },
  { id: 'languages', label: 'Languages', emoji: '🗣️', category: 'intellectual' },
  { id: 'politics', label: 'Politics', emoji: '🗳️', category: 'intellectual' },
  
  // Chill
  { id: 'travel', label: 'Travel', emoji: '✈️', category: 'chill' },
  { id: 'nature', label: 'Nature', emoji: '🌿', category: 'chill' },
  { id: 'pets', label: 'Pets', emoji: '🐕', category: 'chill' },
  { id: 'gaming', label: 'Gaming', emoji: '🎮', category: 'chill' },
  { id: 'meditation', label: 'Meditation', emoji: '🧠', category: 'chill' },
  { id: 'cooking', label: 'Cooking', emoji: '👨‍🍳', category: 'chill' },
];

const MIN_INTERESTS = 3;
const MAX_INTERESTS = 15;

interface InterestChipProps {
  interest: Interest;
  selected: boolean;
  onPress: () => void;
  index: number;
  isCustom?: boolean;
  onRemove?: () => void;
}

function InterestChip({ interest, selected, onPress, index, isCustom, onRemove }: InterestChipProps) {
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(index * 30, withSpring(1, { damping: 12 }));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.chip, selected && styles.chipSelected, isCustom && styles.chipCustom]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <Text style={styles.chipEmoji}>{interest.emoji}</Text>
        <Text style={[styles.chipLabel, selected && styles.chipLabelSelected]}>
          {interest.label}
        </Text>
        {selected && !isCustom && (
          <View style={styles.chipCheck}>
            <Ionicons name="checkmark" size={12} color="#8B5CF6" />
          </View>
        )}
        {isCustom && selected && (
          <TouchableOpacity 
            style={styles.chipRemove}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              onRemove?.();
            }}
          >
            <Ionicons name="close" size={12} color="white" />
          </TouchableOpacity>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function InterestsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.interests);
  const [customInterests, setCustomInterests] = useState<Interest[]>([]);
  const [customInput, setCustomInput] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(false);

  const allInterests = [...INTERESTS, ...customInterests];
  const totalSelected = selected.length;

  const toggleInterest = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      if (prev.length >= MAX_INTERESTS) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return prev;
      }
      return [...prev, id];
    });
  };

  const addCustomInterests = () => {
    if (!customInput.trim()) return;

    const newInterests = customInput
      .split(',')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.length <= 20)
      .slice(0, 10); // Max 10 at a time

    const addedInterests: Interest[] = [];
    const addedIds: string[] = [];

    newInterests.forEach(label => {
      const id = `custom_${label.toLowerCase().replace(/\s+/g, '_')}`;
      
      // Check if already exists
      if (!allInterests.some(i => i.id === id) && !addedIds.includes(id)) {
        addedInterests.push({
          id,
          label,
          emoji: '✨',
          category: 'chill' as const,
        });
        addedIds.push(id);
      }
    });

    if (addedInterests.length > 0) {
      setCustomInterests(prev => [...prev, ...addedInterests]);
      
      // Auto-select new interests if under limit
      const canAdd = MAX_INTERESTS - selected.length;
      const idsToAdd = addedIds.slice(0, canAdd);
      setSelected(prev => [...prev, ...idsToAdd]);
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setCustomInput('');
    setShowCustomInput(false);
  };

  const removeCustomInterest = (id: string) => {
    setCustomInterests(prev => prev.filter(i => i.id !== id));
    setSelected(prev => prev.filter(i => i !== id));
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ interests: selected });
    router.push('/onboarding/looking-for');
  };

  const canContinue = totalSelected >= MIN_INTERESTS;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
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
        <Text style={styles.step}>Step 4 of 7</Text>
        <Text style={styles.title}>Your interests</Text>
        <Text style={styles.subtitle}>
          Pick {MIN_INTERESTS}-{MAX_INTERESTS} things you enjoy. This helps us find your people.
        </Text>
      </View>

      {/* Counter */}
      <View style={styles.counter}>
        <Text style={[
          styles.counterText,
          totalSelected >= MIN_INTERESTS && styles.counterTextValid,
        ]}>
          {totalSelected} / {MAX_INTERESTS} selected
          {totalSelected < MIN_INTERESTS && ` (pick at least ${MIN_INTERESTS})`}
        </Text>
      </View>

      {/* Interests grid */}
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.chipsContainer}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preset interests */}
        {INTERESTS.map((interest, index) => (
          <InterestChip
            key={interest.id}
            interest={interest}
            selected={selected.includes(interest.id)}
            onPress={() => toggleInterest(interest.id)}
            index={index}
          />
        ))}

        {/* Custom interests */}
        {customInterests.map((interest, index) => (
          <InterestChip
            key={interest.id}
            interest={interest}
            selected={selected.includes(interest.id)}
            onPress={() => toggleInterest(interest.id)}
            index={INTERESTS.length + index}
            isCustom
            onRemove={() => removeCustomInterest(interest.id)}
          />
        ))}

        {/* Add custom button */}
        {!showCustomInput && (
          <TouchableOpacity
            style={styles.addCustomButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowCustomInput(true);
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#8B5CF6" />
            <Text style={styles.addCustomText}>Add your own</Text>
          </TouchableOpacity>
        )}

        {/* Custom input */}
        {showCustomInput && (
          <View style={styles.customInputContainer}>
            <View style={styles.customInputWrapper}>
              <TextInput
                style={styles.customInput}
                value={customInput}
                onChangeText={setCustomInput}
                placeholder="hiking, board games, pottery..."
                placeholderTextColor="rgba(255,255,255,0.3)"
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                onSubmitEditing={addCustomInterests}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={styles.customInputClose}
                onPress={() => {
                  setShowCustomInput(false);
                  setCustomInput('');
                }}
              >
                <Ionicons name="close" size={18} color="rgba(255,255,255,0.5)" />
              </TouchableOpacity>
            </View>
            <Text style={styles.customInputHint}>
              Separate multiple interests with commas
            </Text>
            <TouchableOpacity
              style={[
                styles.customInputAdd,
                !customInput.trim() && styles.customInputAddDisabled,
              ]}
              onPress={addCustomInterests}
              disabled={!customInput.trim()}
            >
              <Ionicons name="add" size={18} color="white" />
              <Text style={styles.customInputAddText}>Add Interests</Text>
            </TouchableOpacity>
          </View>
        )}
        
        {/* Bottom spacing for button */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={[
            styles.continueButton,
            !canContinue && styles.continueButtonDisabled,
          ]}
          onPress={handleContinue}
          activeOpacity={0.8}
          disabled={!canContinue}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    marginBottom: 16,
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
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  counter: {
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  counterText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  counterTextValid: {
    color: '#10B981',
  },
  scrollView: {
    flex: 1,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 20,
    gap: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  chipSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  chipEmoji: {
    fontSize: 18,
    marginRight: 6,
  },
  chipLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '500',
  },
  chipLabelSelected: {
    color: 'white',
    fontWeight: '600',
  },
  chipCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  chipCustom: {
    borderStyle: 'dashed',
  },
  chipRemove: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(239, 68, 68, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 6,
  },
  addCustomButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
  },
  addCustomText: {
    fontSize: 14,
    color: '#8B5CF6',
    fontWeight: '500',
    marginLeft: 4,
  },
  customInputContainer: {
    width: '100%',
    marginTop: 8,
    marginBottom: 8,
  },
  customInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#8B5CF6',
  },
  customInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: 'white',
  },
  customInputClose: {
    padding: 12,
  },
  customInputHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
    marginLeft: 4,
  },
  customInputAdd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#8B5CF6',
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
  },
  customInputAddDisabled: {
    backgroundColor: 'rgba(139, 92, 246, 0.3)',
  },
  customInputAddText: {
    fontSize: 14,
    color: 'white',
    fontWeight: '600',
    marginLeft: 6,
  },
  bottomSection: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingBottom: 50,
    paddingTop: 20,
    backgroundColor: '#0a0a0f',
  },
  continueButton: {
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
