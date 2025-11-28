import { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../src/lib/api';

interface BlockedUser {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  blockedAt: string;
}

export default function BlockedUsersScreen() {
  const router = useRouter();
  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    fetchBlockedUsers();
  }, []);

  const fetchBlockedUsers = async () => {
    try {
      const response = await api.get<BlockedUser[]>('/api/users/blocked');
      setBlockedUsers(response);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchBlockedUsers();
  };

  const handleUnblock = (user: BlockedUser) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${user.displayName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            try {
              await api.delete(`/api/users/${user.id}/block`);
              setBlockedUsers((prev) => prev.filter((u) => u.id !== user.id));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Unable to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderUser = ({ item }: { item: BlockedUser }) => (
    <View className="flex-row items-center p-4 bg-white border-b border-gray-100">
      {/* Avatar */}
      {item.avatar ? (
        <Image
          source={{ uri: item.avatar }}
          className="w-12 h-12 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-12 h-12 rounded-full bg-gray-200 items-center justify-center">
          <Text className="text-lg font-bold text-gray-400">
            {item.displayName.charAt(0)}
          </Text>
        </View>
      )}

      {/* User Info */}
      <View className="flex-1 ml-3">
        <Text className="font-semibold text-gray-900">{item.displayName}</Text>
        <Text className="text-sm text-gray-500">@{item.username}</Text>
        <Text className="text-xs text-gray-400 mt-0.5">
          Blocked on {formatDate(item.blockedAt)}
        </Text>
      </View>

      {/* Unblock Button */}
      <TouchableOpacity
        onPress={() => handleUnblock(item)}
        className="px-4 py-2 bg-gray-100 rounded-full"
      >
        <Text className="text-gray-700 font-medium">Unblock</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Blocked Users',
          headerBackTitle: 'Back',
        }}
      />

      {/* Info Banner */}
      <View className="bg-blue-50 p-4 flex-row items-start">
        <Ionicons name="information-circle" size={20} color="#3B82F6" />
        <Text className="flex-1 ml-2 text-sm text-blue-700">
          Blocked users can't see your profile, send you messages, or interact with you in any way.
        </Text>
      </View>

      {/* Blocked Users List */}
      <FlatList
        data={blockedUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor="#FF6B9D"
          />
        }
        ListEmptyComponent={
          <View className="items-center py-16 px-8">
            <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-4">
              <Ionicons name="person-remove" size={32} color="#D1D5DB" />
            </View>
            <Text className="text-lg font-semibold text-gray-900 text-center">
              No blocked users
            </Text>
            <Text className="text-gray-500 text-center mt-2">
              When you block someone, they'll appear here.
            </Text>
          </View>
        }
        contentContainerStyle={blockedUsers.length === 0 ? { flex: 1 } : undefined}
      />
    </View>
  );
}
