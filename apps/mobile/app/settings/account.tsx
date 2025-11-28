import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';

export default function AccountSettingsScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          onPress: () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            logout();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE to confirm');
      return;
    }

    setIsDeleting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

    try {
      await api.delete('/api/users/me');
      logout();
      router.replace('/(auth)/login');
    } catch (error) {
      Alert.alert('Error', 'Unable to delete account. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangePassword = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // In a real app, navigate to change password screen
    Alert.alert(
      'Change Password',
      'A password reset link will be sent to your email.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Link',
          onPress: async () => {
            try {
              await api.post('/api/auth/reset-password', { email: user?.email });
              Alert.alert('Success', 'Password reset link sent to your email.');
            } catch (error) {
              Alert.alert('Error', 'Unable to send reset link. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleChangeEmail = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert('Coming Soon', 'Email change functionality will be available soon.');
  };

  const handleExportData = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Alert.alert(
      'Export Your Data',
      'We\'ll prepare a download of all your data and send it to your email within 24 hours.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Request Export',
          onPress: async () => {
            try {
              await api.post('/api/users/me/export-data');
              Alert.alert('Success', 'You\'ll receive an email with your data within 24 hours.');
            } catch (error) {
              Alert.alert('Error', 'Unable to request data export. Please try again.');
            }
          },
        },
      ]
    );
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen
        options={{
          headerShown: true,
          title: 'Account',
          headerBackTitle: 'Back',
        }}
      />

      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Account Info */}
        <View className="bg-white mt-4 mx-4 rounded-2xl p-4">
          <Text className="text-xs font-medium text-gray-500 uppercase mb-3">
            Account Information
          </Text>
          
          <View className="flex-row items-center py-3 border-b border-gray-100">
            <Ionicons name="mail" size={20} color="#6B7280" />
            <View className="flex-1 ml-3">
              <Text className="text-sm text-gray-500">Email</Text>
              <Text className="text-gray-900">{user?.email || 'Not set'}</Text>
            </View>
            <TouchableOpacity onPress={handleChangeEmail}>
              <Text className="text-primary-500 font-medium">Change</Text>
            </TouchableOpacity>
          </View>

          <View className="flex-row items-center py-3">
            <Ionicons name="at" size={20} color="#6B7280" />
            <View className="flex-1 ml-3">
              <Text className="text-sm text-gray-500">Username</Text>
              <Text className="text-gray-900">@{user?.username || 'Not set'}</Text>
            </View>
          </View>
        </View>

        {/* Security */}
        <View className="bg-white mt-4 mx-4 rounded-2xl">
          <Text className="text-xs font-medium text-gray-500 uppercase px-4 pt-4 pb-2">
            Security
          </Text>

          <TouchableOpacity
            onPress={handleChangePassword}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Ionicons name="lock-closed" size={20} color="#6B7280" />
            <Text className="flex-1 ml-3 text-gray-900">Change Password</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert('Coming Soon', 'Two-factor authentication will be available soon.');
            }}
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name="shield-checkmark" size={20} color="#6B7280" />
            <View className="flex-1 ml-3">
              <Text className="text-gray-900">Two-Factor Authentication</Text>
              <Text className="text-sm text-gray-500">Not enabled</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Data & Privacy */}
        <View className="bg-white mt-4 mx-4 rounded-2xl">
          <Text className="text-xs font-medium text-gray-500 uppercase px-4 pt-4 pb-2">
            Data & Privacy
          </Text>

          <TouchableOpacity
            onPress={handleExportData}
            className="flex-row items-center px-4 py-4 border-b border-gray-100"
          >
            <Ionicons name="download" size={20} color="#6B7280" />
            <Text className="flex-1 ml-3 text-gray-900">Export Your Data</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/settings/blocked-users')}
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name="person-remove" size={20} color="#6B7280" />
            <Text className="flex-1 ml-3 text-gray-900">Blocked Users</Text>
            <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Session */}
        <View className="bg-white mt-4 mx-4 rounded-2xl">
          <TouchableOpacity
            onPress={handleLogout}
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name="log-out" size={20} color="#F59E0B" />
            <Text className="flex-1 ml-3 text-amber-600 font-medium">Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* Danger Zone */}
        <View className="bg-white mt-4 mx-4 rounded-2xl mb-8">
          <Text className="text-xs font-medium text-red-500 uppercase px-4 pt-4 pb-2">
            Danger Zone
          </Text>

          <TouchableOpacity
            onPress={() => setShowDeleteModal(true)}
            className="flex-row items-center px-4 py-4"
          >
            <Ionicons name="trash" size={20} color="#EF4444" />
            <View className="flex-1 ml-3">
              <Text className="text-red-600 font-medium">Delete Account</Text>
              <Text className="text-sm text-gray-500">
                Permanently delete your account and data
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Delete Account Modal */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View className="flex-1 bg-black/50 justify-end">
          <View className="bg-white rounded-t-3xl p-6 pb-10">
            {/* Handle */}
            <View className="items-center mb-4">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Warning Icon */}
            <View className="items-center mb-4">
              <View className="w-16 h-16 rounded-full bg-red-100 items-center justify-center">
                <Ionicons name="warning" size={32} color="#EF4444" />
              </View>
            </View>

            <Text className="text-xl font-bold text-gray-900 text-center mb-2">
              Delete Your Account?
            </Text>
            <Text className="text-gray-600 text-center mb-6">
              This action cannot be undone. All your data, including pins, messages, and connections will be permanently deleted.
            </Text>

            {/* Confirmation Input */}
            <View className="mb-6">
              <Text className="text-sm text-gray-600 mb-2">
                Type <Text className="font-bold">DELETE</Text> to confirm:
              </Text>
              <TextInput
                value={deleteConfirmation}
                onChangeText={setDeleteConfirmation}
                placeholder="Type DELETE"
                className="border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                autoCapitalize="characters"
                autoCorrect={false}
              />
            </View>

            {/* Buttons */}
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleDeleteAccount}
                disabled={deleteConfirmation !== 'DELETE' || isDeleting}
                className={`py-4 rounded-xl items-center ${
                  deleteConfirmation === 'DELETE' ? 'bg-red-500' : 'bg-gray-200'
                }`}
              >
                <Text
                  className={`font-semibold ${
                    deleteConfirmation === 'DELETE' ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {isDeleting ? 'Deleting...' : 'Delete My Account'}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowDeleteModal(false);
                  setDeleteConfirmation('');
                }}
                className="py-4 items-center"
              >
                <Text className="text-gray-600 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}
