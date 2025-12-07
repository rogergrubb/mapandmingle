import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { api } from '../../src/lib/api';
import { HapticButton, HapticFAB } from '../../src/components/HapticButton';

interface Event {
  id: string;
  title: string;
  description: string;
  categories: string[]; // Changed to array
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
    userId: string;
    status: string;
  }>;
}

const CATEGORY_CONFIG = {
  social: { icon: 'people', color: '#FF6B9D', bg: 'bg-pink-50' },
  dating: { icon: 'heart', color: '#F43F5E', bg: 'bg-rose-50' },
  networking: { icon: 'briefcase', color: '#8B5CF6', bg: 'bg-purple-50' },
  activity: { icon: 'fitness', color: '#10B981', bg: 'bg-green-50' },
  other: { icon: 'ellipsis-horizontal', color: '#6B7280', bg: 'bg-gray-50' },
};

export default function EventsScreen() {
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);

  const fetchEvents = useCallback(async () => {
    try {
      if (!location) {
        const loc = await Location.getCurrentPositionAsync({});
        setLocation(loc);
      }

      const params: any = {
        latitude: location?.coords.latitude || 37.78825,
        longitude: location?.coords.longitude || -122.4324,
        radius: 50,
      };

      if (selectedCategory) {
        params.category = selectedCategory;
      }

      const data = await api.get<Event[]>('/api/events', { params });
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [location, selectedCategory]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchEvents();
  };

  const handleEventPress = (eventId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/event/${eventId}`);
  };

  const handleCreateEvent = () => {
    router.push('/create-event');
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === now.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) {
      return `Today at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    if (isTomorrow) {
      return `Tomorrow at ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const getAttendeeCount = (event: Event) => {
    return event.attendees.filter(a => a.status === 'going').length;
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="calendar" size={48} color="#FF6B9D" />
        <Text className="text-gray-500 mt-4">Loading events...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      <ScrollView
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
          <Text className="text-2xl font-bold text-gray-900">Events</Text>
          <Text className="text-gray-500 mt-1">Discover what's happening nearby</Text>
        </View>

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="px-4 py-3 bg-white"
        >
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setSelectedCategory(null);
            }}
            className={`px-4 py-2 rounded-full mr-2 ${
              selectedCategory === null ? 'bg-primary-500' : 'bg-gray-100'
            }`}
          >
            <Text className={selectedCategory === null ? 'text-white font-medium' : 'text-gray-700'}>
              All
            </Text>
          </TouchableOpacity>
          
          {Object.entries(CATEGORY_CONFIG).map(([key, config]) => (
            <TouchableOpacity
              key={key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(key);
              }}
              className={`flex-row items-center px-4 py-2 rounded-full mr-2 ${
                selectedCategory === key ? 'bg-primary-500' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={config.icon as any}
                size={16}
                color={selectedCategory === key ? 'white' : config.color}
              />
              <Text
                className={`ml-1 capitalize ${
                  selectedCategory === key ? 'text-white font-medium' : 'text-gray-700'
                }`}
              >
                {key}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Events List */}
        <View className="px-4 mt-4">
          {events.length === 0 ? (
            <View className="bg-white rounded-xl p-8 items-center">
              <Ionicons name="calendar-outline" size={48} color="#D1D5DB" />
              <Text className="text-gray-500 mt-4 text-center">
                No events found nearby.{'\n'}Why not create one?
              </Text>
              <HapticButton
                variant="primary"
                className="mt-4"
                onPress={handleCreateEvent}
              >
                Create Event
              </HapticButton>
            </View>
          ) : (
            events.map((event) => {
              const config = CATEGORY_CONFIG[event.categories[0] as keyof typeof CATEGORY_CONFIG] || CATEGORY_CONFIG.other;
              const attendeeCount = getAttendeeCount(event);

              return (
                <TouchableOpacity
                  key={event.id}
                  onPress={() => handleEventPress(event.id)}
                  className="bg-white rounded-xl mb-4 shadow-sm overflow-hidden"
                  activeOpacity={0.7}
                >
                  {/* Event Image */}
                  {event.image ? (
                    <Image
                      source={{ uri: event.image }}
                      className="w-full h-40"
                      resizeMode="cover"
                    />
                  ) : (
                    <View className={`w-full h-32 ${config.bg} items-center justify-center`}>
                      <Ionicons name={config.icon as any} size={48} color={config.color} />
                    </View>
                  )}

                  {/* Category Badges */}
                  <View className="absolute top-3 left-3 flex-row gap-2">
                    <View
                      className="px-3 py-1 rounded-full flex-row items-center"
                      style={{ backgroundColor: config.color }}
                    >
                      <Ionicons name={config.icon as any} size={14} color="white" />
                      <Text className="text-white text-xs font-medium ml-1 capitalize">
                        {event.categories[0]}
                      </Text>
                    </View>
                    {event.categories.length > 1 && (
                      <View className="px-2 py-1 rounded-full bg-gray-700">
                        <Text className="text-white text-xs font-medium">
                          +{event.categories.length - 1}
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Content */}
                  <View className="p-4">
                    <Text className="text-lg font-semibold text-gray-900">
                      {event.title}
                    </Text>
                    
                    <Text className="text-gray-500 mt-1" numberOfLines={2}>
                      {event.description}
                    </Text>

                    {/* Details */}
                    <View className="mt-3 space-y-2">
                      <View className="flex-row items-center">
                        <Ionicons name="time-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-2 text-sm">
                          {formatDate(event.startTime)}
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <Ionicons name="location-outline" size={16} color="#6B7280" />
                        <Text className="text-gray-600 ml-2 text-sm" numberOfLines={1}>
                          {event.venueName}
                        </Text>
                      </View>

                      <View className="flex-row items-center justify-between">
                        <View className="flex-row items-center">
                          <Ionicons name="people-outline" size={16} color="#6B7280" />
                          <Text className="text-gray-600 ml-2 text-sm">
                            {attendeeCount} going
                            {event.maxAttendees && ` · ${event.maxAttendees - attendeeCount} spots left`}
                          </Text>
                        </View>

                        {/* Host Avatar */}
                        <View className="flex-row items-center">
                          <Text className="text-gray-400 text-xs mr-2">by</Text>
                          <View className="w-6 h-6 rounded-full bg-gray-200 items-center justify-center">
                            {event.host.image ? (
                              <Image
                                source={{ uri: event.host.image }}
                                className="w-6 h-6 rounded-full"
                              />
                            ) : (
                              <Ionicons name="person" size={12} color="#9CA3AF" />
                            )}
                          </View>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </View>

        {/* Bottom Padding */}
        <View className="h-32" />
      </ScrollView>

      {/* Create Event FAB */}
      <View className="absolute bottom-24 right-4">
        <HapticFAB
          icon={<Ionicons name="add" size={28} color="white" />}
          onPress={handleCreateEvent}
        />
      </View>
    </View>
  );
}
