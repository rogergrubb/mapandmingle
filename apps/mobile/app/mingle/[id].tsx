import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  Animated,
  Alert,
  Share,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import MapView, { Marker } from 'react-native-maps';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';

const { width, height } = Dimensions.get('window');

interface Participant {
  id: string;
  displayName: string;
  avatar?: string;
  isHost: boolean;
}

interface Mingle {
  id: string;
  activityType: string;
  customActivity?: string;
  description?: string;
  startTime: string;
  duration: number;
  maxParticipants: number;
  participants: Participant[];
  latitude: number;
  longitude: number;
  locationName?: string;
  host: {
    id: string;
    displayName: string;
    avatar?: string;
    trustScore: number;
  };
  status: 'upcoming' | 'active' | 'ended';
  createdAt: string;
}

// Activity type config
const activityConfig: Record<string, { icon: keyof typeof Ionicons.glyphMap; color: string; label: string }> = {
  coffee: { icon: 'cafe', color: '#8B4513', label: 'Coffee' },
  lunch: { icon: 'restaurant', color: '#F97316', label: 'Lunch' },
  drinks: { icon: 'beer', color: '#F59E0B', label: 'Drinks' },
  walk: { icon: 'walk', color: '#22C55E', label: 'Walk' },
  workout: { icon: 'fitness', color: '#EF4444', label: 'Workout' },
  study: { icon: 'book', color: '#3B82F6', label: 'Study' },
  cowork: { icon: 'laptop', color: '#8B5CF6', label: 'Cowork' },
  explore: { icon: 'compass', color: '#06B6D4', label: 'Explore' },
  games: { icon: 'game-controller', color: '#EC4899', label: 'Games' },
  custom: { icon: 'sparkles', color: '#FF6B9D', label: 'Activity' },
};

export default function MingleDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [mingle, setMingle] = useState<Mingle | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const joinButtonScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    fetchMingleDetails();
  }, [id]);

  useEffect(() => {
    if (mingle) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();

      // Check if user has already joined
      setHasJoined(mingle.participants.some((p) => p.id === user?.id));
    }
  }, [mingle, user]);

  const fetchMingleDetails = async () => {
    try {
      const response = await api.get<Mingle>(`/api/mingles/${id}`);
      setMingle(response);
    } catch (error) {
      console.error('Error fetching mingle:', error);
      Alert.alert('Error', 'Unable to load mingle details');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Button animation
    Animated.sequence([
      Animated.timing(joinButtonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(joinButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    setIsJoining(true);

    try {
      await api.post(`/api/mingles/${id}/join`);
      setHasJoined(true);
      
      // Refresh mingle data
      fetchMingleDetails();
      
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Unable to Join', error.message || 'Please try again later');
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    Alert.alert(
      'Leave Mingle?',
      'Are you sure you want to leave this activity?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post(`/api/mingles/${id}/leave`);
              setHasJoined(false);
              fetchMingleDetails();
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Unable to leave mingle');
            }
          },
        },
      ]
    );
  };

  const handleShare = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      await Share.share({
        message: `Join me for ${mingle?.activityType || 'an activity'} on Map Mingle!`,
        url: `https://mapmingle.app/mingle/${id}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/mingle-${id}`);
  };

  const handleViewHost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${mingle?.host.id}`);
  };

  // Format time
  const formatTime = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = date.getTime() - now.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 0) return 'Started';
    if (diffMins < 60) return `Starts in ${diffMins}m`;
    if (diffMins < 1440) return `Starts in ${Math.floor(diffMins / 60)}h`;
    return date.toLocaleDateString();
  };

  // Format duration
  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes} min`;
    if (minutes === 60) return '1 hour';
    return `${(minutes / 60).toFixed(1)} hours`;
  };

  if (isLoading || !mingle) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Animated.View
          style={{
            opacity: fadeAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.5, 1],
            }),
          }}
        >
          <Ionicons name="people" size={48} color="#D1D5DB" />
        </Animated.View>
      </View>
    );
  }

  const activity = activityConfig[mingle.activityType] || activityConfig.custom;
  const spotsLeft = mingle.maxParticipants - mingle.participants.length;
  const isHost = mingle.host.id === user?.id;

  return (
    <View className="flex-1 bg-white">
      {/* Map Header */}
      <View className="h-48 relative">
        <MapView
          style={{ flex: 1 }}
          initialRegion={{
            latitude: mingle.latitude,
            longitude: mingle.longitude,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
          }}
          scrollEnabled={false}
          zoomEnabled={false}
        >
          <Marker
            coordinate={{
              latitude: mingle.latitude,
              longitude: mingle.longitude,
            }}
          >
            <View
              className="w-12 h-12 rounded-full items-center justify-center"
              style={{ backgroundColor: activity.color }}
            >
              <Ionicons name={activity.icon} size={24} color="white" />
            </View>
          </Marker>
        </MapView>

        {/* Back Button */}
        <TouchableOpacity
          onPress={() => router.back()}
          className="absolute top-12 left-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md"
        >
          <Ionicons name="chevron-back" size={24} color="#1F2937" />
        </TouchableOpacity>

        {/* Share Button */}
        <TouchableOpacity
          onPress={handleShare}
          className="absolute top-12 right-4 w-10 h-10 rounded-full bg-white/90 items-center justify-center shadow-md"
        >
          <Ionicons name="share-outline" size={22} color="#1F2937" />
        </TouchableOpacity>

        {/* Status Badge */}
        <View className="absolute bottom-4 left-4">
          <View
            className={`px-3 py-1 rounded-full ${
              mingle.status === 'active' ? 'bg-green-500' : 'bg-orange-500'
            }`}
          >
            <Text className="text-white text-sm font-semibold">
              {mingle.status === 'active' ? '🔴 Live Now' : formatTime(mingle.startTime)}
            </Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <Animated.ScrollView
        style={{
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        }}
        className="flex-1"
        showsVerticalScrollIndicator={false}
      >
        {/* Activity Info */}
        <View className="p-4">
          <View className="flex-row items-center mb-2">
            <View
              className="w-12 h-12 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${activity.color}20` }}
            >
              <Ionicons name={activity.icon} size={24} color={activity.color} />
            </View>
            <View className="flex-1">
              <Text className="text-2xl font-bold text-gray-900">
                {mingle.customActivity || activity.label}
              </Text>
              {mingle.locationName && (
                <Text className="text-gray-500">{mingle.locationName}</Text>
              )}
            </View>
          </View>

          {mingle.description && (
            <Text className="text-gray-600 mt-2">{mingle.description}</Text>
          )}

          {/* Quick Info */}
          <View className="flex-row mt-4 space-x-4">
            <View className="flex-row items-center">
              <Ionicons name="time" size={18} color="#9CA3AF" />
              <Text className="text-gray-600 ml-1">{formatDuration(mingle.duration)}</Text>
            </View>
            <View className="flex-row items-center">
              <Ionicons name="people" size={18} color="#9CA3AF" />
              <Text className="text-gray-600 ml-1">
                {spotsLeft} spot{spotsLeft !== 1 ? 's' : ''} left
              </Text>
            </View>
          </View>
        </View>

        {/* Host Card */}
        <TouchableOpacity
          onPress={handleViewHost}
          className="mx-4 p-4 bg-gray-50 rounded-2xl flex-row items-center"
        >
          {mingle.host.avatar ? (
            <Image
              source={{ uri: mingle.host.avatar }}
              className="w-12 h-12 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-lg font-bold text-primary-500">
                {mingle.host.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <View className="flex-1 ml-3">
            <Text className="font-semibold text-gray-900">
              {mingle.host.displayName}
            </Text>
            <View className="flex-row items-center">
              <Text className="text-sm text-gray-500">Host</Text>
              <View className="flex-row items-center ml-2">
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text className="text-xs text-gray-500 ml-0.5">
                  {mingle.host.trustScore}
                </Text>
              </View>
            </View>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
        </TouchableOpacity>

        {/* Participants */}
        <View className="p-4">
          <Text className="text-lg font-bold text-gray-900 mb-3">
            Who's Coming ({mingle.participants.length}/{mingle.maxParticipants})
          </Text>
          
          <View className="flex-row flex-wrap">
            {mingle.participants.map((participant) => (
              <TouchableOpacity
                key={participant.id}
                onPress={() => router.push(`/profile/${participant.id}`)}
                className="items-center mr-4 mb-3"
              >
                {participant.avatar ? (
                  <Image
                    source={{ uri: participant.avatar }}
                    className="w-14 h-14 rounded-full bg-gray-200"
                  />
                ) : (
                  <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
                    <Text className="text-lg font-bold text-primary-500">
                      {participant.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
                <Text className="text-xs text-gray-600 mt-1 max-w-14 text-center" numberOfLines={1}>
                  {participant.displayName}
                </Text>
                {participant.isHost && (
                  <View className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-0.5">
                    <Ionicons name="star" size={10} color="white" />
                  </View>
                )}
              </TouchableOpacity>
            ))}

            {/* Empty Spots */}
            {Array.from({ length: spotsLeft }).map((_, index) => (
              <View key={`empty-${index}`} className="items-center mr-4 mb-3">
                <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center border-2 border-dashed border-gray-300">
                  <Ionicons name="add" size={20} color="#9CA3AF" />
                </View>
                <Text className="text-xs text-gray-400 mt-1">Open</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Safety Note */}
        <View className="mx-4 mb-4 p-3 bg-blue-50 rounded-xl flex-row items-start">
          <Ionicons name="shield-checkmark" size={20} color="#3B82F6" />
          <View className="flex-1 ml-2">
            <Text className="text-sm text-blue-800 font-medium">
              Safety First
            </Text>
            <Text className="text-xs text-blue-600 mt-0.5">
              Meet in public places. Share your location with friends.
            </Text>
          </View>
        </View>

        <View className="h-32" />
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      <BlurView
        intensity={90}
        className="absolute bottom-0 left-0 right-0 px-4 py-4 pb-8"
      >
        <View className="flex-row items-center">
          {/* Chat Button */}
          {hasJoined && (
            <TouchableOpacity
              onPress={handleChat}
              className="w-12 h-12 rounded-full bg-gray-100 items-center justify-center mr-3"
            >
              <Ionicons name="chatbubble" size={22} color="#4B5563" />
            </TouchableOpacity>
          )}

          {/* Join/Leave Button */}
          <Animated.View
            style={{
              flex: 1,
              transform: [{ scale: joinButtonScale }],
            }}
          >
            {isHost ? (
              <TouchableOpacity
                className="py-4 rounded-xl bg-gray-200 items-center justify-center"
                disabled
              >
                <Text className="text-gray-600 font-semibold">You're the Host</Text>
              </TouchableOpacity>
            ) : hasJoined ? (
              <TouchableOpacity
                onPress={handleLeave}
                className="py-4 rounded-xl bg-gray-100 items-center justify-center"
              >
                <Text className="text-gray-600 font-semibold">Leave Mingle</Text>
              </TouchableOpacity>
            ) : spotsLeft > 0 ? (
              <TouchableOpacity onPress={handleJoin} disabled={isJoining}>
                <LinearGradient
                  colors={['#FF6B9D', '#FF8FB1']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  className="py-4 rounded-xl items-center justify-center"
                >
                  <Text className="text-white font-bold text-lg">
                    {isJoining ? 'Joining...' : 'Join Mingle'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                className="py-4 rounded-xl bg-gray-200 items-center justify-center"
                disabled
              >
                <Text className="text-gray-500 font-semibold">Mingle is Full</Text>
              </TouchableOpacity>
            )}
          </Animated.View>
        </View>
      </BlurView>
    </View>
  );
}
