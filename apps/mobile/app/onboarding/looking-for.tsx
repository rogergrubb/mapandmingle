import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
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

interface LookingForOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  color: string;
}

const OPTIONS: LookingForOption[] = [
  {
    id: 'dating',
    label: 'Dating',
    description: 'Looking for romantic connections',
    icon: 'heart',
    color: '#FF6B9D',
  },
  {
    id: 'friends',
    label: 'Friendship',
    description: 'Making new friends in the area',
    icon: 'people',
    color: '#FFA07A',
  },
  {
    id: 'networking',
    label: 'Networking',
    description: 'Professional connections',
    icon: 'briefcase',
    color: '#8B5CF6',
  },
  {
    id: 'activity-partners',
    label: 'Activity Partners',
    description: 'People to do things with',
    icon: 'walk',
    color: '#10B981',
  },
  {
    id: 'open',
    label: 'Open to Anything',
    description: 'See what happens!',
    icon: 'sparkles',
    color: '#F59E0B',
  },
];

interface OptionCardProps {
  option: LookingForOption;
  selected: boolean;
  onPress: () => void;
  index: number;
}

function OptionCard({ option, selected, onPress, index }: OptionCardProps) {
  const translateX = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(index * 80, withSpring(0, { damping: 15 }));
    opacity.value = withDelay(index * 80, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.optionCard,
          selected && { borderColor: option.color, backgroundColor: `${option.color}15` },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <View style={[styles.iconContainer, { backgroundColor: `${option.color}20` }]}>
          <Ionicons name={option.icon as any} size={28} color={option.color} />
        </View>
        
        <View style={styles.optionContent}>
          <Text style={styles.optionLabel}>{option.label}</Text>
          <Text style={styles.optionDescription}>{option.description}</Text>
        </View>
        
        <View style={[
          styles.checkbox,
          selected && { backgroundColor: option.color, borderColor: option.color },
        ]}>
          {selected && <Ionicons name="checkmark" size={16} color="white" />}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function LookingForScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [selected, setSelected] = useState<string[]>(data.lookingFor);

  const toggleOption = (id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) {
        return prev.filter(i => i !== id);
      }
      return [...prev, id];
    });
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({ lookingFor: selected });
    router.push('/onboarding/activity-intent');
  };

  const canContinue = selected.length > 0;

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
        <Text style={styles.step}>Step 5 of 7</Text>
        <Text style={styles.title}>What are you{'\n'}looking for?</Text>
        <Text style={styles.subtitle}>
          Select all that apply. This helps us show your profile to the right people.
        </Text>
      </View>

      {/* Options */}
      <View style={styles.options}>
        {OPTIONS.map((option, index) => (
          <OptionCard
            key={option.id}
            option={option}
            selected={selected.includes(option.id)}
            onPress={() => toggleOption(option.id)}
            index={index}
          />
        ))}
      </View>

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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  header: {
    marginBottom: 32,
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
  options: {
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 17,
    fontWeight: '700',
    color: 'white',
    marginBottom: 2,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
  },
  checkbox: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSection: {
    position: 'absolute',
    bottom: 50,
    left: 24,
    right: 24,
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
