import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Share,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/stores/auth';
import { HapticButton } from '../src/components/HapticButton';

interface Pin {
  id: string;
  latitude: number;
  longitude: number;
  description: string;
  image: string | null;
  likesCount: number;
  createdAt: string;
  createdBy: {
    id: string;
    name: string | null;
    image: string | null;
    profile?: {
      displayName: string | null;
      avatar: string | null;
      trustScore: number;
      trustLevel: string;
    };
  };
  isLiked: boolean;
  isSaved: boolean;
}

export default function PinDetailScreen() {
  const { id: pinId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  
  const [pin, setPin] = useState<Pin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchPin();
  }, [pinId]);

  const fetchPin = async () => {
    try {
      const data = await api.get<Pin>(`/api/pins/${pinId}`);
      setPin(data);
    } catch (error) {
      console.error('Error fetching pin:', error);
      Alert.alert('Error', 'Could not load pin details');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLiking(true);

    try {
      const response = await api.post<{ liked: boolean; likesCount: number }>(
        `/api/pins/${pinId}/like`,
        {}
      );
      setPin(prev => prev ? {
        ...prev,
        isLiked: response.liked,
        likesCount: response.likesCount,
      } : null);
      
      if (response.liked) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Error liking pin:', error);
    } finally {
      setIsLiking(false);
    }
  };

  const handleSave = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSaving(true);

    try {
      const response = await api.post<{ saved: boolean }>(
        `/api/saved-pins/${pinId}/toggle`,
        {}
      );
      setPin(prev => prev ? { ...prev, isSaved: response.saved } : null);
    } catch (error) {
      console.error('Error saving pin:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await Share.share({
        message: `Check out this missed connection on Map Mingle: "${pin?.description.substring(0, 100)}..."`,
        // url: `https://mapmingle.app/pin/${pinId}`, // Deep link
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const handleMessage = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create or get existing conversation
      const response = await api.post<{ conversation: { id: string } }>(
        '/api/conversations',
        { participantIds: [pin?.createdBy.id] }
      );
      router.push(`/chat/${response.conversation.id}`);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Alert.alert(
      'Report Pin',
      'Why are you reporting this pin?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Spam', onPress: () => submitReport('spam') },
        { text: 'Inappropriate', onPress: () => submitReport('inappropriate') },
        { text: 'Harassment', onPress: () => submitReport('harassment') },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      await api.post(`/api/safety/report/${pin?.createdBy.id}`, { reason });
      Alert.alert('Reported', 'Thank you for helping keep Map Mingle safe.');
    } catch (error) {
      console.error('Error reporting:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  if (!pin) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-8">
        <Ionicons name="alert-circle-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-500 mt-4 text-center">
          This pin could not be found or has been removed.
        </Text>
        <HapticButton
          variant="primary"
          className="mt-6"
          onPress={() => router.back()}
        >
          Go Back
        </HapticButton>
      </View>
    );
  }

  const isOwnPin = user?.id === pin.createdBy.id;

  return (
    <>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={handleReport} className="p-2">
              <Ionicons name="ellipsis-horizontal" size={24} color="#6B7280" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <ScrollView className="flex-1 bg-white">
        {/* Image */}
        {pin.image && (
          <Image
            source={{ uri: pin.image }}
            className="w-full h-64"
            resizeMode="cover"
          />
        )}

        {/* Content */}
        <View className="p-4">
          {/* User Info */}
          <TouchableOpacity
            onPress={() => {
              if (!isOwnPin) {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/profile/${pin.createdBy.id}`);
              }
            }}
            className="flex-row items-center mb-4"
            disabled={isOwnPin}
          >
            <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center mr-3">
              {pin.createdBy.profile?.avatar || pin.createdBy.image ? (
                <Image
                  source={{ uri: pin.createdBy.profile?.avatar || pin.createdBy.image! }}
                  className="w-12 h-12 rounded-full"
                />
              ) : (
                <Ionicons name="person" size={24} color="#9CA3AF" />
              )}
            </View>
            <View className="flex-1">
              <Text className="font-semibold text-gray-900">
                {pin.createdBy.profile?.displayName || pin.createdBy.name || 'Anonymous'}
              </Text>
              <Text className="text-gray-500 text-sm">
                {formatTimeAgo(pin.createdAt)}
              </Text>
            </View>
            {pin.createdBy.profile && (
              <View className="flex-row items-center bg-green-50 px-2 py-1 rounded-full">
                <Ionicons name="shield-checkmark" size={14} color="#10B981" />
                <Text className="text-green-700 text-xs ml-1">
                  {pin.createdBy.profile.trustScore}
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Description */}
          <Text className="text-gray-900 text-lg leading-relaxed mb-6">
            {pin.description}
          </Text>

          {/* Stats */}
          <View className="flex-row items-center mb-6 pb-6 border-b border-gray-100">
            <View className="flex-row items-center mr-6">
              <Ionicons name="heart" size={20} color="#FF6B9D" />
              <Text className="text-gray-700 ml-1 font-medium">
                {pin.likesCount} {pin.likesCount === 1 ? 'like' : 'likes'}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View className="flex-row space-x-3 mb-6">
            <TouchableOpacity
              onPress={handleLike}
              disabled={isLiking}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                pin.isLiked ? 'bg-primary-500' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={pin.isLiked ? 'heart' : 'heart-outline'}
                size={24}
                color={pin.isLiked ? 'white' : '#FF6B9D'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  pin.isLiked ? 'text-white' : 'text-gray-700'
                }`}
              >
                {pin.isLiked ? 'Liked' : 'Like'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSave}
              disabled={isSaving}
              className={`flex-1 flex-row items-center justify-center py-3 rounded-xl ${
                pin.isSaved ? 'bg-purple-500' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={pin.isSaved ? 'bookmark' : 'bookmark-outline'}
                size={24}
                color={pin.isSaved ? 'white' : '#9333EA'}
              />
              <Text
                className={`ml-2 font-semibold ${
                  pin.isSaved ? 'text-white' : 'text-gray-700'
                }`}
              >
                {pin.isSaved ? 'Saved' : 'Save'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleShare}
              className="w-12 h-12 rounded-xl bg-gray-100 items-center justify-center"
            >
              <Ionicons name="share-outline" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Is This You? Section */}
          {!isOwnPin && (
            <View className="bg-primary-50 rounded-2xl p-5">
              <View className="flex-row items-center mb-3">
                <Ionicons name="sparkles" size={24} color="#FF6B9D" />
                <Text className="text-primary-800 font-semibold text-lg ml-2">
                  Is this you?
                </Text>
              </View>
              <Text className="text-primary-700 mb-4">
                If you think this pin might be about you, send a message and find out!
              </Text>
              <HapticButton
                variant="primary"
                size="lg"
                onPress={handleMessage}
                leftIcon={<Ionicons name="chatbubble" size={20} color="white" />}
              >
                Send Message
              </HapticButton>
            </View>
          )}

          {/* Own Pin Actions */}
          {isOwnPin && (
            <View className="bg-gray-50 rounded-2xl p-4">
              <Text className="text-gray-500 text-center mb-3">
                This is your pin
              </Text>
              <HapticButton
                variant="danger"
                onPress={() => {
                  Alert.alert(
                    'Delete Pin',
                    'Are you sure you want to delete this pin?',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      {
                        text: 'Delete',
                        style: 'destructive',
                        onPress: async () => {
                          try {
                            await api.delete(`/api/pins/${pinId}`);
                            router.back();
                          } catch (error) {
                            console.error('Error deleting pin:', error);
                          }
                        },
                      },
                    ]
                  );
                }}
              >
                Delete Pin
              </HapticButton>
            </View>
          )}
        </View>
      </ScrollView>
    </>
  );
}
