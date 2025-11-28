import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  Share,
  Linking,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  FadeIn,
  FadeInDown,
  SlideInUp,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { HapticButton, HapticIconButton } from '../../src/components/HapticButton';
import { useAuthStore } from '../../src/stores/auth';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Category configuration
const CATEGORY_CONFIG = {
  social: { icon: 'people', color: '#FF6B9D', gradient: ['#FF6B9D', '#FF8FB8'] },
  dating: { icon: 'heart', color: '#F43F5E', gradient: ['#F43F5E', '#FB7185'] },
  networking: { icon: 'briefcase', color: '#8B5CF6', gradient: ['#8B5CF6', '#A78BFA'] },
  activity: { icon: 'fitness', color: '#10B981', gradient: ['#10B981', '#34D399'] },
  other: { icon: 'ellipsis-horizontal', color: '#6B7280', gradient: ['#6B7280', '#9CA3AF'] },
} as const;

// RSVP status options
const RSVP_OPTIONS = [
  { status: 'going', label: 'Going', icon: 'checkmark-circle', color: '#10B981' },
  { status: 'interested', label: 'Interested', icon: 'star', color: '#F59E0B' },
  { status: 'not_going', label: 'Can\'t Go', icon: 'close-circle', color: '#EF4444' },
] as const;

interface EventDetail {
  id: string;
  title: string;
  description: string | null;
  category: keyof typeof CATEGORY_CONFIG;
  image: string | null;
  venueName: string;
  venueAddress: string | null;
  latitude: number;
  longitude: number;
  startTime: string;
  endTime: string | null;
  maxAttendees: number | null;
  host: {
    id: string;
    name: string | null;
    image: string | null;
  };
  attendees: Array<{
    id: string;
    name: string | null;
    image: string | null;
    status: string;
  }>;
  createdAt: string;
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRsvping, setIsRsvping] = useState(false);
  const [userRsvpStatus, setUserRsvpStatus] = useState<string | null>(null);
  const [showRsvpOptions, setShowRsvpOptions] = useState(false);
  const [showAllAttendees, setShowAllAttendees] = useState(false);

  // Animation values
  const headerScale = useSharedValue(1);
  const rsvpButtonScale = useSharedValue(1);

  const fetchEvent = useCallback(async () => {
    try {
      const data = await api.get<EventDetail>(`/api/events/${id}`);
      setEvent(data);

      // Check if current user has RSVP'd
      if (user) {
        const userAttendee = data.attendees.find((a) => a.id === user.id);
        setUserRsvpStatus(userAttendee?.status || null);
      }
    } catch (error) {
      console.error('Error fetching event:', error);
      Alert.alert('Error', 'Could not load event details');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [id, user]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvent();
  };

  const handleRsvp = async (status: string) => {
    if (!user) {
      Alert.alert('Sign In Required', 'Please sign in to RSVP to events.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    setIsRsvping(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post(`/api/events/${id}/rsvp`, { status });
      setUserRsvpStatus(status);
      setShowRsvpOptions(false);

      // Refresh event to get updated attendees
      await fetchEvent();

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to RSVP. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsRsvping(false);
    }
  };

  const handleShare = async () => {
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const startDate = new Date(event.startTime);
      const message = `Join me at "${event.title}"!\n\n📅 ${formatFullDate(startDate)}\n📍 ${event.venueName}\n\nCheck it out on Map Mingle!`;

      await Share.share({
        message,
        title: event.title,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const handleOpenMaps = () => {
    if (!event) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const scheme = Platform.select({
      ios: `maps:0,0?q=${event.venueName}@${event.latitude},${event.longitude}`,
      android: `geo:${event.latitude},${event.longitude}?q=${event.latitude},${event.longitude}(${event.venueName})`,
    });

    if (scheme) {
      Linking.openURL(scheme).catch(() => {
        // Fallback to Google Maps web
        Linking.openURL(
          `https://www.google.com/maps/search/?api=1&query=${event.latitude},${event.longitude}`
        );
      });
    }
  };

  const handleViewProfile = (userId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/profile/${userId}`);
  };

  // Format helpers
  const formatFullDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Tomorrow';
    if (diffDays < 7) return `In ${diffDays} days`;
    if (diffDays < 30) return `In ${Math.ceil(diffDays / 7)} weeks`;
    return formatFullDate(date);
  };

  const getAttendeesByStatus = (status: string) => {
    return event?.attendees.filter((a) => a.status === status) || [];
  };

  const goingCount = getAttendeesByStatus('going').length;
  const interestedCount = getAttendeesByStatus('interested').length;
  const spotsLeft = event?.maxAttendees ? event.maxAttendees - goingCount : null;
  const isFull = spotsLeft !== null && spotsLeft <= 0;
  const isHost = user?.id === event?.host.id;
  const isPast = event ? new Date(event.startTime) < new Date() : false;

  // RSVP button animation
  const rsvpButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rsvpButtonScale.value }],
  }));

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="calendar" size={48} color="#FF6B9D" />
        <Text className="text-gray-500 mt-4">Loading event...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View className="flex-1 bg-white items-center justify-center px-6">
        <Ionicons name="calendar-outline" size={64} color="#D1D5DB" />
        <Text className="text-gray-900 text-xl font-semibold mt-4">Event Not Found</Text>
        <Text className="text-gray-500 text-center mt-2">
          This event may have been removed or is no longer available.
        </Text>
        <HapticButton
          variant="primary"
          onPress={() => router.back()}
          className="mt-6"
        >
          Go Back
        </HapticButton>
      </View>
    );
  }

  const config = CATEGORY_CONFIG[event.category] || CATEGORY_CONFIG.other;

  return (
    <View className="flex-1 bg-white">
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerRight: () => (
            <HapticIconButton
              icon={<Ionicons name="share-outline" size={24} color="white" />}
              onPress={handleShare}
              className="mr-2"
            />
          ),
        }}
      />

      <ScrollView
        className="flex-1"
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor="#FF6B9D" />
        }
      >
        {/* Header Image */}
        <View className="relative">
          {event.image ? (
            <Image
              source={{ uri: event.image }}
              className="w-full h-64"
              resizeMode="cover"
            />
          ) : (
            <LinearGradient
              colors={config.gradient as [string, string]}
              className="w-full h-64 items-center justify-center"
            >
              <Ionicons name={config.icon as any} size={80} color="white" />
            </LinearGradient>
          )}

          {/* Gradient Overlay */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            className="absolute bottom-0 left-0 right-0 h-32"
          />

          {/* Category Badge */}
          <View
            className="absolute top-14 left-4 px-3 py-1.5 rounded-full flex-row items-center"
            style={{ backgroundColor: config.color }}
          >
            <Ionicons name={config.icon as any} size={14} color="white" />
            <Text className="text-white text-xs font-medium ml-1 capitalize">
              {event.category}
            </Text>
          </View>

          {/* Date Badge */}
          <View className="absolute bottom-4 left-4 bg-white/95 rounded-xl px-3 py-2">
            <Text className="text-gray-900 font-bold text-lg">
              {formatRelativeDate(event.startTime)}
            </Text>
            <Text className="text-gray-500 text-sm">{formatTime(event.startTime)}</Text>
          </View>

          {/* Status Badge (if full or past) */}
          {(isFull || isPast) && (
            <View
              className={`absolute bottom-4 right-4 px-3 py-1.5 rounded-full ${
                isPast ? 'bg-gray-500' : 'bg-red-500'
              }`}
            >
              <Text className="text-white font-medium text-sm">
                {isPast ? 'Past Event' : 'Full'}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View className="px-4 py-5">
          {/* Title */}
          <Animated.Text
            entering={FadeInDown.duration(300)}
            className="text-2xl font-bold text-gray-900"
          >
            {event.title}
          </Animated.Text>

          {/* Host */}
          <TouchableOpacity
            onPress={() => handleViewProfile(event.host.id)}
            className="flex-row items-center mt-3"
            activeOpacity={0.7}
          >
            <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center overflow-hidden">
              {event.host.image ? (
                <Image
                  source={{ uri: event.host.image }}
                  className="w-10 h-10 rounded-full"
                />
              ) : (
                <Ionicons name="person" size={18} color="#9CA3AF" />
              )}
            </View>
            <View className="ml-3">
              <Text className="text-gray-900 font-medium">
                {event.host.name || 'Anonymous'}
              </Text>
              <Text className="text-gray-500 text-sm">
                {isHost ? 'You\'re hosting' : 'Event host'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" className="ml-auto" />
          </TouchableOpacity>

          {/* Quick Stats */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(100)}
            className="flex-row mt-4 bg-gray-50 rounded-xl p-3"
          >
            <View className="flex-1 items-center border-r border-gray-200">
              <Ionicons name="people" size={24} color={config.color} />
              <Text className="text-gray-900 font-bold mt-1">{goingCount}</Text>
              <Text className="text-gray-500 text-xs">Going</Text>
            </View>
            <View className="flex-1 items-center border-r border-gray-200">
              <Ionicons name="star" size={24} color="#F59E0B" />
              <Text className="text-gray-900 font-bold mt-1">{interestedCount}</Text>
              <Text className="text-gray-500 text-xs">Interested</Text>
            </View>
            <View className="flex-1 items-center">
              <Ionicons name="ticket" size={24} color="#6B7280" />
              <Text className="text-gray-900 font-bold mt-1">
                {spotsLeft !== null ? (spotsLeft > 0 ? spotsLeft : 0) : '∞'}
              </Text>
              <Text className="text-gray-500 text-xs">Spots Left</Text>
            </View>
          </Animated.View>

          {/* Date & Time */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mt-5"
          >
            <Text className="text-gray-700 font-semibold text-lg mb-3">
              Date & Time
            </Text>
            <View className="bg-gray-50 rounded-xl p-4">
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Ionicons name="calendar" size={20} color="#FF6B9D" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-medium">
                    {formatFullDate(new Date(event.startTime))}
                  </Text>
                  <Text className="text-gray-500">
                    {formatTime(event.startTime)}
                    {event.endTime && ` - ${formatTime(event.endTime)}`}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>

          {/* Location */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(300)}
            className="mt-5"
          >
            <Text className="text-gray-700 font-semibold text-lg mb-3">
              Location
            </Text>
            <TouchableOpacity
              onPress={handleOpenMaps}
              className="bg-gray-50 rounded-xl p-4"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Ionicons name="location" size={20} color="#FF6B9D" />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-medium">{event.venueName}</Text>
                  {event.venueAddress && (
                    <Text className="text-gray-500">{event.venueAddress}</Text>
                  )}
                </View>
                <Ionicons name="navigate" size={20} color="#FF6B9D" />
              </View>
            </TouchableOpacity>
          </Animated.View>

          {/* Description */}
          {event.description && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(400)}
              className="mt-5"
            >
              <Text className="text-gray-700 font-semibold text-lg mb-3">
                About
              </Text>
              <Text className="text-gray-600 leading-6">{event.description}</Text>
            </Animated.View>
          )}

          {/* Attendees */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(500)}
            className="mt-5"
          >
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-gray-700 font-semibold text-lg">
                Going ({goingCount})
              </Text>
              {goingCount > 6 && (
                <TouchableOpacity
                  onPress={() => setShowAllAttendees(true)}
                  className="flex-row items-center"
                >
                  <Text className="text-primary-500 font-medium">See All</Text>
                  <Ionicons name="chevron-forward" size={16} color="#FF6B9D" />
                </TouchableOpacity>
              )}
            </View>

            {goingCount === 0 ? (
              <View className="bg-gray-50 rounded-xl p-6 items-center">
                <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                <Text className="text-gray-500 mt-2">No one has RSVP'd yet</Text>
                <Text className="text-gray-400 text-sm">Be the first to join!</Text>
              </View>
            ) : (
              <View className="flex-row flex-wrap gap-3">
                {getAttendeesByStatus('going')
                  .slice(0, 6)
                  .map((attendee, index) => (
                    <TouchableOpacity
                      key={attendee.id}
                      onPress={() => handleViewProfile(attendee.id)}
                      className="items-center"
                      activeOpacity={0.7}
                    >
                      <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-2 border-white">
                        {attendee.image ? (
                          <Image
                            source={{ uri: attendee.image }}
                            className="w-14 h-14 rounded-full"
                          />
                        ) : (
                          <Ionicons name="person" size={24} color="#9CA3AF" />
                        )}
                      </View>
                      <Text
                        className="text-gray-700 text-xs mt-1 text-center"
                        numberOfLines={1}
                        style={{ maxWidth: 60 }}
                      >
                        {attendee.name?.split(' ')[0] || 'User'}
                      </Text>
                    </TouchableOpacity>
                  ))}

                {goingCount > 6 && (
                  <TouchableOpacity
                    onPress={() => setShowAllAttendees(true)}
                    className="items-center"
                    activeOpacity={0.7}
                  >
                    <View className="w-14 h-14 rounded-full bg-gray-100 items-center justify-center border-2 border-white">
                      <Text className="text-gray-600 font-semibold">
                        +{goingCount - 6}
                      </Text>
                    </View>
                    <Text className="text-gray-500 text-xs mt-1">more</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </Animated.View>

          {/* Interested */}
          {interestedCount > 0 && (
            <Animated.View
              entering={FadeInDown.duration(300).delay(600)}
              className="mt-5"
            >
              <Text className="text-gray-700 font-semibold text-lg mb-3">
                Interested ({interestedCount})
              </Text>
              <View className="flex-row">
                {getAttendeesByStatus('interested')
                  .slice(0, 8)
                  .map((attendee, index) => (
                    <View
                      key={attendee.id}
                      className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center overflow-hidden border-2 border-white -ml-2"
                      style={{ zIndex: 8 - index, marginLeft: index === 0 ? 0 : -8 }}
                    >
                      {attendee.image ? (
                        <Image
                          source={{ uri: attendee.image }}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <Ionicons name="person" size={14} color="#9CA3AF" />
                      )}
                    </View>
                  ))}
                {interestedCount > 8 && (
                  <View className="h-8 px-2 rounded-full bg-gray-100 items-center justify-center -ml-2">
                    <Text className="text-gray-500 text-xs font-medium">
                      +{interestedCount - 8}
                    </Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}

          {/* Bottom spacing */}
          <View className="h-28" />
        </View>
      </ScrollView>

      {/* Bottom RSVP Bar */}
      {!isPast && (
        <Animated.View
          entering={SlideInUp.duration(300).delay(300)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8"
        >
          {showRsvpOptions ? (
            <View>
              <View className="flex-row items-center justify-between mb-3">
                <Text className="text-gray-700 font-medium">Choose your response</Text>
                <TouchableOpacity onPress={() => setShowRsvpOptions(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
              <View className="flex-row gap-2">
                {RSVP_OPTIONS.map((option) => {
                  const isSelected = userRsvpStatus === option.status;
                  return (
                    <TouchableOpacity
                      key={option.status}
                      onPress={() => handleRsvp(option.status)}
                      disabled={isRsvping}
                      className={`flex-1 py-3 rounded-xl flex-row items-center justify-center ${
                        isSelected ? 'border-2' : 'bg-gray-100'
                      }`}
                      style={isSelected ? { borderColor: option.color, backgroundColor: `${option.color}15` } : {}}
                      activeOpacity={0.7}
                    >
                      <Ionicons
                        name={option.icon as any}
                        size={18}
                        color={isSelected ? option.color : '#6B7280'}
                      />
                      <Text
                        className={`ml-1 font-medium ${
                          isSelected ? '' : 'text-gray-700'
                        }`}
                        style={isSelected ? { color: option.color } : {}}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ) : (
            <View className="flex-row items-center gap-3">
              {userRsvpStatus && (
                <View
                  className="px-4 py-3 rounded-xl flex-row items-center"
                  style={{
                    backgroundColor: `${RSVP_OPTIONS.find((o) => o.status === userRsvpStatus)?.color}15`,
                  }}
                >
                  <Ionicons
                    name={RSVP_OPTIONS.find((o) => o.status === userRsvpStatus)?.icon as any}
                    size={18}
                    color={RSVP_OPTIONS.find((o) => o.status === userRsvpStatus)?.color}
                  />
                  <Text
                    className="ml-2 font-medium"
                    style={{ color: RSVP_OPTIONS.find((o) => o.status === userRsvpStatus)?.color }}
                  >
                    {RSVP_OPTIONS.find((o) => o.status === userRsvpStatus)?.label}
                  </Text>
                </View>
              )}

              <View className="flex-1">
                <HapticButton
                  variant={userRsvpStatus ? 'secondary' : 'primary'}
                  size="lg"
                  onPress={() => {
                    if (isFull && userRsvpStatus !== 'going') {
                      Alert.alert('Event Full', 'This event has reached its capacity.');
                    } else {
                      setShowRsvpOptions(true);
                    }
                  }}
                  disabled={isFull && !userRsvpStatus}
                  leftIcon={
                    <Ionicons
                      name={userRsvpStatus ? 'create-outline' : 'hand-right-outline'}
                      size={20}
                      color={userRsvpStatus ? '#374151' : 'white'}
                    />
                  }
                >
                  {userRsvpStatus ? 'Change RSVP' : isFull ? 'Event Full' : 'RSVP'}
                </HapticButton>
              </View>
            </View>
          )}
        </Animated.View>
      )}
    </View>
  );
}

// Platform import for maps
import { Platform } from 'react-native';
