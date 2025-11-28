import { useState, useEffect } from 'react';
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
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../src/lib/api';
import { HapticButton } from '../src/components/HapticButton';

export default function CreatePinScreen() {
  const router = useRouter();
  const [description, setDescription] = useState('');
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [locationName, setLocationName] = useState('Getting location...');

  useEffect(() => {
    (async () => {
      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      
      // Reverse geocode to get location name
      try {
        const [address] = await Location.reverseGeocodeAsync({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        if (address) {
          const parts = [address.name, address.street, address.city].filter(Boolean);
          setLocationName(parts.join(', ') || 'Current Location');
        }
      } catch {
        setLocationName('Current Location');
      }
    })();
  }, []);

  const pickImage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera roll permissions to add photos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const takePhoto = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please grant camera permissions to take photos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Missing description', 'Please describe who you saw!');
      return;
    }

    if (description.length < 10) {
      Alert.alert('Too short', 'Please add more details to your description.');
      return;
    }

    if (!location) {
      Alert.alert('Location needed', 'Please wait for your location to be detected.');
      return;
    }

    setIsLoading(true);

    try {
      await api.post('/api/pins', {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        description: description.trim(),
        image: image, // In real app, would upload to storage first
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create pin. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="flex-1 px-4 py-4">
          {/* Location Badge */}
          <View className="flex-row items-center bg-gray-50 rounded-xl p-3 mb-4">
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center mr-3">
              <Ionicons name="location" size={20} color="#FF6B9D" />
            </View>
            <View className="flex-1">
              <Text className="text-xs text-gray-500 uppercase tracking-wide">Pinning at</Text>
              <Text className="text-gray-900 font-medium" numberOfLines={1}>
                {locationName}
              </Text>
            </View>
            {location && (
              <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            )}
          </View>

          {/* Description Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Who did you see? 💕
            </Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the person you noticed... What were they wearing? What caught your eye?"
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={5}
              maxLength={500}
              className="bg-gray-50 rounded-xl p-4 text-gray-900 min-h-32 border border-gray-200"
              textAlignVertical="top"
            />
            <Text className="text-gray-400 text-xs text-right mt-1">
              {description.length}/500
            </Text>
          </View>

          {/* Image Section */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">
              Add a photo (optional)
            </Text>
            
            {image ? (
              <View className="relative">
                <Image
                  source={{ uri: image }}
                  className="w-full h-48 rounded-xl"
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setImage(null);
                  }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 items-center justify-center"
                >
                  <Ionicons name="close" size={20} color="white" />
                </TouchableOpacity>
              </View>
            ) : (
              <View className="flex-row space-x-3">
                <TouchableOpacity
                  onPress={takePhoto}
                  className="flex-1 bg-gray-50 rounded-xl p-6 items-center border border-gray-200"
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera" size={32} color="#FF6B9D" />
                  <Text className="text-gray-600 mt-2">Take Photo</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  onPress={pickImage}
                  className="flex-1 bg-gray-50 rounded-xl p-6 items-center border border-gray-200"
                  activeOpacity={0.7}
                >
                  <Ionicons name="images" size={32} color="#FF6B9D" />
                  <Text className="text-gray-600 mt-2">Choose Photo</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <Text className="text-gray-400 text-xs mt-2">
              💡 Tip: A photo of the location (not the person!) can help them recognize where they were
            </Text>
          </View>

          {/* Tips */}
          <View className="bg-primary-50 rounded-xl p-4 mb-6">
            <Text className="text-primary-800 font-medium mb-2">
              ✨ Tips for a great pin
            </Text>
            <View className="space-y-1">
              <Text className="text-primary-700 text-sm">• Be specific about time and location</Text>
              <Text className="text-primary-700 text-sm">• Describe clothing, accessories, or activities</Text>
              <Text className="text-primary-700 text-sm">• Be respectful and genuine</Text>
              <Text className="text-primary-700 text-sm">• Don't share personal information</Text>
            </View>
          </View>

          {/* Submit Button */}
          <HapticButton
            variant="primary"
            size="lg"
            isLoading={isLoading}
            onPress={handleSubmit}
            disabled={!description.trim() || !location}
            leftIcon={<Ionicons name="location" size={20} color="white" />}
          >
            Drop Pin
          </HapticButton>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
