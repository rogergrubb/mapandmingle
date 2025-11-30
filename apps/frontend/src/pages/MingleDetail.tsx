import { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  MapPin, Users, Clock, Zap, Send, UserPlus, UserMinus, X
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useWebSocket } from '../lib/websocket';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface Mingle {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  participantsCount: number;
  maxParticipants: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  isParticipating: boolean;
  isCreator: boolean;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
  participants: Array<{
    id: string;
    name: string;
    avatar: string;
  }>;
}

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  text: string;
  createdAt: Date;
}

export function MingleDetail() {
  const params = useParams<{ id: string }>();
  const user = useAuthStore((state) => state.user);
  const { socket, isConnected } = useWebSocket();
  const [mingle, setMingle] = useState<Mingle | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [showParticipants, setShowParticipants] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (params.id) {
      fetchMingle();
      fetchMessages();
    }
  }, [params.id]);

  useEffect(() => {
    if (!socket || !isConnected || !params.id) return;

    // Join mingle chat room
    socket.send('join_mingle', { mingleId: params.id });

    // Listen for new messages
    const handleNewMessage = (message: ChatMessage) => {
      setMessages((prev) => [...prev, message]);
      scrollToBottom();
    };

    // Listen for participant updates
    const handleParticipantJoined = ({ participant }: { participant: any }) => {
      if (mingle) {
        setMingle({
          ...mingle,
          participants: [...mingle.participants, participant],
          participantsCount: mingle.participantsCount + 1,
        });
      }
    };

    const handleParticipantLeft = ({ userId }: { userId: string }) => {
      if (mingle) {
        setMingle({
          ...mingle,
          participants: mingle.participants.filter((p) => p.id !== userId),
          participantsCount: mingle.participantsCount - 1,
        });
      }
    };

    socket.on('mingle_message', handleNewMessage);
    socket.on('participant_joined', handleParticipantJoined);
    socket.on('participant_left', handleParticipantLeft);

    return () => {
      socket.off('mingle_message', handleNewMessage);
      socket.off('participant_joined', handleParticipantJoined);
      socket.off('participant_left', handleParticipantLeft);
      socket.send('leave_mingle', { mingleId: params.id });
    };
  }, [socket, isConnected, params.id, mingle]);

  const fetchMingle = async () => {
    try {
      const response = await api.get(`/api/mingles/${params.id}`);
      setMingle(response.data);
    } catch (error) {
      console.error('Failed to fetch mingle:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await api.get(`/api/mingles/${params.id}/messages`);
      setMessages(response.data);
      scrollToBottom();
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleJoin = async () => {
    if (!mingle) return;

    try {
      await api.post(`/api/mingles/${mingle.id}/join`);
      setMingle({ ...mingle, isParticipating: true });
      fetchMingle(); // Refresh to get updated participant list
    } catch (error) {
      console.error('Failed to join mingle:', error);
    }
  };

  const handleLeave = async () => {
    if (!mingle) return;

    try {
      await api.post(`/api/mingles/${mingle.id}/leave`);
      setMingle({ ...mingle, isParticipating: false });
      fetchMingle();
    } catch (error) {
      console.error('Failed to leave mingle:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !mingle) return;

    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      userId: user?.id || '',
      userName: user?.name || '',
      userAvatar: user?.avatar || '',
      text: newMessage,
      createdAt: new Date(),
    };

    setMessages((prev) => [...prev, tempMessage]);
    setNewMessage('');
    scrollToBottom();

    try {
      const response = await api.post(`/api/mingles/${mingle.id}/messages`, {
        text: newMessage,
      });

      setMessages((prev) =>
        prev.map((msg) => (msg.id === tempMessage.id ? response.data : msg))
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      setMessages((prev) => prev.filter((msg) => msg.id !== tempMessage.id));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading mingle...</div>
      </div>
    );
  }

  if (!mingle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Mingle Not Found</h2>
          <Link to="/mingles">
            <Button>Back to Mingles</Button>
          </Link>
        </div>
      </div>
    );
  }

  const isFull = mingle.participantsCount >= mingle.maxParticipants;

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b p-4">
        <div className="flex items-center gap-2 mb-3">
          <span className="inline-block px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs font-medium">
            {mingle.category}
          </span>
          {mingle.isActive && (
            <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
              <Zap className="w-3 h-3 mr-1" />
              Active
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-3">{mingle.title}</h1>
        <p className="text-gray-600 mb-4">{mingle.description}</p>

        <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
          <div className="flex items-center">
            <MapPin className="w-4 h-4 mr-1" />
            {mingle.location}
          </div>
          <button
            onClick={() => setShowParticipants(true)}
            className="flex items-center hover:text-gray-900"
          >
            <Users className="w-4 h-4 mr-1" />
            {mingle.participantsCount}/{mingle.maxParticipants}
          </button>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            Ends {new Date(mingle.endsAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>

        {/* Join/Leave Button */}
        {!mingle.isCreator && (
          mingle.isParticipating ? (
            <Button variant="outline" onClick={handleLeave} className="w-full">
              <UserMinus className="w-4 h-4 mr-2" />
              Leave Mingle
            </Button>
          ) : (
            <Button onClick={handleJoin} disabled={isFull} className="w-full">
              <UserPlus className="w-4 h-4 mr-2" />
              {isFull ? 'Mingle Full' : 'Join Mingle'}
            </Button>
          )
        )}
      </div>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((message) => {
          const isMine = message.userId === user?.id;
          return (
            <div key={message.id} className={`flex gap-2 ${isMine ? 'flex-row-reverse' : ''}`}>
              <img
                src={message.userAvatar || '/default-avatar.png'}
                alt={message.userName}
                className="w-8 h-8 rounded-full flex-shrink-0"
              />
              <div className={`flex-1 ${isMine ? 'text-right' : ''}`}>
                <div className="text-xs text-gray-500 mb-1">{message.userName}</div>
                <div
                  className={`inline-block px-4 py-2 rounded-2xl ${
                    isMine ? 'bg-pink-600 text-white' : 'bg-white text-gray-900'
                  }`}
                >
                  {message.text}
                </div>
                <div className="text-xs text-gray-400 mt-1">
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      {mingle.isParticipating && (
        <form onSubmit={handleSendMessage} className="border-t p-4 bg-white">
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:ring-2 focus:ring-pink-500 focus:border-transparent"
            />
            <Button type="submit" disabled={!newMessage.trim()} className="rounded-full p-3">
              <Send className="w-5 h-5" />
            </Button>
          </div>
        </form>
      )}

      {/* Participants Modal */}
      {showParticipants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <h3 className="text-lg font-bold">Participants ({mingle.participantsCount})</h3>
              <button onClick={() => setShowParticipants(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[60vh] p-4">
              <div className="space-y-3">
                {mingle.participants.map((participant) => (
                  <Link key={participant.id} href={`/profile/${participant.id}`}>
                    <div className="flex items-center gap-3 p-3 hover:bg-gray-50 rounded-lg">
                      <img
                        src={participant.avatar || '/default-avatar.png'}
                        alt={participant.name}
                        className="w-12 h-12 rounded-full"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{participant.name}</div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
