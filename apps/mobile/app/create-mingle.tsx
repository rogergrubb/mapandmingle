import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';

export default function CreateMingleScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [mapRegion, setMapRegion] = useState({
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.015,
    longitudeDelta: 0.015,
  });

  // Form state
  const [description, setDescription] = useState('');
  const [preferredPeople, setPreferredPeople] = useState('2-4');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'private' | 'friends'>('public');
  const [tags, setTags] = useState('');
  const [latitude, setLatitude] = useState(37.7749);
  const [longitude, setLongitude] = useState(-122.4194);
  const [locationName, setLocationName] = useState('San Francisco, CA');
  const [isMingleEnabled, setIsMingleEnabled] = useState(true);

  // Get user's current location on mount
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          setMapRegion({
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            latitudeDelta: 0.015,
            longitudeDelta: 0.015,
          });
          setLatitude(loc.coords.latitude);
          setLongitude(loc.coords.longitude);

          // Reverse geocode
          try {
            const [address] = await Location.reverseGeocodeAsync({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
            if (address) {
              const parts = [address.name, address.city].filter(Boolean);
              setLocationName(parts.join(', ') || 'Current Location');
            }
          } catch (e) {
            setLocationName('Current Location');
          }
        }
      } catch (error) {
        console.error('Location error:', error);
      }
    })();
  }, []);

  const handleMapRegionChange = (region: any) => {
    setMapRegion(region);
  };

  const handleMapPressConfirm = () => {
    setLatitude(mapRegion.latitude);
    setLongitude(mapRegion.longitude);
    setShowMapPicker(false);

    // Reverse geocode the new location
    (async () => {
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: mapRegion.latitude,
          longitude: mapRegion.longitude,
        });
        if (address) {
          const parts = [address.name, address.city].filter(Boolean);
          setLocationName(parts.join(', ') || 'Selected Location');
        }
      } catch (e) {
        setLocationName('Selected Location');
      }
    })();

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handlePhotoSelect = async () => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
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
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [4, 3],
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
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a description before saving');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', latitude.toString());
      formData.append('longitude', longitude.toString());
      formData.append('locationName', locationName);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', tags);
      formData.append('isDraft', 'true');
      formData.append('isActive', isMingleEnabled ? 'true' : 'false');

      if (photoUri) {
        formData.append('photo', {
          uri: photoUri,
          type: 'image/jpeg',
          name: `mingle-${Date.now()}.jpg`,
        } as any);
      }

      const response = await api.post('/api/mingles/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Draft saved! You can review and submit anytime.');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save draft');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitMingle = async () => {
    if (!description.trim()) {
      Alert.alert('Required', 'Please add a description');
      return;
    }

    if (!isMingleEnabled) {
      Alert.alert('Mingle Disabled', 'Please enable the mingle feature to submit');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const formData = new FormData();
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

      await api.post('/api/mingles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('🔥 You\'re Live!', 'Your mingle is now active. Find your people!', [
        {
          text: 'View on Map',
          onPress: () => router.push('/(tabs)'),
        },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create mingle');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (showMapPicker) {
    return (
      <View className="flex-1">
        <MapView
          region={mapRegion}
          onRegionChange={handleMapRegionChange}
          className="flex-1"
        >
          <Marker
            coordinate={{
              latitude: mapRegion.latitude,
              longitude: mapRegion.longitude,
            }}
            title="Your Mingle Location"
          />
        </MapView>

        {/* Location Picker Controls */}
        <View className="absolute bottom-0 left-0 right-0 bg-white rounded-t-3xl p-6 shadow-lg">
          <TouchableOpacity
            onPress={() => setShowMapPicker(false)}
            className="absolute top-4 left-4"
          >
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>

          <Text className="text-center text-lg font-bold text-gray-800 mb-4 mt-4">
            Tap to set location
          </Text>

          <View className="bg-gray-50 rounded-lg p-4 mb-4">
            <Text className="text-xs text-gray-500 uppercase tracking-wide mb-1">
              Coordinates
            </Text>
            <Text className="text-sm text-gray-700 font-mono">
              {mapRegion.latitude.toFixed(4)}, {mapRegion.longitude.toFixed(4)}
            </Text>
          </View>

          <TouchableOpacity
            onPress={handleMapPressConfirm}
            className="bg-orange-500 rounded-lg p-4"
          >
            <Text className="text-white font-bold text-center text-lg">
              Confirm Location
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View className="px-4 py-6 bg-gradient-to-b from-orange-400 to-orange-500">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mb-4 w-8"
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          <Text className="text-4xl font-bold text-white mb-2">Ready to Mingle</Text>
          <Text className="text-orange-100 text-base">
            I'm hot 🔥 & ready right now
          </Text>
        </View>

        {/* Content */}
        <View className="px-4 py-6 pb-10">
          {/* Info Banner - Turn Off Feature */}
          <View className="bg-blue-50 rounded-xl p-4 mb-6 border border-blue-200">
            <View className="flex-row items-start justify-between">
              <View className="flex-1 flex-row items-start">
                <Ionicons name="information-circle" size={20} color="#3b82f6" style={{ marginRight: 12, marginTop: 2 }} />
                <Text className="text-blue-700 text-sm flex-1">
                  You can turn off this spontaneous mingle feature anytime to stop finding matches
                </Text>
              </View>
            </View>

            {/* Toggle Enable/Disable */}
            <View className="flex-row items-center mt-4 bg-white rounded-lg p-3">
              <Ionicons name="flame" size={20} color={isMingleEnabled ? '#f97316' : '#d1d5db'} />
              <Text className="text-gray-700 font-semibold flex-1 ml-3">
                {isMingleEnabled ? 'Mingle Feature Active' : 'Mingle Feature Disabled'}
              </Text>
              <Switch
                value={isMingleEnabled}
                onValueChange={setIsMingleEnabled}
                trackColor={{ false: '#d1d5db', true: '#f97316' }}
                thumbColor={isMingleEnabled ? '#fff' : '#f3f4f6'}
              />
            </View>
          </View>

          {/* Photo Upload */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-800">Your Vibe 📸</Text>
            {photoUri ? (
              <View className="relative">
                <Image
                  source={{ uri: photoUri }}
                  className="w-full h-64 rounded-xl mb-3"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => setPhotoUri(null)}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={handleTakePhoto}
                  className="flex-1 bg-orange-100 rounded-xl p-6 items-center justify-center border border-orange-300"
                >
                  <Ionicons name="camera" size={32} color="#f97316" />
                  <Text className="text-orange-700 font-semibold mt-2 text-center text-sm">
                    Take Photo
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePhotoSelect}
                  className="flex-1 bg-blue-100 rounded-xl p-6 items-center justify-center border border-blue-300"
                >
                  <Ionicons name="images" size={32} color="#3b82f6" />
                  <Text className="text-blue-700 font-semibold mt-2 text-center text-sm">
                    Choose Photo
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            <Text className="text-gray-400 text-xs mt-2">
              💡 Show what you're up to or where you are
            </Text>
          </View>

          {/* Description */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2 text-gray-800">What's Happening?</Text>
            <TextInput
              placeholder="Tell people what this mingle is about... Coffee chat, game night, workout buddy, etc."
              value={description}
              onChangeText={setDescription}
              multiline
              numberOfLines={4}
              className="border border-gray-300 rounded-xl p-4 text-gray-700 min-h-28"
              placeholderTextColor="#999"
              maxLength={500}
            />
            <Text className="text-gray-400 text-xs mt-2 text-right">
              {description.length}/500
            </Text>
          </View>

          {/* Tags */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-2 text-gray-800">Tags</Text>
            <TextInput
              placeholder="Add tags: #coffee #gaming #sports (space-separated)"
              value={tags}
              onChangeText={setTags}
              className="border border-gray-300 rounded-xl p-4 text-gray-700"
              placeholderTextColor="#999"
              maxLength={200}
            />
            <Text className="text-gray-400 text-xs mt-2">
              Help people find mingles they're interested in
            </Text>
          </View>

          {/* Preferred People Count */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-800">How Many People?</Text>
            <View className="flex-row gap-2">
              {['1-2', '2-4', '4-6', '6+'].map((option) => (
                <TouchableOpacity
                  key={option}
                  onPress={() => {
                    setPreferredPeople(option);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`flex-1 rounded-xl p-4 ${
                    preferredPeople === option ? 'bg-orange-500' : 'bg-gray-200'
                  }`}
                >
                  <Text
                    className={`text-center font-bold ${
                      preferredPeople === option ? 'text-white' : 'text-gray-700'
                    }`}
                  >
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Privacy */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-800">Who Can See This?</Text>
            <View className="gap-3">
              {(['public', 'friends', 'private'] as const).map((privacyOption) => (
                <TouchableOpacity
                  key={privacyOption}
                  onPress={() => {
                    setPrivacy(privacyOption);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                  className={`flex-row items-center p-4 rounded-xl border-2 ${
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
                  <View className="flex-1">
                    <Text className="font-semibold text-gray-800 capitalize">
                      {privacyOption === 'public' && 'Public'}
                      {privacyOption === 'friends' && 'Friends Only'}
                      {privacyOption === 'private' && 'Private (Invite Only)'}
                    </Text>
                    <Text className="text-xs text-gray-500 mt-1">
                      {privacyOption === 'public' && 'Anyone can see & join'}
                      {privacyOption === 'friends' && 'Only your friends can see'}
                      {privacyOption === 'private' && 'Only people you invite'}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Location Picker */}
          <View className="mb-6">
            <Text className="text-lg font-bold mb-3 text-gray-800">📍 Your Location</Text>
            <View className="bg-gray-100 rounded-xl p-4 mb-3">
              <View className="flex-row items-center">
                <Ionicons name="location" size={20} color="#f97316" style={{ marginRight: 10 }} />
                <Text className="text-gray-800 font-semibold flex-1">
                  {locationName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setShowMapPicker(true)}
              className="bg-orange-500 rounded-xl p-4"
            >
              <View className="flex-row items-center justify-center">
                <Ionicons name="map" size={20} color="white" style={{ marginRight: 8 }} />
                <Text className="text-white font-bold text-center flex-1">
                  Change Location
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Buttons */}
          <View className="gap-3 pb-6">
            <TouchableOpacity
              onPress={saveDraft}
              disabled={isLoading}
              className="bg-gray-200 rounded-xl p-4"
            >
              {isLoading ? (
                <ActivityIndicator color="#666" />
              ) : (
                <Text className="text-gray-700 font-bold text-center text-base">
                  💾 Save as Draft
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              onPress={submitMingle}
              disabled={isLoading || !description.trim() || !isMingleEnabled}
              className={`rounded-xl p-4 ${
                description.trim() && isMingleEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              {isLoading ? (
                <ActivityIndicator color="white" />
              ) : (
                <Text className="text-white font-bold text-center text-lg">
                  🔥 Go Live Now
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
