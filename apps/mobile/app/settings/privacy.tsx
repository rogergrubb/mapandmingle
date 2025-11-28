import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';
import { useAuthStore } from '../../src/stores/auth';

// Visibility mode options
const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public', description: 'Anyone can see your profile', icon: 'globe' },
  { value: 'friends_only', label: 'Connections Only', description: 'Only people you\'ve connected with', icon: 'people' },
  { value: 'hidden', label: 'Hidden', description: 'Your profile is invisible', icon: 'eye-off' },
];

// Who can message options
const MESSAGE_OPTIONS = [
  { value: 'everyone', label: 'Everyone', description: 'Anyone can send you messages' },
  { value: 'verified', label: 'Verified Users', description: 'Only verified users can message' },
  { value: 'none', label: 'No One', description: 'Disable incoming messages' },
];

interface PrivacySettings {
  visibilityMode: string;
  whoCanMessage: string;
  whoCanSeePins: string;
  whoCanSeeProfile: string;
  showActivityStatus: boolean;
  hideLastOnline: boolean;
  ghostMode: boolean;
  incognitoMode: boolean;
  showAvailability: boolean;
}

interface BlockedUser {
  id: string;
  blockedUser: {
    id: string;
    name: string | null;
    image: string | null;
  };
  createdAt: string;
}

export default function PrivacySettingsScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();

  const [settings, setSettings] = useState<PrivacySettings>({
    visibilityMode: 'public',
    whoCanMessage: 'everyone',
    whoCanSeePins: 'everyone',
    whoCanSeeProfile: 'everyone',
    showActivityStatus: true,
    hideLastOnline: false,
    ghostMode: false,
    incognitoMode: false,
    showAvailability: true,
  });

  const [blockedUsers, setBlockedUsers] = useState<BlockedUser[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('visibility');

  const isPremium = profile?.subscriptionStatus === 'active';

  // Load settings from profile
  useEffect(() => {
    if (profile) {
      setSettings({
        visibilityMode: profile.visibilityMode || 'public',
        whoCanMessage: profile.whoCanMessage || 'everyone',
        whoCanSeePins: profile.whoCanSeePins || 'everyone',
        whoCanSeeProfile: profile.whoCanSeeProfile || 'everyone',
        showActivityStatus: profile.showActivityStatus ?? true,
        hideLastOnline: profile.hideLastOnline ?? false,
        ghostMode: profile.ghostMode ?? false,
        incognitoMode: profile.incognitoMode ?? false,
        showAvailability: profile.showAvailability ?? true,
      });
    }
    fetchBlockedUsers();
  }, [profile]);

  const fetchBlockedUsers = async () => {
    try {
      const data = await api.get<BlockedUser[]>('/api/safety/blocked');
      setBlockedUsers(data);
    } catch (error) {
      console.error('Error fetching blocked users:', error);
    }
  };

  const updateSetting = async (key: keyof PrivacySettings, value: any) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Check premium for certain features
    if (!isPremium && ['ghostMode', 'incognitoMode'].includes(key)) {
      Alert.alert(
        'Premium Feature',
        'This feature is only available for premium members.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/settings/subscription') },
        ]
      );
      return;
    }

    const previousValue = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      await api.put('/api/profile', { [key]: value });
      await refreshProfile();
    } catch (error) {
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: previousValue }));
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const handleUnblock = async (blockId: string, userName: string) => {
    Alert.alert(
      'Unblock User',
      `Are you sure you want to unblock ${userName || 'this user'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Unblock',
          onPress: async () => {
            try {
              await api.delete(`/api/safety/block/${blockId}`);
              setBlockedUsers((prev) => prev.filter((b) => b.id !== blockId));
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } catch (error) {
              Alert.alert('Error', 'Failed to unblock user. Please try again.');
            }
          },
        },
      ]
    );
  };

  const toggleSection = (section: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedSection(expandedSection === section ? null : section);
  };

  const renderSettingToggle = (
    title: string,
    description: string,
    key: keyof PrivacySettings,
    icon: string,
    isPremiumFeature: boolean = false
  ) => (
    <View className="flex-row items-center py-4 border-b border-gray-100">
      <View className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center mr-3">
        <Ionicons name={icon as any} size={20} color="#6B7280" />
      </View>
      <View className="flex-1">
        <View className="flex-row items-center">
          <Text className="text-gray-900 font-medium">{title}</Text>
          {isPremiumFeature && (
            <View className="ml-2 bg-purple-100 px-2 py-0.5 rounded">
              <Text className="text-purple-600 text-xs font-medium">Premium</Text>
            </View>
          )}
        </View>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
      <Switch
        value={settings[key] as boolean}
        onValueChange={(value) => updateSetting(key, value)}
        trackColor={{ false: '#E5E7EB', true: '#FF6B9D' }}
        thumbColor="white"
        disabled={isPremiumFeature && !isPremium}
      />
    </View>
  );

  const renderOptionSelector = (
    title: string,
    options: typeof VISIBILITY_OPTIONS,
    currentValue: string,
    settingKey: keyof PrivacySettings
  ) => (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-3">{title}</Text>
      <View className="space-y-2">
        {options.map((option) => {
          const isSelected = currentValue === option.value;
          return (
            <TouchableOpacity
              key={option.value}
              onPress={() => updateSetting(settingKey, option.value)}
              className={`flex-row items-center p-4 rounded-xl border ${
                isSelected ? 'border-primary-500 bg-primary-50' : 'border-gray-200 bg-white'
              }`}
              activeOpacity={0.7}
            >
              {'icon' in option && (
                <View
                  className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                    isSelected ? 'bg-primary-500' : 'bg-gray-100'
                  }`}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={20}
                    color={isSelected ? 'white' : '#6B7280'}
                  />
                </View>
              )}
              <View className="flex-1">
                <Text className={`font-medium ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
                  {option.label}
                </Text>
                <Text className={`text-sm ${isSelected ? 'text-primary-600' : 'text-gray-500'}`}>
                  {option.description}
                </Text>
              </View>
              {isSelected && (
                <Ionicons name="checkmark-circle" size={24} color="#FF6B9D" />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Privacy & Safety' }} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Visibility Section */}
        <Animated.View entering={FadeInDown.duration(300)} className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSection('visibility')}
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                <Ionicons name="eye" size={20} color="#3B82F6" />
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">Profile Visibility</Text>
                <Text className="text-gray-500 text-sm">Control who can see you</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSection === 'visibility' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {expandedSection === 'visibility' && (
            <View className="px-4 pb-4">
              {renderOptionSelector(
                'Who can see your profile?',
                VISIBILITY_OPTIONS,
                settings.visibilityMode,
                'visibilityMode'
              )}
            </View>
          )}
        </Animated.View>

        {/* Messaging Section */}
        <Animated.View entering={FadeInDown.duration(300).delay(100)} className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSection('messaging')}
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-green-100 items-center justify-center mr-3">
                <Ionicons name="chatbubble" size={20} color="#10B981" />
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">Messaging</Text>
                <Text className="text-gray-500 text-sm">Control who can message you</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSection === 'messaging' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {expandedSection === 'messaging' && (
            <View className="px-4 pb-4">
              {renderOptionSelector(
                'Who can send you messages?',
                MESSAGE_OPTIONS,
                settings.whoCanMessage,
                'whoCanMessage'
              )}
            </View>
          )}
        </Animated.View>

        {/* Activity Status Section */}
        <Animated.View entering={FadeInDown.duration(300).delay(200)} className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSection('activity')}
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-purple-100 items-center justify-center mr-3">
                <Ionicons name="radio" size={20} color="#8B5CF6" />
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">Activity Status</Text>
                <Text className="text-gray-500 text-sm">Online & activity indicators</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSection === 'activity' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {expandedSection === 'activity' && (
            <View className="px-4 pb-2">
              {renderSettingToggle(
                'Show Activity Status',
                'Let others see when you\'re active',
                'showActivityStatus',
                'pulse'
              )}
              {renderSettingToggle(
                'Hide Last Online',
                'Don\'t show when you were last active',
                'hideLastOnline',
                'time'
              )}
              {renderSettingToggle(
                'Show Availability',
                'Display your chat readiness status',
                'showAvailability',
                'happy'
              )}
            </View>
          )}
        </Animated.View>

        {/* Premium Privacy Features */}
        <Animated.View entering={FadeInDown.duration(300).delay(300)} className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSection('premium')}
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center mr-3">
                <Ionicons name="star" size={20} color="#F59E0B" />
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">Premium Privacy</Text>
                <Text className="text-gray-500 text-sm">Advanced privacy features</Text>
              </View>
            </View>
            <Ionicons
              name={expandedSection === 'premium' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {expandedSection === 'premium' && (
            <View className="px-4 pb-2">
              {renderSettingToggle(
                'Ghost Mode',
                'Browse profiles without being seen',
                'ghostMode',
                'eye-off',
                true
              )}
              {renderSettingToggle(
                'Incognito Mode',
                'Hide your profile from search',
                'incognitoMode',
                'glasses',
                true
              )}

              {!isPremium && (
                <View className="bg-purple-50 rounded-xl p-4 mt-4 mb-4">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="star" size={20} color="#8B5CF6" />
                    <Text className="text-purple-800 font-semibold ml-2">
                      Unlock Premium Privacy
                    </Text>
                  </View>
                  <Text className="text-purple-700 text-sm mb-3">
                    Get Ghost Mode, Incognito Mode, and more advanced privacy features.
                  </Text>
                  <HapticButton
                    variant="primary"
                    size="sm"
                    onPress={() => router.push('/settings/subscription')}
                  >
                    Upgrade to Premium
                  </HapticButton>
                </View>
              )}
            </View>
          )}
        </Animated.View>

        {/* Blocked Users Section */}
        <Animated.View entering={FadeInDown.duration(300).delay(400)} className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden">
          <TouchableOpacity
            onPress={() => toggleSection('blocked')}
            className="flex-row items-center justify-between p-4"
            activeOpacity={0.7}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center mr-3">
                <Ionicons name="ban" size={20} color="#EF4444" />
              </View>
              <View>
                <Text className="text-gray-900 font-semibold">Blocked Users</Text>
                <Text className="text-gray-500 text-sm">
                  {blockedUsers.length} {blockedUsers.length === 1 ? 'user' : 'users'} blocked
                </Text>
              </View>
            </View>
            <Ionicons
              name={expandedSection === 'blocked' ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#9CA3AF"
            />
          </TouchableOpacity>

          {expandedSection === 'blocked' && (
            <View className="px-4 pb-4">
              {blockedUsers.length === 0 ? (
                <View className="py-6 items-center">
                  <Ionicons name="people-outline" size={40} color="#D1D5DB" />
                  <Text className="text-gray-500 mt-2">No blocked users</Text>
                </View>
              ) : (
                blockedUsers.map((block) => (
                  <View
                    key={block.id}
                    className="flex-row items-center py-3 border-b border-gray-100"
                  >
                    <View className="w-10 h-10 rounded-full bg-gray-200 items-center justify-center mr-3">
                      <Ionicons name="person" size={20} color="#9CA3AF" />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-900 font-medium">
                        {block.blockedUser.name || 'Anonymous'}
                      </Text>
                      <Text className="text-gray-500 text-sm">
                        Blocked {new Date(block.createdAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUnblock(block.id, block.blockedUser.name || 'this user')}
                      className="px-3 py-1.5 bg-gray-100 rounded-full"
                    >
                      <Text className="text-gray-700 font-medium text-sm">Unblock</Text>
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </View>
          )}
        </Animated.View>

        {/* Safety Tips */}
        <Animated.View entering={FadeInDown.duration(300).delay(500)} className="mx-4 mt-4 mb-8">
          <View className="bg-blue-50 rounded-2xl p-4">
            <View className="flex-row items-center mb-3">
              <Ionicons name="shield-checkmark" size={24} color="#3B82F6" />
              <Text className="text-blue-800 font-semibold ml-2">Safety Tips</Text>
            </View>
            <View className="space-y-2">
              <Text className="text-blue-700 text-sm">• Never share personal information like your address or phone number</Text>
              <Text className="text-blue-700 text-sm">• Meet in public places when meeting someone new</Text>
              <Text className="text-blue-700 text-sm">• Trust your instincts - if something feels off, it probably is</Text>
              <Text className="text-blue-700 text-sm">• Report suspicious behavior to help keep the community safe</Text>
            </View>
          </View>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
