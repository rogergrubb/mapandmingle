import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/auth';
import { HapticButton } from '../../src/components/HapticButton';

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await login(email, password);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1 bg-white"
    >
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
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
            <Text className="text-3xl font-bold text-gray-900">Welcome back</Text>
            <Text className="text-gray-500 mt-2">
              Sign in to continue discovering connections
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

            {/* Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Password</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 py-4 px-3 text-gray-900"
                />
                <TouchableOpacity
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShowPassword(!showPassword);
                  }}
                >
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color="#9CA3AF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/forgot-password');
              }}
              className="self-end"
            >
              <Text className="text-primary-500 font-medium">Forgot password?</Text>
            </TouchableOpacity>

            {/* Error Message */}
            {error ? (
              <View className="mt-4 bg-red-50 p-3 rounded-xl flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-red-600 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Sign In Button */}
            <HapticButton
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleLogin}
              className="mt-6"
            >
              Sign In
            </HapticButton>
          </View>

          {/* Divider */}
          <View className="flex-row items-center my-8">
            <View className="flex-1 h-px bg-gray-200" />
            <Text className="text-gray-400 mx-4">or</Text>
            <View className="flex-1 h-px bg-gray-200" />
          </View>

          {/* Social Login Buttons */}
          <View className="space-y-3">
            <HapticButton
              variant="outline"
              size="lg"
              leftIcon={<Ionicons name="logo-apple" size={20} color="#000" />}
              onPress={() => {
                // TODO: Implement Apple Sign In
              }}
            >
              Continue with Apple
            </HapticButton>
            
            <HapticButton
              variant="outline"
              size="lg"
              className="mt-3"
              leftIcon={<Ionicons name="logo-google" size={20} color="#DB4437" />}
              onPress={() => {
                // TODO: Implement Google Sign In
              }}
            >
              Continue with Google
            </HapticButton>
          </View>

          {/* Sign Up Link */}
          <View className="flex-row justify-center mt-8 mb-8">
            <Text className="text-gray-500">Don't have an account? </Text>
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push('/(auth)/register');
              }}
            >
              <Text className="text-primary-500 font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
