import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';

interface ActivityItem {
  type: 'pin';
  id: string;
  description: string;
  image: string | null;
  likesCount: number;
  createdAt: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

interface NearbyStats {
  stats: {
    pinsToday: number;
    pinsLastHour: number;
    pinsFiveMin: number;
  };
  recentPins: Array<{
    id: string;
    description: string;
    image: string | null;
    createdAt: string;
    user: { name: string | null };
  }>;
  mysteryPin: {
    id: string;
    latitude: number;
    longitude: number;
    description: string;
    createdAt: string;
  } | null;
  justMissed: {
    count: number;
    message: string;
  } | null;
}

export default function ActivityScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const [feed, setFeed] = useState<ActivityItem[]>([]);
  const [nearbyStats, setNearbyStats] = useState<NearbyStats | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      
      const [feedData, statsData] = await Promise.all([
        api.get<ActivityItem[]>('/api/activity/feed'),
        api.get<NearbyStats>('/api/activity/nearby', {
          params: {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          },
        }),
      ]);
      
      setFeed(feedData);
      setNearbyStats(statsData);
    } catch (error) {
      console.error('Error fetching activity:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchData();
  };

  const handlePinPress = (pinId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/pin/${pinId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center mb-4">
          <Ionicons name="flash" size={24} color="#FF6B9D" />
        </View>
        <Text className="text-gray-500">Loading activity...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={onRefresh}
          tintColor="#FF6B9D"
        />
      }
    >
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4">
        <Text className="text-2xl font-bold text-gray-900">Activity</Text>
        <Text className="text-gray-500 mt-1">See what's happening nearby</Text>
      </View>

      {/* Just Missed Alert */}
      {nearbyStats?.justMissed && (
        <View className="mx-4 mt-4 bg-gradient-to-r from-primary-500 to-coral-500 rounded-2xl p-4">
          <View className="flex-row items-center">
            <View className="w-10 h-10 rounded-full bg-white/20 items-center justify-center mr-3">
              <Ionicons name="time" size={20} color="white" />
            </View>
            <View className="flex-1">
              <Text className="text-white font-semibold">Just Missed!</Text>
              <Text className="text-white/90 text-sm">
                {nearbyStats.justMissed.message}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Stats Cards */}
      {nearbyStats && (
        <View className="flex-row px-4 mt-4 space-x-3">
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-3xl font-bold text-primary-500">
              {nearbyStats.stats.pinsToday}
            </Text>
            <Text className="text-gray-500 text-sm">Pins today</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-3xl font-bold text-coral-500">
              {nearbyStats.stats.pinsLastHour}
            </Text>
            <Text className="text-gray-500 text-sm">Last hour</Text>
          </View>
          <View className="flex-1 bg-white rounded-xl p-4 shadow-sm">
            <Text className="text-3xl font-bold text-purple-500">
              {nearbyStats.stats.pinsFiveMin}
            </Text>
            <Text className="text-gray-500 text-sm">Just now</Text>
          </View>
        </View>
      )}

      {/* Mystery Pin Teaser */}
      {nearbyStats?.mysteryPin && (
        <TouchableOpacity
          onPress={() => handlePinPress(nearbyStats.mysteryPin!.id)}
          className="mx-4 mt-4 bg-purple-50 border border-purple-200 rounded-2xl p-4"
          activeOpacity={0.7}
        >
          <View className="flex-row items-center">
            <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Ionicons name="eye" size={24} color="#9333EA" />
            </View>
            <View className="flex-1">
              <Text className="text-purple-900 font-semibold">Someone's looking...</Text>
              <Text className="text-purple-600 text-sm mt-1" numberOfLines={1}>
                "{nearbyStats.mysteryPin.description}"
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9333EA" />
          </View>
        </TouchableOpacity>
      )}

      {/* Feed Section */}
      <View className="px-4 mt-6">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</Text>
        
        {feed.length === 0 ? (
          <View className="bg-white rounded-xl p-8 items-center">
            <Ionicons name="leaf-outline" size={48} color="#D1D5DB" />
            <Text className="text-gray-500 mt-4 text-center">
              No recent activity nearby.{'\n'}Be the first to drop a pin!
            </Text>
          </View>
        ) : (
          feed.map((item) => (
            <TouchableOpacity
              key={item.id}
              onPress={() => handlePinPress(item.id)}
              className="bg-white rounded-xl p-4 mb-3 shadow-sm"
              activeOpacity={0.7}
            >
              <View className="flex-row">
                {/* User Avatar */}
                <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                  {item.user.image ? (
                    <Image
                      source={{ uri: item.user.image }}
                      className="w-10 h-10 rounded-full"
                    />
                  ) : (
                    <Ionicons name="person" size={20} color="#9CA3AF" />
                  )}
                </View>

                {/* Content */}
                <View className="flex-1">
                  <View className="flex-row items-center">
                    <Text className="font-semibold text-gray-900">
                      {item.user.name || 'Anonymous'}
                    </Text>
                    <Text className="text-gray-400 text-sm ml-2">
                      {formatTimeAgo(item.createdAt)}
                    </Text>
                  </View>
                  <Text className="text-gray-600 mt-1" numberOfLines={2}>
                    {item.description}
                  </Text>

                  {/* Image Preview */}
                  {item.image && (
                    <Image
                      source={{ uri: item.image }}
                      className="w-full h-40 rounded-lg mt-2"
                      resizeMode="cover"
                    />
                  )}

                  {/* Stats */}
                  <View className="flex-row items-center mt-2">
                    <Ionicons name="heart" size={16} color="#FF6B9D" />
                    <Text className="text-gray-500 text-sm ml-1">
                      {item.likesCount} likes
                    </Text>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </View>

      {/* Bottom Padding */}
      <View className="h-24" />
    </ScrollView>
  );
}
