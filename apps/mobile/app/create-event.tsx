import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeOut,
  SlideInRight,
  SlideOutLeft,
} from 'react-native-reanimated';
import DateTimePicker from '@react-native-community/datetimepicker';
import { api } from '../src/lib/api';
import { HapticButton } from '../src/components/HapticButton';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category configuration with icons and colors
const CATEGORIES = [
  { id: 'social', label: 'Social', icon: 'people', color: '#FF6B9D', description: 'Casual hangouts & meetups' },
  { id: 'dating', label: 'Dating', icon: 'heart', color: '#F43F5E', description: 'Singles events & speed dating' },
  { id: 'networking', label: 'Networking', icon: 'briefcase', color: '#8B5CF6', description: 'Professional connections' },
  { id: 'activity', label: 'Activity', icon: 'fitness', color: '#10B981', description: 'Sports, hiking & hobbies' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal', color: '#6B7280', description: 'Everything else' },
] as const;

type CategoryId = typeof CATEGORIES[number]['id'];

// Duration presets
const DURATION_OPTIONS = [
  { value: 60, label: '1 hour' },
  { value: 120, label: '2 hours' },
  { value: 180, label: '3 hours' },
  { value: 240, label: '4 hours' },
  { value: 360, label: '6 hours' },
  { value: 0, label: 'Custom' },
];

// Maximum attendee presets
const ATTENDEE_PRESETS = [
  { value: 10, label: '10' },
  { value: 25, label: '25' },
  { value: 50, label: '50' },
  { value: 100, label: '100' },
  { value: null, label: 'Unlimited' },
];

export default function CreateEventScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<CategoryId | null>(null);
  const [coverImage, setCoverImage] = useState<string | null>(null);

  // Date & Time state
  const [startDate, setStartDate] = useState<Date>(() => {
    const date = new Date();
    date.setHours(date.getHours() + 1, 0, 0, 0); // Round to next hour
    return date;
  });
  const [duration, setDuration] = useState<number>(120); // 2 hours default
  const [customEndTime, setCustomEndTime] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);

  // Location state
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationSuggestions, setLocationSuggestions] = useState<any[]>([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  // Capacity state
  const [maxAttendees, setMaxAttendees] = useState<number | null>(50);
  const [showAttendeesPicker, setShowAttendeesPicker] = useState(false);

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  // Animation values
  const progressWidth = useSharedValue(25);
  const cardScale = useSharedValue(1);

  // Update progress animation
  useEffect(() => {
    progressWidth.value = withSpring((currentStep / totalSteps) * 100, {
      damping: 15,
      stiffness: 100,
    });
  }, [currentStep]);

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progressWidth.value}%`,
  }));

  // Get end time
  const getEndTime = () => {
    if (duration === 0 && customEndTime) {
      return customEndTime;
    }
    const endTime = new Date(startDate);
    endTime.setMinutes(endTime.getMinutes() + duration);
    return endTime;
  };

  // Format date for display
  const formatDate = (date: Date) => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'Today';
    if (isTomorrow) return 'Tomorrow';

    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  // Image picker functions
  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to add a cover image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });

    if (!result.canceled) {
      setCoverImage(result.assets[0].uri);
    }
  };

  // Location functions
  const getCurrentLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSearchingLocation(true);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission needed', 'Please enable location services.');
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
        const addressParts = [address.street, address.city, address.region].filter(Boolean);
        setVenueAddress(addressParts.join(', '));
        if (!venueName) {
          setVenueName(address.name || 'Current Location');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Could not get your location. Please try again.');
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const searchLocation = async (query: string) => {
    if (query.length < 3) {
      setLocationSuggestions([]);
      return;
    }

    setIsSearchingLocation(true);
    try {
      const results = await Location.geocodeAsync(query);
      if (results.length > 0) {
        const suggestions = await Promise.all(
          results.slice(0, 5).map(async (result) => {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: result.latitude,
              longitude: result.longitude,
            });
            return {
              latitude: result.latitude,
              longitude: result.longitude,
              name: address?.name || query,
              address: [address?.street, address?.city, address?.region].filter(Boolean).join(', '),
            };
          })
        );
        setLocationSuggestions(suggestions);
      }
    } catch (error) {
      console.error('Location search error:', error);
    } finally {
      setIsSearchingLocation(false);
    }
  };

  const selectLocationSuggestion = (suggestion: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setVenueName(suggestion.name);
    setVenueAddress(suggestion.address);
    setLocation({
      latitude: suggestion.latitude,
      longitude: suggestion.longitude,
    });
    setLocationSuggestions([]);
    setShowLocationPicker(false);
  };

  // Form validation
  const isStep1Valid = title.trim().length >= 3 && category !== null;
  const isStep2Valid = startDate > new Date();
  const isStep3Valid = venueName.trim().length > 0 && location !== null;
  const isStep4Valid = true; // All optional

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return isStep4Valid;
      default: return false;
    }
  };

  const goToNextStep = () => {
    if (!canProceed()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      handleSubmit();
    }
  };

  const goToPrevStep = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    } else {
      router.back();
    }
  };

  // Submit form
  const handleSubmit = async () => {
    if (!isStep1Valid || !isStep2Valid || !isStep3Valid) {
      Alert.alert('Incomplete', 'Please fill in all required fields.');
      return;
    }

    setIsLoading(true);

    try {
      const endTime = getEndTime();

      await api.post('/api/events', {
        title: title.trim(),
        description: description.trim() || undefined,
        category,
        image: coverImage || undefined,
        venueName: venueName.trim(),
        venueAddress: venueAddress.trim() || undefined,
        latitude: location!.latitude,
        longitude: location!.longitude,
        startTime: startDate.toISOString(),
        endTime: endTime.toISOString(),
        maxAttendees: maxAttendees || undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      Alert.alert(
        '🎉 Event Created!',
        'Your event is live and visible to people nearby.',
        [{ text: 'View Events', onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create event. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  // Render step indicator
  const renderStepIndicator = () => (
    <View className="px-4 pt-4 pb-2">
      <View className="flex-row items-center justify-between mb-2">
        <Text className="text-gray-500 text-sm">Step {currentStep} of {totalSteps}</Text>
        <Text className="text-primary-500 text-sm font-medium">
          {['Details', 'When', 'Where', 'Options'][currentStep - 1]}
        </Text>
      </View>
      <View className="h-1 bg-gray-200 rounded-full overflow-hidden">
        <Animated.View
          className="h-full bg-primary-500 rounded-full"
          style={progressStyle}
        />
      </View>
    </View>
  );

  // Step 1: Event Details
  const renderStep1 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      className="px-4 py-4"
    >
      <Text className="text-xl font-bold text-gray-900 mb-1">What's happening?</Text>
      <Text className="text-gray-500 mb-6">Tell people about your event</Text>

      {/* Title */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Event Title *</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="e.g., Coffee & Conversations"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
          className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 text-base"
        />
        <Text className="text-gray-400 text-xs text-right mt-1">{title.length}/100</Text>
      </View>

      {/* Description */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Description</Text>
        <TextInput
          value={description}
          onChangeText={setDescription}
          placeholder="What should people expect? Any details they should know?"
          placeholderTextColor="#9CA3AF"
          multiline
          numberOfLines={4}
          maxLength={1000}
          className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 min-h-24"
          textAlignVertical="top"
        />
        <Text className="text-gray-400 text-xs text-right mt-1">{description.length}/1000</Text>
      </View>

      {/* Category */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-3">Category *</Text>
        <View className="flex-row flex-wrap gap-2">
          {CATEGORIES.map((cat) => {
            const isSelected = category === cat.id;
            return (
              <TouchableOpacity
                key={cat.id}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setCategory(cat.id);
                }}
                className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                  isSelected
                    ? 'border-transparent'
                    : 'border-gray-200 bg-gray-50'
                }`}
                style={isSelected ? { backgroundColor: cat.color } : {}}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={cat.icon as any}
                  size={18}
                  color={isSelected ? 'white' : cat.color}
                />
                <Text
                  className={`ml-2 font-medium ${
                    isSelected ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  {cat.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        {category && (
          <Animated.Text
            entering={FadeIn.duration(200)}
            className="text-gray-500 text-sm mt-2"
          >
            {CATEGORIES.find((c) => c.id === category)?.description}
          </Animated.Text>
        )}
      </View>

      {/* Cover Image */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Cover Image</Text>
        {coverImage ? (
          <View className="relative">
            <Image
              source={{ uri: coverImage }}
              className="w-full h-40 rounded-xl"
              resizeMode="cover"
            />
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCoverImage(null);
              }}
              className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
            >
              <Ionicons name="close" size={20} color="white" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            onPress={pickImage}
            className="bg-gray-50 border border-dashed border-gray-300 rounded-xl p-8 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons name="image-outline" size={40} color="#9CA3AF" />
            <Text className="text-gray-500 mt-2">Add a cover image</Text>
            <Text className="text-gray-400 text-xs mt-1">Recommended: 16:9 ratio</Text>
          </TouchableOpacity>
        )}
      </View>
    </Animated.View>
  );

  // Step 2: Date & Time
  const renderStep2 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      className="px-4 py-4"
    >
      <Text className="text-xl font-bold text-gray-900 mb-1">When is it?</Text>
      <Text className="text-gray-500 mb-6">Set the date and time</Text>

      {/* Start Date */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Start Date *</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowDatePicker(true);
          }}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="calendar" size={20} color="#FF6B9D" />
            </View>
            <Text className="text-gray-900 text-base font-medium">{formatDate(startDate)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Start Time */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Start Time *</Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setShowTimePicker(true);
          }}
          className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 flex-row items-center justify-between"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="time" size={20} color="#FF6B9D" />
            </View>
            <Text className="text-gray-900 text-base font-medium">{formatTime(startDate)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>
      </View>

      {/* Duration */}
      <View className="mb-4">
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
                  if (option.value === 0) {
                    setShowEndTimePicker(true);
                  }
                }}
                className={`px-4 py-2.5 rounded-full border ${
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* End Time Preview */}
      <View className="bg-primary-50 rounded-xl p-4 flex-row items-center">
        <Ionicons name="information-circle" size={24} color="#FF6B9D" />
        <View className="ml-3 flex-1">
          <Text className="text-primary-800 font-medium">Event ends at</Text>
          <Text className="text-primary-700">
            {formatDate(getEndTime())} at {formatTime(getEndTime())}
          </Text>
        </View>
      </View>

      {/* Date/Time Pickers */}
      {showDatePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Select Date</Text>
                <TouchableOpacity
                  onPress={() => setShowDatePicker(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                minimumDate={new Date()}
                onChange={(event, date) => {
                  if (date) {
                    const newDate = new Date(startDate);
                    newDate.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
                    setStartDate(newDate);
                  }
                }}
                style={{ height: 200 }}
              />
              <HapticButton
                variant="primary"
                onPress={() => setShowDatePicker(false)}
                className="mt-4"
              >
                Confirm
              </HapticButton>
            </View>
          </View>
        </Modal>
      )}

      {showTimePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Select Time</Text>
                <TouchableOpacity
                  onPress={() => setShowTimePicker(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={startDate}
                mode="time"
                display="spinner"
                minuteInterval={15}
                onChange={(event, date) => {
                  if (date) {
                    const newDate = new Date(startDate);
                    newDate.setHours(date.getHours(), date.getMinutes());
                    setStartDate(newDate);
                  }
                }}
                style={{ height: 200 }}
              />
              <HapticButton
                variant="primary"
                onPress={() => setShowTimePicker(false)}
                className="mt-4"
              >
                Confirm
              </HapticButton>
            </View>
          </View>
        </Modal>
      )}

      {showEndTimePicker && (
        <Modal transparent animationType="slide">
          <View className="flex-1 justify-end bg-black/50">
            <View className="bg-white rounded-t-3xl p-4">
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-lg font-semibold text-gray-900">Custom End Time</Text>
                <TouchableOpacity
                  onPress={() => setShowEndTimePicker(false)}
                  className="p-2"
                >
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <DateTimePicker
                value={customEndTime || new Date(startDate.getTime() + 2 * 60 * 60 * 1000)}
                mode="datetime"
                display="spinner"
                minimumDate={new Date(startDate.getTime() + 30 * 60 * 1000)}
                onChange={(event, date) => {
                  if (date) {
                    setCustomEndTime(date);
                  }
                }}
                style={{ height: 200 }}
              />
              <HapticButton
                variant="primary"
                onPress={() => setShowEndTimePicker(false)}
                className="mt-4"
              >
                Confirm
              </HapticButton>
            </View>
          </View>
        </Modal>
      )}
    </Animated.View>
  );

  // Step 3: Location
  const renderStep3 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      className="px-4 py-4"
    >
      <Text className="text-xl font-bold text-gray-900 mb-1">Where is it?</Text>
      <Text className="text-gray-500 mb-6">Help people find your event</Text>

      {/* Venue Name */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Venue Name *</Text>
        <TextInput
          value={venueName}
          onChangeText={(text) => {
            setVenueName(text);
            searchLocation(text);
          }}
          placeholder="e.g., Central Park, Blue Bottle Coffee"
          placeholderTextColor="#9CA3AF"
          maxLength={100}
          className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 text-base"
        />

        {/* Location Suggestions */}
        {locationSuggestions.length > 0 && (
          <Animated.View
            entering={FadeIn.duration(200)}
            className="bg-white border border-gray-200 rounded-xl mt-2 overflow-hidden"
          >
            {locationSuggestions.map((suggestion, index) => (
              <TouchableOpacity
                key={index}
                onPress={() => selectLocationSuggestion(suggestion)}
                className={`p-3 flex-row items-center ${
                  index !== locationSuggestions.length - 1 ? 'border-b border-gray-100' : ''
                }`}
                activeOpacity={0.7}
              >
                <Ionicons name="location" size={20} color="#FF6B9D" />
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-medium" numberOfLines={1}>
                    {suggestion.name}
                  </Text>
                  <Text className="text-gray-500 text-sm" numberOfLines={1}>
                    {suggestion.address}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </Animated.View>
        )}
      </View>

      {/* Address */}
      <View className="mb-4">
        <Text className="text-gray-700 font-medium mb-2">Address</Text>
        <TextInput
          value={venueAddress}
          onChangeText={setVenueAddress}
          placeholder="Street address (optional)"
          placeholderTextColor="#9CA3AF"
          maxLength={200}
          className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 text-base"
        />
      </View>

      {/* Use Current Location Button */}
      <TouchableOpacity
        onPress={getCurrentLocation}
        disabled={isSearchingLocation}
        className="bg-gray-50 border border-gray-200 rounded-xl p-4 flex-row items-center mb-4"
        activeOpacity={0.7}
      >
        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
          {isSearchingLocation ? (
            <Ionicons name="sync" size={20} color="#FF6B9D" />
          ) : (
            <Ionicons name="locate" size={20} color="#FF6B9D" />
          )}
        </View>
        <View className="ml-3 flex-1">
          <Text className="text-gray-900 font-medium">Use Current Location</Text>
          <Text className="text-gray-500 text-sm">Find places near you</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
      </TouchableOpacity>

      {/* Location Status */}
      {location && (
        <Animated.View
          entering={FadeIn.duration(200)}
          className="bg-green-50 rounded-xl p-4 flex-row items-center"
        >
          <Ionicons name="checkmark-circle" size={24} color="#10B981" />
          <View className="ml-3 flex-1">
            <Text className="text-green-800 font-medium">Location set</Text>
            <Text className="text-green-700 text-sm">
              {venueName || 'Custom location'}
              {venueAddress ? ` • ${venueAddress}` : ''}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Map Preview Placeholder */}
      {location && (
        <Animated.View
          entering={FadeIn.duration(300).delay(200)}
          className="mt-4 bg-gray-100 rounded-xl h-40 items-center justify-center overflow-hidden"
        >
          <View className="absolute inset-0 bg-gray-200" />
          <View className="w-12 h-12 rounded-full bg-primary-500 items-center justify-center shadow-lg">
            <Ionicons name="location" size={24} color="white" />
          </View>
          <Text className="text-gray-500 text-xs mt-2">Map preview</Text>
        </Animated.View>
      )}
    </Animated.View>
  );

  // Step 4: Options
  const renderStep4 = () => (
    <Animated.View
      entering={SlideInRight.duration(300)}
      exiting={SlideOutLeft.duration(300)}
      className="px-4 py-4"
    >
      <Text className="text-xl font-bold text-gray-900 mb-1">Final touches</Text>
      <Text className="text-gray-500 mb-6">Set capacity and other options</Text>

      {/* Max Attendees */}
      <View className="mb-6">
        <Text className="text-gray-700 font-medium mb-3">Maximum Attendees</Text>
        <View className="flex-row flex-wrap gap-2">
          {ATTENDEE_PRESETS.map((preset) => {
            const isSelected = maxAttendees === preset.value;
            return (
              <TouchableOpacity
                key={String(preset.value)}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setMaxAttendees(preset.value);
                }}
                className={`px-5 py-2.5 rounded-full border ${
                  isSelected
                    ? 'bg-primary-500 border-primary-500'
                    : 'bg-gray-50 border-gray-200'
                }`}
                activeOpacity={0.7}
              >
                <Text
                  className={`font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}
                >
                  {preset.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
        <Text className="text-gray-400 text-sm mt-2">
          {maxAttendees
            ? `Your event can have up to ${maxAttendees} attendees`
            : 'No limit on attendees'}
        </Text>
      </View>

      {/* Event Summary */}
      <View className="bg-gray-50 rounded-2xl p-4">
        <Text className="text-gray-900 font-semibold text-lg mb-3">Event Summary</Text>

        <View className="space-y-3">
          {/* Title & Category */}
          <View className="flex-row items-start">
            <View
              className="w-8 h-8 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: CATEGORIES.find((c) => c.id === category)?.color || '#6B7280' }}
            >
              <Ionicons
                name={(CATEGORIES.find((c) => c.id === category)?.icon || 'calendar') as any}
                size={16}
                color="white"
              />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900 font-medium">{title || 'Untitled Event'}</Text>
              <Text className="text-gray-500 text-sm capitalize">{category || 'No category'}</Text>
            </View>
          </View>

          {/* Date & Time */}
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="calendar" size={16} color="#FF6B9D" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900">
                {formatDate(startDate)} at {formatTime(startDate)}
              </Text>
              <Text className="text-gray-500 text-sm">
                Until {formatTime(getEndTime())}
              </Text>
            </View>
          </View>

          {/* Location */}
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="location" size={16} color="#FF6B9D" />
            </View>
            <View className="flex-1">
              <Text className="text-gray-900" numberOfLines={1}>
                {venueName || 'No venue'}
              </Text>
              {venueAddress && (
                <Text className="text-gray-500 text-sm" numberOfLines={1}>
                  {venueAddress}
                </Text>
              )}
            </View>
          </View>

          {/* Capacity */}
          <View className="flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="people" size={16} color="#FF6B9D" />
            </View>
            <Text className="text-gray-900">
              {maxAttendees ? `Up to ${maxAttendees} attendees` : 'Unlimited attendees'}
            </Text>
          </View>
        </View>
      </View>

      {/* Tips */}
      <View className="bg-primary-50 rounded-xl p-4 mt-4">
        <Text className="text-primary-800 font-medium mb-2">💡 Tips for success</Text>
        <View className="space-y-1">
          <Text className="text-primary-700 text-sm">• Share your event on social media</Text>
          <Text className="text-primary-700 text-sm">• Respond to questions promptly</Text>
          <Text className="text-primary-700 text-sm">• Update attendees if details change</Text>
        </View>
      </View>
    </Animated.View>
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      default: return null;
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      {renderStepIndicator()}

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 100 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {renderCurrentStep()}
      </ScrollView>

      {/* Bottom Navigation */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity
            onPress={goToPrevStep}
            className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center"
            activeOpacity={0.7}
          >
            <Ionicons
              name={currentStep === 1 ? 'close' : 'arrow-back'}
              size={24}
              color="#6B7280"
            />
          </TouchableOpacity>

          <View className="flex-1">
            <HapticButton
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={goToNextStep}
              disabled={!canProceed()}
              rightIcon={
                currentStep < totalSteps ? (
                  <Ionicons name="arrow-forward" size={20} color="white" />
                ) : (
                  <Ionicons name="checkmark" size={20} color="white" />
                )
              }
            >
              {currentStep < totalSteps ? 'Continue' : 'Create Event'}
            </HapticButton>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
