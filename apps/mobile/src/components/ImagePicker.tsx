import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { api } from '../lib/api';

interface ImagePickerModalProps {
  visible: boolean;
  onClose: () => void;
  onImageSelected: (uri: string) => void;
  currentImage?: string;
  type?: 'avatar' | 'photo';
}

export default function ImagePickerModal({
  visible,
  onClose,
  onImageSelected,
  currentImage,
  type = 'avatar',
}: ImagePickerModalProps) {
  const [isUploading, setIsUploading] = useState(false);

  const requestPermission = async (
    permissionType: 'camera' | 'library'
  ): Promise<boolean> => {
    if (permissionType === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera access is needed to take photos.'
        );
        return false;
      }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Photo library access is needed to select photos.'
        );
        return false;
      }
    }
    return true;
  };

  const handleCamera = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const hasPermission = await requestPermission('camera');
    if (!hasPermission) return;

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleLibrary = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const hasPermission = await requestPermission('library');
    if (!hasPermission) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: type === 'avatar' ? [1, 1] : [4, 3],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      handleUpload(result.assets[0].uri);
    }
  };

  const handleUpload = async (uri: string) => {
    setIsUploading(true);

    try {
      // Create form data
      const formData = new FormData();
      const filename = uri.split('/').pop() || 'image.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const fileType = match ? `image/${match[1]}` : 'image/jpeg';

      formData.append('file', {
        uri,
        name: filename,
        type: fileType,
      } as any);

      // Upload to backend
      const response = await api.upload<{ url: string }>('/api/upload', formData);
      
      onImageSelected(response.url);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      onClose();
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert('Upload Failed', 'Unable to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onImageSelected('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-black/50 justify-end">
        <View className="bg-white rounded-t-3xl p-6 pb-10">
          {/* Handle */}
          <View className="items-center mb-4">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Title */}
          <Text className="text-xl font-bold text-gray-900 text-center mb-6">
            {type === 'avatar' ? 'Choose Profile Photo' : 'Add Photo'}
          </Text>

          {/* Current Image Preview */}
          {currentImage && (
            <View className="items-center mb-6">
              <Image
                source={{ uri: currentImage }}
                className={`${
                  type === 'avatar' ? 'w-24 h-24 rounded-full' : 'w-40 h-30 rounded-xl'
                } bg-gray-200`}
              />
            </View>
          )}

          {/* Uploading Indicator */}
          {isUploading && (
            <View className="items-center py-4">
              <ActivityIndicator size="large" color="#FF6B9D" />
              <Text className="text-gray-500 mt-2">Uploading...</Text>
            </View>
          )}

          {/* Options */}
          {!isUploading && (
            <View className="space-y-3">
              <TouchableOpacity
                onPress={handleCamera}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl"
              >
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Ionicons name="camera" size={20} color="#FF6B9D" />
                </View>
                <Text className="flex-1 ml-3 font-medium text-gray-900">
                  Take Photo
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleLibrary}
                className="flex-row items-center p-4 bg-gray-50 rounded-xl"
              >
                <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center">
                  <Ionicons name="images" size={20} color="#3B82F6" />
                </View>
                <Text className="flex-1 ml-3 font-medium text-gray-900">
                  Choose from Library
                </Text>
                <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
              </TouchableOpacity>

              {currentImage && (
                <TouchableOpacity
                  onPress={handleRemove}
                  className="flex-row items-center p-4 bg-red-50 rounded-xl"
                >
                  <View className="w-10 h-10 rounded-full bg-red-100 items-center justify-center">
                    <Ionicons name="trash" size={20} color="#EF4444" />
                  </View>
                  <Text className="flex-1 ml-3 font-medium text-red-600">
                    Remove Photo
                  </Text>
                </TouchableOpacity>
              )}

              <TouchableOpacity
                onPress={onClose}
                className="py-4 items-center"
              >
                <Text className="text-gray-500 font-medium">Cancel</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

// Avatar component with edit button
interface EditableAvatarProps {
  uri?: string;
  size?: 'small' | 'medium' | 'large';
  onPress: () => void;
  editable?: boolean;
}

export function EditableAvatar({
  uri,
  size = 'medium',
  onPress,
  editable = true,
}: EditableAvatarProps) {
  const sizeStyles = {
    small: { container: 'w-16 h-16', icon: 24, badge: 'w-6 h-6', badgeIcon: 12 },
    medium: { container: 'w-24 h-24', icon: 36, badge: 'w-8 h-8', badgeIcon: 14 },
    large: { container: 'w-32 h-32', icon: 48, badge: 'w-10 h-10', badgeIcon: 16 },
  };

  const styles = sizeStyles[size];

  return (
    <TouchableOpacity
      onPress={editable ? onPress : undefined}
      activeOpacity={editable ? 0.7 : 1}
      className="relative"
    >
      {uri ? (
        <Image
          source={{ uri }}
          className={`${styles.container} rounded-full bg-gray-200`}
        />
      ) : (
        <View
          className={`${styles.container} rounded-full bg-gray-200 items-center justify-center`}
        >
          <Ionicons name="person" size={styles.icon} color="#9CA3AF" />
        </View>
      )}

      {editable && (
        <View
          className={`absolute bottom-0 right-0 ${styles.badge} rounded-full bg-primary-500 items-center justify-center border-2 border-white`}
        >
          <Ionicons name="camera" size={styles.badgeIcon} color="white" />
        </View>
      )}
    </TouchableOpacity>
  );
}
