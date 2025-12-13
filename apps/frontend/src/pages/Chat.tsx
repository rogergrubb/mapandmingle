import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Send, Image, MapPin, Smile, MoreVertical, 
  Trash2, ArrowLeft, Check, CheckCheck, Phone, Video, Download, UserPlus, UserCheck, Clock, Star
} from 'lucide-react';
import { Button } from '../components/common/Button';
import EmojiPicker from '../components/EmojiPicker';
import { useWebSocket } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import { useCallStore } from '../stores/callStore';
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
  const { initiateCall, status: callStatus } = useCallStore();
  const { socket, isConnected } = useWebSocket();
  const [otherUser, setOtherUser] = useState<UserProfile | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [viewingImage, setViewingImage] = useState<string | null>(null);
  const [viewingImageMsg, setViewingImageMsg] = useState<Message | null>(null);
  const [savingImage, setSavingImage] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<number | undefined>(undefined);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isOtherUserOnline, setIsOtherUserOnline] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<{
    status: string;
    connectionId: string | null;
    isRequester: boolean;
    canAccept: boolean;
  }>({ status: 'none', connectionId: null, isRequester: false, canAccept: false });
  const [connectionLoading, setConnectionLoading] = useState(false);

  // Fetch connection status
  useEffect(() => {
    if (otherUserId) {
      api.get(`/api/connections/status/${otherUserId}`)
        .then((response: any) => {
          setConnectionStatus(response.data || response);
        })
        .catch(() => {});
    }
  }, [otherUserId]);

  const handleConnect = async () => {
    if (!otherUserId || connectionLoading) return;
    setConnectionLoading(true);
    
    try {
      if (connectionStatus.status === 'none') {
        await api.post('/api/connections/request', { addresseeId: otherUserId });
        setConnectionStatus({ status: 'pending', connectionId: null, isRequester: true, canAccept: false });
      } else if (connectionStatus.canAccept && connectionStatus.connectionId) {
        await api.post(`/api/connections/${connectionStatus.connectionId}/accept`);
        setConnectionStatus({ status: 'accepted', connectionId: connectionStatus.connectionId, isRequester: false, canAccept: false });
      }
    } catch (err) {
      console.error('Connection failed:', err);
    } finally {
      setConnectionLoading(false);
    }
  };

  useEffect(() => {
    if (otherUserId) {
      fetchMessages();
    }
  }, [otherUserId]);

  useEffect(() => {
    if (!socket || !isConnected || !otherUserId || !user?.id) return;

    // Authenticate WebSocket
    socket.send('auth', { userId: user.id });
    
    // Check if other user is online
    socket.send('check-online', { userId: otherUserId });
    
    // Listen for online status updates
    const handleOnlineStatus = (data: { userId: string; isOnline: boolean }) => {
      if (data.userId === otherUserId) {
        setIsOtherUserOnline(data.isOnline);
      }
    };
    socket.on('online-status', handleOnlineStatus);

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

  // Mark all messages in this conversation as read
  const markConversationAsRead = async () => {
    try {
      await api.put(`/api/messages/conversation/${otherUserId}/read`);
    } catch (error) {
      console.error('Failed to mark conversation as read:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      setIsLoading(true);
      // Use new API endpoint: GET /api/messages/conversation/:userId
      const data: Message[] = await api.get(`/api/messages/conversation/${otherUserId}`);
      setMessages(data);
      
      // Mark messages as read after fetching
      markConversationAsRead();
      
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
          const response: any = await api.get(`/api/users/${otherUserId}`);
          // Backend returns { user: { ... } }
          const userData = response.user || response;
          setOtherUser({
            id: userData.id,
            name: userData.displayName || userData.name || 'User',
            email: userData.email || '',
            avatar: userData.avatar,
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

  // Helper to detect if message contains an image
  const extractImageUrl = (text: string): string | null => {
    // Check for [Image] prefix format
    if (text.startsWith('[Image] ')) {
      return text.replace('[Image] ', '').trim();
    }
    // Check for S3 URL pattern
    const s3Pattern = /(https:\/\/[\w.-]+\.s3[\w.-]*\.amazonaws\.com\/[^\s]+)/;
    const match = text.match(s3Pattern);
    return match ? match[1] : null;
  };

  // Helper to detect location messages
  const extractLocationUrl = (text: string): string | null => {
    if (text.includes('Shared location:') || text.includes('[Location]')) {
      const urlMatch = text.match(/(https:\/\/[\w./\-?=&,]+)/);
      return urlMatch ? urlMatch[1] : null;
    }
    return null;
  };

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !otherUserId) return;

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setUploadError(`Invalid file type. Please select a JPEG, PNG, GIF, or WebP image.\n\nYour file: ${file.type || 'unknown type'}`);
      return;
    }
    
    // File size validation (10MB max to match backend)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      const sizeMB = (file.size / (1024 * 1024)).toFixed(1);
      setUploadError(`Image is too large (${sizeMB}MB).\n\nMaximum size: 10MB\n\nTry compressing your image or choosing a smaller one.`);
      return;
    }

    setIsUploadingImage(true);
    setUploadError(null);
    try {
      // Upload to S3
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', 'messages');
      
      const uploadResponse: any = await api.post('/api/upload', formData);
      const imageUrl = uploadResponse.url || uploadResponse.fileUrl;

      if (imageUrl) {
        // Send as a message with image
        await api.post('/api/messages', {
          receiverId: otherUserId,
          content: "[Image] " + imageUrl,
        });
        
        // Refresh messages
        const data: Message[] = await api.get(`/api/messages/conversation/${otherUserId}`);
        setMessages(data);
        scrollToBottom();
      } else {
        throw new Error('Upload succeeded but no URL returned');
      }
    } catch (error: any) {
      console.error('Failed to upload image:', error);
      // Extract error message from response
      const errorMsg = error?.response?.data?.error 
        || error?.response?.data?.message 
        || error?.message 
        || 'Unknown error';
      
      if (errorMsg.includes('file type')) {
        setUploadError(`Invalid file type.\n\nAllowed: JPEG, PNG, GIF, WebP`);
      } else if (errorMsg.includes('too large') || errorMsg.includes('Maximum')) {
        setUploadError(`Image is too large.\n\nMaximum size: 10MB`);
      } else if (errorMsg.includes('Unauthorized')) {
        setUploadError(`Please log in again to send images.`);
      } else {
        setUploadError(`Failed to send image.\n\n${errorMsg}\n\nPlease try again.`);
      }
    } finally {
      setIsUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleShareLocation = async () => {
    if (!otherUserId) return;
    
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      const { latitude, longitude } = position.coords;
      const mapsUrl = `https://www.google.com/maps?q=${latitude},${longitude}`;
      
      // Send location as a message
      await api.post('/api/messages', {
        receiverId: otherUserId,
        content: `📍 Shared location: ${mapsUrl}`,
      });
      
      // Refresh messages
      const data: Message[] = await api.get(`/api/messages/conversation/${otherUserId}`);
      setMessages(data);
      scrollToBottom();
    } catch (error: any) {
      if (error.code === 1) {
        alert('Location access denied. Please enable location permissions.');
      } else {
        alert('Failed to get location. Please try again.');
      }
    }
  };

  const handleEmojiSelect = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    inputRef.current?.focus();
  };

  const handleSaveImageToGallery = async () => {
    if (!viewingImage || !viewingImageMsg) return;
    
    setSavingImage(true);
    try {
      await api.post('/api/photos/save-from-chat', {
        messageId: viewingImageMsg.id,
        imageUrl: viewingImage,
      });
      alert('Photo saved to your gallery!');
    } catch (error: any) {
      console.error('Failed to save image:', error);
      alert(error.response?.data?.error || 'Failed to save photo');
    } finally {
      setSavingImage(false);
    }
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
              {/* Online indicator on avatar */}
              <span className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${isOtherUserOnline ? 'bg-green-500' : 'bg-gray-400'}`}>
                {isOtherUserOnline && (
                  <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-75"></span>
                )}
              </span>
            </div>
            <div>
              <div className="font-semibold text-gray-900">{displayName}</div>
              <div className="text-xs">
                {isTyping ? (
                  <span className="text-pink-500 font-medium">typing...</span>
                ) : isOtherUserOnline ? (
                  <span className="text-green-500 font-medium flex items-center gap-1">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                    Online now
                  </span>
                ) : (
                  <span className="text-gray-500">Tap to view profile</span>
                )}
              </div>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-1">
          {/* Connection Status Button */}
          {connectionStatus.status === 'none' && (
            <button 
              onClick={handleConnect}
              disabled={connectionLoading}
              className="p-2 hover:bg-purple-100 rounded-full transition-colors disabled:opacity-50"
              title="Connect"
            >
              <UserPlus className="w-5 h-5 text-purple-600" />
            </button>
          )}
          {connectionStatus.status === 'pending' && connectionStatus.canAccept && (
            <button 
              onClick={handleConnect}
              disabled={connectionLoading}
              className="p-2 hover:bg-green-100 rounded-full transition-colors disabled:opacity-50"
              title="Accept connection"
            >
              <UserCheck className="w-5 h-5 text-green-600" />
            </button>
          )}
          {connectionStatus.status === 'pending' && connectionStatus.isRequester && (
            <button 
              disabled
              className="p-2 rounded-full opacity-50"
              title="Request pending"
            >
              <Clock className="w-5 h-5 text-gray-400" />
            </button>
          )}
          {connectionStatus.status === 'accepted' && (
            <button 
              disabled
              className="p-2 rounded-full"
              title="Connected friend"
            >
              <Star className="w-5 h-5 text-yellow-500" />
            </button>
          )}
          
          <button 
            onClick={() => otherUser && callStatus === 'idle' && initiateCall(otherUser.id, otherUser.name, otherUser.avatar || null, false)}
            disabled={callStatus !== 'idle'}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Voice call"
          >
            <Phone className="w-5 h-5 text-gray-600" />
          </button>
          <button 
            onClick={() => otherUser && callStatus === 'idle' && initiateCall(otherUser.id, otherUser.name, otherUser.avatar || null, true)}
            disabled={callStatus !== 'idle'}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Video call"
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
                      {(() => {
                        const imageUrl = extractImageUrl(message.content);
                        const locationUrl = extractLocationUrl(message.content);
                        
                        if (imageUrl) {
                          return (
                            <div 
                              className="cursor-pointer"
                              onClick={() => {
                                setViewingImage(imageUrl);
                                setViewingImageMsg(message);
                              }}
                            >
                              <img 
                                src={imageUrl} 
                                alt="Shared image"
                                className="max-w-[200px] max-h-[200px] rounded-lg object-cover hover:opacity-90 transition-opacity"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                  (e.target as HTMLImageElement).parentElement!.innerHTML = '<p class="text-sm opacity-75">Image failed to load</p>';
                                }}
                              />
                              <p className="text-xs mt-1 opacity-75">Tap to view full size</p>
                            </div>
                          );
                        }
                        
                        if (locationUrl) {
                          return (
                            <a 
                              href={locationUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 underline hover:no-underline"
                            >
                              <span>📍</span>
                              <span>View shared location</span>
                            </a>
                          );
                        }
                        
                        return <p className="whitespace-pre-wrap break-words">{message.content}</p>;
                      })()}
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

      {/* Upload Error Toast */}
      {uploadError && (
        <div className="absolute bottom-20 left-4 right-4 bg-red-50 border border-red-200 rounded-xl p-4 shadow-lg animate-in slide-in-from-bottom duration-200 z-50">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg className="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-red-800 text-sm">Image Upload Failed</h4>
              <p className="text-red-600 text-sm mt-1 whitespace-pre-line">{uploadError}</p>
            </div>
            <button 
              onClick={() => setUploadError(null)}
              className="text-red-400 hover:text-red-600 p-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="mt-3 pt-3 border-t border-red-200">
            <p className="text-xs text-red-500">
              <strong>Supported formats:</strong> JPEG, PNG, GIF, WebP • <strong>Max size:</strong> 10MB
            </p>
          </div>
        </div>
      )}

      {/* Input */}
      <form onSubmit={handleSendMessage} className="bg-white border-t p-3">
        <div className="flex items-center gap-2">
          {/* Hidden file input for image upload */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageSelect}
            className="hidden"
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploadingImage}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
            title="Send image"
          >
            {isUploadingImage ? (
              <div className="w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Image className="w-5 h-5" />
            )}
          </button>
          <button 
            type="button"
            onClick={handleShareLocation}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Share location"
          >
            <MapPin className="w-5 h-5" />
          </button>
          <button 
            type="button"
            onClick={() => setShowEmojiPicker(true)}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            title="Add emoji"
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
      {/* Emoji Picker Modal */}
      <EmojiPicker
        isOpen={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelect={handleEmojiSelect}
      />

      {/* Full-size Image Viewer Modal */}
      {viewingImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setViewingImage(null);
            setViewingImageMsg(null);
          }}
        >
          <button
            onClick={() => {
              setViewingImage(null);
              setViewingImageMsg(null);
            }}
            className="absolute top-4 right-4 text-white text-4xl hover:text-gray-300 z-50"
          >
            &times;
          </button>
          
          {/* Save button for received images */}
          {viewingImageMsg && viewingImageMsg.senderId !== user?.id && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleSaveImageToGallery();
              }}
              disabled={savingImage}
              className="absolute top-4 left-4 flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-lg hover:opacity-90 transition-opacity disabled:opacity-50 z-50"
            >
              <Download size={18} />
              {savingImage ? 'Saving...' : 'Save to Gallery'}
            </button>
          )}
          
          <img 
            src={viewingImage}
            alt="Full size"
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

export default Chat;


