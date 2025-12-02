import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, RefreshControl, Image, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../src/lib/api';
import { useAuthStore } from '../../src/stores/auth';
import { useNotificationStore } from '../../src/stores/notifications';

// Backend returns this format from /api/messages/conversations
interface Conversation {
  partnerId: string;
  partner: {
    id: string;
    name: string | null;
    email: string;
  };
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const { setUnreadCount } = useNotificationStore();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchConversations = useCallback(async () => {
    if (!isAuthenticated) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await api.get<Conversation[]>('/api/messages/conversations');
      setConversations(data);
      
      // Update global unread count
      const totalUnread = data.reduce((sum, c) => sum + c.unreadCount, 0);
      setUnreadCount(totalUnread);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [isAuthenticated, setUnreadCount]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchConversations();
  };

  const handleConversationPress = (partnerId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push(`/chat/${partnerId}`);
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}d`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <View className="w-20 h-20 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Ionicons name="chatbubbles" size={40} color="#FF6B9D" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Sign in to message
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Create an account to start chatting with people you've connected with.
        </Text>
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/(auth)/login');
          }}
          className="bg-primary-500 px-8 py-3 rounded-full mt-6"
        >
          <Text className="text-white font-semibold">Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center">
        <Ionicons name="chatbubbles" size={48} color="#FF6B9D" />
        <Text className="text-gray-500 mt-4">Loading messages...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-4 pt-14 pb-4 border-b border-gray-100">
        <Text className="text-2xl font-bold text-gray-900">Messages</Text>
      </View>

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            tintColor="#FF6B9D"
          />
        }
      >
        {conversations.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8 pt-20">
            <View className="w-20 h-20 rounded-full bg-gray-100 items-center justify-center mb-6">
              <Ionicons name="chatbubble-outline" size={40} color="#D1D5DB" />
            </View>
            <Text className="text-xl font-semibold text-gray-900 text-center">
              No messages yet
            </Text>
            <Text className="text-gray-500 mt-2 text-center">
              When you like someone's pin and they like yours back, you can start chatting!
            </Text>
          </View>
        ) : (
          <View className="bg-white">
            {conversations.map((conversation, index) => {
              const isUnread = conversation.unreadCount > 0;

              return (
                <TouchableOpacity
                  key={conversation.partnerId}
                  onPress={() => handleConversationPress(conversation.partnerId)}
                  className={`flex-row items-center px-4 py-3 ${
                    index < conversations.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  {/* Avatar */}
                  <View className="relative">
                    <View className="w-14 h-14 rounded-full bg-gray-200 items-center justify-center">
                      <Ionicons name="person" size={28} color="#9CA3AF" />
                    </View>
                    {/* Online indicator would go here */}
                  </View>

                  {/* Content */}
                  <View className="flex-1 ml-3">
                    <View className="flex-row items-center justify-between">
                      <Text
                        className={`text-base ${
                          isUnread ? 'font-bold text-gray-900' : 'font-medium text-gray-900'
                        }`}
                      >
                        {conversation.partner.name || 'Anonymous'}
                      </Text>
                      <Text className={`text-sm ${isUnread ? 'text-primary-500' : 'text-gray-400'}`}>
                        {conversation.lastMessageAt ? formatTimeAgo(conversation.lastMessageAt) : ''}
                      </Text>
                    </View>
                    
                    <View className="flex-row items-center mt-0.5">
                      <Text
                        className={`flex-1 text-sm ${
                          isUnread ? 'text-gray-900 font-medium' : 'text-gray-500'
                        }`}
                        numberOfLines={1}
                      >
                        {conversation.lastMessage || 'No messages yet'}
                      </Text>
                    </View>
                  </View>

                  {/* Unread Badge */}
                  {isUnread && (
                    <View className="bg-primary-500 rounded-full min-w-6 h-6 items-center justify-center px-2 ml-2">
                      <Text className="text-white text-xs font-bold">
                        {conversation.unreadCount > 9 ? '9+' : conversation.unreadCount}
                      </Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Bottom Padding */}
        <View className="h-24" />
      </ScrollView>
    </View>
  );
}
