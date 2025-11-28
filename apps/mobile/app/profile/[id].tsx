import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  interpolate,
  Extrapolation,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { HapticButton, HapticIconButton } from '../../src/components/HapticButton';
import { useAuthStore } from '../../src/stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 280;

interface UserProfile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  profile: {
    handle: string | null;
    displayName: string | null;
    bio: string | null;
    avatar: string | null;
    age: number | null;
    gender: string | null;
    interests: string | null;
    lookingFor: string | null;
    chatReadiness: string | null;
    activityIntent: string | null;
    activityIntentActive: boolean;
    trustScore: number;
    trustLevel: string;
    pinsCreated: number;
    likesReceived: number;
    eventsAttended: number;
    lastActiveAt: string | null;
    subscriptionStatus: string;
  } | null;
}

interface UserPin {
  id: string;
  description: string;
  image: string | null;
  likesCount: number;
  createdAt: string;
}

// Chat readiness display config
const CHAT_READINESS = {
  open_to_chat: { label: 'Open to Chat', color: '#10B981', icon: 'chatbubble' },
  open_to_meet: { label: 'Open to Meet', color: '#8B5CF6', icon: 'cafe' },
  browsing_only: { label: 'Browsing', color: '#6B7280', icon: 'eye' },
  busy: { label: 'Busy', color: '#EF4444', icon: 'moon' },
} as const;

// Trust level display config
const TRUST_LEVELS = {
  new: { label: 'New', color: '#9CA3AF', icon: 'person' },
  trusted: { label: 'Trusted', color: '#10B981', icon: 'shield-checkmark' },
  verified: { label: 'Verified', color: '#3B82F6', icon: 'checkmark-circle' },
  vip: { label: 'VIP', color: '#F59E0B', icon: 'star' },
  flagged: { label: 'Under Review', color: '#EF4444', icon: 'warning' },
  restricted: { label: 'Restricted', color: '#EF4444', icon: 'ban' },
} as const;

export default function ViewProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuthStore();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [pins, setPins] = useState<UserPin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [hasConversation, setHasConversation] = useState(false);

  // Animation
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => ({
    transform: [
      {
        translateY: interpolate(
          scrollY.value,
          [-100, 0, HEADER_HEIGHT],
          [50, 0, -HEADER_HEIGHT / 2],
          Extrapolation.CLAMP
        ),
      },
      {
        scale: interpolate(
          scrollY.value,
          [-100, 0],
          [1.2, 1],
          Extrapolation.CLAMP
        ),
      },
    ],
  }));

  const fetchProfile = useCallback(async () => {
    try {
      const data = await api.get<UserProfile>(`/api/profile/${id}`);
      setProfile(data);

      // Fetch user's pins
      const pinsData = await api.get<UserPin[]>(`/api/pins/user/${id}`);
      setPins(pinsData);
    } catch (error: any) {
      if (error.status === 404) {
        Alert.alert('Not Found', 'This user does not exist.');
        router.back();
      } else if (error.status === 403) {
        setIsBlocked(true);
      } else {
        console.error('Error fetching profile:', error);
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchProfile();
  };

  const handleMessage = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    try {
      // Create or get existing conversation
      const conversation = await api.post<{ id: string }>('/api/conversations', {
        participantId: id,
      });
      router.push(`/chat/${conversation.id}`);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Could not start conversation');
    }
  };

  const handleBlock = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    Alert.alert(
      'Block User',
      `Are you sure you want to block ${profile?.profile?.displayName || profile?.name || 'this user'}? They won't be able to see your profile or message you.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Block',
          style: 'destructive',
          onPress: async () => {
            try {
              await api.post('/api/safety/block', { blockedUserId: id });
              Alert.alert('Blocked', 'User has been blocked.');
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Could not block user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleReport = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Alert.alert(
      'Report User',
      'Why are you reporting this user?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Spam',
          onPress: () => submitReport('spam'),
        },
        {
          text: 'Harassment',
          onPress: () => submitReport('harassment'),
        },
        {
          text: 'Inappropriate Content',
          onPress: () => submitReport('inappropriate'),
        },
        {
          text: 'Fake Profile',
          onPress: () => submitReport('fake'),
        },
      ]
    );
  };

  const submitReport = async (reason: string) => {
    try {
      await api.post('/api/safety/report', {
        reportedUserId: id,
        reason,
      });
      Alert.alert('Reported', 'Thank you for your report. We will review it shortly.');
    } catch (error) {
      Alert.alert('Error', 'Could not submit report. Please try again.');
    }
  };

  const handleViewPin = (pinId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/pin/${pinId}`);
  };

  // Parse interests JSON
  const getInterests = (): string[] => {
    if (!profile?.profile?.interests) return [];
    try {
      return JSON.parse(profile.profile.interests);
    } catch {
      return [];
    }
  };

  const formatLastActive = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 5) return 'Online now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return 'Over a week ago';
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="person" size={48} color="#FF6B9D" />
        <Text className="text-gray-500 mt-4">Loading profile...</Text>
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="eye-off" size={64} color="#D1D5DB" />
        <Text className="text-gray-900 text-xl font-semibold mt-4">Profile Hidden</Text>
        <Text className="text-gray-500 text-center mt-2">
          This profile is not available to view.
        </Text>
        <HapticButton variant="primary" onPress={() => router.back()} className="mt-6">
          Go Back
        </HapticButton>
      </View>
    );
  }

  if (!profile) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="person-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-900 text-xl font-semibold mt-4">User Not Found</Text>
        <Text className="text-gray-500 text-center mt-2">
          This user may have deleted their account.
        </Text>
        <HapticButton variant="primary" onPress={() => router.back()} className="mt-6">
          Go Back
        </HapticButton>
      </View>
    );
  }

  const displayName = profile.profile?.displayName || profile.name || 'Anonymous';
  const avatar = profile.profile?.avatar || profile.image;
  const chatReadiness = profile.profile?.chatReadiness as keyof typeof CHAT_READINESS || 'browsing_only';
  const trustLevel = profile.profile?.trustLevel as keyof typeof TRUST_LEVELS || 'new';
  const isPremium = profile.profile?.subscriptionStatus === 'active';
  const isOwnProfile = currentUser?.id === id;
  const interests = getInterests();

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerRight: () => (
            !isOwnProfile && (
              <HapticIconButton
                icon={<Ionicons name="ellipsis-horizontal" size={24} color="white" />}
                onPress={() => {
                  Alert.alert(
                    'Options',
                    '',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Report User', onPress: handleReport },
                      { text: 'Block User', style: 'destructive', onPress: handleBlock },
                    ]
                  );
                }}
              />
            )
          ),
        }}
      />

      <Animated.ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FF6B9D" />
        }
      >
        {/* Header */}
        <Animated.View style={[{ height: HEADER_HEIGHT }, headerStyle]}>
          <LinearGradient
            colors={['#FF6B9D', '#C084FC']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            className="flex-1"
          />
        </Animated.View>

        {/* Profile Card */}
        <View className="bg-white -mt-20 rounded-t-3xl">
          {/* Avatar */}
          <View className="items-center -mt-16">
            <View className="relative">
              <View className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-xl items-center justify-center overflow-hidden">
                {avatar ? (
                  <Image source={{ uri: avatar }} className="w-32 h-32 rounded-full" />
                ) : (
                  <Ionicons name="person" size={56} color="#9CA3AF" />
                )}
              </View>

              {/* Online/Activity Status */}
              <View
                className="absolute bottom-2 right-2 w-6 h-6 rounded-full border-2 border-white items-center justify-center"
                style={{ backgroundColor: CHAT_READINESS[chatReadiness].color }}
              >
                <Ionicons
                  name={CHAT_READINESS[chatReadiness].icon as any}
                  size={12}
                  color="white"
                />
              </View>
            </View>

            {/* Premium Badge */}
            {isPremium && (
              <View className="bg-purple-500 px-3 py-1 rounded-full flex-row items-center mt-2">
                <Ionicons name="star" size={12} color="white" />
                <Text className="text-white text-xs font-bold ml-1">PREMIUM</Text>
              </View>
            )}
          </View>

          {/* Name & Handle */}
          <View className="items-center mt-3 px-6">
            <Text className="text-2xl font-bold text-gray-900">{displayName}</Text>
            {profile.profile?.handle && (
              <Text className="text-gray-500">@{profile.profile.handle}</Text>
            )}
          </View>

          {/* Status & Trust */}
          <View className="flex-row items-center justify-center mt-3 space-x-3 px-6">
            {/* Chat Readiness */}
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${CHAT_READINESS[chatReadiness].color}20` }}
            >
              <Ionicons
                name={CHAT_READINESS[chatReadiness].icon as any}
                size={14}
                color={CHAT_READINESS[chatReadiness].color}
              />
              <Text
                className="ml-1 text-sm font-medium"
                style={{ color: CHAT_READINESS[chatReadiness].color }}
              >
                {CHAT_READINESS[chatReadiness].label}
              </Text>
            </View>

            {/* Trust Level */}
            <View
              className="flex-row items-center px-3 py-1.5 rounded-full"
              style={{ backgroundColor: `${TRUST_LEVELS[trustLevel].color}20` }}
            >
              <Ionicons
                name={TRUST_LEVELS[trustLevel].icon as any}
                size={14}
                color={TRUST_LEVELS[trustLevel].color}
              />
              <Text
                className="ml-1 text-sm font-medium"
                style={{ color: TRUST_LEVELS[trustLevel].color }}
              >
                {profile.profile?.trustScore || 50}
              </Text>
            </View>
          </View>

          {/* Last Active */}
          <Text className="text-gray-400 text-sm text-center mt-2">
            {formatLastActive(profile.profile?.lastActiveAt || null)}
          </Text>

          {/* Bio */}
          {profile.profile?.bio && (
            <Animated.View entering={FadeInDown.duration(300).delay(100)} className="px-6 mt-4">
              <Text className="text-gray-600 text-center leading-6">
                {profile.profile.bio}
              </Text>
            </Animated.View>
          )}

          {/* Activity Intent Badge */}
          {profile.profile?.activityIntentActive && profile.profile?.activityIntent && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(150)}
              className="mx-6 mt-4 bg-primary-50 rounded-xl p-3 flex-row items-center"
            >
              <View className="w-10 h-10 rounded-full bg-primary-500 items-center justify-center">
                <Ionicons name="sparkles" size={20} color="white" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-primary-800 font-medium">Looking to connect</Text>
                <Text className="text-primary-600 text-sm">{profile.profile.activityIntent}</Text>
              </View>
            </Animated.View>
          )}

          {/* Stats */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="flex-row mx-6 mt-6 bg-gray-50 rounded-xl p-4"
          >
            <View className="flex-1 items-center">
              <Text className="text-2xl font-bold text-gray-900">
                {profile.profile?.pinsCreated || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Pins</Text>
            </View>
            <View className="flex-1 items-center border-l border-gray-200">
              <Text className="text-2xl font-bold text-gray-900">
                {profile.profile?.likesReceived || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Likes</Text>
            </View>
            <View className="flex-1 items-center border-l border-gray-200">
              <Text className="text-2xl font-bold text-gray-900">
                {profile.profile?.eventsAttended || 0}
              </Text>
              <Text className="text-gray-500 text-sm">Events</Text>
            </View>
          </Animated.View>

          {/* Interests */}
          {interests.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(250)}
              className="px-6 mt-6"
            >
              <Text className="text-gray-700 font-semibold text-lg mb-3">Interests</Text>
              <View className="flex-row flex-wrap gap-2">
                {interests.map((interest, index) => (
                  <View
                    key={index}
                    className="bg-gray-100 px-3 py-1.5 rounded-full"
                  >
                    <Text className="text-gray-700 text-sm">{interest}</Text>
                  </View>
                ))}
              </View>
            </Animated.View>
          )}

          {/* Looking For */}
          {profile.profile?.lookingFor && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(300)}
              className="px-6 mt-6"
            >
              <Text className="text-gray-700 font-semibold text-lg mb-2">Looking For</Text>
              <Text className="text-gray-600">{profile.profile.lookingFor}</Text>
            </Animated.View>
          )}

          {/* User's Pins */}
          {pins.length > 0 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(350)}
              className="px-6 mt-6"
            >
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 font-semibold text-lg">Recent Pins</Text>
                <TouchableOpacity>
                  <Text className="text-primary-500 font-medium">See All</Text>
                </TouchableOpacity>
              </View>

              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                className="-mx-6 px-6"
              >
                {pins.slice(0, 5).map((pin) => (
                  <TouchableOpacity
                    key={pin.id}
                    onPress={() => handleViewPin(pin.id)}
                    className="bg-gray-50 rounded-xl mr-3 w-64 overflow-hidden"
                    activeOpacity={0.7}
                  >
                    {pin.image && (
                      <Image
                        source={{ uri: pin.image }}
                        className="w-full h-32"
                        resizeMode="cover"
                      />
                    )}
                    <View className="p-3">
                      <Text className="text-gray-900" numberOfLines={2}>
                        {pin.description}
                      </Text>
                      <View className="flex-row items-center mt-2">
                        <Ionicons name="heart" size={14} color="#FF6B9D" />
                        <Text className="text-gray-500 text-sm ml-1">{pin.likesCount}</Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </Animated.View>
          )}

          {/* Demographics */}
          {(profile.profile?.age || profile.profile?.gender) && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(400)}
              className="px-6 mt-6"
            >
              <Text className="text-gray-700 font-semibold text-lg mb-3">About</Text>
              <View className="flex-row flex-wrap gap-2">
                {profile.profile.age && (
                  <View className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center">
                    <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-700 text-sm ml-1">{profile.profile.age} years old</Text>
                  </View>
                )}
                {profile.profile.gender && (
                  <View className="bg-gray-100 px-3 py-1.5 rounded-full flex-row items-center">
                    <Ionicons name="person-outline" size={14} color="#6B7280" />
                    <Text className="text-gray-700 text-sm ml-1 capitalize">
                      {profile.profile.gender.replace('_', ' ')}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Bottom spacing */}
          <View className="h-32" />
        </View>
      </Animated.ScrollView>

      {/* Bottom Action Bar */}
      {!isOwnProfile && (
        <Animated.View
          entering={FadeIn.duration(300).delay(500)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8"
        >
          <View className="flex-row gap-3">
            {/* Wave/Poke Button */}
            <HapticButton
              variant="secondary"
              onPress={() => {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                Alert.alert('Wave Sent! 👋', `${displayName} will be notified.`);
              }}
              className="flex-1"
              leftIcon={<Text style={{ fontSize: 18 }}>👋</Text>}
            >
              Wave
            </HapticButton>

            {/* Message Button */}
            <HapticButton
              variant="primary"
              onPress={handleMessage}
              className="flex-1"
              leftIcon={<Ionicons name="chatbubble" size={18} color="white" />}
            >
              Message
            </HapticButton>
          </View>
        </Animated.View>
      )}
    </View>
  );
}
