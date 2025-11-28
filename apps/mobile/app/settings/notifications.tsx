import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';

interface NotificationSettings {
  // Push Notification Categories
  newMessages: boolean;
  newMatches: boolean;
  pinLikes: boolean;
  pinReplies: boolean;
  eventReminders: boolean;
  eventUpdates: boolean;
  mingleAlerts: boolean;
  proximityAlerts: boolean;
  weeklyDigest: boolean;
  marketingEmails: boolean;
  
  // Quiet Hours
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
}

const DEFAULT_SETTINGS: NotificationSettings = {
  newMessages: true,
  newMatches: true,
  pinLikes: true,
  pinReplies: true,
  eventReminders: true,
  eventUpdates: true,
  mingleAlerts: true,
  proximityAlerts: false,
  weeklyDigest: true,
  marketingEmails: false,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '08:00',
};

const NOTIFICATION_SECTIONS = [
  {
    title: 'Messages & Connections',
    icon: 'chatbubble',
    color: '#10B981',
    settings: [
      {
        key: 'newMessages',
        title: 'New Messages',
        description: 'When someone sends you a message',
      },
      {
        key: 'newMatches',
        title: 'New Matches',
        description: 'When you match with someone nearby',
      },
    ],
  },
  {
    title: 'Pins',
    icon: 'location',
    color: '#FF6B9D',
    settings: [
      {
        key: 'pinLikes',
        title: 'Pin Likes',
        description: 'When someone likes your pin',
      },
      {
        key: 'pinReplies',
        title: 'Pin Replies',
        description: 'When someone replies to your pin',
      },
    ],
  },
  {
    title: 'Events',
    icon: 'calendar',
    color: '#8B5CF6',
    settings: [
      {
        key: 'eventReminders',
        title: 'Event Reminders',
        description: 'Reminders before events you\'re attending',
      },
      {
        key: 'eventUpdates',
        title: 'Event Updates',
        description: 'Changes to events you\'re interested in',
      },
    ],
  },
  {
    title: 'Discovery',
    icon: 'compass',
    color: '#F59E0B',
    settings: [
      {
        key: 'mingleAlerts',
        title: 'Mingle Alerts',
        description: 'New mingles happening nearby',
      },
      {
        key: 'proximityAlerts',
        title: 'Proximity Alerts',
        description: 'When someone matching your preferences is nearby',
      },
    ],
  },
  {
    title: 'Email',
    icon: 'mail',
    color: '#3B82F6',
    settings: [
      {
        key: 'weeklyDigest',
        title: 'Weekly Digest',
        description: 'Summary of activity and recommendations',
      },
      {
        key: 'marketingEmails',
        title: 'Marketing Emails',
        description: 'News, offers, and product updates',
      },
    ],
  },
];

export default function NotificationsSettingsScreen() {
  const [settings, setSettings] = useState<NotificationSettings>(DEFAULT_SETTINGS);
  const [pushPermission, setPushPermission] = useState<'granted' | 'denied' | 'undetermined'>('undetermined');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkPushPermission();
    fetchSettings();
  }, []);

  const checkPushPermission = async () => {
    const { status } = await Notifications.getPermissionsAsync();
    setPushPermission(status);
  };

  const fetchSettings = async () => {
    try {
      const data = await api.get<NotificationSettings>('/api/profile/notifications');
      setSettings({ ...DEFAULT_SETTINGS, ...data });
    } catch (error) {
      console.error('Error fetching notification settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: keyof NotificationSettings, value: boolean | string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const previousValue = settings[key];
    setSettings((prev) => ({ ...prev, [key]: value }));

    try {
      await api.put('/api/profile/notifications', { [key]: value });
    } catch (error) {
      // Revert on error
      setSettings((prev) => ({ ...prev, [key]: previousValue }));
      Alert.alert('Error', 'Failed to update setting. Please try again.');
    }
  };

  const requestPushPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (pushPermission === 'denied') {
      // Open system settings
      Alert.alert(
        'Enable Notifications',
        'Push notifications are disabled. Would you like to enable them in Settings?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Open Settings',
            onPress: () => Linking.openSettings(),
          },
        ]
      );
      return;
    }

    const { status } = await Notifications.requestPermissionsAsync();
    setPushPermission(status);

    if (status === 'granted') {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
  };

  const toggleAllInSection = (sectionSettings: typeof NOTIFICATION_SECTIONS[0]['settings'], enable: boolean) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    sectionSettings.forEach((setting) => {
      updateSetting(setting.key as keyof NotificationSettings, enable);
    });
  };

  const disableAll = () => {
    Alert.alert(
      'Disable All Notifications',
      'Are you sure you want to disable all notifications? You may miss important updates.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disable All',
          style: 'destructive',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            NOTIFICATION_SECTIONS.forEach((section) => {
              section.settings.forEach((setting) => {
                updateSetting(setting.key as keyof NotificationSettings, false);
              });
            });
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Notifications' }} />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Push Permission Status */}
        {pushPermission !== 'granted' && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="mx-4 mt-4 bg-yellow-50 rounded-2xl p-4"
          >
            <View className="flex-row items-start">
              <View className="w-10 h-10 rounded-full bg-yellow-100 items-center justify-center">
                <Ionicons name="notifications-off" size={20} color="#F59E0B" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-yellow-800 font-semibold">
                  Push Notifications {pushPermission === 'denied' ? 'Disabled' : 'Not Enabled'}
                </Text>
                <Text className="text-yellow-700 text-sm mt-1">
                  {pushPermission === 'denied'
                    ? 'Enable push notifications in your device settings to receive alerts.'
                    : 'Enable push notifications to stay updated on messages and events.'}
                </Text>
                <TouchableOpacity
                  onPress={requestPushPermission}
                  className="mt-3"
                >
                  <Text className="text-yellow-800 font-medium">
                    {pushPermission === 'denied' ? 'Open Settings' : 'Enable Notifications'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </Animated.View>
        )}

        {/* Notification Sections */}
        {NOTIFICATION_SECTIONS.map((section, sectionIndex) => (
          <Animated.View
            key={section.title}
            entering={FadeInDown.duration(300).delay(sectionIndex * 50)}
            className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden"
          >
            {/* Section Header */}
            <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
              <View className="flex-row items-center">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <Ionicons name={section.icon as any} size={20} color={section.color} />
                </View>
                <Text className="text-gray-900 font-semibold ml-3">{section.title}</Text>
              </View>
              <TouchableOpacity
                onPress={() => {
                  const allEnabled = section.settings.every(
                    (s) => settings[s.key as keyof NotificationSettings]
                  );
                  toggleAllInSection(section.settings, !allEnabled);
                }}
              >
                <Text className="text-primary-500 text-sm font-medium">
                  {section.settings.every((s) => settings[s.key as keyof NotificationSettings])
                    ? 'Disable All'
                    : 'Enable All'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Settings */}
            {section.settings.map((setting, settingIndex) => (
              <View
                key={setting.key}
                className={`flex-row items-center justify-between p-4 ${
                  settingIndex !== section.settings.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View className="flex-1 pr-4">
                  <Text className="text-gray-900 font-medium">{setting.title}</Text>
                  <Text className="text-gray-500 text-sm">{setting.description}</Text>
                </View>
                <Switch
                  value={settings[setting.key as keyof NotificationSettings] as boolean}
                  onValueChange={(value) =>
                    updateSetting(setting.key as keyof NotificationSettings, value)
                  }
                  trackColor={{ false: '#E5E7EB', true: '#FF6B9D' }}
                  thumbColor="white"
                />
              </View>
            ))}
          </Animated.View>
        ))}

        {/* Quiet Hours */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(250)}
          className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden"
        >
          <View className="flex-row items-center justify-between p-4 border-b border-gray-100">
            <View className="flex-row items-center">
              <View className="w-10 h-10 rounded-full bg-indigo-100 items-center justify-center">
                <Ionicons name="moon" size={20} color="#6366F1" />
              </View>
              <View className="ml-3">
                <Text className="text-gray-900 font-semibold">Quiet Hours</Text>
                <Text className="text-gray-500 text-sm">Pause notifications during set times</Text>
              </View>
            </View>
            <Switch
              value={settings.quietHoursEnabled}
              onValueChange={(value) => updateSetting('quietHoursEnabled', value)}
              trackColor={{ false: '#E5E7EB', true: '#FF6B9D' }}
              thumbColor="white"
            />
          </View>

          {settings.quietHoursEnabled && (
            <View className="p-4">
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-700 font-medium">From</Text>
                  <Text className="text-gray-500">{settings.quietHoursStart}</Text>
                </View>
                <Ionicons name="arrow-forward" size={20} color="#9CA3AF" />
                <View>
                  <Text className="text-gray-700 font-medium">To</Text>
                  <Text className="text-gray-500">{settings.quietHoursEnd}</Text>
                </View>
              </View>
              <Text className="text-gray-400 text-xs mt-3">
                You won't receive push notifications during quiet hours, but you'll still see them when you open the app.
              </Text>
            </View>
          )}
        </Animated.View>

        {/* Disable All Button */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(300)}
          className="mx-4 mt-6 mb-8"
        >
          <TouchableOpacity
            onPress={disableAll}
            className="py-3"
          >
            <Text className="text-red-500 text-center font-medium">Disable All Notifications</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}
