import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/auth/request-reset', { email });
      setSuccess(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      setError(err.message || 'Failed to send reset email. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <View className="flex-1 bg-white px-6 pt-16">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        {/* Success State */}
        <View className="flex-1 items-center justify-center -mt-20">
          <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-6">
            <Ionicons name="mail" size={40} color="#10B981" />
          </View>
          <Text className="text-2xl font-bold text-gray-900 text-center">
            Check your email
          </Text>
          <Text className="text-gray-500 mt-2 text-center px-8">
            We've sent a password reset link to{'\n'}
            <Text className="font-medium text-gray-700">{email}</Text>
          </Text>
          
          <HapticButton
            variant="primary"
            className="mt-8"
            onPress={() => router.push('/(auth)/login')}
          >
            Back to Sign In
          </HapticButton>

          <TouchableOpacity
            onPress={handleReset}
            className="mt-4"
          >
            <Text className="text-primary-500 font-medium">Resend email</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <View className="flex-1 px-6 pt-16">
        {/* Back Button */}
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          className="w-10 h-10 rounded-full bg-gray-100 items-center justify-center"
        >
          <Ionicons name="arrow-back" size={20} color="#374151" />
        </TouchableOpacity>

        {/* Header */}
        <View className="mt-8">
          <Text className="text-3xl font-bold text-gray-900">Reset password</Text>
          <Text className="text-gray-500 mt-2">
            Enter your email address and we'll send you a link to reset your password.
          </Text>
        </View>

        {/* Form */}
        <View className="mt-8">
          {/* Email Input */}
          <View className="mb-4">
            <Text className="text-gray-700 font-medium mb-2">Email</Text>
            <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
              <Ionicons name="mail-outline" size={20} color="#9CA3AF" />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor="#9CA3AF"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 py-4 px-3 text-gray-900"
              />
            </View>
          </View>

          {/* Error Message */}
          {error ? (
            <View className="mt-4 bg-red-50 p-3 rounded-xl flex-row items-center">
              <Ionicons name="alert-circle" size={20} color="#EF4444" />
              <Text className="text-red-600 ml-2 flex-1">{error}</Text>
            </View>
          ) : null}

          {/* Submit Button */}
          <HapticButton
            variant="primary"
            size="lg"
            isLoading={isLoading}
            onPress={handleReset}
            className="mt-6"
          >
            Send Reset Link
          </HapticButton>
        </View>

        {/* Back to Sign In */}
        <View className="flex-row justify-center mt-8">
          <Text className="text-gray-500">Remember your password? </Text>
          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login');
            }}
          >
            <Text className="text-primary-500 font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
