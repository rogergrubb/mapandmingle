import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
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

type GenderOption = 'male' | 'female' | 'non-binary' | 'prefer-not-to-say';

interface GenderButtonProps {
  value: GenderOption;
  label: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  delay: number;
}

function GenderButton({ value, label, icon, selected, onPress, delay }: GenderButtonProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12 }));
    opacity.value = withDelay(delay, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[styles.genderButton, selected && styles.genderButtonSelected]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        activeOpacity={0.8}
      >
        <Ionicons
          name={icon as any}
          size={24}
          color={selected ? 'white' : 'rgba(255,255,255,0.6)'}
        />
        <Text style={[styles.genderLabel, selected && styles.genderLabelSelected]}>
          {label}
        </Text>
        {selected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark" size={14} color="#8B5CF6" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function DemographicsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [age, setAge] = useState(data.age);
  const [gender, setGender] = useState<GenderOption | null>(data.gender);

  const titleOpacity = useSharedValue(0);

  useEffect(() => {
    titleOpacity.value = withSpring(1);
  }, []);

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
  }));

  const handleAgeChange = (text: string) => {
    // Only allow numbers
    const numericValue = text.replace(/[^0-9]/g, '');
    setAge(numericValue);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const ageNum = parseInt(age);
    if (!age || isNaN(ageNum)) {
      Alert.alert('Age required', 'Please enter your age to continue.');
      return;
    }

    if (ageNum < 18) {
      Alert.alert(
        'Age Requirement',
        'You must be at least 18 years old to use Map Mingle.'
      );
      return;
    }

    if (ageNum > 99) {
      Alert.alert('Invalid age', 'Please enter a valid age.');
      return;
    }

    if (!gender) {
      Alert.alert('Gender required', 'Please select a gender option to continue.');
      return;
    }

    updateData({ age, gender });
    router.push('/onboarding/interests');
  };

  const canContinue = age.length > 0 && parseInt(age) >= 18 && gender !== null;

  const genderOptions: { value: GenderOption; label: string; icon: string }[] = [
    { value: 'male', label: 'Male', icon: 'male' },
    { value: 'female', label: 'Female', icon: 'female' },
    { value: 'non-binary', label: 'Non-binary', icon: 'male-female' },
    { value: 'prefer-not-to-say', label: 'Prefer not to say', icon: 'person' },
  ];

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
      <Animated.View style={[styles.header, titleStyle]}>
        <Text style={styles.step}>Step 3 of 7</Text>
        <Text style={styles.title}>A bit about you</Text>
        <Text style={styles.subtitle}>
          This helps us show you to the right people and vice versa.
        </Text>
      </Animated.View>

      {/* Age input */}
      <View style={styles.section}>
        <Text style={styles.label}>How old are you?</Text>
        <View style={styles.ageInputContainer}>
          <TextInput
            style={styles.ageInput}
            value={age}
            onChangeText={handleAgeChange}
            placeholder="Age"
            placeholderTextColor="rgba(255,255,255,0.3)"
            keyboardType="number-pad"
            maxLength={2}
          />
          <Text style={styles.ageUnit}>years old</Text>
        </View>
        <Text style={styles.inputHint}>You must be 18+ to use Map Mingle</Text>
      </View>

      {/* Gender selection */}
      <View style={styles.section}>
        <Text style={styles.label}>How do you identify?</Text>
        <View style={styles.genderGrid}>
          {genderOptions.map((option, index) => (
            <GenderButton
              key={option.value}
              value={option.value}
              label={option.label}
              icon={option.icon}
              selected={gender === option.value}
              onPress={() => setGender(option.value)}
              delay={100 + index * 80}
            />
          ))}
        </View>
      </View>

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Ionicons name="eye-off" size={18} color="#8B5CF6" />
        <Text style={styles.privacyText}>
          You can choose to hide your age later in privacy settings.
        </Text>
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
    </KeyboardAvoidingView>
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
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  section: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginBottom: 16,
  },
  ageInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ageInput: {
    width: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 18,
    fontSize: 24,
    fontWeight: '700',
    color: 'white',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    textAlign: 'center',
  },
  ageUnit: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.5)',
    marginLeft: 16,
  },
  inputHint: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 12,
  },
  genderGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  genderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    minWidth: '47%',
  },
  genderButtonSelected: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    borderColor: '#8B5CF6',
  },
  genderLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 10,
    flex: 1,
  },
  genderLabelSelected: {
    color: 'white',
    fontWeight: '600',
  },
  checkmark: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'white',
    justifyContent: 'center',
    alignItems: 'center',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 14,
  },
  privacyText: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
    marginLeft: 10,
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
