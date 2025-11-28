import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { api } from '../../src/lib/api';
import { HapticButton } from '../../src/components/HapticButton';

// FAQ Data
const FAQ_SECTIONS = [
  {
    title: 'Getting Started',
    icon: 'rocket',
    color: '#FF6B9D',
    questions: [
      {
        q: 'What is Map Mingle?',
        a: 'Map Mingle is a location-based social discovery app that helps you connect with people nearby. Drop pins at locations to make missed connections, attend events, and meet new people in your area.',
      },
      {
        q: 'How do pins work?',
        a: 'Pins are like digital notes you can drop at any location. Use them to make a missed connection, share a moment, or let someone know you\'d like to meet them. When someone nearby sees your pin, they can respond.',
      },
      {
        q: 'Is my location shared with everyone?',
        a: 'Your exact location is never shared. We only show approximate distances and general areas. You have full control over your visibility in Privacy settings.',
      },
    ],
  },
  {
    title: 'Account & Profile',
    icon: 'person',
    color: '#8B5CF6',
    questions: [
      {
        q: 'How do I edit my profile?',
        a: 'Go to your Profile tab, tap the settings icon, then select "Edit Profile." You can update your photo, bio, interests, and more.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Go to Settings > Privacy & Safety > scroll to the bottom and tap "Delete Account." This action is permanent and cannot be undone.',
      },
      {
        q: 'What is Trust Score?',
        a: 'Trust Score reflects your reputation in the community based on positive interactions, verified information, and how others engage with you. Higher scores increase visibility and trust.',
      },
    ],
  },
  {
    title: 'Premium',
    icon: 'star',
    color: '#F59E0B',
    questions: [
      {
        q: 'What does Premium include?',
        a: 'Premium unlocks Ghost Mode (browse invisibly), Incognito Mode (hide from search), Profile Boost, unlimited messages, AI icebreakers, and more.',
      },
      {
        q: 'How do I cancel my subscription?',
        a: 'Go to Settings > Premium > Manage Subscription. You can cancel anytime and will retain access until the end of your billing period.',
      },
      {
        q: 'Can I get a refund?',
        a: 'Yes, contact us within 14 days of purchase for a full refund. Use the "Contact Support" button below.',
      },
    ],
  },
  {
    title: 'Safety & Privacy',
    icon: 'shield-checkmark',
    color: '#10B981',
    questions: [
      {
        q: 'How do I report someone?',
        a: 'Visit their profile, tap the menu (three dots), and select "Report User." Choose a reason and we\'ll review it within 24 hours.',
      },
      {
        q: 'How do I block someone?',
        a: 'Visit their profile, tap the menu (three dots), and select "Block User." They won\'t be able to see your profile or message you.',
      },
      {
        q: 'Is my data secure?',
        a: 'Yes, we use industry-standard encryption for all data. We never sell your personal information. See our Privacy Policy for details.',
      },
    ],
  },
];

// Quick Action Links
const QUICK_ACTIONS = [
  {
    icon: 'mail',
    title: 'Email Support',
    subtitle: 'support@mapmingle.app',
    action: () => Linking.openURL('mailto:support@mapmingle.app'),
    color: '#3B82F6',
  },
  {
    icon: 'logo-twitter',
    title: 'Twitter / X',
    subtitle: '@MapMingleApp',
    action: () => Linking.openURL('https://twitter.com/MapMingleApp'),
    color: '#1DA1F2',
  },
  {
    icon: 'logo-instagram',
    title: 'Instagram',
    subtitle: '@mapmingle',
    action: () => Linking.openURL('https://instagram.com/mapmingle'),
    color: '#E4405F',
  },
  {
    icon: 'document-text',
    title: 'Terms of Service',
    subtitle: 'View our terms',
    action: () => Linking.openURL('https://mapmingle.app/terms'),
    color: '#6B7280',
  },
  {
    icon: 'lock-closed',
    title: 'Privacy Policy',
    subtitle: 'View our privacy policy',
    action: () => Linking.openURL('https://mapmingle.app/privacy'),
    color: '#6B7280',
  },
];

export default function HelpScreen() {
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);

  const toggleQuestion = (questionKey: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedQuestion(expandedQuestion === questionKey ? null : questionKey);
  };

  const handleSendMessage = async () => {
    if (!contactSubject.trim() || !contactMessage.trim()) {
      Alert.alert('Missing Information', 'Please fill in both subject and message.');
      return;
    }

    setIsSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      await api.post('/api/support/contact', {
        subject: contactSubject.trim(),
        message: contactMessage.trim(),
      });

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        'Message Sent!',
        'Thank you for reaching out. We\'ll get back to you within 24 hours.',
        [{ text: 'OK', onPress: () => {
          setContactSubject('');
          setContactMessage('');
          setShowContactForm(false);
        }}]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to send message. Please try again or email us directly.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View className="flex-1 bg-gray-50">
      <Stack.Screen options={{ title: 'Help & Support' }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Header */}
          <Animated.View
            entering={FadeInDown.duration(300)}
            className="bg-primary-500 px-6 py-8"
          >
            <View className="items-center">
              <View className="w-16 h-16 rounded-full bg-white/20 items-center justify-center mb-4">
                <Ionicons name="help-circle" size={36} color="white" />
              </View>
              <Text className="text-white text-2xl font-bold text-center">How can we help?</Text>
              <Text className="text-white/80 text-center mt-2">
                Find answers to common questions or reach out to our team
              </Text>
            </View>
          </Animated.View>

          {/* FAQ Sections */}
          {FAQ_SECTIONS.map((section, sectionIndex) => (
            <Animated.View
              key={section.title}
              entering={FadeInDown.duration(300).delay(100 + sectionIndex * 50)}
              className="bg-white mx-4 mt-4 rounded-2xl overflow-hidden"
            >
              {/* Section Header */}
              <View className="flex-row items-center p-4 border-b border-gray-100">
                <View
                  className="w-10 h-10 rounded-full items-center justify-center"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <Ionicons name={section.icon as any} size={20} color={section.color} />
                </View>
                <Text className="text-gray-900 font-semibold ml-3">{section.title}</Text>
              </View>

              {/* Questions */}
              {section.questions.map((item, questionIndex) => {
                const questionKey = `${section.title}-${questionIndex}`;
                const isExpanded = expandedQuestion === questionKey;

                return (
                  <View key={questionKey}>
                    <TouchableOpacity
                      onPress={() => toggleQuestion(questionKey)}
                      className="flex-row items-center justify-between p-4"
                      activeOpacity={0.7}
                    >
                      <Text className="text-gray-900 font-medium flex-1 pr-4">{item.q}</Text>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#9CA3AF"
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View className="px-4 pb-4">
                        <Text className="text-gray-600 leading-6">{item.a}</Text>
                      </View>
                    )}

                    {questionIndex !== section.questions.length - 1 && (
                      <View className="h-px bg-gray-100 mx-4" />
                    )}
                  </View>
                );
              })}
            </Animated.View>
          ))}

          {/* Quick Actions */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(300)}
            className="mx-4 mt-6"
          >
            <Text className="text-lg font-semibold text-gray-900 mb-3">Contact & Links</Text>

            <View className="bg-white rounded-2xl overflow-hidden">
              {QUICK_ACTIONS.map((action, index) => (
                <TouchableOpacity
                  key={action.title}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    action.action();
                  }}
                  className={`flex-row items-center p-4 ${
                    index !== QUICK_ACTIONS.length - 1 ? 'border-b border-gray-100' : ''
                  }`}
                  activeOpacity={0.7}
                >
                  <View
                    className="w-10 h-10 rounded-full items-center justify-center"
                    style={{ backgroundColor: `${action.color}20` }}
                  >
                    <Ionicons name={action.icon as any} size={20} color={action.color} />
                  </View>
                  <View className="ml-3 flex-1">
                    <Text className="text-gray-900 font-medium">{action.title}</Text>
                    <Text className="text-gray-500 text-sm">{action.subtitle}</Text>
                  </View>
                  <Ionicons name="open-outline" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* Contact Form */}
          <Animated.View
            entering={FadeInDown.duration(300).delay(350)}
            className="mx-4 mt-6 mb-8"
          >
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setShowContactForm(!showContactForm);
              }}
              className="bg-white rounded-2xl p-4 flex-row items-center justify-between"
              activeOpacity={0.7}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 rounded-full bg-primary-100 items-center justify-center">
                  <Ionicons name="chatbubble-ellipses" size={20} color="#FF6B9D" />
                </View>
                <View className="ml-3">
                  <Text className="text-gray-900 font-semibold">Contact Support</Text>
                  <Text className="text-gray-500 text-sm">Send us a message</Text>
                </View>
              </View>
              <Ionicons
                name={showContactForm ? 'chevron-up' : 'chevron-down'}
                size={20}
                color="#9CA3AF"
              />
            </TouchableOpacity>

            {showContactForm && (
              <View className="bg-white mt-1 rounded-2xl p-4">
                <Text className="text-gray-700 font-medium mb-2">Subject</Text>
                <TextInput
                  value={contactSubject}
                  onChangeText={setContactSubject}
                  placeholder="What's this about?"
                  placeholderTextColor="#9CA3AF"
                  maxLength={100}
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200 mb-4"
                />

                <Text className="text-gray-700 font-medium mb-2">Message</Text>
                <TextInput
                  value={contactMessage}
                  onChangeText={setContactMessage}
                  placeholder="Describe your issue or question..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={5}
                  maxLength={1000}
                  className="bg-gray-50 rounded-xl px-4 py-3 text-gray-900 border border-gray-200 min-h-28"
                  textAlignVertical="top"
                />
                <Text className="text-gray-400 text-xs text-right mt-1">
                  {contactMessage.length}/1000
                </Text>

                <HapticButton
                  variant="primary"
                  onPress={handleSendMessage}
                  isLoading={isSending}
                  disabled={!contactSubject.trim() || !contactMessage.trim()}
                  className="mt-4"
                >
                  Send Message
                </HapticButton>
              </View>
            )}
          </Animated.View>

          {/* App Info */}
          <View className="items-center py-6 mb-8">
            <Text className="text-gray-400 text-sm">Map Mingle v1.0.0</Text>
            <Text className="text-gray-400 text-xs mt-1">Made with 💕 for connection seekers</Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}
