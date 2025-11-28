import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  FadeIn,
  FadeInDown,
  SlideInRight,
} from 'react-native-reanimated';
import { api } from '../src/lib/api';
import { HapticButton } from '../src/components/HapticButton';

// Mingle activity types with icons and colors
const ACTIVITY_TYPES = [
  { id: 'coffee', label: 'Coffee ☕', icon: 'cafe', color: '#8B4513', description: 'Grab a coffee together' },
  { id: 'walk', label: 'Walk 🚶', icon: 'walk', color: '#10B981', description: 'Go for a walk' },
  { id: 'lunch', label: 'Lunch 🍽️', icon: 'restaurant', color: '#F59E0B', description: 'Share a meal' },
  { id: 'drinks', label: 'Drinks 🍻', icon: 'beer', color: '#EF4444', description: 'Grab drinks' },
  { id: 'workout', label: 'Workout 💪', icon: 'fitness', color: '#8B5CF6', description: 'Exercise together' },
  { id: 'study', label: 'Study 📚', icon: 'book', color: '#3B82F6', description: 'Study or work together' },
  { id: 'gaming', label: 'Gaming 🎮', icon: 'game-controller', color: '#EC4899', description: 'Play games' },
  { id: 'explore', label: 'Explore 🗺️', icon: 'compass', color: '#14B8A6', description: 'Discover new places' },
  { id: 'chat', label: 'Just Chat 💬', icon: 'chatbubbles', color: '#FF6B9D', description: 'Casual conversation' },
  { id: 'other', label: 'Other ✨', icon: 'sparkles', color: '#6B7280', description: 'Something else' },
];

// Duration options
const DURATION_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
];

// Time options (how soon)
const TIME_OPTIONS = [
  { value: 'now', label: 'Right Now', sublabel: 'Available immediately' },
  { value: '15min', label: 'In 15 min', sublabel: 'Need a few minutes' },
  { value: '30min', label: 'In 30 min', sublabel: 'Getting ready' },
  { value: '1hour', label: 'In 1 hour', sublabel: 'On my way soon' },
  { value: 'later', label: 'Later Today', sublabel: 'Set a specific time' },
];

export default function CreateMingleScreen() {
  const router = useRouter();

  // Form state
  const [activityType, setActivityType] = useState<string | null>(null);
  const [customActivity, setCustomActivity] = useState('');
  const [description, setDescription] = useState('');
  const [timeOption, setTimeOption] = useState('now');
  const [duration, setDuration] = useState(60);
  const [maxParticipants, setMaxParticipants] = useState<number | null>(null);
  const [isPremiumOnly, setIsPremiumOnly] = useState(false);

  // Location state
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [locationName, setLocationName] = useState('Getting location...');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);

  // Animation
  const progressWidth = useSharedValue(33);

  useEffect(() => {
    progressWidth.value = withSpring((step / 3) * 100, { damping: 15 });
  }, [step]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Get current location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setLocationName('Location unavailable');
          return;
        }

        const loc = await Location.getCurrentPositionAsync({});
        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        // Reverse geocode
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });

        if (address) {
          const parts = [address.name, address.street, address.city].filter(Boolean);
          setLocationName(parts.join(', ') || 'Your current location');
        }
      } catch (error) {
        setLocationName('Location unavailable');
      }
    })();
  }, []);

  const getStartTime = () => {
    const now = new Date();
    switch (timeOption) {
      case 'now':
        return now;
      case '15min':
        return new Date(now.getTime() + 15 * 60 * 1000);
      case '30min':
        return new Date(now.getTime() + 30 * 60 * 1000);
      case '1hour':
        return new Date(now.getTime() + 60 * 60 * 1000);
      default:
        return now;
    }
  };

  const getEndTime = () => {
    const startTime = getStartTime();
    return new Date(startTime.getTime() + duration * 60 * 1000);
  };

  const handleSubmit = async () => {
    if (!activityType) {
      Alert.alert('Select Activity', 'Please select what you want to do.');
      return;
    }

    if (!location) {
      Alert.alert('Location Needed', 'Please wait for your location to be detected.');
      return;
    }

    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const selectedActivity = ACTIVITY_TYPES.find((a) => a.id === activityType);
      
      await api.post('/api/mingles', {
        activityType,
        title: activityType === 'other' && customActivity 
          ? customActivity 
          : selectedActivity?.label || 'Mingle',
        description: description.trim() || selectedActivity?.description,
        latitude: location.latitude,
        longitude: location.longitude,
        startTime: getStartTime().toISOString(),
        duration,
        maxParticipants: maxParticipants || undefined,
        isPremiumOnly,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        '🎉 Mingle Created!',
        'People nearby can now see your mingle and join you.',
        [{ text: 'Great!', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create mingle. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return activityType !== null && (activityType !== 'other' || customActivity.trim().length > 0);
      case 2:
        return true;
      case 3:
        return location !== null;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  const prevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (step > 1) {
      setStep(step - 1);
    } else {
      router.back();
    }
  };

  // Step 1: Activity Selection
  const renderStep1 = () => (
    <Animated.View entering={SlideInRight.duration(300)} className="px-4 py-4">
      <Text className="text-xl font-bold text-gray-900 mb-1">What do you want to do?</Text>
      <Text className="text-gray-500 mb-6">Pick an activity or create your own</Text>

      <View className="flex-row flex-wrap gap-3">
        {ACTIVITY_TYPES.map((activity) => {
          const isSelected = activityType === activity.id;
          return (
            <TouchableOpacity
              key={activity.id}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActivityType(activity.id);
              }}
              className={`px-4 py-3 rounded-xl border ${
                isSelected ? 'border-transparent' : 'border-gray-200 bg-gray-50'
              }`}
              style={isSelected ? { backgroundColor: activity.color } : {}}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <Ionicons
                  name={activity.icon as any}
                  size={20}
                  color={isSelected ? 'white' : activity.color}
                />
                <Text
                  className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}
                >
                  {activity.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Custom activity input */}
      {activityType === 'other' && (
        <Animated.View entering={FadeIn.duration(200)} className="mt-4">
          <Text className="text-gray-700 font-medium mb-2">What's the activity?</Text>
          <TextInput
            value={customActivity}
            onChangeText={setCustomActivity}
            placeholder="e.g., Board games night, Photography walk..."
            placeholderTextColor="#9CA3AF"
            maxLength={50}
            className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
          />
        </Animated.View>
      )}

      {/* Optional description */}
      <View className="mt-6">
        <Text className="text-gray-700 font-medium mb-2">Add details (optional)</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="Any preferences? e.g., 'Looking for fellow hikers' or 'Beginner-friendly'"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={3}
          maxLength={200}
          className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 min-h-20"
          textAlignVertical="top"
        />
        <Text className="text-gray-400 text-xs text-right mt-1">{description.length}/200</Text>
      </View>
    </Animated.View>
  );

  // Step 2: Time & Duration
  const renderStep2 = () => (
    <Animated.View entering={SlideInRight.duration(300)} className="px-4 py-4">
      <Text className="text-xl font-bold text-gray-900 mb-1">When are you available?</Text>
      <Text className="text-gray-500 mb-6">Let people know when to join</Text>

      {/* Time options */}
      <Text className="text-gray-700 font-medium mb-3">Start Time</Text>
      <View className="space-y-2 mb-6">
        {TIME_OPTIONS.map((option) => {
          const isSelected = timeOption === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setTimeOption(option.value);
              }}
              className={`flex-row items-center p-4 rounded-xl border ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-1">
                <Text className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                  {option.label}
                </Text>
                <Text className={`text-sm ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                  {option.sublabel}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FF6B9D" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Duration */}
      <Text className="text-gray-700 font-medium mb-3">Duration</Text>
      <View className="flex-row flex-wrap gap-2">
        {DURATION_OPTIONS.map((option) => {
          const isSelected = duration === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setDuration(option.value);
              }}
              className={`px-4 py-2.5 rounded-full border ${
                isSelected ? 'bg-primary-500 border-primary-500' : 'bg-gray-50 border-gray-200'
              }`}
              activeOpacity={0.7}
            >
              <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                {option.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </Animated.View>
  );

  // Step 3: Options & Confirm
  const renderStep3 = () => {
    const selectedActivity = ACTIVITY_TYPES.find((a) => a.id === activityType);

    return (
      <Animated.View entering={SlideInRight.duration(300)} className="px-4 py-4">
        <Text className="text-xl font-bold text-gray-900 mb-1">Final touches</Text>
        <Text className="text-gray-500 mb-6">Review and customize your mingle</Text>

        {/* Location */}
        <View className="bg-gray-50 rounded-xl p-4 mb-4 flex-row items-center">
          <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
            <Ionicons name="location" size={20} color="#FF6B9D" />
          </View>
          <View className="flex-1">
            <Text className="text-xs text-gray-500 uppercase tracking-wide">Your Location</Text>
            <Text className="text-gray-900 font-medium" numberOfLines={1}>
              {locationName}
            </Text>
          </View>
          {location && <Ionicons name="checkmark-circle" size={20} color="#10B981" />}
        </View>

        {/* Max Participants */}
        <View className="mb-6">
          <Text className="text-gray-700 font-medium mb-3">Max Participants (optional)</Text>
          <View className="flex-row flex-wrap gap-2">
            {[null, 2, 4, 6, 8, 10].map((num) => {
              const isSelected = maxParticipants === num;
              return (
                <TouchableOpacity
                  key={String(num)}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setMaxParticipants(num);
                  }}
                  className={`px-4 py-2.5 rounded-full border ${
                    isSelected ? 'bg-primary-500 border-primary-500' : 'bg-gray-50 border-gray-200'
                  }`}
                  activeOpacity={0.7}
                >
                  <Text className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}>
                    {num === null ? 'No limit' : num}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Summary */}
        <View className="bg-primary-50 rounded-2xl p-4">
          <Text className="text-primary-800 font-semibold text-lg mb-3">Mingle Summary</Text>

          <View className="space-y-3">
            {/* Activity */}
            <View className="flex-row items-center">
              <View
                className="w-8 h-8 rounded-full items-center justify-center"
                style={{ backgroundColor: selectedActivity?.color || '#6B7280' }}
              >
                <Ionicons
                  name={(selectedActivity?.icon || 'sparkles') as any}
                  size={16}
                  color="white"
                />
              </View>
              <Text className="text-primary-800 font-medium ml-3">
                {activityType === 'other' && customActivity
                  ? customActivity
                  : selectedActivity?.label || 'Activity'}
              </Text>
            </View>

            {/* Time */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-200 items-center justify-center">
                <Ionicons name="time" size={16} color="#FF6B9D" />
              </View>
              <Text className="text-primary-800 ml-3">
                {TIME_OPTIONS.find((t) => t.value === timeOption)?.label} • {duration} min
              </Text>
            </View>

            {/* Capacity */}
            <View className="flex-row items-center">
              <View className="w-8 h-8 rounded-full bg-primary-200 items-center justify-center">
                <Ionicons name="people" size={16} color="#FF6B9D" />
              </View>
              <Text className="text-primary-800 ml-3">
                {maxParticipants ? `Up to ${maxParticipants} people` : 'Open to everyone'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tips */}
        <View className="bg-blue-50 rounded-xl p-4 mt-4">
          <Text className="text-blue-800 font-medium mb-2">💡 Tips</Text>
          <Text className="text-blue-700 text-sm">
            • Stay in public places when meeting new people{'\n'}
            • Let someone know where you're going{'\n'}
            • Trust your instincts
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <Stack.Screen options={{ title: 'Plan a Mingle' }} />

      {/* Progress Bar */}
      <View className="px-4 pt-2 pb-2">
        <View className="flex-row items-center justify-between mb-2">
          <Text className="text-gray-500 text-sm">Step {step} of 3</Text>
          <Text className="text-primary-500 text-sm font-medium">
            {['Activity', 'Time', 'Confirm'][step - 1]}
          </Text>
        </View>
        <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <Animated.View className="h-full bg-primary-500 rounded-full" style={progressStyle} />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={prevStep}
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name={step === 1 ? 'close' : 'arrow-back'} size={24} color="#6B7280" />
          </TouchableOpacity>

          <View className="flex-1">
            <HapticButton
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={nextStep}
              disabled={!canProceed()}
              rightIcon={
                step < 3 ? (
                  <Ionicons name="arrow-forward" size={20} color="white" />
                ) : (
                  <Ionicons name="sparkles" size={20} color="white" />
                )
              }
            >
              {step < 3 ? 'Continue' : 'Create Mingle'}
            </HapticButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
