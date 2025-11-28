import { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  ActivityIndicator,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  FadeIn,
  FadeInDown,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';
import { useAuthStore } from '../../src/stores/auth';

// Premium features
const PREMIUM_FEATURES = [
  {
    icon: 'eye-off',
    title: 'Ghost Mode',
    description: 'Browse profiles without being seen',
    color: '#8B5CF6',
  },
  {
    icon: 'glasses',
    title: 'Incognito Mode',
    description: 'Hide from search and recommendations',
    color: '#6366F1',
  },
  {
    icon: 'rocket',
    title: 'Profile Boost',
    description: 'Get seen by more people nearby',
    color: '#EC4899',
  },
  {
    icon: 'infinite',
    title: 'Unlimited Messages',
    description: 'No daily message limits',
    color: '#10B981',
  },
  {
    icon: 'sparkles',
    title: 'AI Icebreakers',
    description: 'Get personalized conversation starters',
    color: '#F59E0B',
  },
  {
    icon: 'checkmark-shield',
    title: 'Priority Support',
    description: 'Get help faster when you need it',
    color: '#3B82F6',
  },
  {
    icon: 'star',
    title: 'Premium Badge',
    description: 'Stand out with a premium profile badge',
    color: '#EF4444',
  },
  {
    icon: 'analytics',
    title: 'Profile Analytics',
    description: 'See who viewed your profile',
    color: '#14B8A6',
  },
];

const PRICE_MONTHLY = 4.99;
const PRICE_YEARLY = 39.99;

export default function SubscriptionScreen() {
  const router = useRouter();
  const { profile, refreshProfile } = useAuthStore();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('monthly');
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);

  // Animation
  const starScale = useSharedValue(1);

  useEffect(() => {
    starScale.value = withRepeat(
      withSequence(
        withSpring(1.1, { damping: 2 }),
        withSpring(1, { damping: 2 })
      ),
      -1,
      true
    );
  }, []);

  const starStyle = useAnimatedStyle(() => ({
    transform: [{ scale: starScale.value }],
  }));

  const isPremium = profile?.subscriptionStatus === 'active';
  const isTrial = profile?.subscriptionStatus === 'trial';
  const subscriptionExpiresAt = profile?.subscriptionExpiresAt
    ? new Date(profile.subscriptionExpiresAt)
    : null;

  const handleSubscribe = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      // Create checkout session
      const response = await api.post<{ url: string }>('/api/subscription/create-checkout', {
        planType: selectedPlan,
      });

      // Open Stripe checkout in browser
      const supported = await Linking.canOpenURL(response.url);
      if (supported) {
        await Linking.openURL(response.url);
      } else {
        Alert.alert('Error', 'Could not open payment page. Please try again.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to start subscription. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleManageSubscription = async () => {
    setIsLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const response = await api.post<{ url: string }>('/api/subscription/portal');

      const supported = await Linking.canOpenURL(response.url);
      if (supported) {
        await Linking.openURL(response.url);
      } else {
        Alert.alert('Error', 'Could not open subscription portal.');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to open subscription portal.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestorePurchases = async () => {
    setIsRestoring(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      await api.post('/api/subscription/restore');
      await refreshProfile();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Purchases restored successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'No active subscription found.');
    } finally {
      setIsRestoring(false);
    }
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          title: 'Premium',
          headerTransparent: false,
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <LinearGradient
          colors={['#8B5CF6', '#EC4899']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          className="px-6 pt-6 pb-10"
        >
          <Animated.View style={starStyle} className="items-center">
            <View className="w-20 h-20 rounded-full bg-white/20 items-center justify-center mb-4">
              <Ionicons name="star" size={40} color="white" />
            </View>
          </Animated.View>
          <Text className="text-white text-3xl font-bold text-center">
            {isPremium ? 'You\'re Premium!' : 'Go Premium'}
          </Text>
          <Text className="text-white/80 text-center mt-2">
            {isPremium
              ? 'Enjoy all the exclusive features'
              : 'Unlock all features and get the most out of Map Mingle'}
          </Text>

          {/* Status Badge */}
          {(isPremium || isTrial) && (
            <View className="bg-white/20 self-center mt-4 px-4 py-2 rounded-full">
              <Text className="text-white font-medium">
                {isTrial ? '🎉 Free Trial Active' : '⭐ Premium Member'}
              </Text>
            </View>
          )}
        </LinearGradient>

        {/* Current Status Card */}
        {(isPremium || isTrial) && (
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="bg-white mx-4 -mt-4 rounded-2xl p-4 shadow-sm"
          >
            <View className="flex-row items-center">
              <View className="w-12 h-12 rounded-full bg-purple-100 items-center justify-center">
                <Ionicons name="calendar" size={24} color="#8B5CF6" />
              </View>
              <View className="ml-3 flex-1">
                <Text className="text-gray-900 font-semibold">
                  {isTrial ? 'Trial Period' : 'Active Subscription'}
                </Text>
                <Text className="text-gray-500 text-sm">
                  {subscriptionExpiresAt
                    ? `${isTrial ? 'Ends' : 'Renews'} on ${formatDate(subscriptionExpiresAt)}`
                    : 'Lifetime access'}
                </Text>
              </View>
            </View>

            {isPremium && (
              <HapticButton
                variant="secondary"
                onPress={handleManageSubscription}
                isLoading={isLoading}
                className="mt-4"
              >
                Manage Subscription
              </HapticButton>
            )}
          </Animated.View>
        )}

        {/* Features List */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(100)}
          className="mx-4 mt-6"
        >
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Premium Features
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden">
            {PREMIUM_FEATURES.map((feature, index) => (
              <View
                key={feature.title}
                className={`flex-row items-center p-4 ${
                  index !== PREMIUM_FEATURES.length - 1 ? 'border-b border-gray-100' : ''
                }`}
              >
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${feature.color}20` }}
                >
                  <Ionicons name={feature.icon as any} size={20} color={feature.color} />
                </View>
                <View className="ml-3 flex-1">
                  <Text className="text-gray-900 font-medium">{feature.title}</Text>
                  <Text className="text-gray-500 text-sm">{feature.description}</Text>
                </View>
                {isPremium && (
                  <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                )}
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Pricing Section - Only show if not premium */}
        {!isPremium && (
          <Animated.View
            entering={FadeInDown.duration(300).delay(200)}
            className="mx-4 mt-6"
          >
            <Text className="text-lg font-semibold text-gray-900 mb-4">
              Choose Your Plan
            </Text>

            {/* Monthly Plan */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPlan('monthly');
              }}
              className={`bg-white rounded-2xl p-4 mb-3 border-2 ${
                selectedPlan === 'monthly' ? 'border-purple-500' : 'border-transparent'
              }`}
              activeOpacity={0.7}
            >
              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-semibold text-lg">Monthly</Text>
                  <Text className="text-gray-500">Billed monthly</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-900">${PRICE_MONTHLY}</Text>
                  <Text className="text-gray-500">/month</Text>
                </View>
              </View>
              {selectedPlan === 'monthly' && (
                <View className="absolute top-4 right-4">
                  <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                </View>
              )}
            </TouchableOpacity>

            {/* Yearly Plan */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedPlan('yearly');
              }}
              className={`bg-white rounded-2xl p-4 border-2 relative overflow-hidden ${
                selectedPlan === 'yearly' ? 'border-purple-500' : 'border-transparent'
              }`}
              activeOpacity={0.7}
            >
              {/* Best Value Badge */}
              <View className="absolute top-0 right-0 bg-green-500 px-3 py-1 rounded-bl-xl">
                <Text className="text-white text-xs font-bold">SAVE 33%</Text>
              </View>

              <View className="flex-row items-center justify-between">
                <View>
                  <Text className="text-gray-900 font-semibold text-lg">Yearly</Text>
                  <Text className="text-gray-500">Billed annually</Text>
                </View>
                <View className="items-end">
                  <Text className="text-2xl font-bold text-gray-900">${PRICE_YEARLY}</Text>
                  <Text className="text-gray-500">/year</Text>
                  <Text className="text-green-600 text-sm">
                    ${(PRICE_YEARLY / 12).toFixed(2)}/mo
                  </Text>
                </View>
              </View>
              {selectedPlan === 'yearly' && (
                <View className="absolute top-12 right-4">
                  <Ionicons name="checkmark-circle" size={24} color="#8B5CF6" />
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* FAQ Section */}
        <Animated.View
          entering={FadeInDown.duration(300).delay(300)}
          className="mx-4 mt-6 mb-8"
        >
          <Text className="text-lg font-semibold text-gray-900 mb-4">
            Frequently Asked Questions
          </Text>

          <View className="bg-white rounded-2xl overflow-hidden">
            {[
              {
                q: 'Can I cancel anytime?',
                a: 'Yes! You can cancel your subscription at any time. Your premium features will remain active until the end of your billing period.',
              },
              {
                q: 'Will I lose my data if I cancel?',
                a: 'No, your data remains safe. You\'ll just lose access to premium features until you resubscribe.',
              },
              {
                q: 'Is there a free trial?',
                a: 'New users get a 7-day free trial of premium features. No credit card required!',
              },
              {
                q: 'How do I get a refund?',
                a: 'Contact our support team within 14 days of purchase for a full refund.',
              },
            ].map((item, index) => (
              <View
                key={index}
                className={`p-4 ${index !== 3 ? 'border-b border-gray-100' : ''}`}
              >
                <Text className="text-gray-900 font-medium">{item.q}</Text>
                <Text className="text-gray-500 text-sm mt-1">{item.a}</Text>
              </View>
            ))}
          </View>
        </Animated.View>

        {/* Restore Purchases */}
        <View className="mx-4 mb-8">
          <TouchableOpacity
            onPress={handleRestorePurchases}
            disabled={isRestoring}
            className="py-3"
          >
            {isRestoring ? (
              <ActivityIndicator color="#6B7280" />
            ) : (
              <Text className="text-gray-500 text-center">Restore Purchases</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Bottom padding for button */}
        {!isPremium && <View className="h-24" />}
      </ScrollView>

      {/* Subscribe Button */}
      {!isPremium && (
        <Animated.View
          entering={FadeIn.duration(300).delay(400)}
          className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-4 pb-8"
        >
          <HapticButton
            variant="primary"
            size="lg"
            onPress={handleSubscribe}
            isLoading={isLoading}
            style={{ backgroundColor: '#8B5CF6' }}
          >
            {selectedPlan === 'monthly'
              ? `Subscribe for $${PRICE_MONTHLY}/month`
              : `Subscribe for $${PRICE_YEARLY}/year`}
          </HapticButton>
          <Text className="text-gray-400 text-xs text-center mt-2">
            Cancel anytime. Terms and conditions apply.
          </Text>
        </Animated.View>
      )}
    </View>
  );
}
