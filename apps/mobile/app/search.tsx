import { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Keyboard,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { debounce } from 'lodash';
import { api } from '../../src/lib/api';
import WaveButton from '../../src/components/WaveButton';

interface SearchUser {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  bio?: string;
  activityIntent?: string;
  chatReadiness: 'open' | 'maybe' | 'busy';
  trustScore: number;
  sharedInterests: string[];
  distance?: number;
  isVerified: boolean;
}

interface RecentSearch {
  id: string;
  type: 'user' | 'query';
  value: string;
  displayName?: string;
  avatar?: string;
  timestamp: number;
}

const chatReadinessConfig = {
  open: { color: '#22C55E', label: 'Open to chat' },
  maybe: { color: '#F59E0B', label: 'Maybe later' },
  busy: { color: '#EF4444', label: 'Busy' },
};

export default function SearchScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [recentSearches, setRecentSearches] = useState<RecentSearch[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [filter, setFilter] = useState<'all' | 'nearby' | 'online'>('all');

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    // Focus input on mount
    setTimeout(() => inputRef.current?.focus(), 100);

    // Load recent searches
    loadRecentSearches();
  }, []);

  const loadRecentSearches = async () => {
    // In real app, load from AsyncStorage
    setRecentSearches([
      { id: '1', type: 'user', value: 'sarah', displayName: 'Sarah Johnson', timestamp: Date.now() - 3600000 },
      { id: '2', type: 'query', value: 'coffee lovers', timestamp: Date.now() - 86400000 },
      { id: '3', type: 'user', value: 'mike', displayName: 'Mike Chen', timestamp: Date.now() - 172800000 },
    ]);
  };

  const performSearch = useCallback(
    debounce(async (searchQuery: string) => {
      if (!searchQuery.trim()) {
        setResults([]);
        setHasSearched(false);
        return;
      }

      setIsSearching(true);
      setHasSearched(true);

      try {
        const response = await api.get<SearchUser[]>('/api/users/search', {
          params: {
            q: searchQuery,
            filter,
          },
        });
        setResults(response);
      } catch (error) {
        console.error('Search error:', error);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300),
    [filter]
  );

  useEffect(() => {
    performSearch(query);
  }, [query, performSearch]);

  const handleUserPress = (user: SearchUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Save to recent searches
    const newRecent: RecentSearch = {
      id: user.id,
      type: 'user',
      value: user.username,
      displayName: user.displayName,
      avatar: user.avatar,
      timestamp: Date.now(),
    };
    setRecentSearches((prev) => [newRecent, ...prev.filter((r) => r.id !== user.id)].slice(0, 10));

    router.push(`/profile/${user.id}`);
  };

  const handleClearRecent = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setRecentSearches((prev) => prev.filter((r) => r.id !== id));
  };

  const handleClearAllRecent = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setRecentSearches([]);
  };

  const formatDistance = (meters?: number): string => {
    if (!meters) return '';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)}km`;
  };

  const renderUser = ({ item }: { item: SearchUser }) => {
    const readiness = chatReadinessConfig[item.chatReadiness];

    return (
      <TouchableOpacity
        onPress={() => handleUserPress(item)}
        className="flex-row items-center p-4 bg-white border-b border-gray-100"
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="relative">
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              className="w-14 h-14 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-xl font-bold text-primary-500">
                {item.displayName.charAt(0)}
              </Text>
            </View>
          )}
          <View
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: readiness.color }}
          />
        </View>

        {/* User Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">{item.displayName}</Text>
            {item.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" className="ml-1" />
            )}
          </View>
          <Text className="text-sm text-gray-500">@{item.username}</Text>
          
          {/* Shared Interests */}
          {item.sharedInterests.length > 0 && (
            <View className="flex-row items-center mt-1">
              <Ionicons name="heart" size={12} color="#FF6B9D" />
              <Text className="text-xs text-gray-500 ml-1">
                {item.sharedInterests.slice(0, 2).join(', ')}
                {item.sharedInterests.length > 2 && ` +${item.sharedInterests.length - 2}`}
              </Text>
            </View>
          )}

          {/* Distance */}
          {item.distance && (
            <Text className="text-xs text-gray-400 mt-0.5">
              {formatDistance(item.distance)} away
            </Text>
          )}
        </View>

        {/* Wave Button */}
        <WaveButton
          userId={item.id}
          userName={item.displayName}
          size="small"
          variant="outline"
        />
      </TouchableOpacity>
    );
  };

  const renderRecentSearch = ({ item }: { item: RecentSearch }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.type === 'user') {
          router.push(`/profile/${item.id}`);
        } else {
          setQuery(item.value);
        }
      }}
      className="flex-row items-center px-4 py-3"
      activeOpacity={0.7}
    >
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center">
        {item.type === 'user' && item.avatar ? (
          <Image source={{ uri: item.avatar }} className="w-10 h-10 rounded-full" />
        ) : (
          <Ionicons
            name={item.type === 'user' ? 'person' : 'time'}
            size={18}
            color="#6B7280"
          />
        )}
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-gray-900">
          {item.type === 'user' ? item.displayName : item.value}
        </Text>
        {item.type === 'user' && (
          <Text className="text-sm text-gray-500">@{item.value}</Text>
        )}
      </View>
      <TouchableOpacity onPress={() => handleClearRecent(item.id)} className="p-2">
        <Ionicons name="close" size={18} color="#9CA3AF" />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <Animated.View style={{ flex: 1, opacity: fadeAnim }} className="bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      {/* Search Header */}
      <View className="bg-white pt-14 pb-4 px-4 shadow-sm">
        <View className="flex-row items-center">
          <TouchableOpacity
            onPress={() => router.back()}
            className="mr-3"
          >
            <Ionicons name="arrow-back" size={24} color="#1F2937" />
          </TouchableOpacity>

          <View className="flex-1 flex-row items-center bg-gray-100 rounded-xl px-4 py-3">
            <Ionicons name="search" size={20} color="#9CA3AF" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              placeholder="Search people..."
              placeholderTextColor="#9CA3AF"
              className="flex-1 ml-2 text-gray-900"
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 && (
              <TouchableOpacity onPress={() => setQuery('')}>
                <Ionicons name="close-circle" size={20} color="#9CA3AF" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Filter Pills */}
        <View className="flex-row mt-3 space-x-2">
          {[
            { key: 'all', label: 'All', icon: 'people' },
            { key: 'nearby', label: 'Nearby', icon: 'location' },
            { key: 'online', label: 'Online', icon: 'pulse' },
          ].map((f) => (
            <TouchableOpacity
              key={f.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f.key as any);
              }}
              className={`flex-row items-center px-3 py-1.5 rounded-full ${
                filter === f.key ? 'bg-primary-500' : 'bg-gray-100'
              }`}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={filter === f.key ? 'white' : '#6B7280'}
              />
              <Text
                className={`ml-1 text-sm font-medium ${
                  filter === f.key ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Loading */}
      {isSearching && (
        <View className="py-8 items-center">
          <ActivityIndicator size="small" color="#FF6B9D" />
        </View>
      )}

      {/* Search Results */}
      {hasSearched && !isSearching && (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Ionicons name="search" size={48} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-900 text-center mt-4">
                No results found
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Try a different search term or filter
              </Text>
            </View>
          }
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
        />
      )}

      {/* Recent Searches */}
      {!hasSearched && !isSearching && (
        <View className="flex-1">
          {recentSearches.length > 0 && (
            <>
              <View className="flex-row items-center justify-between px-4 py-3">
                <Text className="font-semibold text-gray-900">Recent</Text>
                <TouchableOpacity onPress={handleClearAllRecent}>
                  <Text className="text-primary-500 text-sm">Clear all</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={recentSearches}
                renderItem={renderRecentSearch}
                keyExtractor={(item) => item.id}
                keyboardShouldPersistTaps="handled"
              />
            </>
          )}

          {/* Suggestions */}
          <View className="px-4 py-4">
            <Text className="font-semibold text-gray-900 mb-3">Suggested</Text>
            <View className="flex-row flex-wrap">
              {['Coffee lovers ☕', 'Hikers 🥾', 'Foodies 🍕', 'Gamers 🎮', 'Bookworms 📚'].map(
                (tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setQuery(tag.split(' ')[0])}
                    className="bg-gray-100 px-3 py-2 rounded-full mr-2 mb-2"
                  >
                    <Text className="text-gray-700">{tag}</Text>
                  </TouchableOpacity>
                )
              )}
            </View>
          </View>
        </View>
      )}
    </Animated.View>
  );
}
