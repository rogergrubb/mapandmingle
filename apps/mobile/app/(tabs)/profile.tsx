import { useState, useEffect } from 'react';
import { View, Text, ScrollView, Image, TouchableOpacity, Switch } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';

interface ProfileStats {
  pinsCreated: number;
  likesReceived: number;
  eventsAttended: number;
  messagesSent: number;
}

interface Streak {
  streakType: string;
  currentStreak: number;
  longestStreak: number;
}

export default function ProfileScreen() {
  const router = useRouter();
  const { user, profile, isAuthenticated, logout, refreshProfile } = useAuthStore();
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [streaks, setStreaks] = useState<Streak[]>([]);
  const [isGhostMode, setIsGhostMode] = useState(false);

  useEffect(() => {
    if (isAuthenticated && profile) {
      setIsGhostMode(profile.ghostMode);
      fetchData();
    }
  }, [isAuthenticated, profile]);

  const fetchData = async () => {
    try {
      const streakData = await api.get<{ streaks: Streak[] }>('/api/streaks');
      setStreaks(streakData.streaks);
    } catch (error) {
      console.error('Error fetching profile data:', error);
    }
  };

  const handleLogout = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await logout();
    router.replace('/(auth)/login');
  };

  const handleGhostModeToggle = async (value: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsGhostMode(value);
    
    try {
      await api.put('/api/profile', { ghostMode: value });
      await refreshProfile();
    } catch (error) {
      console.error('Error updating ghost mode:', error);
      setIsGhostMode(!value); // Revert on error
    }
  };

  if (!isAuthenticated) {
    return (
      <View className="flex-1 bg-gray-50 items-center justify-center px-8">
        <View className="w-24 h-24 rounded-full bg-primary-100 items-center justify-center mb-6">
          <Ionicons name="person" size={48} color="#FF6B9D" />
        </View>
        <Text className="text-2xl font-bold text-gray-900 text-center">
          Join Map Mingle
        </Text>
        <Text className="text-gray-500 mt-2 text-center">
          Create an account to drop pins, connect with people, and discover events nearby.
        </Text>
        <HapticButton
          variant="primary"
          className="mt-6 w-full"
          onPress={() => router.push('/(auth)/register')}
        >
          Create Account
        </HapticButton>
        <HapticButton
          variant="outline"
          className="mt-3 w-full"
          onPress={() => router.push('/(auth)/login')}
        >
          Sign In
        </HapticButton>
      </View>
    );
  }

  const isPremium = profile?.subscriptionStatus === 'active' || profile?.subscriptionStatus === 'trial';

  return (
    <ScrollView className="flex-1 bg-gray-50">
      {/* Header with gradient */}
      <View className="bg-primary-500 pt-14 pb-20 px-4">
        <View className="flex-row justify-between items-center">
          <Text className="text-white text-lg font-semibold">Profile</Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings/edit-profile');
            }}
          >
            <Ionicons name="settings-outline" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Profile Card */}
      <View className="bg-white mx-4 -mt-12 rounded-2xl shadow-lg p-6">
        {/* Avatar */}
        <View className="items-center -mt-16">
          <View className="w-24 h-24 rounded-full bg-gray-200 border-4 border-white shadow-lg items-center justify-center">
            {profile?.avatar ? (
              <Image
                source={{ uri: profile.avatar }}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <Ionicons name="person" size={40} color="#9CA3AF" />
            )}
          </View>
          
          {/* Premium Badge */}
          {isPremium && (
            <View className="absolute -bottom-1 bg-purple-500 px-3 py-1 rounded-full flex-row items-center">
              <Ionicons name="star" size={12} color="white" />
              <Text className="text-white text-xs font-bold ml-1">PREMIUM</Text>
            </View>
          )}
        </View>

        {/* Name & Bio */}
        <View className="items-center mt-4">
          <Text className="text-xl font-bold text-gray-900">
            {profile?.displayName || user?.name || 'Anonymous'}
          </Text>
          {profile?.bio && (
            <Text className="text-gray-500 mt-1 text-center">
              {profile.bio}
            </Text>
          )}
        </View>

        {/* Trust Score */}
        <View className="flex-row items-center justify-center mt-4">
          <View className="flex-row items-center bg-green-50 px-3 py-1.5 rounded-full">
            <Ionicons name="shield-checkmark" size={16} color="#10B981" />
            <Text className="text-green-700 font-medium ml-1">
              Trust Score: {profile?.trustScore || 50}
            </Text>
          </View>
        </View>

        {/* Quick Stats */}
        <View className="flex-row mt-6 border-t border-gray-100 pt-4">
          <View className="flex-1 items-center">
            <Text className="text-2xl font-bold text-gray-900">
              {stats?.pinsCreated || 0}
            </Text>
            <Text className="text-gray-500 text-sm">Pins</Text>
          </View>
          <View className="flex-1 items-center border-l border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">
              {stats?.likesReceived || 0}
            </Text>
            <Text className="text-gray-500 text-sm">Likes</Text>
          </View>
          <View className="flex-1 items-center border-l border-gray-100">
            <Text className="text-2xl font-bold text-gray-900">
              {stats?.eventsAttended || 0}
            </Text>
            <Text className="text-gray-500 text-sm">Events</Text>
          </View>
        </View>
      </View>

      {/* Streaks */}
      {streaks.length > 0 && (
        <View className="mx-4 mt-4">
          <Text className="text-lg font-semibold text-gray-900 mb-3">Your Streaks 🔥</Text>
          <View className="flex-row flex-wrap">
            {streaks.map((streak) => (
              <View
                key={streak.streakType}
                className="bg-white rounded-xl p-4 mr-3 mb-3 shadow-sm"
                style={{ width: '47%' }}
              >
                <Text className="text-3xl font-bold text-primary-500">
                  {streak.currentStreak}
                </Text>
                <Text className="text-gray-500 text-sm capitalize">
                  {streak.streakType.replace('_', ' ')} streak
                </Text>
                <Text className="text-gray-400 text-xs mt-1">
                  Best: {streak.longestStreak}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View className="mx-4 mt-4">
        <Text className="text-lg font-semibold text-gray-900 mb-3">Quick Actions</Text>
        
        {/* Ghost Mode Toggle */}
        <View className="bg-white rounded-xl p-4 flex-row items-center justify-between shadow-sm mb-3">
          <View className="flex-row items-center flex-1">
            <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
              <Ionicons name="eye-off" size={20} color="#9333EA" />
            </View>
            <View className="flex-1">
              <Text className="font-medium text-gray-900">Ghost Mode</Text>
              <Text className="text-gray-500 text-sm">Browse invisibly</Text>
            </View>
          </View>
          <Switch
            value={isGhostMode}
            onValueChange={handleGhostModeToggle}
            trackColor={{ false: '#E5E7EB', true: '#C084FC' }}
            thumbColor={isGhostMode ? '#9333EA' : '#fff'}
            disabled={!isPremium}
          />
        </View>

        {/* Menu Items */}
        {[
          { icon: 'bookmark', label: 'Saved Pins', route: '/settings/saved-pins', color: '#FF6B9D' },
          { icon: 'shield-checkmark', label: 'Privacy & Safety', route: '/settings/privacy', color: '#10B981' },
          { icon: 'star', label: 'Premium', route: '/settings/subscription', color: '#F59E0B' },
          { icon: 'notifications', label: 'Notifications', route: '/settings/notifications', color: '#3B82F6' },
          { icon: 'person-circle', label: 'Account', route: '/settings/account', color: '#8B5CF6' },
          { icon: 'help-circle', label: 'Help & Support', route: '/settings/help', color: '#6B7280' },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push(item.route as any);
            }}
            className="bg-white rounded-xl p-4 flex-row items-center shadow-sm mb-3"
            activeOpacity={0.7}
          >
            <View
              className="w-10 h-10 rounded-full items-center justify-center mr-3"
              style={{ backgroundColor: `${item.color}20` }}
            >
              <Ionicons name={item.icon as any} size={20} color={item.color} />
            </View>
            <Text className="flex-1 font-medium text-gray-900">{item.label}</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        ))}
      </View>

      {/* Logout Button */}
      <View className="mx-4 mt-6 mb-32">
        <HapticButton
          variant="ghost"
          onPress={handleLogout}
          className="border border-red-200"
        >
          <Text className="text-red-500 font-medium">Sign Out</Text>
        </HapticButton>
      </View>
    </ScrollView>
  );
}
