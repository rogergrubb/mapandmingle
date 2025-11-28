import { Stack } from 'expo-router';
import { useState, createContext, useContext } from 'react';

// Onboarding data that persists across screens
interface OnboardingData {
  // Permissions
  locationGranted: boolean;
  notificationsGranted: boolean;
  
  // Profile basics
  name: string;
  photo: string | null;
  
  // Demographics
  age: string;
  gender: 'male' | 'female' | 'non-binary' | 'prefer-not-to-say' | null;
  
  // Interests & Intent
  interests: string[];
  lookingFor: string[];
  activityIntent: string | null;
  
  // Privacy
  ghostModeEnabled: boolean;
  showAge: boolean;
  showDistance: boolean;
}

const defaultData: OnboardingData = {
  locationGranted: false,
  notificationsGranted: false,
  name: '',
  photo: null,
  age: '',
  gender: null,
  interests: [],
  lookingFor: [],
  activityIntent: null,
  ghostModeEnabled: false,
  showAge: true,
  showDistance: true,
};

interface OnboardingContextType {
  data: OnboardingData;
  updateData: (updates: Partial<OnboardingData>) => void;
}

const OnboardingContext = createContext<OnboardingContextType | null>(null);

export function useOnboarding() {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
}

export default function OnboardingLayout() {
  const [data, setData] = useState<OnboardingData>(defaultData);

  const updateData = (updates: Partial<OnboardingData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  return (
    <OnboardingContext.Provider value={{ data, updateData }}>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      >
        <Stack.Screen name="welcome" />
        <Stack.Screen name="permissions" />
        <Stack.Screen name="profile-basics" />
        <Stack.Screen name="demographics" />
        <Stack.Screen name="interests" />
        <Stack.Screen name="looking-for" />
        <Stack.Screen name="activity-intent" />
        <Stack.Screen name="privacy" />
        <Stack.Screen name="complete" />
      </Stack>
    </OnboardingContext.Provider>
  );
}
