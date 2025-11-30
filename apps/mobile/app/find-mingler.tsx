import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  FlatList,
  Modal,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker } from 'react-native-maps';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';

interface MingleResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  tags: string[];
  privacy: string;
  startTime: string;
  maxParticipants: string;
  participantCount: number;
  distance: number;
  photoUrl?: string;
  host: {
    id: string;
    name: string;
    image?: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  };
}

export default function FindMinglerScreen() {
  const router = useRouter();
  const { user, userLocation } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState('50');
  const [sortBy, setSortBy] = useState<'distance' | 'recent' | 'popular'>('distance');
  const [showMap, setShowMap] = useState(false);
  const [results, setResults] = useState<MingleResult[]>([]);
  const [selectedMingle, setSelectedMingle] = useState<MingleResult | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const allTags = [
    'coffee', 'gaming', 'sports', 'music', 'art', 'hiking', 'movies',
    'cooking', 'reading', 'yoga', 'fitness', 'tech', 'business', 'travel',
  ];

  const searchMingles = async () => {
    if (!userLocation) {
      Alert.alert('Location Required', 'Please enable location services');
      return;
    }

    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        latitude: userLocation.latitude.toString(),
        longitude: userLocation.longitude.toString(),
        radius: radiusKm,
        sort: sortBy,
      });

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      if (searchQuery.trim()) {
        params.append('q', searchQuery);
      }

      const response = await api.get(`/api/mingles/search?${params.toString()}`);
      setResults(response);
    } catch (error: any) {
      Alert.alert('Search Failed', error.message || 'Could not search mingles');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMessageHost = (mingler: MingleResult) => {
    // Navigate to create/open conversation
    router.push({
      pathname: '/chat/[id]',
      params: { id: mingler.host.id, name: mingler.host.displayName || mingler.host.name },
    });
  };

  useEffect(() => {
    searchMingles();
  }, []);

  if (showMap && results.length > 0) {
    return (
      <View className="flex-1">
        <MapView
          className="flex-1"
          initialRegion={{
            latitude: userLocation?.latitude || 37.7749,
            longitude: userLocation?.longitude || -122.4194,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
        >
          {results.map((mingle) => (
            <Marker
              key={mingle.id}
              coordinate={{
                latitude: mingle.latitude,
                longitude: mingle.longitude,
              }}
              onPress={() => {
                setSelectedMingle(mingle);
                setShowDetailModal(true);
              }}
            >
              <View className="bg-orange-500 rounded-full p-2">
                <Ionicons name="flame" size={20} color="white" />
              </View>
            </Marker>
          ))}
        </MapView>

        <TouchableOpacity
          onPress={() => setShowMap(false)}
          className="absolute top-4 left-4 bg-white rounded-full p-3 shadow-lg"
        >
          <Ionicons name="close" size={24} color="#000" />
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-6">
        <TouchableOpacity onPress={() => router.back()} className="mb-4">
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        <Text className="text-3xl font-bold text-white mb-1">Find a Mingler</Text>
        <Text className="text-purple-100">Discover people ready to mingle near you</Text>
      </View>

      <ScrollView className="flex-1 px-4 py-4">
        {/* Search Bar */}
        <View className="mb-4">
          <TextInput
            placeholder="Search by interest..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="w-full bg-white border border-gray-300 rounded-xl px-4 py-3"
            placeholderTextColor="#999"
          />
        </View>

        {/* Tags Filter */}
        <View className="mb-4">
          <Text className="text-sm font-bold text-gray-700 mb-2">Filter by Interest</Text>
          <View className="flex-row flex-wrap gap-2">
            {allTags.map((tag) => (
              <TouchableOpacity
                key={tag}
                onPress={() => {
                  setSelectedTags(
                    selectedTags.includes(tag)
                      ? selectedTags.filter((t) => t !== tag)
                      : [...selectedTags, tag]
                  );
                }}
                className={`rounded-full px-3 py-1 ${
                  selectedTags.includes(tag)
                    ? 'bg-purple-500'
                    : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`text-xs font-semibold ${
                    selectedTags.includes(tag) ? 'text-white' : 'text-gray-700'
                  }`}
                >
                  #{tag}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Radius & Sort */}
        <View className="flex-row gap-4 mb-4">
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-700 mb-1">Distance (km)</Text>
            <TextInput
              value={radiusKm}
              onChangeText={setRadiusKm}
              keyboardType="number-pad"
              className="bg-white border border-gray-300 rounded-lg px-3 py-2"
              maxLength={3}
            />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-gray-700 mb-1">Sort By</Text>
            <TouchableOpacity
              onPress={() => {
                const options = ['distance', 'recent', 'popular'] as const;
                const nextSort = options[(options.indexOf(sortBy) + 1) % 3];
                setSortBy(nextSort);
              }}
              className="bg-white border border-gray-300 rounded-lg px-3 py-2 flex-row items-center justify-between"
            >
              <Text className="text-gray-700 font-semibold text-xs capitalize">
                {sortBy}
              </Text>
              <Ionicons name="swap-vertical" size={16} color="#666" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Search Button */}
        <TouchableOpacity
          onPress={searchMingles}
          disabled={isLoading}
          className="bg-purple-500 rounded-xl p-3 mb-4 flex-row items-center justify-center gap-2"
        >
          {isLoading ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Ionicons name="search" size={20} color="white" />
              <Text className="text-white font-bold">Search Minglers</Text>
            </>
          )}
        </TouchableOpacity>

        {/* Map Toggle */}
        {results.length > 0 && (
          <TouchableOpacity
            onPress={() => setShowMap(true)}
            className="bg-blue-500 rounded-xl p-3 mb-4 flex-row items-center justify-center gap-2"
          >
            <Ionicons name="map" size={20} color="white" />
            <Text className="text-white font-bold">View on Map ({results.length})</Text>
          </TouchableOpacity>
        )}

        {/* Results */}
        {isLoading ? (
          <View className="flex-1 items-center justify-center py-20">
            <ActivityIndicator size="large" color="#a855f7" />
            <Text className="text-gray-500 mt-4">Searching minglers...</Text>
          </View>
        ) : results.length === 0 ? (
          <View className="flex-1 items-center justify-center py-20">
            <Ionicons name="search" size={48} color="#d1d5db" />
            <Text className="text-gray-500 mt-4 text-center">
              No minglers found. Try adjusting your filters!
            </Text>
          </View>
        ) : (
          <View className="gap-3 pb-10">
            {results.map((mingle) => (
              <TouchableOpacity
                key={mingle.id}
                onPress={() => {
                  setSelectedMingle(mingle);
                  setShowDetailModal(true);
                }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                {mingle.photoUrl && (
                  <Image
                    source={{ uri: mingle.photoUrl }}
                    className="w-full h-40 rounded-lg mb-3"
                  />
                )}

                <View className="flex-row items-start justify-between mb-2">
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-gray-800">
                      {mingle.title}
                    </Text>
                    <Text className="text-sm text-gray-600">
                      by {mingle.host.displayName || mingle.host.name}
                    </Text>
                  </View>
                  <View className="bg-blue-100 rounded-full px-2 py-1">
                    <Text className="text-blue-700 text-xs font-bold">
                      {mingle.distance.toFixed(1)} km
                    </Text>
                  </View>
                </View>

                <Text className="text-gray-700 text-sm mb-2 line-clamp-2">
                  {mingle.description}
                </Text>

                <View className="flex-row flex-wrap gap-1 mb-3">
                  {mingle.tags.slice(0, 3).map((tag) => (
                    <View
                      key={tag}
                      className="bg-purple-100 rounded-full px-2 py-1"
                    >
                      <Text className="text-purple-700 text-xs">#{tag}</Text>
                    </View>
                  ))}
                  {mingle.tags.length > 3 && (
                    <Text className="text-gray-500 text-xs self-center">
                      +{mingle.tags.length - 3}
                    </Text>
                  )}
                </View>

                <View className="flex-row items-center justify-between pt-3 border-t border-gray-200">
                  <View className="flex-row items-center gap-2">
                    {mingle.host.avatar ? (
                      <Image
                        source={{ uri: mingle.host.avatar }}
                        className="w-8 h-8 rounded-full"
                      />
                    ) : (
                      <View className="w-8 h-8 rounded-full bg-purple-200 items-center justify-center">
                        <Ionicons name="person" size={16} color="#a855f7" />
                      </View>
                    )}
                    <Text className="text-sm font-semibold text-gray-700">
                      {mingle.participantCount} joined
                    </Text>
                  </View>
                  <Text className="text-xs text-gray-500">
                    {new Date(mingle.startTime).toLocaleDateString()}
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        {selectedMingle && (
          <View className="flex-1 bg-white">
            <ScrollView className="flex-1">
              {/* Header */}
              <View className="bg-purple-500 px-4 py-6 flex-row items-center justify-between">
                <TouchableOpacity onPress={() => setShowDetailModal(false)}>
                  <Ionicons name="close" size={24} color="white" />
                </TouchableOpacity>
                <Text className="text-white font-bold text-lg">Mingle Details</Text>
                <View className="w-6" />
              </View>

              {/* Photo */}
              {selectedMingle.photoUrl && (
                <Image
                  source={{ uri: selectedMingle.photoUrl }}
                  className="w-full h-64"
                />
              )}

              {/* Content */}
              <View className="px-4 py-4">
                <Text className="text-2xl font-bold text-gray-800 mb-2">
                  {selectedMingle.title}
                </Text>

                {/* Host Card */}
                <View className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl p-4 mb-4">
                  <View className="flex-row items-center gap-3">
                    {selectedMingle.host.avatar ? (
                      <Image
                        source={{ uri: selectedMingle.host.avatar }}
                        className="w-16 h-16 rounded-full"
                      />
                    ) : (
                      <View className="w-16 h-16 rounded-full bg-purple-300 items-center justify-center">
                        <Ionicons name="person" size={32} color="white" />
                      </View>
                    )}
                    <View className="flex-1">
                      <Text className="font-bold text-gray-800">
                        {selectedMingle.host.displayName || selectedMingle.host.name}
                      </Text>
                      <Text className="text-sm text-gray-600 mb-2">
                        {selectedMingle.host.bio || 'No bio'}
                      </Text>
                      <TouchableOpacity
                        onPress={() => {
                          handleMessageHost(selectedMingle);
                          setShowDetailModal(false);
                        }}
                        className="bg-purple-500 rounded-lg px-3 py-2"
                      >
                        <Text className="text-white text-sm font-bold">Message</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                </View>

                {/* Details */}
                <View className="gap-3">
                  <View className="flex-row items-center gap-2 p-3 bg-gray-100 rounded-lg">
                    <Ionicons name="location" size={20} color="#a855f7" />
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600">Location</Text>
                      <Text className="font-semibold text-gray-800">
                        {selectedMingle.locationName} ({selectedMingle.distance.toFixed(1)} km away)
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 p-3 bg-gray-100 rounded-lg">
                    <Ionicons name="calendar" size={20} color="#a855f7" />
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600">Time</Text>
                      <Text className="font-semibold text-gray-800">
                        {new Date(selectedMingle.startTime).toLocaleString()}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 p-3 bg-gray-100 rounded-lg">
                    <Ionicons name="people" size={20} color="#a855f7" />
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600">Participants</Text>
                      <Text className="font-semibold text-gray-800">
                        {selectedMingle.participantCount} / {selectedMingle.maxParticipants}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-row items-center gap-2 p-3 bg-gray-100 rounded-lg">
                    <Ionicons
                      name={
                        selectedMingle.privacy === 'private'
                          ? 'lock-closed'
                          : 'globe'
                      }
                      size={20}
                      color="#a855f7"
                    />
                    <View className="flex-1">
                      <Text className="text-xs text-gray-600">Privacy</Text>
                      <Text className="font-semibold text-gray-800 capitalize">
                        {selectedMingle.privacy}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Description */}
                <View className="mt-4">
                  <Text className="font-bold text-gray-800 mb-2">About</Text>
                  <Text className="text-gray-700 leading-6">
                    {selectedMingle.description}
                  </Text>
                </View>

                {/* Tags */}
                <View className="mt-4 mb-6">
                  <Text className="font-bold text-gray-800 mb-2">Interests</Text>
                  <View className="flex-row flex-wrap gap-2">
                    {selectedMingle.tags.map((tag) => (
                      <View key={tag} className="bg-purple-100 rounded-full px-3 py-1">
                        <Text className="text-purple-700 text-sm font-semibold">
                          #{tag}
                        </Text>
                      </View>
                    ))}
                  </View>
                </View>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </View>
  );
}
