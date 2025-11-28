import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Linking,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAuthStore } from '../../src/stores/auth';
import { HapticButton } from '../../src/components/HapticButton';

// Legal document URLs - update these with your actual URLs
const TERMS_URL = 'https://mapandmingle.app/terms';
const PRIVACY_URL = 'https://mapandmingle.app/privacy';

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuthStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const validatePassword = (pass: string) => {
    if (pass.length < 8) return 'Password must be at least 8 characters';
    if (!/[A-Z]/.test(pass)) return 'Password must contain an uppercase letter';
    if (!/[a-z]/.test(pass)) return 'Password must contain a lowercase letter';
    if (!/[0-9]/.test(pass)) return 'Password must contain a number';
    return null;
  };

  const handleRegister = async () => {
    setError('');

    if (!name || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (!acceptedTerms) {
      setError('Please accept the terms and conditions');
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      await register(email, password, name);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please try again.');
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
            <Text className="text-3xl font-bold text-gray-900">Create account</Text>
            <Text className="text-gray-500 mt-2">
              Join Map Mingle and start making connections
            </Text>
          </View>

          {/* Trial Badge */}
          <View className="mt-4 bg-purple-50 p-3 rounded-xl flex-row items-center">
            <Ionicons name="gift" size={20} color="#9333EA" />
            <Text className="text-purple-700 ml-2 flex-1">
              Get 30 days of Premium free when you sign up!
            </Text>
          </View>

          {/* Form */}
          <View className="mt-6">
            {/* Name Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Name</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                <Ionicons name="person-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={name}
                  onChangeText={setName}
                  placeholder="Your name"
                  placeholderTextColor="#9CA3AF"
                  autoCapitalize="words"
                  className="flex-1 py-4 px-3 text-gray-900"
                />
              </View>
            </View>

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
                  placeholder="Create a password"
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
              <Text className="text-gray-400 text-xs mt-1">
                8+ characters, uppercase, lowercase, and number required
              </Text>
            </View>

            {/* Confirm Password Input */}
            <View className="mb-4">
              <Text className="text-gray-700 font-medium mb-2">Confirm Password</Text>
              <View className="flex-row items-center bg-gray-50 rounded-xl px-4 border border-gray-200">
                <Ionicons name="lock-closed-outline" size={20} color="#9CA3AF" />
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  className="flex-1 py-4 px-3 text-gray-900"
                />
              </View>
            </View>

            {/* Terms Checkbox */}
            <View className="flex-row items-start mt-2">
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setAcceptedTerms(!acceptedTerms);
                }}
                className="mt-0.5"
              >
                <View
                  className={`w-6 h-6 rounded-md border-2 items-center justify-center mr-3 ${
                    acceptedTerms ? 'bg-pink-500 border-pink-500' : 'border-gray-300'
                  }`}
                >
                  {acceptedTerms && (
                    <Ionicons name="checkmark" size={16} color="white" />
                  )}
                </View>
              </TouchableOpacity>
              <Text className="flex-1 text-gray-600 text-sm leading-5">
                I accept the{' '}
                <Text
                  className="text-pink-500 font-semibold underline"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(TERMS_URL).catch(() => {
                      Alert.alert('Error', 'Could not open Terms of Service');
                    });
                  }}
                >
                  Terms of Service
                </Text>
                {' '}and{' '}
                <Text
                  className="text-pink-500 font-semibold underline"
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    Linking.openURL(PRIVACY_URL).catch(() => {
                      Alert.alert('Error', 'Could not open Privacy Policy');
                    });
                  }}
                >
                  Privacy Policy
                </Text>
              </Text>
            </View>

            {/* Error Message */}
            {error ? (
              <View className="mt-4 bg-red-50 p-3 rounded-xl flex-row items-center">
                <Ionicons name="alert-circle" size={20} color="#EF4444" />
                <Text className="text-red-600 ml-2 flex-1">{error}</Text>
              </View>
            ) : null}

            {/* Sign Up Button */}
            <HapticButton
              variant="primary"
              size="lg"
              isLoading={isLoading}
              onPress={handleRegister}
              className="mt-6"
            >
              Create Account
            </HapticButton>
          </View>

          {/* Sign In Link */}
          <View className="flex-row justify-center mt-8 mb-8">
            <Text className="text-gray-500">Already have an account? </Text>
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
