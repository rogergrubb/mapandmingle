import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { api } from '../../../src/lib/api';
import { useAuthStore } from '../../../src/stores/auth';

interface Comment {
  id: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatar?: string;
  };
  likesCount: number;
  isLiked: boolean;
  createdAt: string;
  replies?: Comment[];
}

interface ForumPostDetail {
  id: string;
  title: string;
  content: string;
  author: {
    id: string;
    displayName: string;
    avatar?: string;
    trustScore: number;
  };
  category: string;
  categoryColor: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isPinned: boolean;
  createdAt: string;
  location?: {
    name: string;
    latitude: number;
    longitude: number;
  };
  comments: Comment[];
}

export default function ForumPostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();
  const scrollViewRef = useRef<ScrollView>(null);

  const [post, setPost] = useState<ForumPostDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      const response = await api.get<ForumPostDetail>(`/api/forums/posts/${id}`);
      setPost(response);
    } catch (error) {
      console.error('Error fetching post:', error);
      Alert.alert('Error', 'Unable to load post');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleLike = async () => {
    if (!post) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setPost({
      ...post,
      isLiked: !post.isLiked,
      likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
    });

    try {
      await api.post(`/api/forums/posts/${id}/like`);
    } catch (error) {
      setPost({
        ...post,
        isLiked: !post.isLiked,
        likesCount: post.isLiked ? post.likesCount + 1 : post.likesCount - 1,
      });
    }
  };

  const handleCommentLike = async (commentId: string) => {
    if (!post) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    setPost({
      ...post,
      comments: post.comments.map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              isLiked: !comment.isLiked,
              likesCount: comment.isLiked ? comment.likesCount - 1 : comment.likesCount + 1,
            }
          : comment
      ),
    });

    try {
      await api.post(`/api/forums/comments/${commentId}/like`);
    } catch (error) {
      fetchPost();
    }
  };

  const handleSubmitComment = async () => {
    if (!newComment.trim() || !post) return;

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const response = await api.post<Comment>(`/api/forums/posts/${id}/comments`, {
        content: newComment,
        parentId: replyingTo,
      });

      setPost({
        ...post,
        commentsCount: post.commentsCount + 1,
        comments: [...post.comments, response],
      });

      setNewComment('');
      setReplyingTo(null);
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      Alert.alert('Error', 'Unable to post comment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  const renderComment = (comment: Comment, isReply = false) => (
    <View key={comment.id} className={`${isReply ? 'ml-12 mt-3' : 'mt-4'}`}>
      <View className="flex-row">
        <TouchableOpacity onPress={() => router.push(`/profile/${comment.author.id}`)}>
          {comment.author.avatar ? (
            <Image
              source={{ uri: comment.author.avatar }}
              className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-gray-200`}
            />
          ) : (
            <View className={`${isReply ? 'w-8 h-8' : 'w-10 h-10'} rounded-full bg-primary-100 items-center justify-center`}>
              <Text className={`font-bold text-primary-500 ${isReply ? 'text-sm' : ''}`}>
                {comment.author.displayName.charAt(0)}
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View className="flex-1 ml-3">
          <View className="bg-gray-50 rounded-2xl px-4 py-3">
            <View className="flex-row items-center">
              <Text className="font-semibold text-gray-900">{comment.author.displayName}</Text>
              <Text className="text-xs text-gray-400 ml-2">{formatTime(comment.createdAt)}</Text>
            </View>
            <Text className="text-gray-700 mt-1">{comment.content}</Text>
          </View>

          <View className="flex-row items-center mt-2 ml-2">
            <TouchableOpacity onPress={() => handleCommentLike(comment.id)} className="flex-row items-center mr-4">
              <Ionicons name={comment.isLiked ? 'heart' : 'heart-outline'} size={16} color={comment.isLiked ? '#FF6B9D' : '#6B7280'} />
              <Text className={`text-xs ml-1 ${comment.isLiked ? 'text-primary-500' : 'text-gray-500'}`}>{comment.likesCount}</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setReplyingTo(comment.id)} className="flex-row items-center">
              <Ionicons name="chatbubble-outline" size={14} color="#6B7280" />
              <Text className="text-xs text-gray-500 ml-1">Reply</Text>
            </TouchableOpacity>
          </View>

          {comment.replies?.map((reply) => renderComment(reply, true))}
        </View>
      </View>
    </View>
  );

  if (isLoading || !post) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <Ionicons name="chatbubbles" size={48} color="#D1D5DB" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} className="flex-1 bg-white">
      <Stack.Screen options={{ headerShown: true, title: '' }} />

      <ScrollView ref={scrollViewRef} className="flex-1" showsVerticalScrollIndicator={false}>
        <View className="p-4">
          {post.isPinned && (
            <View className="flex-row items-center mb-3">
              <Ionicons name="pin" size={14} color="#F59E0B" />
              <Text className="text-xs text-amber-600 font-medium ml-1">Pinned Post</Text>
            </View>
          )}

          <TouchableOpacity onPress={() => router.push(`/profile/${post.author.id}`)} className="flex-row items-center mb-4">
            {post.author.avatar ? (
              <Image source={{ uri: post.author.avatar }} className="w-12 h-12 rounded-full bg-gray-200" />
            ) : (
              <View className="w-12 h-12 rounded-full bg-primary-100 items-center justify-center">
                <Text className="text-xl font-bold text-primary-500">{post.author.displayName.charAt(0)}</Text>
              </View>
            )}
            <View className="ml-3">
              <View className="flex-row items-center">
                <Text className="font-semibold text-gray-900">{post.author.displayName}</Text>
                <View className="flex-row items-center ml-2">
                  <Ionicons name="shield-checkmark" size={14} color="#22C55E" />
                  <Text className="text-xs text-gray-500 ml-0.5">{post.author.trustScore}</Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text className="text-sm text-gray-500">{formatTime(post.createdAt)}</Text>
                <View className="ml-2 px-2 py-0.5 rounded-full" style={{ backgroundColor: `${post.categoryColor}20` }}>
                  <Text className="text-xs font-medium" style={{ color: post.categoryColor }}>{post.category}</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>

          <Text className="text-2xl font-bold text-gray-900 mb-3">{post.title}</Text>
          <Text className="text-gray-700 leading-6">{post.content}</Text>

          <View className="flex-row items-center mt-6 pt-4 border-t border-gray-100">
            <TouchableOpacity onPress={handleLike} className="flex-row items-center mr-6">
              <Ionicons name={post.isLiked ? 'heart' : 'heart-outline'} size={24} color={post.isLiked ? '#FF6B9D' : '#6B7280'} />
              <Text className={`ml-2 font-medium ${post.isLiked ? 'text-primary-500' : 'text-gray-600'}`}>{post.likesCount}</Text>
            </TouchableOpacity>

            <View className="flex-row items-center mr-6">
              <Ionicons name="chatbubble-outline" size={22} color="#6B7280" />
              <Text className="ml-2 text-gray-600">{post.commentsCount}</Text>
            </View>

            <View className="flex-1" />
            <TouchableOpacity className="p-2"><Ionicons name="share-outline" size={22} color="#6B7280" /></TouchableOpacity>
          </View>
        </View>

        <View className="px-4 pb-24">
          <Text className="font-bold text-lg text-gray-900 mb-2">Comments ({post.commentsCount})</Text>
          {post.comments.length === 0 ? (
            <View className="items-center py-8">
              <Ionicons name="chatbubble-outline" size={32} color="#D1D5DB" />
              <Text className="text-gray-500 mt-2">No comments yet</Text>
            </View>
          ) : (
            post.comments.map((comment) => renderComment(comment))
          )}
        </View>
      </ScrollView>

      <View className="absolute bottom-0 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 pb-8">
        {replyingTo && (
          <View className="flex-row items-center mb-2">
            <Text className="text-sm text-gray-500">Replying to comment</Text>
            <TouchableOpacity onPress={() => setReplyingTo(null)} className="ml-2">
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          </View>
        )}
        
        <View className="flex-row items-center">
          <TextInput
            value={newComment}
            onChangeText={setNewComment}
            placeholder="Write a comment..."
            placeholderTextColor="#9CA3AF"
            className="flex-1 bg-gray-100 rounded-full px-4 py-3 text-gray-900"
            multiline
            maxLength={500}
          />
          <TouchableOpacity onPress={handleSubmitComment} disabled={!newComment.trim() || isSubmitting} className="ml-2">
            <LinearGradient
              colors={newComment.trim() ? ['#FF6B9D', '#FF8FB1'] : ['#E5E7EB', '#E5E7EB']}
              className="w-10 h-10 rounded-full items-center justify-center"
            >
              <Ionicons name="send" size={18} color={newComment.trim() ? 'white' : '#9CA3AF'} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
