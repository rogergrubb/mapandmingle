import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
} from 'react-native-reanimated';
import { useOnboarding } from './_layout';

interface PermissionCardProps {
  icon: string;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  status: 'pending' | 'granted' | 'denied';
  onPress: () => void;
  delay: number;
  required?: boolean;
}

function PermissionCard({
  icon,
  iconColor,
  iconBg,
  title,
  description,
  status,
  onPress,
  delay,
  required,
}: PermissionCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(30);

  useState(() => {
    opacity.value = withDelay(delay, withSpring(1));
    translateY.value = withDelay(delay, withSpring(0));
  });

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  const getStatusIcon = () => {
    switch (status) {
      case 'granted':
        return <Ionicons name="checkmark-circle" size={24} color="#10B981" />;
      case 'denied':
        return <Ionicons name="close-circle" size={24} color="#EF4444" />;
      default:
        return <Ionicons name="chevron-forward" size={24} color="rgba(255,255,255,0.5)" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'granted':
        return 'Enabled';
      case 'denied':
        return 'Denied';
      default:
        return 'Tap to enable';
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <TouchableOpacity
        style={[
          styles.card,
          status === 'granted' && styles.cardGranted,
          status === 'denied' && styles.cardDenied,
        ]}
        onPress={onPress}
        activeOpacity={0.8}
        disabled={status === 'granted'}
      >
        <View style={[styles.iconContainer, { backgroundColor: iconBg }]}>
          <Ionicons name={icon as any} size={28} color={iconColor} />
        </View>

        <View style={styles.cardContent}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{title}</Text>
            {required && (
              <View style={styles.requiredBadge}>
                <Text style={styles.requiredText}>Required</Text>
              </View>
            )}
          </View>
          <Text style={styles.cardDescription}>{description}</Text>
          <Text style={[
            styles.statusText,
            status === 'granted' && styles.statusGranted,
            status === 'denied' && styles.statusDenied,
          ]}>
            {getStatusText()}
          </Text>
        </View>

        {getStatusIcon()}
      </TouchableOpacity>
    </Animated.View>
  );
}

export default function PermissionsScreen() {
  const router = useRouter();
  const { data, updateData } = useOnboarding();
  const [locationStatus, setLocationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');
  const [notificationStatus, setNotificationStatus] = useState<'pending' | 'granted' | 'denied'>('pending');

  const requestLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      
      if (status === 'granted') {
        setLocationStatus('granted');
        updateData({ locationGranted: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setLocationStatus('denied');
        Alert.alert(
          'Location Required',
          'Map Mingle needs your location to show you nearby pins and events. Please enable location in your device settings.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Location permission error:', error);
      setLocationStatus('denied');
    }
  };

  const requestNotifications = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      
      if (status === 'granted') {
        setNotificationStatus('granted');
        updateData({ notificationsGranted: true });
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setNotificationStatus('denied');
        // Notifications are optional, so just update state
      }
    } catch (error) {
      console.error('Notification permission error:', error);
      setNotificationStatus('denied');
    }
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    if (locationStatus !== 'granted') {
      Alert.alert(
        'Location Required',
        'You need to enable location to use Map Mingle. Without it, we can\'t show you nearby pins or events.',
        [
          { text: 'Enable Location', onPress: requestLocation },
          { text: 'Cancel', style: 'cancel' },
        ]
      );
      return;
    }
    
    router.push('/onboarding/profile-basics');
  };

  const canContinue = locationStatus === 'granted';

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.step}>Step 1 of 7</Text>
        <Text style={styles.title}>Enable Permissions</Text>
        <Text style={styles.subtitle}>
          To connect you with people nearby, we need a few permissions.
        </Text>
      </View>

      {/* Permission Cards */}
      <View style={styles.cards}>
        <PermissionCard
          icon="location"
          iconColor="#FF6B9D"
          iconBg="rgba(255, 107, 157, 0.15)"
          title="Location"
          description="See pins and events near you. This is how the magic happens."
          status={locationStatus}
          onPress={requestLocation}
          delay={100}
          required
        />

        <PermissionCard
          icon="notifications"
          iconColor="#FFA07A"
          iconBg="rgba(255, 160, 122, 0.15)"
          title="Notifications"
          description="Get notified when someone messages you or drops a pin nearby."
          status={notificationStatus}
          onPress={requestNotifications}
          delay={200}
        />
      </View>

      {/* Privacy note */}
      <View style={styles.privacyNote}>
        <Ionicons name="shield-checkmark" size={20} color="#10B981" />
        <Text style={styles.privacyText}>
          Your exact location is never shared. Only you decide what others see.
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    paddingTop: 80,
    paddingHorizontal: 24,
  },
  header: {
    marginBottom: 40,
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
  cards: {
    gap: 16,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardGranted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
  },
  cardDenied: {
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: 'white',
    marginRight: 8,
  },
  requiredBadge: {
    backgroundColor: 'rgba(255, 107, 157, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  requiredText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#FF6B9D',
    textTransform: 'uppercase',
  },
  cardDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    lineHeight: 20,
    marginBottom: 4,
  },
  statusText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.4)',
    fontWeight: '500',
  },
  statusGranted: {
    color: '#10B981',
  },
  statusDenied: {
    color: '#EF4444',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
  },
  privacyText: {
    flex: 1,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginLeft: 12,
    lineHeight: 20,
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
