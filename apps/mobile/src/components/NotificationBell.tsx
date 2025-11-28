import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  Image,
  Animated,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    userId?: string;
    chatId?: string;
    pinId?: string;
    eventId?: string;
    mingleId?: string;
    postId?: string;
  };
  read: boolean;
  createdAt: string;
  fromUser?: {
    id: string;
    name: string;
    profile?: {
      displayName: string;
      avatar?: string;
    };
  };
}

interface NotificationBellProps {
  color?: string;
  size?: number;
}

export default function NotificationBell({
  color = '#1F2937',
  size = 24,
}: NotificationBellProps) {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Badge animation
  const badgeScale = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchUnreadCount();
    
    // Poll for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (unreadCount > 0) {
      Animated.spring(badgeScale, {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(badgeScale, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [unreadCount]);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get<{ notifications: Notification[]; unreadCount: number }>(
        '/api/notifications?limit=1'
      );
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const fetchNotifications = async () => {
    setIsLoading(true);
    try {
      const response = await api.get<{ notifications: Notification[]; unreadCount: number }>(
        '/api/notifications?limit=50'
      );
      setNotifications(response.notifications);
      setUnreadCount(response.unreadCount);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleOpen = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setShowModal(true);
    fetchNotifications();
  };

  const handleNotificationPress = async (notification: Notification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Mark as read
    if (!notification.read) {
      try {
        await api.put(`/api/notifications/${notification.id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? { ...n, read: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking notification as read:', error);
      }
    }

    setShowModal(false);

    // Navigate based on type
    const { data } = notification;
    if (!data) return;

    switch (notification.type) {
      case 'wave':
      case 'new_follower':
        if (data.userId) router.push(`/profile/${data.userId}`);
        break;
      case 'message':
        if (data.chatId) router.push(`/chat/${data.chatId}`);
        break;
      case 'event_reminder':
        if (data.eventId) router.push(`/event/${data.eventId}`);
        break;
      case 'mingle_invite':
        if (data.mingleId) router.push(`/mingle/${data.mingleId}`);
        break;
      case 'pin_like':
      case 'pin_comment':
        if (data.pinId) router.push(`/pin/${data.pinId}`);
        break;
      case 'forum_reply':
        if (data.postId) router.push(`/forums/post/${data.postId}`);
        break;
    }
  };

  const handleMarkAllRead = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      await api.put('/api/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    if (diffMins < 10080) return `${Math.floor(diffMins / 1440)}d`;
    return date.toLocaleDateString();
  };

  const getNotificationIcon = (type: string): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      case 'wave':
        return 'hand-left';
      case 'message':
        return 'chatbubble';
      case 'proximity':
        return 'location';
      case 'event_reminder':
        return 'calendar';
      case 'mingle_invite':
        return 'people';
      case 'pin_like':
        return 'heart';
      case 'pin_comment':
        return 'chatbubble-ellipses';
      case 'new_follower':
        return 'person-add';
      case 'streak_milestone':
        return 'flame';
      case 'forum_reply':
        return 'chatbubbles';
      default:
        return 'notifications';
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity
      onPress={() => handleNotificationPress(item)}
      className={`flex-row items-start p-4 border-b border-gray-100 ${
        !item.read ? 'bg-primary-50' : ''
      }`}
      activeOpacity={0.7}
    >
      {/* Icon or Avatar */}
      {item.fromUser?.profile?.avatar ? (
        <Image
          source={{ uri: item.fromUser.profile.avatar }}
          className="w-10 h-10 rounded-full bg-gray-200"
        />
      ) : (
        <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
          <Ionicons name={getNotificationIcon(item.type)} size={18} color="#FF6B9D" />
        </View>
      )}

      {/* Content */}
      <View className="flex-1 ml-3">
        <Text className={`${!item.read ? 'font-semibold' : ''} text-gray-900`}>
          {item.title}
        </Text>
        <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={2}>
          {item.body}
        </Text>
        <Text className="text-xs text-gray-400 mt-1">
          {formatTime(item.createdAt)}
        </Text>
      </View>

      {/* Unread dot */}
      {!item.read && (
        <View className="w-2 h-2 rounded-full bg-primary-500 mt-2" />
      )}
    </TouchableOpacity>
  );

  return (
    <>
      {/* Bell Button */}
      <TouchableOpacity onPress={handleOpen} className="relative p-2">
        <Ionicons name="notifications-outline" size={size} color={color} />
        
        {/* Badge */}
        <Animated.View
          style={{
            transform: [{ scale: badgeScale }],
            position: 'absolute',
            top: 0,
            right: 0,
          }}
        >
          {unreadCount > 0 && (
            <View className="min-w-[18px] h-[18px] rounded-full bg-red-500 items-center justify-center px-1">
              <Text className="text-white text-xs font-bold">
                {unreadCount > 99 ? '99+' : unreadCount}
              </Text>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>

      {/* Notifications Modal */}
      <Modal
        visible={showModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl h-[80%]">
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Header */}
            <View className="flex-row items-center justify-between px-4 pb-3 border-b border-gray-100">
              <Text className="text-xl font-bold text-gray-900">Notifications</Text>
              <View className="flex-row items-center">
                {unreadCount > 0 && (
                  <TouchableOpacity onPress={handleMarkAllRead} className="mr-4">
                    <Text className="text-primary-500 font-medium">Mark all read</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            {/* List */}
            <FlatList
              data={notifications}
              renderItem={renderNotification}
              keyExtractor={(item) => item.id}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={() => {
                    setIsRefreshing(true);
                    fetchNotifications();
                  }}
                  tintColor="#FF6B9D"
                />
              }
              ListEmptyComponent={
                <View className="items-center py-16 px-8">
                  <Ionicons name="notifications-off" size={48} color="#D1D5DB" />
                  <Text className="text-lg font-semibold text-gray-900 text-center mt-4">
                    No notifications
                  </Text>
                  <Text className="text-gray-500 text-center mt-2">
                    When you get notifications, they'll show up here
                  </Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>
    </>
  );
}
