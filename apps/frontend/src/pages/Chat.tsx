import { useState, useEffect, useRef } from 'react';
import { useRoute, Link } from 'wouter';
import {
  Send, Image, MapPin, Smile, MoreVertical, Archive,
  VolumeX, Trash2, ArrowLeft, Check, CheckCheck
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useWebSocket } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: Date;
  isRead: boolean;
  type: 'text' | 'image' | 'location';
  imageUrl?: string;
  location?: { latitude: number; longitude: number; name: string };
}

interface Conversation {
  id: string;
  otherUser: {
    id: string;
    name: string;
    avatar: string;
    isOnline: boolean;
  };
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount: number;
  isMuted: boolean;
  isArchived: boolean;
}

export function Chat() {
  const [, params] = useRoute('/chat/:conversationId');
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useWebSocket();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (params?.conversationId) {
      fetchConversation();
      fetchMessages();
    }
  }, [params?.conversationId]);

  useEffect(() => {
    if (!socket || !isConnected || !params?.conversationId) return;

    // Join conversation room
    socket.send('join_conversation', { conversationId: params.conversationId });

    // Listen for new messages
    const handleNewMessage = (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
      
      // Mark as read if from other user
      if (message.senderId !== user?.id) {
        socket.send('mark_read', {
          conversationId: params.conversationId,
          messageId: message.id,
        });
      }
    };

    // Listen for typing indicators
    const handleTyping = ({ userId }: { userId: string }) => {
      if (userId !== user?.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    };

    // Listen for read receipts
    const handleMessageRead = ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    };

    // Listen for online status
    const handleOnlineStatus = ({ userId, isOnline }: { userId: string; isOnline: boolean }) => {
      if (conversation && userId === conversation.otherUser.id) {
        setConversation({
          ...conversation,
          otherUser: { ...conversation.otherUser, isOnline },
        });
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('user_typing', handleTyping);
    socket.on('message_read', handleMessageRead);
    socket.on('user_online_status', handleOnlineStatus);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('user_typing', handleTyping);
      socket.off('message_read', handleMessageRead);
      socket.off('user_online_status', handleOnlineStatus);
      socket.send('leave_conversation', { conversationId: params.conversationId });
    };
  }, [socket, isConnected, params?.conversationId, user?.id, conversation]);

  const fetchConversation = async () => {
    try {
      const data = await api.get(`/api/conversations/${params?.conversationId}`);
      setConversation(data);
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const data = await api.get(`/api/conversations/${params?.conversationId}/messages`);
      setMessages(data);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !params?.conversationId) return;

    const tempMessage: Message = {
      id: `temp-${Date.now()}`,
      senderId: user?.id || '',
      text: newMessage,
      createdAt: new Date(),
      isRead: false,
      type: 'text',
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      const message = await api.post(`/api/conversations/${params.conversationId}/messages`, {
        text: newMessage,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? message : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      // Remove temp message on error
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  const handleTyping = () => {
    if (socket && isConnected && params?.conversationId) {
      socket.send('typing', {
        conversationId: params.conversationId,
        userId: user?.id,
      });

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Set new timeout
      typingTimeoutRef.current = setTimeout(() => {
        socket.send('stop_typing', {
          conversationId: params.conversationId,
          userId: user?.id,
        });
      }, 1000);
    }
  };

  const handleMute = async () => {
    if (!conversation) return;
    try {
      await api.post(`/api/conversations/${conversation.id}/mute`);
      setConversation({ ...conversation, isMuted: !conversation.isMuted });
      setShowMenu(false);
    } catch (error) {
      console.error('Failed to mute conversation:', error);
    }
  };

  const handleArchive = async () => {
    if (!conversation) return;
    try {
      await api.post(`/api/conversations/${conversation.id}/archive`);
      setShowMenu(false);
      window.history.back();
    } catch (error) {
      console.error('Failed to archive conversation:', error);
    }
  };

  const handleDelete = async () => {
    if (!conversation || !confirm('Delete this conversation?')) return;
    try {
      await api.delete(`/api/conversations/${conversation.id}`);
      window.history.back();
    } catch (error) {
      console.error('Failed to delete conversation:', error);
    }
  };

  if (!conversation) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading conversation...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-white">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => window.history.back()}>
            <ArrowLeft className="w-6 h-6 text-gray-600" />
          </button>
          <Link href={`/profile/${conversation.otherUser.id}`}>
            <div className="flex items-center gap-3">
              <div className="relative">
                <img
                  src={conversation.otherUser.avatar || '/default-avatar.png'}
                  alt={conversation.otherUser.name}
                  className="w-10 h-10 rounded-full"
                />
                {conversation.otherUser.isOnline && (
                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                )}
              </div>
              <div>
                <div className="font-medium text-gray-900">{conversation.otherUser.name}</div>
                <div className="text-xs text-gray-500">
                  {conversation.otherUser.isOnline ? 'Online' : 'Offline'}
                </div>
              </div>
            </div>
          </Link>
        </div>

        <div className="relative">
          <button onClick={() => setShowMenu(!showMenu)}>
            <MoreVertical className="w-6 h-6 text-gray-600" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-2 w-48 z-10">
              <button
                onClick={handleMute}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <VolumeX className="w-4 h-4" />
                {conversation.isMuted ? 'Unmute' : 'Mute'}
              </button>
              <button
                onClick={handleArchive}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2"
              >
                <Archive className="w-4 h-4" />
                Archive
              </button>
              <button
                onClick={handleDelete}
                className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isMine = message.senderId === user?.id;
          return (
            <div key={message.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[70%] ${isMine ? 'bg-pink-600 text-white' : 'bg-gray-100 text-gray-900'} rounded-2xl px-4 py-2`}>
                {message.type === 'text' && <p>{message.text}</p>}
                {message.type === 'image' && message.imageUrl && (
                  <img src={message.imageUrl} alt="Shared" className="rounded-lg max-w-full" />
                )}
                {message.type === 'location' && message.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    <span>{message.location.name}</span>
                  </div>
                )}
                <div className={`text-xs mt-1 flex items-center gap-1 ${isMine ? 'text-pink-100' : 'text-gray-500'}`}>
                  <span>{new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {isMine && (
                    message.isRead ? (
                      <CheckCheck className="w-3 h-3" />
                    ) : (
                      <Check className="w-3 h-3" />
                    )
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl px-4 py-2">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSendMessage} className="border-t p-4">
        <div className="flex items-center gap-2">
          <button type="button" className="p-2 text-gray-600 hover:text-gray-900">
            <Image className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-gray-600 hover:text-gray-900">
            <MapPin className="w-5 h-5" />
          </button>
          <button type="button" className="p-2 text-gray-600 hover:text-gray-900">
            <Smile className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
          />
          <Button type="submit" disabled={!newMessage.trim()} className="rounded-full p-3">
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
