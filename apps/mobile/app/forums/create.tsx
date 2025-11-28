import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';

interface Category {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}

const categories: Category[] = [
  { id: 'general', name: 'General', icon: 'chatbubbles', color: '#3B82F6' },
  { id: 'meetups', name: 'Meetups', icon: 'people', color: '#FF6B9D' },
  { id: 'events', name: 'Events', icon: 'calendar', color: '#F59E0B' },
  { id: 'places', name: 'Places', icon: 'location', color: '#22C55E' },
  { id: 'tips', name: 'Tips', icon: 'bulb', color: '#8B5CF6' },
  { id: 'questions', name: 'Q&A', icon: 'help-circle', color: '#06B6D4' },
];

export default function CreateForumPostScreen() {
  const router = useRouter();
  
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [addLocation, setAddLocation] = useState(false);
  const [location, setLocation] = useState<{
    name: string;
    latitude: number;
    longitude: number;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddLocation = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (addLocation) {
      setAddLocation(false);
      setLocation(null);
      return;
    }

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required.');
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });

      const locationName = geocode
        ? [geocode.street, geocode.city].filter(Boolean).join(', ')
        : 'Current Location';

      setLocation({
        name: locationName,
        latitude: currentLocation.coords.latitude,
        longitude: currentLocation.coords.longitude,
      });
      setAddLocation(true);
    } catch (error) {
      Alert.alert('Error', 'Unable to get your location.');
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please add a title to your post.');
      return;
    }

    if (!content.trim()) {
      Alert.alert('Missing Content', 'Please add some content to your post.');
      return;
    }

    if (!selectedCategory) {
      Alert.alert('Missing Category', 'Please select a category for your post.');
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post('/api/forums/posts', {
        title: title.trim(),
        content: content.trim(),
        category: selectedCategory,
        location: addLocation ? location : undefined,
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      Alert.alert('Error', 'Unable to create post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const isValid = title.trim() && content.trim() && selectedCategory;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'New Post',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()}>
              <Text className="text-gray-600">Cancel</Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleSubmit} disabled={!isValid || isSubmitting}>
              <Text className={`font-semibold ${isValid && !isSubmitting ? 'text-primary-500' : 'text-gray-300'}`}>
                {isSubmitting ? 'Posting...' : 'Post'}
              </Text>
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView className="flex-1" keyboardShouldPersistTaps="handled">
        <View className="p-4 border-b border-gray-100">
          <Text className="font-semibold text-gray-900 mb-3">Category</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View className="flex-row space-x-2">
              {categories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSelectedCategory(category.id);
                  }}
                  className={`flex-row items-center px-4 py-2 rounded-full border-2 ${
                    selectedCategory === category.id ? 'border-primary-500' : 'border-gray-200'
                  }`}
                  style={selectedCategory === category.id ? { backgroundColor: `${category.color}10` } : undefined}
                >
                  <Ionicons name={category.icon} size={16} color={selectedCategory === category.id ? category.color : '#6B7280'} />
                  <Text className={`ml-2 font-medium ${selectedCategory === category.id ? '' : 'text-gray-600'}`}
                    style={selectedCategory === category.id ? { color: category.color } : undefined}
                  >
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </View>

        <View className="p-4 border-b border-gray-100">
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            placeholderTextColor="#9CA3AF"
            className="text-xl font-semibold text-gray-900"
            maxLength={100}
          />
          <Text className="text-xs text-gray-400 text-right mt-1">{title.length}/100</Text>
        </View>

        <View className="p-4">
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="What do you want to share?"
            placeholderTextColor="#9CA3AF"
            className="text-gray-900 leading-6"
            multiline
            textAlignVertical="top"
            style={{ minHeight: 200 }}
            maxLength={2000}
          />
          <Text className="text-xs text-gray-400 text-right mt-1">{content.length}/2000</Text>
        </View>

        {addLocation && location && (
          <View className="mx-4 mb-4 p-3 bg-gray-50 rounded-xl flex-row items-center">
            <Ionicons name="location" size={20} color="#FF6B9D" />
            <Text className="flex-1 ml-2 text-gray-700">{location.name}</Text>
            <TouchableOpacity onPress={handleAddLocation}>
              <Ionicons name="close-circle" size={20} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}

        <View className="px-4 pb-8">
          <TouchableOpacity
            onPress={handleAddLocation}
            className={`flex-row items-center p-3 rounded-xl ${addLocation ? 'bg-primary-50' : 'bg-gray-50'}`}
          >
            <Ionicons name="location" size={20} color={addLocation ? '#FF6B9D' : '#6B7280'} />
            <Text className={`ml-2 font-medium ${addLocation ? 'text-primary-500' : 'text-gray-600'}`}>
              {addLocation ? 'Location added' : 'Add location'}
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mx-4 mb-8 p-4 bg-blue-50 rounded-xl">
          <View className="flex-row items-center mb-2">
            <Ionicons name="information-circle" size={18} color="#3B82F6" />
            <Text className="font-semibold text-blue-800 ml-2">Community Guidelines</Text>
          </View>
          <Text className="text-sm text-blue-700 leading-5">
            Be respectful and kind. No spam, hate speech, or inappropriate content.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
