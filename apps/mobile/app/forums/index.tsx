import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  RefreshControl,
  TextInput,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';

interface ForumCategory {
  id: string;
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  postCount: number;
}

interface ForumPost {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  category: string;
  categoryColor: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: string;
  location?: {
    name: string;
    distance?: number;
  };
}

const categories: ForumCategory[] = [
  { id: 'general', name: 'General', icon: 'chatbubbles', color: '#3B82F6', postCount: 0 },
  { id: 'meetups', name: 'Meetups', icon: 'people', color: '#FF6B9D', postCount: 0 },
  { id: 'events', name: 'Events', icon: 'calendar', color: '#F59E0B', postCount: 0 },
  { id: 'places', name: 'Places', icon: 'location', color: '#22C55E', postCount: 0 },
  { id: 'tips', name: 'Tips', icon: 'bulb', color: '#8B5CF6', postCount: 0 },
  { id: 'questions', name: 'Q&A', icon: 'help-circle', color: '#06B6D4', postCount: 0 },
];

export default function ForumsScreen() {
  const router = useRouter();
  
  const [activeTab, setActiveTab] = useState<'feed' | 'categories'>('feed');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'nearby'>('recent');

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory, sortBy]);

  const fetchPosts = async () => {
    try {
      const response = await api.get<ForumPost[]>('/api/forums/posts', {
        params: {
          category: selectedCategory,
          sort: sortBy,
        },
      });
      setPosts(response);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchPosts();
  };

  const handleLike = async (postId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Optimistic update
    setPosts((prev) =>
      prev.map((post) =>
        post.id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post
      )
    );

    try {
      await api.post(`/api/forums/posts/${postId}/like`);
    } catch (error) {
      // Revert on error
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? {
                ...post,
                isLiked: !post.isLiked,
                likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1,
              }
            : post
        )
      );
    }
  };

  const handleCreatePost = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.push('/forums/create');
  };

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d ago`;
    return date.toLocaleDateString();
  };

  const renderPost = ({ item: post }: { item: ForumPost }) => (
    <TouchableOpacity
      onPress={() => router.push(`/forums/post/${post.id}`)}
      className="bg-white p-4 mb-3 mx-4 rounded-2xl shadow-sm"
      activeOpacity={0.7}
    >
      {/* Pinned Badge */}
      {post.isPinned && (
        <View className="flex-row items-center mb-2">
          <Ionicons name="pin" size={14} color="#F59E0B" />
          <Text className="text-xs text-amber-600 font-medium ml-1">Pinned</Text>
        </View>
      )}

      {/* Header */}
      <View className="flex-row items-center mb-3">
        <TouchableOpacity
          onPress={() => router.push(`/profile/${post.author.id}`)}
        >
          {post.author.avatar ? (
            <Image
              source={{ uri: post.author.avatar }}
              className="w-10 h-10 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
              <Text className="font-bold text-primary-500">
                {post.author.displayName.charAt(0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="flex-1 ml-3">
          <Text className="font-semibold text-gray-900">{post.author.displayName}</Text>
          <View className="flex-row items-center">
            <Text className="text-xs text-gray-500">{formatTime(post.createdAt)}</Text>
            {post.location && (
              <>
                <Text className="text-xs text-gray-400 mx-1">•</Text>
                <Ionicons name="location" size={10} color="#9CA3AF" />
                <Text className="text-xs text-gray-500 ml-0.5">{post.location.name}</Text>
              </>
            )}
          </View>
        </View>

        {/* Category Badge */}
        <View
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${post.categoryColor}20` }}
        >
          <Text className="text-xs font-medium" style={{ color: post.categoryColor }}>
            {post.category}
          </Text>
        </View>
      </View>

      {/* Content */}
      <Text className="text-lg font-semibold text-gray-900 mb-1">{post.title}</Text>
      <Text className="text-gray-600 leading-5" numberOfLines={3}>
        {post.content}
      </Text>

      {/* Actions */}
      <View className="flex-row items-center mt-4 pt-3 border-t border-gray-100">
        <TouchableOpacity
          onPress={() => handleLike(post.id)}
          className="flex-row items-center mr-6"
        >
          <Ionicons
            name={post.isLiked ? 'heart' : 'heart-outline'}
            size={20}
            color={post.isLiked ? '#FF6B9D' : '#6B7280'}
          />
          <Text
            className={`ml-1 text-sm font-medium ${
              post.isLiked ? 'text-primary-500' : 'text-gray-600'
            }`}
          >
            {post.likesCount}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity className="flex-row items-center">
          <Ionicons name="chatbubble-outline" size={18} color="#6B7280" />
          <Text className="ml-1 text-sm text-gray-600">{post.commentsCount}</Text>
        </TouchableOpacity>

        <View className="flex-1" />

        <TouchableOpacity className="p-1">
          <Ionicons name="share-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  const renderCategory = ({ item }: { item: ForumCategory }) => (
    <TouchableOpacity
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setSelectedCategory(selectedCategory === item.id ? null : item.id);
        setActiveTab('feed');
      }}
      className={`flex-row items-center p-4 bg-white mb-2 mx-4 rounded-xl ${
        selectedCategory === item.id ? 'border-2 border-primary-500' : ''
      }`}
      activeOpacity={0.7}
    >
      <View
        className="w-12 h-12 rounded-full items-center justify-center"
        style={{ backgroundColor: `${item.color}20` }}
      >
        <Ionicons name={item.icon} size={24} color={item.color} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-gray-900">{item.name}</Text>
        <Text className="text-sm text-gray-500">{item.postCount} posts</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Community',
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/search')} className="mr-4">
              <Ionicons name="search" size={24} color="#1F2937" />
            </TouchableOpacity>
          ),
        }}
      />

      {/* Tab Switcher */}
      <View className="bg-white px-4 pb-3 pt-2 shadow-sm">
        <View className="flex-row bg-gray-100 rounded-xl p-1">
          {[
            { key: 'feed', label: 'Feed' },
            { key: 'categories', label: 'Categories' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key as any);
              }}
              className={`flex-1 py-2 rounded-lg items-center ${
                activeTab === tab.key ? 'bg-white shadow-sm' : ''
              }`}
            >
              <Text
                className={`font-medium ${
                  activeTab === tab.key ? 'text-gray-900' : 'text-gray-500'
                }`}
              >
                {tab.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Sort Options (only for feed) */}
        {activeTab === 'feed' && (
          <View className="flex-row mt-3 space-x-2">
            {[
              { key: 'recent', label: 'Recent', icon: 'time' },
              { key: 'popular', label: 'Popular', icon: 'flame' },
              { key: 'nearby', label: 'Nearby', icon: 'location' },
            ].map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSortBy(option.key as any);
                }}
                className={`flex-row items-center px-3 py-1.5 rounded-full ${
                  sortBy === option.key ? 'bg-primary-500' : 'bg-gray-100'
                }`}
              >
                <Ionicons
                  name={option.icon as any}
                  size={14}
                  color={sortBy === option.key ? 'white' : '#6B7280'}
                />
                <Text
                  className={`ml-1 text-sm font-medium ${
                    sortBy === option.key ? 'text-white' : 'text-gray-600'
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}

            {/* Active Category Filter */}
            {selectedCategory && (
              <TouchableOpacity
                onPress={() => setSelectedCategory(null)}
                className="flex-row items-center px-3 py-1.5 rounded-full bg-primary-100"
              >
                <Text className="text-sm font-medium text-primary-700">
                  {categories.find((c) => c.id === selectedCategory)?.name}
                </Text>
                <Ionicons name="close" size={14} color="#FF6B9D" className="ml-1" />
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Content */}
      {activeTab === 'feed' ? (
        <FlatList
          data={posts}
          renderItem={renderPost}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FF6B9D"
            />
          }
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-16 px-8">
              <Ionicons name="chatbubbles" size={48} color="#D1D5DB" />
              <Text className="text-lg font-semibold text-gray-900 text-center mt-4">
                No posts yet
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Be the first to start a conversation!
              </Text>
            </View>
          }
        />
      ) : (
        <FlatList
          data={categories}
          renderItem={renderCategory}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingTop: 12, paddingBottom: 100 }}
        />
      )}

      {/* Create Post FAB */}
      <TouchableOpacity
        onPress={handleCreatePost}
        className="absolute bottom-24 right-4"
        style={{
          shadowColor: '#FF6B9D',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
          elevation: 8,
        }}
      >
        <LinearGradient
          colors={['#FF6B9D', '#FF8FB1']}
          className="w-14 h-14 rounded-full items-center justify-center"
        >
          <Ionicons name="add" size={28} color="white" />
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}
