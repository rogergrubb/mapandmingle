import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeIn, FadeInDown, FadeOut, Layout } from 'react-native-reanimated';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';

interface SavedPin {
  id: string;
  createdAt: string;
  pin: {
    id: string;
    description: string;
    image: string | null;
    likesCount: number;
    createdAt: string;
    latitude: number;
    longitude: number;
    user: {
      id: string;
      name: string | null;
      image: string | null;
    };
  };
}

export default function SavedPinsScreen() {
  const router = useRouter();
  const [savedPins, setSavedPins] = useState<SavedPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchSavedPins = useCallback(async () => {
    try {
      const data = await api.get<SavedPin[]>('/api/saved-pins');
      setSavedPins(data);
    } catch (error) {
      console.error('Error fetching saved pins:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchSavedPins();
  }, [fetchSavedPins]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchSavedPins();
  };

  const handlePinPress = (pinId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/pin/${pinId}`);
  };

  const handleUnsave = async (savedPinId: string, pinId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    Alert.alert(
      'Remove from Saved',
      'Are you sure you want to remove this pin from your saved list?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.delete(`/api/saved-pins/${pinId}`);
              setSavedPins((prev) => prev.filter((sp) => sp.id !== savedPinId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to remove pin. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="bookmark" size={48} color="#FF6B9D" />
        <Text className="text-gray-500 mt-4">Loading saved pins...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Saved Pins' }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 20 }}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FF6B9D" />
        }
        showsVerticalScrollIndicator={false}
      >
        {savedPins.length === 0 ? (
          <Animated.View
            entering={FadeIn.duration(300)}
            className="flex-1 items-center justify-center px-8 pt-20"
          >
            <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
              <Ionicons name="bookmark-outline" size={48} color="#FF6B9D" />
            </View>
            <Text className="text-xl font-bold text-gray-900 text-center">
              No Saved Pins Yet
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              When you save pins, they'll appear here so you can easily find them later.
            </Text>
            <HapticButton
              variant="primary"
              className="mt-6"
              onPress={() => router.push('/(tabs)')}
            >
              Explore Pins
            </HapticButton>
          </Animated.View>
        ) : (
          <View className="px-4 pt-4">
            <Text className="text-gray-500 mb-4">
              {savedPins.length} saved {savedPins.length === 1 ? 'pin' : 'pins'}
            </Text>

            {savedPins.map((savedPin, index) => (
              <Animated.View
                key={savedPin.id}
                entering={FadeInDown.duration(300).delay(index * 50)}
                exiting={FadeOut.duration(200)}
                layout={Layout.springify()}
              >
                <TouchableOpacity
                  onPress={() => handlePinPress(savedPin.pin.id)}
                  className="bg-white rounded-2xl mb-3 overflow-hidden shadow-sm"
                  activeOpacity={0.7}
                >
                  {/* Image */}
                  {savedPin.pin.image && (
                    <Image
                      source={{ uri: savedPin.pin.image }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                  )}

                  {/* Content */}
                  <View className="p-4">
                    {/* User Info */}
                    <View className="flex-row items-center mb-2">
                      <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
                        {savedPin.pin.user.image ? (
                          <Image
                            source={{ uri: savedPin.pin.user.image }}
                            className="w-8 h-8 rounded-full"
                          />
                        ) : (
                          <Ionicons name="person" size={16} color="#9CA3AF" />
                        )}
                      </View>
                      <View className="ml-2 flex-1">
                        <Text className="text-gray-900 font-medium text-sm">
                          {savedPin.pin.user.name || 'Anonymous'}
                        </Text>
                        <Text className="text-gray-400 text-xs">
                          {formatDate(savedPin.pin.createdAt)}
                        </Text>
                      </View>
                    </View>

                    {/* Description */}
                    <Text className="text-gray-700" numberOfLines={3}>
                      {savedPin.pin.description}
                    </Text>

                    {/* Footer */}
                    <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-gray-100">
                      <View className="flex-row items-center">
                        <Ionicons name="heart" size={16} color="#FF6B9D" />
                        <Text className="text-gray-500 text-sm ml-1">
                          {savedPin.pin.likesCount}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Text className="text-gray-400 text-xs mr-3">
                          Saved {formatDate(savedPin.createdAt)}
                        </Text>
                        <TouchableOpacity
                          onPress={() => handleUnsave(savedPin.id, savedPin.pin.id)}
                          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        >
                          <Ionicons name="bookmark" size={20} color="#FF6B9D" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}
