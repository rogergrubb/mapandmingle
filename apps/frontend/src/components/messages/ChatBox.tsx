import { useState, useEffect, useRef } from 'react';
import { Send, Smile, Paperclip, MoreVertical } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Message, User } from '../../types';
import { useWebSocket } from '../../lib/websocket';

interface ChatBoxProps {
  conversationId: string;
  currentUser: User;
  otherUser: User;
  onSendMessage: (content: string) => Promise<void>;
}

export function ChatBox({
  conversationId,
  currentUser,
  otherUser,
  onSendMessage,
}: ChatBoxProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { socket, isConnected } = useWebSocket();

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Join conversation room
    socket.emit('join_conversation', { conversationId });

    // Listen for new messages
    socket.on('new_message', (message: Message) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    });

    // Listen for typing indicators
    socket.on('user_typing', ({ userId }: { userId: string }) => {
      if (userId !== currentUser.id) {
        setIsTyping(true);
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Listen for read receipts
    socket.on('message_read', ({ messageId }: { messageId: string }) => {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === messageId ? { ...msg, isRead: true } : msg
        )
      );
    });

    return () => {
      socket.off('new_message');
      socket.off('user_typing');
      socket.off('message_read');
      socket.emit('leave_conversation', { conversationId });
    };
  }, [socket, isConnected, conversationId, currentUser.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isSending) return;

    setIsSending(true);
    try {
      await onSendMessage(newMessage);
      setNewMessage('');
      scrollToBottom();
    } finally {
      setIsSending(false);
    }
  };

  const handleTyping = () => {
    if (socket && isConnected) {
      socket.emit('typing', {
        conversationId,
        userId: currentUser.id,
      });
    }
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src={otherUser.avatar || '/default-avatar.png'}
            alt={otherUser.name}
            className="w-10 h-10 rounded-full object-cover"
          />
          <div>
            <h3 className="font-semibold text-gray-900">{otherUser.name}</h3>
            <p className="text-sm text-gray-500">
              {isConnected ? 'Online' : 'Offline'}
            </p>
          </div>
        </div>
        <Button variant="ghost" size="sm">
          <MoreVertical className="w-5 h-5" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => {
          const isOwn = message.senderId === currentUser.id;
          return (
            <div
              key={message.id}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isOwn
                    ? 'bg-pink-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span
                    className={`text-xs ${
                      isOwn ? 'text-pink-100' : 'text-gray-500'
                    }`}
                  >
                    {formatTime(message.createdAt)}
                  </span>
                  {isOwn && (
                    <span className="text-xs text-pink-100">
                      {message.isRead ? '✓✓' : '✓'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.1s' }}
                ></span>
                <span
                  className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                  style={{ animationDelay: '0.2s' }}
                ></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <form onSubmit={handleSend} className="p-4 border-t">
        <div className="flex items-center gap-2">
          <Button type="button" variant="ghost" size="sm">
            <Smile className="w-5 h-5" />
          </Button>
          <Button type="button" variant="ghost" size="sm">
            <Paperclip className="w-5 h-5" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              handleTyping();
            }}
            placeholder="Type a message..."
            className="flex-1"
          />
          <Button type="submit" disabled={!newMessage.trim() || isSending}>
            <Send className="w-5 h-5" />
          </Button>
        </div>
      </form>
    </div>
  );
}
