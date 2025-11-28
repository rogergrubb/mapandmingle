import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { useAuthStore } from '../src/stores/auth';
import '../global.css';

// Keep splash screen visible while we fetch auth
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { initialize, isLoading } = useAuthStore();

  useEffect(() => {
    async function prepare() {
      try {
        await initialize();
      } catch (e) {
        console.warn('Auth init error:', e);
      } finally {
        await SplashScreen.hideAsync();
      }
    }
    prepare();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="auto" />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="splash" options={{ animation: 'fade' }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen 
          name="pin/[id]" 
          options={{ 
            headerShown: true,
            title: 'Pin Details',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="chat/[id]" 
          options={{ 
            headerShown: true,
            title: 'Chat',
          }} 
        />
        <Stack.Screen 
          name="profile/[id]" 
          options={{ 
            headerShown: true,
            title: 'Profile',
          }} 
        />
        <Stack.Screen 
          name="event/[id]" 
          options={{ 
            headerShown: true,
            title: 'Event',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="create-pin" 
          options={{ 
            headerShown: true,
            title: 'Drop a Pin',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="create-event" 
          options={{ 
            headerShown: true,
            title: 'Create Event',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="create-mingle" 
          options={{ 
            headerShown: true,
            title: 'Plan a Mingle',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="settings/edit-profile" 
          options={{ 
            headerShown: true,
            title: 'Edit Profile',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="settings/privacy" 
          options={{ 
            headerShown: true,
            title: 'Privacy & Safety',
          }} 
        />
        <Stack.Screen 
          name="settings/subscription" 
          options={{ 
            headerShown: true,
            title: 'Premium',
          }} 
        />
        <Stack.Screen 
          name="settings/saved-pins" 
          options={{ 
            headerShown: true,
            title: 'Saved Pins',
          }} 
        />
        <Stack.Screen 
          name="settings/notifications" 
          options={{ 
            headerShown: true,
            title: 'Notifications',
          }} 
        />
        <Stack.Screen 
          name="settings/help" 
          options={{ 
            headerShown: true,
            title: 'Help & Support',
          }} 
        />
        <Stack.Screen 
          name="settings/blocked-users" 
          options={{ 
            headerShown: true,
            title: 'Blocked Users',
          }} 
        />
        <Stack.Screen 
          name="settings/account" 
          options={{ 
            headerShown: true,
            title: 'Account',
          }} 
        />
        <Stack.Screen 
          name="video-call/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'fullScreenModal',
          }} 
        />
        <Stack.Screen 
          name="mingle/[id]" 
          options={{ 
            headerShown: false,
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="search" 
          options={{ 
            headerShown: false,
            animation: 'fade',
          }} 
        />
        <Stack.Screen 
          name="forums/index" 
          options={{ 
            headerShown: true,
            title: 'Community',
          }} 
        />
        <Stack.Screen 
          name="forums/create" 
          options={{ 
            headerShown: true,
            title: 'New Post',
            presentation: 'modal',
          }} 
        />
        <Stack.Screen 
          name="forums/post/[id]" 
          options={{ 
            headerShown: true,
            title: 'Post',
          }} 
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
