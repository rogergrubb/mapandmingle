import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../lib/api';

type ReportType = 'user' | 'pin' | 'event' | 'message' | 'mingle';

interface ReportReason {
  id: string;
  label: string;
  description: string;
  icon: keyof typeof Ionicons.glyphMap;
}

const reportReasons: ReportReason[] = [
  {
    id: 'harassment',
    label: 'Harassment or Bullying',
    description: 'Threatening, intimidating, or abusive behavior',
    icon: 'warning',
  },
  {
    id: 'inappropriate',
    label: 'Inappropriate Content',
    description: 'Sexual, violent, or otherwise inappropriate material',
    icon: 'eye-off',
  },
  {
    id: 'spam',
    label: 'Spam or Scam',
    description: 'Fake accounts, misleading info, or promotional spam',
    icon: 'mail-unread',
  },
  {
    id: 'impersonation',
    label: 'Impersonation',
    description: 'Pretending to be someone else',
    icon: 'person-remove',
  },
  {
    id: 'safety',
    label: 'Safety Concern',
    description: 'Dangerous behavior or potential harm',
    icon: 'shield',
  },
  {
    id: 'other',
    label: 'Something Else',
    description: 'Other issues not listed above',
    icon: 'ellipsis-horizontal',
  },
];

interface ReportModalProps {
  visible: boolean;
  onClose: () => void;
  targetType: ReportType;
  targetId: string;
  targetName?: string;
}

export default function ReportModal({
  visible,
  onClose,
  targetType,
  targetId,
  targetName,
}: ReportModalProps) {
  const [step, setStep] = useState<'reason' | 'details' | 'success'>('reason');
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [additionalDetails, setAdditionalDetails] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(100)).current;

  useEffect(() => {
    if (visible) {
      setStep('reason');
      setSelectedReason(null);
      setAdditionalDetails('');
      
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
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const handleSelectReason = (reasonId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedReason(reasonId);
  };

  const handleContinue = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep('details');
  };

  const handleSubmit = async () => {
    if (!selectedReason) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post('/api/reports', {
        targetType,
        targetId,
        reason: selectedReason,
        details: additionalDetails,
      });

      setStep('success');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Alert.alert('Error', 'Unable to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTargetLabel = (): string => {
    switch (targetType) {
      case 'user':
        return targetName || 'this user';
      case 'pin':
        return 'this pin';
      case 'event':
        return 'this event';
      case 'message':
        return 'this message';
      case 'mingle':
        return 'this mingle';
      default:
        return 'this content';
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <Animated.View
          style={{ opacity: fadeAnim }}
          className="flex-1 bg-black/50 justify-end"
        >
          <TouchableOpacity
            className="flex-1"
            activeOpacity={1}
            onPress={handleClose}
          />

          <Animated.View
            style={{ transform: [{ translateY: slideAnim }] }}
            className="bg-white rounded-t-3xl max-h-[85%]"
          >
            {/* Handle */}
            <View className="items-center py-3">
              <View className="w-10 h-1 bg-gray-300 rounded-full" />
            </View>

            {/* Step: Select Reason */}
            {step === 'reason' && (
              <View className="px-6 pb-8">
                <View className="flex-row items-center justify-between mb-4">
                  <Text className="text-xl font-bold text-gray-900">
                    Report {getTargetLabel()}
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-600 mb-6">
                  Help us understand what's wrong. Your report is confidential.
                </Text>

                {/* Reason List */}
                {reportReasons.map((reason) => (
                  <TouchableOpacity
                    key={reason.id}
                    onPress={() => handleSelectReason(reason.id)}
                    className={`flex-row items-center p-4 rounded-xl mb-2 border-2 ${
                      selectedReason === reason.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-gray-100 bg-gray-50'
                    }`}
                  >
                    <View
                      className={`w-10 h-10 rounded-full items-center justify-center mr-3 ${
                        selectedReason === reason.id ? 'bg-primary-100' : 'bg-gray-200'
                      }`}
                    >
                      <Ionicons
                        name={reason.icon}
                        size={20}
                        color={selectedReason === reason.id ? '#FF6B9D' : '#6B7280'}
                      />
                    </View>
                    <View className="flex-1">
                      <Text
                        className={`font-semibold ${
                          selectedReason === reason.id ? 'text-primary-700' : 'text-gray-900'
                        }`}
                      >
                        {reason.label}
                      </Text>
                      <Text className="text-sm text-gray-500">{reason.description}</Text>
                    </View>
                    {selectedReason === reason.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#FF6B9D" />
                    )}
                  </TouchableOpacity>
                ))}

                {/* Continue Button */}
                <TouchableOpacity
                  onPress={handleContinue}
                  disabled={!selectedReason}
                  className="mt-4"
                >
                  <LinearGradient
                    colors={selectedReason ? ['#FF6B9D', '#FF8FB1'] : ['#E5E7EB', '#E5E7EB']}
                    className="py-4 rounded-xl items-center"
                  >
                    <Text
                      className={`font-semibold ${
                        selectedReason ? 'text-white' : 'text-gray-400'
                      }`}
                    >
                      Continue
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Additional Details */}
            {step === 'details' && (
              <View className="px-6 pb-8">
                <View className="flex-row items-center mb-4">
                  <TouchableOpacity onPress={() => setStep('reason')} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color="#6B7280" />
                  </TouchableOpacity>
                  <Text className="text-xl font-bold text-gray-900 flex-1">
                    Add Details
                  </Text>
                  <TouchableOpacity onPress={handleClose}>
                    <Ionicons name="close" size={24} color="#6B7280" />
                  </TouchableOpacity>
                </View>

                <Text className="text-gray-600 mb-4">
                  Please provide any additional information that might help us review this report.
                </Text>

                {/* Text Input */}
                <View className="bg-gray-50 rounded-xl p-4 mb-6">
                  <TextInput
                    value={additionalDetails}
                    onChangeText={setAdditionalDetails}
                    placeholder="Describe what happened... (optional)"
                    placeholderTextColor="#9CA3AF"
                    multiline
                    numberOfLines={5}
                    textAlignVertical="top"
                    className="text-gray-900 min-h-[120px]"
                  />
                </View>

                {/* What Happens Next */}
                <View className="bg-blue-50 rounded-xl p-4 mb-6">
                  <View className="flex-row items-center mb-2">
                    <Ionicons name="information-circle" size={20} color="#3B82F6" />
                    <Text className="font-semibold text-blue-800 ml-2">
                      What happens next?
                    </Text>
                  </View>
                  <Text className="text-sm text-blue-700">
                    Our team will review your report within 24 hours. If we find a violation,
                    we'll take appropriate action. You'll be notified of the outcome.
                  </Text>
                </View>

                {/* Submit Button */}
                <TouchableOpacity onPress={handleSubmit} disabled={isSubmitting}>
                  <LinearGradient
                    colors={['#FF6B9D', '#FF8FB1']}
                    className="py-4 rounded-xl items-center"
                  >
                    <Text className="font-semibold text-white">
                      {isSubmitting ? 'Submitting...' : 'Submit Report'}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}

            {/* Step: Success */}
            {step === 'success' && (
              <View className="px-6 pb-8 items-center">
                <View className="w-20 h-20 rounded-full bg-green-100 items-center justify-center mb-4">
                  <Ionicons name="checkmark-circle" size={48} color="#22C55E" />
                </View>
                
                <Text className="text-xl font-bold text-gray-900 text-center mb-2">
                  Report Submitted
                </Text>
                <Text className="text-gray-600 text-center mb-6">
                  Thank you for helping keep Map Mingle safe. We'll review your report and
                  take appropriate action.
                </Text>

                {/* Block Option */}
                {targetType === 'user' && (
                  <TouchableOpacity
                    onPress={() => {
                      // Handle block user
                      handleClose();
                    }}
                    className="w-full py-3 rounded-xl bg-gray-100 items-center mb-3"
                  >
                    <Text className="text-gray-700 font-medium">
                      Block {targetName || 'User'}
                    </Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  onPress={handleClose}
                  className="w-full py-3 items-center"
                >
                  <Text className="text-primary-500 font-medium">Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </Animated.View>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
