import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Image,
  Animated,
  Dimensions,
  PanResponder,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { api } from '../lib/api';

const { width, height } = Dimensions.get('window');

const SHEET_MIN_HEIGHT = 80;
const SHEET_MID_HEIGHT = height * 0.4;
const SHEET_MAX_HEIGHT = height * 0.85;

interface NearbyUser {
  id: string;
  displayName: string;
  username: string;
  avatar?: string;
  activityIntent?: string;
  chatReadiness: 'open' | 'maybe' | 'busy';
  distance: number; // in meters
  trustScore: number;
  lastActive: string;
  interests: string[];
  isVerified: boolean;
}

interface NearbyUsersSheetProps {
  latitude: number;
  longitude: number;
  onUserPress?: (user: NearbyUser) => void;
}

// Chat readiness config
const chatReadinessConfig = {
  open: { color: '#22C55E', label: 'Open to chat', icon: 'chatbubble' },
  maybe: { color: '#F59E0B', label: 'Maybe later', icon: 'time' },
  busy: { color: '#EF4444', label: 'Busy', icon: 'close-circle' },
};

// Format distance
const formatDistance = (meters: number): string => {
  if (meters < 100) return 'Very close';
  if (meters < 500) return `${Math.round(meters)}m`;
  if (meters < 1000) return `${Math.round(meters / 100) * 100}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

// Format last active
const formatLastActive = (dateString: string): string => {
  const now = new Date();
  const lastActive = new Date(dateString);
  const diffMs = now.getTime() - lastActive.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
  return `${Math.floor(diffMins / 1440)}d ago`;
};

export default function NearbyUsersSheet({
  latitude,
  longitude,
  onUserPress,
}: NearbyUsersSheetProps) {
  const router = useRouter();
  const [users, setUsers] = useState<NearbyUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [sheetPosition, setSheetPosition] = useState<'min' | 'mid' | 'max'>('min');

  // Animations
  const sheetHeight = useRef(new Animated.Value(SHEET_MIN_HEIGHT)).current;
  const indicatorRotation = useRef(new Animated.Value(0)).current;

  // Pan responder for drag gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        const currentHeight = sheetPosition === 'min' 
          ? SHEET_MIN_HEIGHT 
          : sheetPosition === 'mid' 
          ? SHEET_MID_HEIGHT 
          : SHEET_MAX_HEIGHT;
        
        const newHeight = Math.max(
          SHEET_MIN_HEIGHT,
          Math.min(SHEET_MAX_HEIGHT, currentHeight - gestureState.dy)
        );
        
        sheetHeight.setValue(newHeight);
      },
      onPanResponderRelease: (_, gestureState) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        
        // Determine target position based on velocity and position
        const currentHeight = sheetPosition === 'min' 
          ? SHEET_MIN_HEIGHT 
          : sheetPosition === 'mid' 
          ? SHEET_MID_HEIGHT 
          : SHEET_MAX_HEIGHT;
        
        const newHeight = currentHeight - gestureState.dy;
        let targetHeight = SHEET_MIN_HEIGHT;
        let targetPosition: 'min' | 'mid' | 'max' = 'min';

        if (gestureState.vy < -0.5 || newHeight > SHEET_MID_HEIGHT + 50) {
          if (newHeight > SHEET_MID_HEIGHT + (SHEET_MAX_HEIGHT - SHEET_MID_HEIGHT) / 2) {
            targetHeight = SHEET_MAX_HEIGHT;
            targetPosition = 'max';
          } else {
            targetHeight = SHEET_MID_HEIGHT;
            targetPosition = 'mid';
          }
        } else if (gestureState.vy > 0.5 || newHeight < SHEET_MID_HEIGHT - 50) {
          if (newHeight < (SHEET_MIN_HEIGHT + SHEET_MID_HEIGHT) / 2) {
            targetHeight = SHEET_MIN_HEIGHT;
            targetPosition = 'min';
          } else {
            targetHeight = SHEET_MID_HEIGHT;
            targetPosition = 'mid';
          }
        } else {
          // Snap to nearest
          const distances = [
            { pos: 'min' as const, h: SHEET_MIN_HEIGHT },
            { pos: 'mid' as const, h: SHEET_MID_HEIGHT },
            { pos: 'max' as const, h: SHEET_MAX_HEIGHT },
          ];
          const nearest = distances.reduce((prev, curr) =>
            Math.abs(curr.h - newHeight) < Math.abs(prev.h - newHeight) ? curr : prev
          );
          targetHeight = nearest.h;
          targetPosition = nearest.pos;
        }

        setSheetPosition(targetPosition);
        Animated.spring(sheetHeight, {
          toValue: targetHeight,
          useNativeDriver: false,
          tension: 50,
          friction: 10,
        }).start();
      },
    })
  ).current;

  // Fetch nearby users
  const fetchNearbyUsers = useCallback(async () => {
    try {
      const response = await api.get<NearbyUser[]>('/api/users/nearby', {
        params: {
          latitude,
          longitude,
          radius: 5000, // 5km
        },
      });
      setUsers(response);
    } catch (error) {
      console.error('Error fetching nearby users:', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [latitude, longitude]);

  useEffect(() => {
    fetchNearbyUsers();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchNearbyUsers, 30000);
    return () => clearInterval(interval);
  }, [fetchNearbyUsers]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchNearbyUsers();
  };

  const handleUserPress = (user: NearbyUser) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onUserPress) {
      onUserPress(user);
    } else {
      router.push(`/profile/${user.id}`);
    }
  };

  const handleExpandToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const nextPosition = sheetPosition === 'min' ? 'mid' : sheetPosition === 'mid' ? 'max' : 'min';
    const targetHeight = nextPosition === 'min' ? SHEET_MIN_HEIGHT : nextPosition === 'mid' ? SHEET_MID_HEIGHT : SHEET_MAX_HEIGHT;
    
    setSheetPosition(nextPosition);
    Animated.spring(sheetHeight, {
      toValue: targetHeight,
      useNativeDriver: false,
      tension: 50,
      friction: 10,
    }).start();
  };

  const renderUser = ({ item: user }: { item: NearbyUser }) => {
    const readiness = chatReadinessConfig[user.chatReadiness];

    return (
      <TouchableOpacity
        onPress={() => handleUserPress(user)}
        className="flex-row items-center p-4 border-b border-gray-100"
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View className="relative">
          {user.avatar ? (
            <Image
              source={{ uri: user.avatar }}
              className="w-14 h-14 rounded-full bg-gray-200"
            />
          ) : (
            <View className="w-14 h-14 rounded-full bg-primary-100 items-center justify-center">
              <Text className="text-xl font-bold text-primary-500">
                {user.displayName.charAt(0)}
              </Text>
            </View>
          )}
          
          {/* Online indicator */}
          <View 
            className="absolute bottom-0 right-0 w-4 h-4 rounded-full border-2 border-white"
            style={{ backgroundColor: readiness.color }}
          />
        </View>

        {/* User Info */}
        <View className="flex-1 ml-3">
          <View className="flex-row items-center">
            <Text className="font-semibold text-gray-900">{user.displayName}</Text>
            {user.isVerified && (
              <Ionicons name="checkmark-circle" size={16} color="#3B82F6" className="ml-1" />
            )}
            <View className="ml-2 flex-row items-center">
              <Ionicons name="star" size={12} color="#F59E0B" />
              <Text className="text-xs text-gray-500 ml-0.5">{user.trustScore}</Text>
            </View>
          </View>
          
          {user.activityIntent && (
            <Text className="text-sm text-gray-600 mt-0.5" numberOfLines={1}>
              {user.activityIntent}
            </Text>
          )}
          
          <View className="flex-row items-center mt-1">
            <View className="flex-row items-center mr-3">
              <Ionicons name="location" size={12} color="#9CA3AF" />
              <Text className="text-xs text-gray-400 ml-1">
                {formatDistance(user.distance)}
              </Text>
            </View>
            <Text className="text-xs text-gray-400">
              {formatLastActive(user.lastActive)}
            </Text>
          </View>
        </View>

        {/* Chat Readiness Badge */}
        <View 
          className="px-2 py-1 rounded-full"
          style={{ backgroundColor: `${readiness.color}20` }}
        >
          <Ionicons 
            name={readiness.icon as any} 
            size={16} 
            color={readiness.color} 
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <Animated.View
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        height: sheetHeight,
        backgroundColor: 'white',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
        elevation: 10,
      }}
    >
      {/* Handle */}
      <View {...panResponder.panHandlers} className="items-center py-3">
        <TouchableOpacity onPress={handleExpandToggle}>
          <View className="w-10 h-1 bg-gray-300 rounded-full" />
        </TouchableOpacity>
      </View>

      {/* Header */}
      <View className="flex-row items-center justify-between px-4 pb-2">
        <View className="flex-row items-center">
          <Text className="text-lg font-bold text-gray-900">Nearby</Text>
          <View className="ml-2 bg-primary-100 px-2 py-0.5 rounded-full">
            <Text className="text-xs font-semibold text-primary-600">
              {users.length}
            </Text>
          </View>
        </View>
        
        <TouchableOpacity 
          onPress={handleRefresh}
          className="p-2"
        >
          <Ionicons 
            name="refresh" 
            size={20} 
            color={isRefreshing ? '#FF6B9D' : '#9CA3AF'} 
          />
        </TouchableOpacity>
      </View>

      {/* User List */}
      {sheetPosition !== 'min' && (
        <FlatList
          data={users}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor="#FF6B9D"
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 100 }}
          ListEmptyComponent={
            <View className="items-center py-12">
              <Ionicons name="people" size={48} color="#D1D5DB" />
              <Text className="text-gray-400 mt-4">No one nearby right now</Text>
              <Text className="text-gray-400 text-sm">
                Check back later or explore the map
              </Text>
            </View>
          }
        />
      )}

      {/* Minimized Preview */}
      {sheetPosition === 'min' && users.length > 0 && (
        <View className="flex-row items-center px-4">
          {/* Stacked Avatars */}
          <View className="flex-row">
            {users.slice(0, 3).map((user, index) => (
              <View
                key={user.id}
                style={{
                  marginLeft: index > 0 ? -12 : 0,
                  zIndex: 3 - index,
                }}
              >
                {user.avatar ? (
                  <Image
                    source={{ uri: user.avatar }}
                    className="w-8 h-8 rounded-full border-2 border-white"
                  />
                ) : (
                  <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center border-2 border-white">
                    <Text className="text-xs font-bold text-primary-500">
                      {user.displayName.charAt(0)}
                    </Text>
                  </View>
                )}
              </View>
            ))}
          </View>
          
          <Text className="ml-3 text-sm text-gray-600">
            {users.length} {users.length === 1 ? 'person' : 'people'} nearby
          </Text>
          
          <View className="flex-1" />
          
          <TouchableOpacity 
            onPress={handleExpandToggle}
            className="flex-row items-center"
          >
            <Text className="text-primary-500 font-medium text-sm mr-1">See all</Text>
            <Ionicons name="chevron-up" size={16} color="#FF6B9D" />
          </TouchableOpacity>
        </View>
      )}
    </Animated.View>
  );
}
