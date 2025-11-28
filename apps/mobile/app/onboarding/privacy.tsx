import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
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

interface PrivacyToggleProps {
  icon: string;
  iconColor: string;
  title: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  index: number;
  premium?: boolean;
}

function PrivacyToggle({
  icon,
  iconColor,
  title,
  description,
  value,
  onValueChange,
  index,
  premium,
}: PrivacyToggleProps) {
  const translateY = useSharedValue(30);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(index * 100, withSpring(0, { damping: 15 }));
    opacity.value = withDelay(index * 100, withSpring(1));
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.toggleCard, animatedStyle]}>
      <View style={[styles.toggleIcon, { backgroundColor: `${iconColor}20` }]}>
        <Ionicons name={icon as any} size={24} color={iconColor} />
      </View>
      
      <View style={styles.toggleContent}>
        <View style={styles.toggleHeader}>
          <Text style={styles.toggleTitle}>{title}</Text>
          {premium && (
            <View style={styles.premiumBadge}>
              <Ionicons name="star" size={10} color="#F59E0B" />
              <Text style={styles.premiumText}>Premium</Text>
            </View>
          )}
        </View>
        <Text style={styles.toggleDescription}>{description}</Text>
      </View>
      
      <Switch
        value={value}
        onValueChange={(newValue) => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onValueChange(newValue);
        }}
        trackColor={{ false: 'rgba(255,255,255,0.2)', true: 'rgba(139, 92, 246, 0.5)' }}
        thumbColor={value ? '#8B5CF6' : '#f4f3f4'}
        ios_backgroundColor="rgba(255,255,255,0.2)"
      />
    </Animated.View>
  );
}

export default function PrivacyScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  
  const [showAge, setShowAge] = useState(data.showAge);
  const [showDistance, setShowDistance] = useState(data.showDistance);
  const [ghostMode, setGhostMode] = useState(data.ghostModeEnabled);

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateData({
      showAge,
      showDistance,
      ghostModeEnabled: ghostMode,
    });
    router.push('/onboarding/complete');
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
        <Text style={styles.step}>Step 7 of 7</Text>
        <Text style={styles.title}>Privacy matters</Text>
        <Text style={styles.subtitle}>
          Control what others can see about you. You can always change these later.
        </Text>
      </View>

      {/* Privacy toggles */}
      <View style={styles.toggles}>
        <PrivacyToggle
          icon="calendar"
          iconColor="#FF6B9D"
          title="Show my age"
          description="Display your age on your profile"
          value={showAge}
          onValueChange={setShowAge}
          index={0}
        />

        <PrivacyToggle
          icon="location"
          iconColor="#FFA07A"
          title="Show distance"
          description="Let others see how far away you are"
          value={showDistance}
          onValueChange={setShowDistance}
          index={1}
        />

        <PrivacyToggle
          icon="eye-off"
          iconColor="#8B5CF6"
          title="Ghost Mode"
          description="Browse invisibly - others can't see you visited their profile"
          value={ghostMode}
          onValueChange={setGhostMode}
          index={2}
          premium
        />
      </View>

      {/* Info card */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <Ionicons name="shield-checkmark" size={24} color="#10B981" />
          <Text style={styles.infoTitle}>Your privacy is protected</Text>
        </View>
        <Text style={styles.infoText}>
          • Your exact location is never shared{'\n'}
          • You control who can message you{'\n'}
          • Block or report anyone at any time{'\n'}
          • Premium gives you even more privacy controls
        </Text>
      </View>

      {/* Continue button */}
      <View style={styles.bottomSection}>
        <TouchableOpacity
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Finish Setup</Text>
          <Ionicons name="checkmark" size={20} color="white" />
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
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 24,
  },
  toggles: {
    gap: 16,
    marginBottom: 24,
  },
  toggleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  toggleIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  toggleContent: {
    flex: 1,
    marginRight: 12,
  },
  toggleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  toggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
    marginRight: 8,
  },
  premiumBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  premiumText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#F59E0B',
    marginLeft: 3,
  },
  toggleDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.2)',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
    marginLeft: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 22,
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
    backgroundColor: '#10B981',
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  continueButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '700',
    marginRight: 8,
  },
});
