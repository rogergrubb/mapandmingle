import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  Image,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { api } from '../src/lib/api';
import { useAuthStore } from '../src/stores/auth';

interface Message {
  id: string;
  content: string;
  senderId: string;
  createdAt: string;
  readAt: string | null;
}

interface Participant {
  userId: string;
  user: {
    id: string;
    name: string | null;
    image: string | null;
  };
}

export default function ChatScreen() {
  const { id: conversationId } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const flatListRef = useRef<FlatList>(null);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [otherUser, setOtherUser] = useState<Participant['user'] | null>(null);

  const fetchMessages = useCallback(async () => {
    try {
      const data = await api.get<{
        messages: Message[];
        participants: Participant[];
      }>(`/api/conversations/${conversationId}/messages`);
      
      setMessages(data.messages.reverse()); // Reverse for inverted FlatList
      setParticipants(data.participants);
      
      // Find the other user
      const other = data.participants.find(p => p.userId !== user?.id);
      if (other) {
        setOtherUser(other.user);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, user?.id]);

  useEffect(() => {
    fetchMessages();
    
    // Poll for new messages (in production, use WebSocket)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const sendMessage = async () => {
    if (!inputText.trim() || isSending) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setIsSending(true);
    
    const messageText = inputText.trim();
    setInputText('');
    
    // Optimistic update
    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      content: messageText,
      senderId: user?.id || '',
      createdAt: new Date().toISOString(),
      readAt: null,
    };
    setMessages(prev => [tempMessage, ...prev]);
    
    try {
      const response = await api.post<{ message: Message }>(
        `/api/conversations/${conversationId}/messages`,
        { content: messageText }
      );
      
      // Replace temp message with real one
      setMessages(prev => 
        prev.map(m => m.id === tempMessage.id ? response.message : m)
      );
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove temp message on error
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      setInputText(messageText); // Restore input
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsSending(false);
    }
  };

  const handleVideoCall = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    // TODO: Initiate video call
    router.push(`/video-call/${otherUser?.id}`);
  };

  const handleIcebreaker = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    try {
      const response = await api.post<{ icebreaker: string }>(
        '/api/icebreaker/generate',
        { recipientId: otherUser?.id }
      );
      setInputText(response.icebreaker);
    } catch (error) {
      console.error('Error generating icebreaker:', error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true,
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === now.toDateString()) {
      return 'Today';
    }
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'long',
      month: 'short', 
      day: 'numeric',
    });
  };

  const shouldShowDateHeader = (currentIndex: number) => {
    if (currentIndex === messages.length - 1) return true;
    
    const currentDate = new Date(messages[currentIndex].createdAt).toDateString();
    const nextDate = new Date(messages[currentIndex + 1].createdAt).toDateString();
    
    return currentDate !== nextDate;
  };

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const isMe = item.senderId === user?.id;
    const showDateHeader = shouldShowDateHeader(index);

    return (
      <View>
        {showDateHeader && (
          <View className="items-center py-3">
            <Text className="text-gray-400 text-xs bg-gray-100 px-3 py-1 rounded-full">
              {formatDateHeader(item.createdAt)}
            </Text>
          </View>
        )}
        
        <View className={`flex-row mb-2 ${isMe ? 'justify-end' : 'justify-start'}`}>
          {!isMe && (
            <View className="w-8 h-8 rounded-full bg-gray-200 items-center justify-center mr-2 self-end">
              {otherUser?.image ? (
                <Image
                  source={{ uri: otherUser.image }}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <Ionicons name="person" size={16} color="#9CA3AF" />
              )}
            </View>
          )}
          
          <View
            className={`max-w-[75%] px-4 py-3 rounded-2xl ${
              isMe
                ? 'bg-primary-500 rounded-br-md'
                : 'bg-gray-100 rounded-bl-md'
            }`}
          >
            <Text className={isMe ? 'text-white' : 'text-gray-900'}>
              {item.content}
            </Text>
            <View className={`flex-row items-center mt-1 ${isMe ? 'justify-end' : ''}`}>
              <Text className={`text-xs ${isMe ? 'text-white/70' : 'text-gray-400'}`}>
                {formatTime(item.createdAt)}
              </Text>
              {isMe && (
                <Ionicons
                  name={item.readAt ? 'checkmark-done' : 'checkmark'}
                  size={14}
                  color={item.readAt ? '#A7F3D0' : 'rgba(255,255,255,0.7)'}
                  style={{ marginLeft: 4 }}
                />
              )}
            </View>
          </View>
        </View>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#FF6B9D" />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          headerTitle: () => (
            <TouchableOpacity
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push(`/profile/${otherUser?.id}`);
              }}
              className="flex-row items-center"
            >
              <View className="w-9 h-9 rounded-full bg-gray-200 items-center justify-center mr-2">
                {otherUser?.image ? (
                  <Image
                    source={{ uri: otherUser.image }}
                    className="w-9 h-9 rounded-full"
                  />
                ) : (
                  <Ionicons name="person" size={18} color="#9CA3AF" />
                )}
              </View>
              <Text className="font-semibold text-gray-900">
                {otherUser?.name || 'Anonymous'}
              </Text>
            </TouchableOpacity>
          ),
          headerRight: () => (
            <TouchableOpacity onPress={handleVideoCall} className="p-2">
              <Ionicons name="videocam" size={24} color="#FF6B9D" />
            </TouchableOpacity>
          ),
        }}
      />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 bg-white"
        keyboardVerticalOffset={90}
      >
        {/* Messages List */}
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderMessage}
          keyExtractor={(item) => item.id}
          inverted
          contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center py-20">
              <View className="w-16 h-16 rounded-full bg-primary-100 items-center justify-center mb-4">
                <Ionicons name="chatbubble-ellipses" size={32} color="#FF6B9D" />
              </View>
              <Text className="text-gray-500 text-center">
                No messages yet.{'\n'}Say hello! 👋
              </Text>
              <TouchableOpacity
                onPress={handleIcebreaker}
                className="mt-4 bg-primary-50 px-4 py-2 rounded-full flex-row items-center"
              >
                <Ionicons name="sparkles" size={16} color="#FF6B9D" />
                <Text className="text-primary-500 font-medium ml-1">
                  Get an icebreaker
                </Text>
              </TouchableOpacity>
            </View>
          }
        />

        {/* Input Area */}
        <View className="border-t border-gray-100 px-4 py-3 bg-white">
          <View className="flex-row items-end space-x-2">
            {/* Icebreaker Button */}
            <TouchableOpacity
              onPress={handleIcebreaker}
              className="w-10 h-10 rounded-full bg-primary-50 items-center justify-center"
            >
              <Ionicons name="sparkles" size={20} color="#FF6B9D" />
            </TouchableOpacity>

            {/* Text Input */}
            <View className="flex-1 bg-gray-50 rounded-2xl px-4 py-2 max-h-32">
              <TextInput
                value={inputText}
                onChangeText={setInputText}
                placeholder="Type a message..."
                placeholderTextColor="#9CA3AF"
                multiline
                maxLength={2000}
                className="text-gray-900 max-h-24"
              />
            </View>

            {/* Send Button */}
            <TouchableOpacity
              onPress={sendMessage}
              disabled={!inputText.trim() || isSending}
              className={`w-10 h-10 rounded-full items-center justify-center ${
                inputText.trim() ? 'bg-primary-500' : 'bg-gray-200'
              }`}
            >
              {isSending ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Ionicons
                  name="send"
                  size={18}
                  color={inputText.trim() ? 'white' : '#9CA3AF'}
                />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </>
  );
}
