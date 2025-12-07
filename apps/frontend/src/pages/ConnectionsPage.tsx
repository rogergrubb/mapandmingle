import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, Clock, Check, X, MapPin, MessageCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface ConnectionUser {
  id: string;
  name: string | null;
  displayName: string | null;
  image: string | null;
  bio: string | null;
  lastActiveAt?: string | null;
}

interface Connection {
  connectionId: string;
  metAt?: string;
  metLocation?: string;
  connectedAt?: string;
  requestedAt?: string;
  user: ConnectionUser;
}

type Tab = 'friends' | 'requests' | 'sent';

export default function ConnectionsPage() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const [activeTab, setActiveTab] = useState<Tab>('friends');
  const [friends, setFriends] = useState<Connection[]>([]);
  const [requests, setRequests] = useState<Connection[]>([]);
  const [sent, setSent] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    fetchConnections();
  }, [isAuthenticated, navigate]);

  const fetchConnections = async () => {
    setLoading(true);
    try {
      const [friendsRes, requestsRes, sentRes] = await Promise.all([
        api.get('/api/connections'),
        api.get('/api/connections/requests'),
        api.get('/api/connections/sent'),
      ]);
      setFriends(friendsRes.data.connections || []);
      setRequests(requestsRes.data.requests || []);
      setSent(sentRes.data.sent || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
    } finally {
      setLoading(false);
    }
  };

  const acceptRequest = async (connectionId: string) => {
    try {
      await api.post(`/api/connections/${connectionId}/accept`);
      fetchConnections();
    } catch (err) {
      console.error('Failed to accept:', err);
    }
  };

  const declineRequest = async (connectionId: string) => {
    try {
      await api.post(`/api/connections/${connectionId}/decline`);
      fetchConnections();
    } catch (err) {
      console.error('Failed to decline:', err);
    }
  };

  const cancelRequest = async (connectionId: string) => {
    try {
      await api.delete(`/api/connections/request/${connectionId}`);
      fetchConnections();
    } catch (err) {
      console.error('Failed to cancel:', err);
    }
  };

  const removeConnection = async (connectionId: string) => {
    if (!confirm('Remove this connection?')) return;
    try {
      await api.delete(`/api/connections/${connectionId}`);
      fetchConnections();
    } catch (err) {
      console.error('Failed to remove:', err);
    }
  };

  const formatTimeAgo = (dateString: string | null | undefined) => {
    if (!dateString) return 'A while ago';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const tabs: { id: Tab; label: string; icon: typeof Users; count: number }[] = [
    { id: 'friends', label: 'Friends', icon: Users, count: friends.length },
    { id: 'requests', label: 'Requests', icon: UserPlus, count: requests.length },
    { id: 'sent', label: 'Sent', icon: Clock, count: sent.length },
  ];

  const renderUserCard = (conn: Connection, type: 'friend' | 'request' | 'sent') => {
    const user = conn.user;
    const displayName = user.displayName || user.name || 'Anonymous';
    
    return (
      <div 
        key={conn.connectionId}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <div 
            className="w-14 h-14 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xl font-bold flex-shrink-0 cursor-pointer"
            onClick={() => navigate(`/user/${user.id}`)}
          >
            {user.image ? (
              <img src={user.image} alt={displayName} className="w-full h-full rounded-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div 
              className="font-semibold text-gray-900 truncate cursor-pointer hover:text-purple-600"
              onClick={() => navigate(`/user/${user.id}`)}
            >
              {displayName}
            </div>
            
            {user.bio && (
              <div className="text-sm text-gray-500 truncate mt-0.5">{user.bio}</div>
            )}

            {/* Meta info */}
            {type === 'friend' && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                {conn.metLocation && (
                  <span className="flex items-center gap-1">
                    <MapPin size={12} />
                    Met at {conn.metLocation}
                  </span>
                )}
                {user.lastActiveAt && (
                  <span>Active {formatTimeAgo(user.lastActiveAt)}</span>
                )}
              </div>
            )}

            {type === 'request' && (
              <div className="text-xs text-gray-400 mt-1">
                Requested {formatTimeAgo(conn.requestedAt)}
              </div>
            )}

            {type === 'sent' && (
              <div className="text-xs text-gray-400 mt-1">
                Sent {formatTimeAgo(conn.requestedAt)}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {type === 'friend' && (
              <>
                <button
                  onClick={() => navigate(`/messages?user=${user.id}`)}
                  className="p-2 rounded-full bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
                  title="Message"
                >
                  <MessageCircle size={18} />
                </button>
                <button
                  onClick={() => removeConnection(conn.connectionId)}
                  className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <X size={18} />
                </button>
              </>
            )}

            {type === 'request' && (
              <>
                <button
                  onClick={() => acceptRequest(conn.connectionId)}
                  className="p-2 rounded-full bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
                  title="Accept"
                >
                  <Check size={18} />
                </button>
                <button
                  onClick={() => declineRequest(conn.connectionId)}
                  className="p-2 rounded-full bg-gray-50 text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                  title="Decline"
                >
                  <X size={18} />
                </button>
              </>
            )}

            {type === 'sent' && (
              <button
                onClick={() => cancelRequest(conn.connectionId)}
                className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200 transition-colors"
              >
                Cancel
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderEmptyState = () => {
    const states = {
      friends: {
        icon: Users,
        title: 'No connections yet',
        description: 'When you connect with people you meet, they\'ll appear here.',
      },
      requests: {
        icon: UserPlus,
        title: 'No pending requests',
        description: 'When someone wants to connect, you\'ll see it here.',
      },
      sent: {
        icon: Clock,
        title: 'No sent requests',
        description: 'Requests you send will appear here until accepted.',
      },
    };

    const state = states[activeTab];
    const Icon = state.icon;

    return (
      <div className="flex flex-col items-center justify-center py-16 px-4">
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          <Icon size={28} className="text-gray-400" />
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-1">{state.title}</h3>
        <p className="text-sm text-gray-500 text-center max-w-xs">{state.description}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-purple-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentList = activeTab === 'friends' ? friends : activeTab === 'requests' ? requests : sent;

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 pt-4 pb-2">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connections</h1>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive 
                      ? tab.id === 'requests' ? 'bg-pink-100 text-pink-600' : 'bg-gray-100 text-gray-600'
                      : 'bg-gray-200 text-gray-500'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {currentList.length === 0 ? (
          renderEmptyState()
        ) : (
          <div className="space-y-3">
            {currentList.map((conn) => renderUserCard(conn, activeTab === 'friends' ? 'friend' : activeTab === 'requests' ? 'request' : 'sent'))}
          </div>
        )}
      </div>
    </div>
  );
}
