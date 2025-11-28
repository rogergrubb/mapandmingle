import { useEffect, useRef, useState } from 'react';
import { Platform, AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { useRouter } from 'expo-router';
import { api } from './api';

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export interface PushNotificationData {
  type: 'message' | 'wave' | 'event' | 'mingle' | 'proximity' | 'forum' | 'system';
  id?: string;
  title?: string;
  body?: string;
  data?: Record<string, any>;
}

// Register for push notifications
export async function registerForPushNotificationsAsync(): Promise<string | null> {
  let token: string | null = null;

  if (!Device.isDevice) {
    console.log('Push notifications require a physical device');
    return null;
  }

  // Check permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Failed to get push token for notifications');
    return null;
  }

  // Get the token
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId: 'your-project-id', // Replace with actual project ID
    });
    token = tokenData.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }

  // Configure Android channel
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'Default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF6B9D',
    });

    await Notifications.setNotificationChannelAsync('messages', {
      name: 'Messages',
      importance: Notifications.AndroidImportance.HIGH,
      sound: 'default',
    });

    await Notifications.setNotificationChannelAsync('proximity', {
      name: 'Nearby Alerts',
      importance: Notifications.AndroidImportance.DEFAULT,
    });

    await Notifications.setNotificationChannelAsync('events', {
      name: 'Events & Mingles',
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  return token;
}

// Save push token to backend
export async function savePushToken(token: string): Promise<void> {
  try {
    await api.post('/api/users/me/push-token', {
      token,
      platform: Platform.OS,
      deviceId: Device.deviceName,
    });
  } catch (error) {
    console.error('Error saving push token:', error);
  }
}

// Remove push token from backend
export async function removePushToken(): Promise<void> {
  try {
    await api.delete('/api/users/me/push-token');
  } catch (error) {
    console.error('Error removing push token:', error);
  }
}

// Schedule local notification
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, any>,
  trigger?: Notifications.NotificationTriggerInput
): Promise<string> {
  const identifier = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: trigger || null, // null = immediate
  });

  return identifier;
}

// Cancel notification
export async function cancelNotification(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

// Cancel all notifications
export async function cancelAllNotifications(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

// Get badge count
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

// Set badge count
export async function setBadgeCount(count: number): Promise<void> {
  await Notifications.setBadgeCountAsync(count);
}

// Clear badge
export async function clearBadge(): Promise<void> {
  await Notifications.setBadgeCountAsync(0);
}

// Custom hook for push notifications
export function usePushNotifications() {
  const router = useRouter();
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  
  const notificationListener = useRef<Notifications.Subscription>();
  const responseListener = useRef<Notifications.Subscription>();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    // Register for push notifications
    registerForPushNotificationsAsync().then((token) => {
      if (token) {
        setExpoPushToken(token);
        savePushToken(token);
      }
    });

    // Listen for incoming notifications while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener((notification) => {
      setNotification(notification);
      handleNotificationReceived(notification);
    });

    // Listen for user interaction with notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
      handleNotificationResponse(response);
    });

    // Handle app state changes (for badge management)
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      subscription.remove();
    };
  }, []);

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      // App has come to the foreground, clear badge
      clearBadge();
    }
    appState.current = nextAppState;
  };

  const handleNotificationReceived = (notification: Notifications.Notification) => {
    const data = notification.request.content.data as PushNotificationData;
    
    // Handle different notification types
    switch (data.type) {
      case 'message':
        // Could trigger in-app notification toast
        break;
      case 'wave':
        // Could show wave received toast
        break;
      case 'proximity':
        // Could trigger proximity alert
        break;
      default:
        break;
    }
  };

  const handleNotificationResponse = (response: Notifications.NotificationResponse) => {
    const data = response.notification.request.content.data as PushNotificationData;
    
    // Navigate based on notification type
    switch (data.type) {
      case 'message':
        if (data.id) {
          router.push(`/chat/${data.id}`);
        }
        break;
      case 'wave':
        if (data.id) {
          router.push(`/profile/${data.id}`);
        }
        break;
      case 'event':
        if (data.id) {
          router.push(`/event/${data.id}`);
        }
        break;
      case 'mingle':
        if (data.id) {
          router.push(`/mingle/${data.id}`);
        }
        break;
      case 'proximity':
        // Go to map and focus on user
        router.push('/(tabs)');
        break;
      case 'forum':
        if (data.id) {
          router.push(`/forums/post/${data.id}`);
        }
        break;
      default:
        break;
    }
  };

  return {
    expoPushToken,
    notification,
  };
}

// Notification preferences
export interface NotificationPreferences {
  messages: boolean;
  waves: boolean;
  proximity: boolean;
  events: boolean;
  mingles: boolean;
  forums: boolean;
  marketing: boolean;
  quietHoursEnabled: boolean;
  quietHoursStart: string; // HH:MM format
  quietHoursEnd: string;
}

export async function getNotificationPreferences(): Promise<NotificationPreferences> {
  try {
    const response = await api.get<NotificationPreferences>('/api/users/me/notification-preferences');
    return response;
  } catch (error) {
    return {
      messages: true,
      waves: true,
      proximity: true,
      events: true,
      mingles: true,
      forums: true,
      marketing: false,
      quietHoursEnabled: false,
      quietHoursStart: '22:00',
      quietHoursEnd: '08:00',
    };
  }
}

export async function updateNotificationPreferences(
  preferences: Partial<NotificationPreferences>
): Promise<void> {
  await api.put('/api/users/me/notification-preferences', preferences);
}
