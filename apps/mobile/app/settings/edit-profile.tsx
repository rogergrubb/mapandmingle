import { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';
import { useAuthStore } from '../../src/stores/auth';

// Gender options
const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'nonbinary', label: 'Non-binary' },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

// Relationship status options
const RELATIONSHIP_OPTIONS = [
  { value: 'single', label: 'Single' },
  { value: 'dating', label: 'Dating' },
  { value: 'committed', label: 'In a Relationship' },
  { value: 'married', label: 'Married' },
  { value: 'open', label: 'Open Relationship' },
  { value: 'complicated', label: "It's Complicated" },
  { value: 'prefer_not', label: 'Prefer not to say' },
];

// Chat readiness options
const CHAT_READINESS_OPTIONS = [
  { value: 'open_to_chat', label: 'Open to Chat', icon: 'chatbubble', color: '#10B981' },
  { value: 'open_to_meet', label: 'Open to Meet', icon: 'cafe', color: '#8B5CF6' },
  { value: 'browsing_only', label: 'Just Browsing', icon: 'eye', color: '#6B7280' },
  { value: 'busy', label: 'Busy Right Now', icon: 'moon', color: '#EF4444' },
];

export default function EditProfileScreen() {
  const router = useRouter();
  const { user, profile, refreshProfile } = useAuthStore();

  // Form state
  const [displayName, setDisplayName] = useState('');
  const [handle, setHandle] = useState('');
  const [bio, setBio] = useState('');
  const [avatar, setAvatar] = useState<string | null>(null);
  const [age, setAge] = useState('');
  const [gender, setGender] = useState<string | null>(null);
  const [relationshipStatus, setRelationshipStatus] = useState<string | null>(null);
  const [chatReadiness, setChatReadiness] = useState('browsing_only');
  const [lookingFor, setLookingFor] = useState('');

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [handleError, setHandleError] = useState<string | null>(null);

  // Load initial data
  useEffect(() => {
    if (profile) {
      setDisplayName(profile.displayName || user?.name || '');
      setHandle(profile.handle || '');
      setBio(profile.bio || '');
      setAvatar(profile.avatar || null);
      setAge(profile.age?.toString() || '');
      setGender(profile.gender || null);
      setRelationshipStatus(profile.relationshipStatus || null);
      setChatReadiness(profile.chatReadiness || 'browsing_only');
      setLookingFor(profile.lookingFor || '');
    }
  }, [profile, user]);

  // Track changes
  useEffect(() => {
    if (!profile) return;
    
    const changed =
      displayName !== (profile.displayName || user?.name || '') ||
      handle !== (profile.handle || '') ||
      bio !== (profile.bio || '') ||
      avatar !== profile.avatar ||
      age !== (profile.age?.toString() || '') ||
      gender !== profile.gender ||
      relationshipStatus !== profile.relationshipStatus ||
      chatReadiness !== (profile.chatReadiness || 'browsing_only') ||
      lookingFor !== (profile.lookingFor || '');

    setHasChanges(changed);
  }, [displayName, handle, bio, avatar, age, gender, relationshipStatus, chatReadiness, lookingFor, profile, user]);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant photo library access to change your avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera access to take a photo.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const validateHandle = async (value: string) => {
    if (!value) {
      setHandleError(null);
      return;
    }

    // Check format
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(value)) {
      setHandleError('3-20 characters, letters, numbers, underscores only');
      return;
    }

    // Check availability (skip if same as current)
    if (value === profile?.handle) {
      setHandleError(null);
      return;
    }

    try {
      const response = await api.get<{ available: boolean }>(`/api/profile/check-handle/${value}`);
      if (!response.available) {
        setHandleError('This handle is already taken');
      } else {
        setHandleError(null);
      }
    } catch {
      // Ignore errors during validation
    }
  };

  const handleSave = async () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    // Validate
    if (displayName.trim().length < 2) {
      Alert.alert('Invalid Name', 'Please enter at least 2 characters for your name.');
      return;
    }

    if (handle && handleError) {
      Alert.alert('Invalid Handle', handleError);
      return;
    }

    if (age && (parseInt(age) < 18 || parseInt(age) > 120)) {
      Alert.alert('Invalid Age', 'Please enter a valid age (18-120).');
      return;
    }

    setIsSaving(true);

    try {
      await api.put('/api/profile', {
        displayName: displayName.trim(),
        handle: handle.trim() || null,
        bio: bio.trim() || null,
        avatar: avatar,
        age: age ? parseInt(age) : null,
        gender,
        relationshipStatus,
        chatReadiness,
        lookingFor: lookingFor.trim() || null,
      });

      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save profile. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDiscard = () => {
    if (!hasChanges) {
      router.back();
      return;
    }

    Alert.alert(
      'Discard Changes?',
      'You have unsaved changes. Are you sure you want to discard them?',
      [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => router.back() },
      ]
    );
  };

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: 'Edit Profile',
          headerLeft: () => (
            <TouchableOpacity onPress={confirmDiscard} className="p-2">
              <Ionicons name="close" size={24} color="#374151" />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving || !hasChanges}
              className="p-2"
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#FF6B9D" />
              ) : (
                <Text
                  className={`font-semibold ${hasChanges ? 'text-primary-500' : 'text-gray-400'}`}
                >
                  Save
                </Text>
              )}
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView
          className="flex-1"
          contentContainerStyle={{ paddingBottom: 100 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Avatar Section */}
          <Animated.View entering={FadeIn.duration(300)} className="items-center py-6 bg-gray-50">
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  'Change Photo',
                  'Choose an option',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Take Photo', onPress: takePhoto },
                    { text: 'Choose from Library', onPress: pickImage },
                    avatar && {
                      text: 'Remove Photo',
                      style: 'destructive',
                      onPress: () => setAvatar(null),
                    },
                  ].filter(Boolean) as any
                );
              }}
              activeOpacity={0.7}
            >
              <View className="relative">
                <View className="w-28 h-28 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-4 border-white shadow-lg">
                  {avatar ? (
                    <Image source={{ uri: avatar }} className="w-28 h-28 rounded-full" />
                  ) : (
                    <Ionicons name="person" size={48} color="#9CA3AF" />
                  )}
                </View>
                <View className="absolute bottom-0 right-0 w-9 h-9 rounded-full bg-primary-500 items-center justify-center border-2 border-white">
                  <Ionicons name="camera" size={18} color="white" />
                </View>
              </View>
            </TouchableOpacity>
            <Text className="text-primary-500 font-medium mt-3">Change Photo</Text>
          </Animated.View>

          {/* Form Fields */}
          <View className="px-4 py-6">
            {/* Display Name */}
            <Animated.View entering={FadeInDown.duration(300).delay(100)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Display Name *</Text>
              <TextInput
                value={displayName}
                onChangeText={setDisplayName}
                placeholder="How should we call you?"
                placeholderTextColor="#9CA3AF"
                maxLength={50}
                className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
              />
            </Animated.View>

            {/* Handle */}
            <Animated.View entering={FadeInDown.duration(300).delay(150)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Username</Text>
              <View className="relative">
                <Text className="absolute left-4 top-3.5 text-gray-400">@</Text>
                <TextInput
                  value={handle}
                  onChangeText={(text) => {
                    const cleaned = text.toLowerCase().replace(/[^a-z0-9_]/g, '');
                    setHandle(cleaned);
                    validateHandle(cleaned);
                  }}
                  placeholder="your_username"
                  placeholderTextColor="#9CA3AF"
                  maxLength={20}
                  autoCapitalize="none"
                  className={`bg-gray-50 rounded-xl pl-8 pr-4 py-3.5 text-gray-900 border ${
                    handleError ? 'border-red-300' : 'border-gray-200'
                  }`}
                />
              </View>
              {handleError && (
                <Text className="text-red-500 text-sm mt-1">{handleError}</Text>
              )}
            </Animated.View>

            {/* Bio */}
            <Animated.View entering={FadeInDown.duration(300).delay(200)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Bio</Text>
              <TextInput
                value={bio}
                onChangeText={setBio}
                placeholder="Tell people a bit about yourself..."
                placeholderTextColor="#9CA3AF"
                multiline
                numberOfLines={3}
                maxLength={300}
                className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200 min-h-24"
                textAlignVertical="top"
              />
              <Text className="text-gray-400 text-xs text-right mt-1">{bio.length}/300</Text>
            </Animated.View>

            {/* Chat Readiness */}
            <Animated.View entering={FadeInDown.duration(300).delay(250)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-3">Your Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {CHAT_READINESS_OPTIONS.map((option) => {
                  const isSelected = chatReadiness === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setChatReadiness(option.value);
                      }}
                      className={`flex-row items-center px-4 py-2.5 rounded-full border ${
                        isSelected ? 'border-transparent' : 'border-gray-200 bg-gray-50'
                      }`}
                      style={isSelected ? { backgroundColor: option.color } : {}}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={16}
                        color={isSelected ? 'white' : option.color}
                      />
                      <Text
                        className={`ml-2 font-medium ${isSelected ? 'text-white' : 'text-gray-700'}`}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* Divider */}
            <View className="h-px bg-gray-200 my-4" />

            {/* Age */}
            <Animated.View entering={FadeInDown.duration(300).delay(300)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">Age</Text>
              <TextInput
                value={age}
                onChangeText={(text) => setAge(text.replace(/[^0-9]/g, ''))}
                placeholder="Your age"
                placeholderTextColor="#9CA3AF"
                keyboardType="number-pad"
                maxLength={3}
                className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
              />
            </Animated.View>

            {/* Gender */}
            <Animated.View entering={FadeInDown.duration(300).delay(350)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-3">Gender</Text>
              <View className="flex-row flex-wrap gap-2">
                {GENDER_OPTIONS.map((option) => {
                  const isSelected = gender === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setGender(isSelected ? null : option.value);
                      }}
                      className={`px-4 py-2.5 rounded-full border ${
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-gray-50 border-gray-200'
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

            {/* Relationship Status */}
            <Animated.View entering={FadeInDown.duration(300).delay(400)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-3">Relationship Status</Text>
              <View className="flex-row flex-wrap gap-2">
                {RELATIONSHIP_OPTIONS.map((option) => {
                  const isSelected = relationshipStatus === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setRelationshipStatus(isSelected ? null : option.value);
                      }}
                      className={`px-4 py-2.5 rounded-full border ${
                        isSelected
                          ? 'bg-primary-500 border-primary-500'
                          : 'bg-gray-50 border-gray-200'
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

            {/* Looking For */}
            <Animated.View entering={FadeInDown.duration(300).delay(450)} className="mb-5">
              <Text className="text-gray-700 font-medium mb-2">What are you looking for?</Text>
              <TextInput
                value={lookingFor}
                onChangeText={setLookingFor}
                placeholder="e.g., New friends, dating, networking..."
                placeholderTextColor="#9CA3AF"
                maxLength={200}
                className="bg-gray-50 rounded-xl px-4 py-3.5 text-gray-900 border border-gray-200"
              />
            </Animated.View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Save Button (Mobile) */}
      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8">
        <HapticButton
          variant="primary"
          size="lg"
          onPress={handleSave}
          isLoading={isSaving}
          disabled={!hasChanges}
        >
          Save Changes
        </HapticButton>
      </View>
    </View>
  );
}
