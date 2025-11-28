import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

const { width } = Dimensions.get('window');

interface UserContext {
  interests: string[];
  activityIntent?: string;
  location?: string;
  sharedInterests?: string[];
}

interface IcebreakerSuggestionProps {
  recipientId: string;
  recipientName: string;
  recipientContext?: UserContext;
  onSelect: (message: string) => void;
  onDismiss: () => void;
}

interface Icebreaker {
  id: string;
  text: string;
  category: 'casual' | 'interest' | 'activity' | 'location' | 'creative';
  icon: keyof typeof Ionicons.glyphMap;
}

// Static icebreakers for fallback
const staticIcebreakers: Icebreaker[] = [
  { id: '1', text: 'Hey! I noticed we\'re both here. What brings you out today?', category: 'casual', icon: 'hand-left' },
  { id: '2', text: 'Hi there! Love meeting new people. What\'s something interesting about you?', category: 'creative', icon: 'sparkles' },
  { id: '3', text: 'Hey! Any good spots around here you\'d recommend?', category: 'location', icon: 'map' },
  { id: '4', text: 'Hi! I\'m always looking to meet cool people. What do you do for fun?', category: 'casual', icon: 'happy' },
  { id: '5', text: 'Hey! New to the area and trying to meet people. How\'s your day going?', category: 'casual', icon: 'sunny' },
];

// Generate contextual icebreakers based on shared interests
const generateContextualIcebreakers = (context?: UserContext): Icebreaker[] => {
  const icebreakers: Icebreaker[] = [];

  if (context?.sharedInterests && context.sharedInterests.length > 0) {
    const interest = context.sharedInterests[0];
    icebreakers.push({
      id: `interest-${interest}`,
      text: `Hey! I saw we both like ${interest}. What got you into it?`,
      category: 'interest',
      icon: 'heart',
    });
  }

  if (context?.activityIntent) {
    icebreakers.push({
      id: 'activity-intent',
      text: `Hi! I noticed you're ${context.activityIntent.toLowerCase()}. Mind if I join?`,
      category: 'activity',
      icon: 'people',
    });
  }

  if (context?.location) {
    icebreakers.push({
      id: 'location',
      text: `Hey! I'm at ${context.location} too. First time here?`,
      category: 'location',
      icon: 'location',
    });
  }

  return icebreakers;
};

// Category colors
const categoryColors: Record<string, { bg: string; text: string }> = {
  casual: { bg: '#EFF6FF', text: '#3B82F6' },
  interest: { bg: '#FEF3C7', text: '#D97706' },
  activity: { bg: '#ECFDF5', text: '#10B981' },
  location: { bg: '#FEE2E2', text: '#EF4444' },
  creative: { bg: '#F3E8FF', text: '#8B5CF6' },
};

export default function IcebreakerSuggestion({
  recipientId,
  recipientName,
  recipientContext,
  onSelect,
  onDismiss,
}: IcebreakerSuggestionProps) {
  const [icebreakers, setIcebreakers] = useState<Icebreaker[]>([]);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const cardAnimations = useRef(icebreakers.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    // Combine contextual and static icebreakers
    const contextual = generateContextualIcebreakers(recipientContext);
    const combined = [...contextual, ...staticIcebreakers.slice(0, 5 - contextual.length)];
    setIcebreakers(combined);
    setIsLoading(false);

    // Entrance animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Stagger card animations
    combined.forEach((_, index) => {
      Animated.timing(cardAnimations[index] || new Animated.Value(0), {
        toValue: 1,
        duration: 200,
        delay: 100 + index * 80,
        useNativeDriver: true,
      }).start();
    });
  }, [recipientContext]);

  const handleSelect = (icebreaker: Icebreaker, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedIndex(index);

    // Brief highlight animation then callback
    setTimeout(() => {
      onSelect(icebreaker.text);
    }, 200);
  };

  const handleRefresh = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsLoading(true);

    try {
      // Try to get AI-generated icebreakers from backend
      const response = await api.post<{ icebreakers: Icebreaker[] }>('/api/icebreaker/generate', {
        recipientId,
        context: recipientContext,
      });
      
      if (response.icebreakers && response.icebreakers.length > 0) {
        setIcebreakers(response.icebreakers);
      }
    } catch (error) {
      // Shuffle static icebreakers as fallback
      const shuffled = [...staticIcebreakers].sort(() => Math.random() - 0.5);
      const contextual = generateContextualIcebreakers(recipientContext);
      setIcebreakers([...contextual, ...shuffled.slice(0, 5 - contextual.length)]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Animated.View
      style={{
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }],
      }}
      className="bg-white rounded-2xl p-4 shadow-lg mx-4 mb-4"
    >
      {/* Header */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-primary-100 items-center justify-center mr-2">
            <Ionicons name="chatbubbles" size={16} color="#FF6B9D" />
          </View>
          <View>
            <Text className="font-semibold text-gray-900">Start a conversation</Text>
            <Text className="text-xs text-gray-500">with {recipientName}</Text>
          </View>
        </View>
        
        <View className="flex-row items-center">
          <TouchableOpacity 
            onPress={handleRefresh}
            className="p-2 mr-1"
            disabled={isLoading}
          >
            <Ionicons 
              name="refresh" 
              size={18} 
              color={isLoading ? '#D1D5DB' : '#9CA3AF'} 
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={onDismiss} className="p-2">
            <Ionicons name="close" size={18} color="#9CA3AF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Icebreaker Cards */}
      <View className="space-y-2">
        {icebreakers.map((icebreaker, index) => {
          const colors = categoryColors[icebreaker.category];
          const isSelected = selectedIndex === index;

          return (
            <Animated.View
              key={icebreaker.id}
              style={{
                opacity: cardAnimations[index] || 1,
                transform: [
                  {
                    translateX: (cardAnimations[index] || new Animated.Value(1)).interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              }}
            >
              <TouchableOpacity
                onPress={() => handleSelect(icebreaker, index)}
                className={`p-3 rounded-xl border-2 mb-2 ${
                  isSelected ? 'border-primary-500 bg-primary-50' : 'border-transparent'
                }`}
                style={!isSelected ? { backgroundColor: colors.bg } : undefined}
                activeOpacity={0.7}
              >
                <View className="flex-row items-start">
                  <View 
                    className="w-8 h-8 rounded-full items-center justify-center mr-3 mt-0.5"
                    style={{ backgroundColor: isSelected ? '#FF6B9D' : colors.text + '20' }}
                  >
                    <Ionicons 
                      name={icebreaker.icon} 
                      size={16} 
                      color={isSelected ? 'white' : colors.text} 
                    />
                  </View>
                  <Text 
                    className={`flex-1 text-sm leading-5 ${
                      isSelected ? 'text-primary-700 font-medium' : 'text-gray-700'
                    }`}
                  >
                    {icebreaker.text}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={20} color="#FF6B9D" />
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          );
        })}
      </View>

      {/* Custom Message Option */}
      <TouchableOpacity
        onPress={onDismiss}
        className="mt-2 py-2"
      >
        <Text className="text-center text-gray-500 text-sm">
          Or write your own message
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}
