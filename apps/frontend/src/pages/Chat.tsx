import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send, Image, MapPin, Smile, MoreVertical, 
  Trash2, ArrowLeft, Check, CheckCheck, Phone, Video
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useWebSocket } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  content: string;
  readAt?: string | null;
  createdAt: string;
  sender?: {
    id: string;
    name: string;
    avatar?: string;
  };
  receiver?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  profile?: {
    avatar?: string;
    displayName?: string;
  };
}

export function Chat() {
  // Route uses :id which is the other user's ID
  const { id: otherUserId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useWebSocket();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (otherUserId) {
      fetchMessages();
    }
  }, [otherUserId]);

  useEffect(() => {
    if (!socket || !isConnected || !otherUserId || !user?.id) return;

    // Authenticate WebSocket
    socket.send('auth', { userId: user.id });

    // Listen for new messages
    const handleNewMessage = (data: any) => {
      const message = data.message || data;
      // Check if message is from/to the current chat partner
      if ((message?.senderId === otherUserId && message?.receiverId === user.id) ||
          (message?.senderId === user.id && message?.receiverId === otherUserId)) {
        setMessages((prev) => {
          if (prev.some(m => m.id === message.id)) return prev;
          return [...prev, message];
        });
        scrollToBottom();
        
        // Mark as read if from other user
        if (message.senderId === otherUserId) {
          api.put(`/api/messages/${message.id}/read`).catch(() => {});
        }
      }
    };

    // Listen for typing indicators
    const handleTyping = (data: { userId: string; isTyping: boolean }) => {
      if (data.userId === otherUserId) {
        setIsTyping(data.isTyping);
        if (data.isTyping) {
          setTimeout(() => setIsTyping(false), 3000);
        }
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('typing', handleTyping);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('typing', handleTyping);
    };
  }, [socket, isConnected, otherUserId, user?.id]);

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      // Use new API endpoint: GET /api/messages/conversation/:userId
      const data: Message[] = await api.get(`/api/messages/conversation/${otherUserId}`);
      setMessages(data);
      
      // Extract other user info from messages or fetch profile
      if (data.length > 0) {
        const firstMessage = data[0];
        const otherUserData = firstMessage.senderId === user?.id 
          ? firstMessage.receiver 
          : firstMessage.sender;
        if (otherUserData) {
          setOtherUser({
            id: otherUserData.id,
            name: otherUserData.name || 'User',
            email: '',
            avatar: otherUserData.avatar,
          });
        }
      } else {
        // No messages yet, fetch user profile
        try {
          const userData: UserProfile = await api.get(`/api/users/${otherUserId}`);
          setOtherUser({
            id: userData.id,
            name: userData.profile?.displayName || userData.name || 'User',
            email: userData.email,
            avatar: userData.profile?.avatar,
          });
        } catch (e) {
          console.error('Failed to fetch user profile:', e);
        }
      }
      
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !otherUserId || isSending) return;

    const tempId = `temp-${Date.now()}`;
    const tempMessage: Message = {
      id: tempId,
      senderId: user?.id || '',
      receiverId: otherUserId,
      content: newMessage,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    setIsSending(true);
    scrollToBottom();

    try {
      // Use new API endpoint: POST /api/messages
      const response: any = await api.post('/api/messages', {
        receiverId: otherUserId,
        content: newMessage,
      });

      // Backend returns { success: true, message }
      const sentMessage = response.message || response;
      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempId ? sentMessage : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleTypingInput = () => {
    if (socket && isConnected && otherUserId) {
      socket.send('typing', {
        receiverId: otherUserId,
        isTyping: true,
      });

      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      typingTimeoutRef.current = window.setTimeout(() => {
        socket.send('typing', {
          receiverId: otherUserId,
          isTyping: false,
        });
      }, 1000);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups: { [key: string]: Message[] }, message) => {
    const date = new Date(message.createdAt).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {});

  const displayName = otherUser?.name || 'User';
  const avatarUrl = otherUser?.avatar;

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/messages')} 
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <Link to={`/user/${otherUserId}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="relative">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-semibold text-lg">
                    {displayName[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div>
              <div className="font-semibold text-gray-900">{displayName}</div>
              <div className="text-xs text-gray-500">
                {isTyping ? (
                  <span className="text-pink-500">typing...</span>
                ) : (
                  'Tap to view profile'
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => navigate(`/video-call/${otherUserId}`)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Video className="w-5 h-5 text-gray-600" />
          </button>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <MoreVertical className="w-5 h-5 text-gray-600" />
            </button>
            {showMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border py-2 w-48 z-20">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-2 text-red-600"
                  >
                    <Trash2 className="w-4 h-4" />
                    Block User
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4">
        {Object.entries(groupedMessages).length === 0 ? (
          <div className="h-full flex items-center justify-center">
            <div className="text-center text-gray-500">
              <p className="mb-2">No messages yet</p>
              <p className="text-sm">Say hello to start the conversation!</p>
            </div>
          </div>
        ) : (
          Object.entries(groupedMessages).map(([date, dateMessages]) => (
            <div key={date}>
              {/* Date Header */}
              <div className="flex justify-center my-4">
                <span className="bg-gray-200 text-gray-600 text-xs px-3 py-1 rounded-full">
                  {formatDateHeader(dateMessages[0].createdAt)}
                </span>
              </div>

              {/* Messages for this date */}
              {dateMessages.map((message, index) => {
                const isMine = message.senderId === user?.id;
                const showAvatar = !isMine && (index === 0 || dateMessages[index - 1]?.senderId !== message.senderId);
                
                return (
                  <div 
                    key={message.id} 
                    className={`flex mb-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    {/* Avatar for other user */}
                    {!isMine && (
                      <div className="w-8 mr-2 flex-shrink-0">
                        {showAvatar && (
                          avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={displayName}
                              className="w-8 h-8 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                              <span className="text-white font-medium text-sm">
                                {displayName[0]?.toUpperCase() || '?'}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    )}

                    <div 
                      className={`max-w-[70%] ${
                        isMine 
                          ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white' 
                          : 'bg-white text-gray-900 border border-gray-200'
                      } rounded-2xl px-4 py-2 shadow-sm`}
                    >
                      <p className="whitespace-pre-wrap break-words">{message.content}</p>
                      <div className={`text-xs mt-1 flex items-center justify-end gap-1 ${
                        isMine ? 'text-pink-100' : 'text-gray-400'
                      }`}>
                        <span>{formatTime(message.createdAt)}</span>
                        {isMine && (
                          message.readAt ? (
                            <CheckCheck className="w-3.5 h-3.5" />
                          ) : (
                            <Check className="w-3.5 h-3.5" />
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-start mb-2">
            <div className="w-8 mr-2 flex-shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
                  <span className="text-white font-medium text-sm">
                    {displayName[0]?.toUpperCase() || '?'}
                  </span>
                </div>
              )}
            </div>
            <div className="bg-white border border-gray-200 rounded-2xl px-4 py-3 shadow-sm">
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
      <form onSubmit={handleSendMessage} className="bg-white border-t p-3">
        <div className="flex items-center gap-2">
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Image className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button 
            type="button" 
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Smile className="w-5 h-5" />
          </button>
          
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTypingInput();
            }}
            placeholder="Type a message..."
            className="flex-1 px-4 py-2.5 bg-gray-100 border-0 rounded-full focus:ring-2 focus:ring-pink-500 focus:bg-white transition-all"
          />
          
          <button 
            type="submit" 
            disabled={!newMessage.trim() || isSending}
            className={`p-3 rounded-full transition-all ${
              newMessage.trim() && !isSending
                ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md hover:shadow-lg'
                : 'bg-gray-200 text-gray-400'
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </form>
    </div>
  );
}

export default Chat;

