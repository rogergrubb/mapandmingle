import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, X, Check, CheckCheck, Trash2, Settings, MapPin, Users, 
  MessageSquare, Calendar, AlertCircle 
} from 'lucide-react';
import api from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
  data?: string;
  fromUser?: {
    id: string;
    name: string;
    profile?: {
      avatar?: string;
      displayName?: string;
    };
  };
}

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationCenter({ isOpen, onClose }: NotificationCenterProps) {
  const navigate = useNavigate();
  const panelRef = useRef<HTMLDivElement>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/api/notifications?limit=20');
      const data = response.data || response;
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/api/notifications/${id}/read`);
      setNotifications(notifications.map(n => 
        n.id === id ? { ...n, isRead: true } : n
      ));
      setUnreadCount(Math.max(0, unreadCount - 1));
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/api/notifications/read-all');
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await api.delete(`/api/notifications/${id}`);
      const notif = notifications.find(n => n.id === id);
      setNotifications(notifications.filter(n => n.id !== id));
      if (notif && !notif.isRead) {
        setUnreadCount(Math.max(0, unreadCount - 1));
      }
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    // Mark as read
    if (!notification.isRead) {
      markAsRead(notification.id);
    }

    // Navigate based on type
    try {
      const data = notification.data ? JSON.parse(notification.data) : {};
      
      if (notification.type === 'friend_pin' || notification.type === 'nearby_pin') {
        // Navigate to map centered on the pin
        if (data.lat && data.lng) {
          navigate(`/map?lat=${data.lat}&lng=${data.lng}&zoom=15`);
        } else {
          navigate('/map');
        }
      } else if (notification.type === 'message') {
        navigate(`/chat/${notification.fromUser?.id}`);
      } else if (notification.type === 'connection_request') {
        navigate('/connections');
      }
    } catch {
      // Default: just close
    }

    onClose();
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'friend_pin':
        return <Users className="w-5 h-5 text-purple-500" />;
      case 'nearby_pin':
        return <MapPin className="w-5 h-5 text-blue-500" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-green-500" />;
      case 'event':
        return <Calendar className="w-5 h-5 text-orange-500" />;
      case 'connection_request':
        return <Users className="w-5 h-5 text-pink-500" />;
      default:
        return <Bell className="w-5 h-5 text-gray-500" />;
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 md:relative md:inset-auto">
      {/* Backdrop (mobile only) */}
      <div className="fixed inset-0 bg-black/30 md:hidden" onClick={onClose} />

      {/* Panel */}
      <div 
        ref={panelRef}
        className="fixed inset-x-0 bottom-0 top-16 md:absolute md:right-0 md:top-full md:inset-x-auto 
          md:w-96 md:mt-2 bg-white md:rounded-xl md:shadow-xl md:border md:max-h-[calc(100vh-100px)]
          overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center justify-between bg-white">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" />
            <h2 className="font-semibold">Notifications</h2>
            {unreadCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-pink-500 text-white rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-pink-500 hover:underline"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => {
                navigate('/notifications/settings');
                onClose();
              }}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <Settings className="w-4 h-4 text-gray-500" />
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full md:hidden"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Bell className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No notifications yet</p>
              <p className="text-sm">You're all caught up!</p>
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`px-4 py-3 hover:bg-gray-50 cursor-pointer transition-colors
                    ${!notification.isRead ? 'bg-pink-50/50' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className="flex gap-3">
                    {/* Avatar or Icon */}
                    <div className="flex-shrink-0">
                      {notification.fromUser?.profile?.avatar ? (
                        <img
                          src={notification.fromUser.profile.avatar}
                          alt=""
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
                          {getNotificationIcon(notification.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${!notification.isRead ? 'font-semibold' : ''}`}>
                        {notification.title}
                      </p>
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {notification.body}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex-shrink-0 flex items-start gap-1">
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-pink-500 rounded-full mt-2" />
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteNotification(notification.id);
                        }}
                        className="p-1 hover:bg-gray-200 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4 text-gray-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="px-4 py-3 border-t bg-white">
            <button
              onClick={() => {
                navigate('/notifications');
                onClose();
              }}
              className="w-full text-center text-sm text-pink-500 hover:underline"
            >
              View all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Bell icon with unread badge for header
export function NotificationBell({ onClick }: { onClick: () => void }) {
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchUnreadCount();
    // Poll every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const response = await api.get('/api/notifications/unread-count');
      const data = response.data || response;
      setUnreadCount(data.count || 0);
    } catch (error) {
      // Silently fail
    }
  };

  return (
    <button
      onClick={onClick}
      className="relative p-2 hover:bg-gray-100 rounded-full transition-colors"
    >
      <Bell className="w-6 h-6 text-gray-600" />
      {unreadCount > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 text-white text-xs 
          font-bold rounded-full flex items-center justify-center">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}
