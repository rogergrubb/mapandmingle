import { useEffect, useState } from 'react';
import { 
  Bell, MessageCircle, Heart, Calendar, Users, MapPin, 
  TrendingUp, X, UserPlus, Star
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export interface ToastNotification {
  id: string;
  type: string;
  title: string;
  body: string;
  avatar?: string;
  fromUserId?: string;
  data?: any;
  createdAt: Date;
}

// Global notification queue
let notificationQueue: ToastNotification[] = [];
let listeners: ((notifications: ToastNotification[]) => void)[] = [];

// Add notification from anywhere in the app
export function showToastNotification(notification: Omit<ToastNotification, 'id' | 'createdAt'>) {
  const newNotification: ToastNotification = {
    ...notification,
    id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    createdAt: new Date(),
  };
  
  notificationQueue = [...notificationQueue, newNotification];
  listeners.forEach(listener => listener(notificationQueue));
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    removeToastNotification(newNotification.id);
  }, 3000);
  
  // Play sound
  try {
    const audio = new Audio('/notification.mp3');
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
  
  // Haptic feedback on mobile
  if ('vibrate' in navigator) {
    navigator.vibrate(100);
  }
}

export function removeToastNotification(id: string) {
  notificationQueue = notificationQueue.filter(n => n.id !== id);
  listeners.forEach(listener => listener(notificationQueue));
}

// Hook to subscribe to notifications
function useToastNotifications() {
  const [notifications, setNotifications] = useState<ToastNotification[]>(notificationQueue);
  
  useEffect(() => {
    const listener = (newQueue: ToastNotification[]) => {
      setNotifications([...newQueue]);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);
  
  return notifications;
}

// Get icon and color based on notification type
function getNotificationStyle(type: string) {
  switch (type) {
    case 'message':
      return { icon: MessageCircle, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-500' };
    case 'friend_pin':
      return { icon: Users, color: 'from-purple-500 to-purple-600', bg: 'bg-purple-500' };
    case 'nearby_pin':
      return { icon: MapPin, color: 'from-orange-500 to-orange-600', bg: 'bg-orange-500' };
    case 'like':
      return { icon: Heart, color: 'from-pink-500 to-pink-600', bg: 'bg-pink-500' };
    case 'comment':
      return { icon: MessageCircle, color: 'from-green-500 to-green-600', bg: 'bg-green-500' };
    case 'event':
      return { icon: Calendar, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-500' };
    case 'connection_request':
      return { icon: UserPlus, color: 'from-purple-500 to-pink-500', bg: 'bg-purple-500' };
    case 'connection_accepted':
      return { icon: Star, color: 'from-yellow-500 to-orange-500', bg: 'bg-yellow-500' };
    case 'trending':
      return { icon: TrendingUp, color: 'from-red-500 to-red-600', bg: 'bg-red-500' };
    default:
      return { icon: Bell, color: 'from-gray-500 to-gray-600', bg: 'bg-gray-500' };
  }
}

// The actual toast container component - render this once at app root
export function ToastNotificationContainer() {
  const navigate = useNavigate();
  const notifications = useToastNotifications();
  
  const handleClick = (notification: ToastNotification) => {
    removeToastNotification(notification.id);
    
    // Navigate based on type
    switch (notification.type) {
      case 'message':
        if (notification.fromUserId) {
          navigate(`/chat/${notification.fromUserId}`);
        } else {
          navigate('/messages');
        }
        break;
      case 'friend_pin':
      case 'nearby_pin':
        if (notification.data?.lat && notification.data?.lng) {
          navigate(`/map?lat=${notification.data.lat}&lng=${notification.data.lng}&zoom=15`);
        } else {
          navigate('/map');
        }
        break;
      case 'connection_request':
      case 'connection_accepted':
        navigate('/activity');
        break;
      case 'event':
        if (notification.data?.eventId) {
          navigate(`/events/${notification.data.eventId}`);
        } else {
          navigate('/events');
        }
        break;
      default:
        navigate('/map');
    }
  };
  
  if (notifications.length === 0) return null;
  
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] flex flex-col gap-3 w-full max-w-md px-4 pointer-events-none">
      {notifications.map((notification, index) => {
        const style = getNotificationStyle(notification.type);
        const Icon = style.icon;
        
        return (
          <div
            key={notification.id}
            onClick={() => handleClick(notification)}
            className="pointer-events-auto animate-slide-down cursor-pointer"
            style={{
              animation: 'slideDown 0.3s ease-out',
              animationFillMode: 'forwards',
            }}
          >
            <div className={`
              relative overflow-hidden rounded-2xl shadow-2xl
              bg-gradient-to-r ${style.color}
              transform transition-all duration-300 hover:scale-[1.02]
            `}>
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              
              {/* Content */}
              <div className="relative p-4 flex items-start gap-4">
                {/* Avatar or Icon */}
                <div className="flex-shrink-0">
                  {notification.avatar ? (
                    <div className="relative">
                      <img
                        src={notification.avatar}
                        alt=""
                        className="w-14 h-14 rounded-full object-cover border-2 border-white/30"
                      />
                      <div className={`absolute -bottom-1 -right-1 w-6 h-6 ${style.bg} rounded-full flex items-center justify-center border-2 border-white`}>
                        <Icon className="w-3 h-3 text-white" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                  )}
                </div>
                
                {/* Text */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white text-lg leading-tight">
                    {notification.title}
                  </h3>
                  <p className="text-white/90 text-sm mt-1 line-clamp-2">
                    {notification.body}
                  </p>
                </div>
                
                {/* Close button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeToastNotification(notification.id);
                  }}
                  className="flex-shrink-0 p-1 hover:bg-white/20 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-white/80" />
                </button>
              </div>
              
              {/* Progress bar */}
              <div className="h-1 bg-white/20">
                <div 
                  className="h-full bg-white/50 animate-shrink"
                  style={{
                    animation: 'shrink 3s linear forwards',
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}
      
      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
        
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }
        
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
}

export default ToastNotificationContainer;
