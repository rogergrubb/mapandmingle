import { useState, useRef } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';

export default function CreateMingleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  // Form state
  const [description, setDescription] = useState('');
  const [preferredPeople, setPreferredPeople] = useState('2-4');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'friends'>('public');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [locationName, setLocationName] = useState('San Francisco, CA');

  const handlePhotoSelect = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setPhotoUri(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  const saveDraft = async () => {
    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const formData = new FormData();
      formData.append('title', 'Ready to Mingle');
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('locationName', locationName);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', tags);
      formData.append('isDraft', 'true');
      formData.append('isActive', 'true');

      if (photoUri) {
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: `mingle-${Date.now()}.jpg`,
        } as any);
      }

      await api.post('/api/mingles/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Mingle draft saved! Review and submit when ready.');
    } catch (error) {
      Alert.alert('Error', 'Failed to save draft');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitMingle = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a description');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const formData = new FormData();
      formData.append('title', 'Ready to Mingle');
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('locationName', locationName);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', tags);
      formData.append('isDraft', 'false');
      formData.append('isActive', 'true');
      formData.append('startTime', new Date().toISOString());
      formData.append('endTime', new Date(Date.now() + 30 * 60000).toISOString());

      if (photoUri) {
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: `mingle-${Date.now()}.jpg`,
        } as any);
      }

      const response = await api.post('/api/mingles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your mingle is live! Find your people 🔥');
      
      setTimeout(() => {
        router.push('/(tabs)');
      }, 1000);
    } catch (error) {
      Alert.alert('Error', 'Failed to create mingle');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ScrollView className="flex-1 bg-white">
      {/* Header */}
      <View className="px-4 py-6 bg-gradient-to-r from-orange-400 to-red-500">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white mb-2">Ready to Mingle</Text>
        <Text className="text-orange-100">Let's find your people right now 🔥</Text>
      </View>

      {/* Content */}
      <View className="px-4 py-6">
        {/* Info Banner */}
        <View className="bg-blue-50 rounded-lg p-4 mb-6 border border-blue-200">
          <View className="flex-row">
            <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 8 }} />
            <Text className="text-blue-700 text-sm flex-1">
              You can turn off this spontaneous mingle feature anytime in your settings
            </Text>
          </View>
        </View>

        {/* Photo Upload */}
        <Text className="text-lg font-bold mb-3 text-gray-800">Your Vibe</Text>
        {photoUri ? (
          <View className="mb-6">
            <Image source={{ uri: photoUri }} className="w-full h-64 rounded-lg mb-3" />
            <TouchableOpacity
              onPress={() => setPhotoUri(null)}
              className="bg-red-500 rounded-lg p-3"
            >
              <Text className="text-white font-semibold text-center">Remove Photo</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View className="flex-row gap-3 mb-6">
            <TouchableOpacity
              onPress={handleTakePhoto}
              className="flex-1 bg-orange-100 rounded-lg p-4 items-center justify-center"
            >
              <Ionicons name="camera" size={28} color="#f97316" />
              <Text className="text-orange-700 font-semibold mt-2 text-center">Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={handlePhotoSelect}
              className="flex-1 bg-blue-100 rounded-lg p-4 items-center justify-center"
            >
              <Ionicons name="image" size={28} color="#3b82f6" />
              <Text className="text-blue-700 font-semibold mt-2 text-center">Choose Photo</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Description */}
        <Text className="text-lg font-bold mb-2 text-gray-800">What's happening?</Text>
        <TextInput
          placeholder="Tell people what this mingle is about... (e.g., Coffee date, Game night, Sports)"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          className="border border-gray-300 rounded-lg p-4 mb-6 text-gray-700"
          placeholderTextColor="#999"
          maxLength={500}
        />
        <Text className="text-xs text-gray-500 mb-6">{description.length}/500</Text>

        {/* Tags */}
        <Text className="text-lg font-bold mb-2 text-gray-800">Tags</Text>
        <TextInput
          placeholder="Add tags: #coffee #gaming #sports (separate with space)"
          value={tags}
          onChangeText={setTags}
          className="border border-gray-300 rounded-lg p-4 mb-6 text-gray-700"
          placeholderTextColor="#999"
          maxLength={200}
        />

        {/* Preferred People */}
        <Text className="text-lg font-bold mb-3 text-gray-800">How many people?</Text>
        <View className="flex-row gap-2 mb-6">
          {['1-2', '2-4', '4-6', '6+'].map((option) => (
            <TouchableOpacity
              key={option}
              onPress={() => {
                setPreferredPeople(option);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`flex-1 rounded-lg p-3 ${
                preferredPeople === option ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <Text
                className={`text-center font-semibold ${
                  preferredPeople === option ? 'text-white' : 'text-gray-700'
                }`}
              >
                {option}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Privacy */}
        <Text className="text-lg font-bold mb-3 text-gray-800">Who can see this?</Text>
        <View className="gap-2 mb-6">
          {(['public', 'private', 'friends'] as const).map((privacyOption) => (
            <TouchableOpacity
              key={privacyOption}
              onPress={() => {
                setPrivacy(privacyOption);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
              className={`flex-row items-center p-4 rounded-lg border-2 ${
                privacy === privacyOption
                  ? 'bg-orange-50 border-orange-500'
                  : 'bg-white border-gray-200'
              }`}
            >
              <View
                className={`w-5 h-5 rounded-full mr-3 ${
                  privacy === privacyOption ? 'bg-orange-500' : 'bg-gray-300'
                }`}
              />
              <View>
                <Text className="font-semibold text-gray-800 capitalize">{privacyOption}</Text>
                <Text className="text-xs text-gray-500">
                  {privacyOption === 'public' && 'Anyone can see & join'}
                  {privacyOption === 'friends' && 'Only your friends can see'}
                  {privacyOption === 'private' && 'Only people you invite'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Location */}
        <Text className="text-lg font-bold mb-3 text-gray-800">Your Location</Text>
        <View className="bg-gray-100 rounded-lg p-4 mb-6">
          <View className="flex-row items-center">
            <Ionicons name="location" size={20} color="#f97316" style={{ marginRight: 8 }} />
            <Text className="text-gray-800 font-semibold">{locationName}</Text>
          </View>
          <TouchableOpacity className="mt-3 bg-orange-500 rounded-lg p-2">
            <Text className="text-white text-center font-semibold text-sm">Change Location (Map)</Text>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View className="gap-3 pb-8">
          <TouchableOpacity
            onPress={saveDraft}
            disabled={isLoading}
            className="bg-gray-200 rounded-lg p-4"
          >
            {isLoading ? (
              <ActivityIndicator color="#666" />
            ) : (
              <Text className="text-gray-700 font-bold text-center">Save as Draft</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={submitMingle}
            disabled={isLoading || !description.trim()}
            className={`rounded-lg p-4 ${
              description.trim() ? 'bg-orange-500' : 'bg-gray-300'
            }`}
          >
            {isLoading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-bold text-center text-lg">🔥 Go Live</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}