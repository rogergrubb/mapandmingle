import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, Locate, RefreshCw,
  Ghost, Eye, UserCheck, Zap, Shield,
  Bell, MessageCircle
} from 'lucide-react';
import haptic from '../../lib/haptics';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';
export type VisibilityLevel = 'ghost' | 'circles' | 'fuzzy' | 'social' | 'discoverable' | 'beacon';

interface MapControlBarProps {
  currentMode: MingleMode;
  onModeChange: (mode: MingleMode) => void;
  onMyLocation: () => void;
  liveNow: number;
  inView: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  // Visibility props
  visibilityLevel: VisibilityLevel;
  onVisibilityChange: (level: VisibilityLevel) => void;
}

interface NotificationCounts {
  unreadMessages: number;
  pendingRequests: number;
  totalNotifications: number;
}

const modeConfig = {
  everybody: { 
    icon: Globe, 
    label: 'Everybody', 
    shortLabel: 'All',
    color: 'from-gray-500 to-gray-700',
  },
  dating: { 
    icon: Heart, 
    label: 'Dating', 
    shortLabel: 'Dating',
    color: 'from-pink-400 to-rose-500',
  },
  friends: { 
    icon: Users, 
    label: 'Friends', 
    shortLabel: 'Friends',
    color: 'from-purple-400 to-indigo-500',
  },
  networking: { 
    icon: Briefcase, 
    label: 'Networking', 
    shortLabel: 'Network',
    color: 'from-blue-400 to-cyan-500',
  },
  events: { 
    icon: Calendar, 
    label: 'Events', 
    shortLabel: 'Events',
    color: 'from-green-400 to-emerald-500',
  },
  travel: { 
    icon: Plane, 
    label: 'Travel', 
    shortLabel: 'Travel',
    color: 'from-orange-400 to-amber-500',
  },
};

const visibilityConfig: Record<VisibilityLevel, { 
  icon: typeof Ghost; 
  label: string; 
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  ghost: {
    icon: Ghost,
    label: 'Ghost Mode',
    shortLabel: 'Ghost',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 border-gray-300',
    description: 'Completely invisible',
  },
  circles: {
    icon: Shield,
    label: 'Circles Only',
    shortLabel: 'Circles',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 border-blue-200',
    description: 'Only trusted circles',
  },
  fuzzy: {
    icon: Eye,
    label: 'Fuzzy Location',
    shortLabel: 'Fuzzy',
    color: 'text-amber-600',
    bgColor: 'bg-amber-50 border-amber-200',
    description: 'Approximate area only',
  },
  social: {
    icon: UserCheck,
    label: 'Connections',
    shortLabel: 'Social',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 border-purple-200',
    description: 'Friends & connections',
  },
  discoverable: {
    icon: Globe,
    label: 'Discoverable',
    shortLabel: 'Visible',
    color: 'text-green-600',
    bgColor: 'bg-green-50 border-green-200',
    description: 'Open to all users',
  },
  beacon: {
    icon: Zap,
    label: 'Beacon Mode',
    shortLabel: 'Beacon',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 border-orange-200',
    description: 'Broadcasting location',
  },
};

function MapControlBar({
  currentMode,
  onModeChange,
  onMyLocation,
  liveNow,
  inView,
  onRefresh,
  isRefreshing,
  visibilityLevel,
  onVisibilityChange,
}: MapControlBarProps) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false);
  const [notifications, setNotifications] = useState<NotificationCounts>({
    unreadMessages: 0,
    pendingRequests: 0,
    totalNotifications: 0,
  });

  const modeConf = modeConfig[currentMode];
  const visConf = visibilityConfig[visibilityLevel];
  const ModeIcon = modeConf.icon;
  const VisIcon = visConf.icon;

  // Fetch notification counts
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const [messagesRes, connectionsRes] = await Promise.all([
          api.get('/api/conversations').catch(() => ({ data: { conversations: [] } })),
          api.get('/api/connections/pending').catch(() => ({ data: { connections: [] } })),
        ]);

        const conversations = messagesRes.data?.conversations || messagesRes.conversations || [];
        const pendingConnections = connectionsRes.data?.connections || connectionsRes.connections || [];

        const unreadMessages = conversations.filter((c: any) => c.unreadCount > 0).length;
        const pendingRequests = pendingConnections.length;

        setNotifications({
          unreadMessages,
          pendingRequests,
          totalNotifications: unreadMessages + pendingRequests,
        });
      } catch (err) {
        console.error('Failed to fetch notifications:', err);
      }
    };

    fetchNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const totalBadgeCount = notifications.unreadMessages + notifications.pendingRequests;

  return (
    <>
      {/* Click outside to close dropdowns */}
      {(showModeSelector || showVisibilitySelector) && (
        <div 
          className="fixed inset-0 z-[1000]" 
          onClick={() => {
            setShowModeSelector(false);
            setShowVisibilitySelector(false);
          }}
        />
      )}

      <div className="absolute top-3 left-3 right-3 z-[1001]">
        <div className="flex items-center justify-between gap-2">
          {/* Left: Main Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Refresh map"
            >
              <RefreshCw 
                size={16} 
                className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>

            <button
              onClick={onMyLocation}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              title="My location"
            >
              <Locate size={16} className="text-blue-500" />
            </button>

            {/* Looking For Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowModeSelector(!showModeSelector);
                  setShowVisibilitySelector(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r ${modeConf.color} text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <ModeIcon size={14} />
                <span>{modeConf.shortLabel}</span>
                <ChevronDown size={12} className={`transition-transform opacity-70 ${showModeSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Mode Dropdown */}
              {showModeSelector && (
                <div className="absolute top-full mt-2 left-0 z-[1002] bg-white rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Looking For</span>
                  </div>
                  {Object.entries(modeConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onModeChange(key as MingleMode);
                          setShowModeSelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          currentMode === key ? 'bg-gray-100 font-semibold' : ''
                        }`}
                      >
                        <Icon size={14} className={currentMode === key ? 'text-purple-500' : 'text-gray-400'} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visibility Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowVisibilitySelector(!showVisibilitySelector);
                  setShowModeSelector(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${visConf.bgColor} ${visConf.color} border text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <VisIcon size={14} />
                <span>{visConf.shortLabel}</span>
                <ChevronDown size={12} className={`transition-transform opacity-70 ${showVisibilitySelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Visibility Dropdown */}
              {showVisibilitySelector && (
                <div className="absolute top-full mt-2 left-0 z-[1002] bg-white rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibility</span>
                  </div>
                  {Object.entries(visibilityConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onVisibilityChange(key as VisibilityLevel);
                          setShowVisibilitySelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          visibilityLevel === key ? `${cfg.bgColor}` : ''
                        }`}
                      >
                        <Icon size={16} className={cfg.color} />
                        <div className="text-left">
                          <div className={`font-medium ${visibilityLevel === key ? cfg.color : 'text-gray-700'}`}>
                            {cfg.label}
                          </div>
                          <div className="text-[10px] text-gray-400">{cfg.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Notifications, Messages & Profile */}
          <div className="flex items-center gap-2">
            {/* Visibility Status Badge */}
            <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              visibilityLevel === 'ghost' 
                ? 'bg-gray-200 text-gray-600' 
                : 'bg-green-500 text-white shadow-sm'
            }`}>
              <span className="relative flex h-2 w-2">
                {visibilityLevel !== 'ghost' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${visibilityLevel === 'ghost' ? 'bg-gray-400' : 'bg-white'}`}></span>
              </span>
              <span>{visibilityLevel === 'ghost' ? 'Hidden' : 'Visible'}</span>
            </div>

            {/* Live Stats - Hidden on mobile */}
            <div className="hidden lg:flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  {liveNow > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${liveNow > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </span>
                <span className="text-gray-600 font-medium">{liveNow} live</span>
              </div>
            </div>

            {/* Messages Button with Badge */}
            <button
              onClick={() => navigate('/messages')}
              className="relative w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              title="Messages"
            >
              <MessageCircle size={18} className="text-gray-600" />
              {notifications.unreadMessages > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                  {notifications.unreadMessages > 99 ? '99+' : notifications.unreadMessages}
                </span>
              )}
            </button>

            {/* Notifications Button with Badge (Friend Requests) */}
            <button
              onClick={() => navigate('/activity')}
              className="relative w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              title="Notifications & Friend Requests"
            >
              <Bell size={18} className="text-gray-600" />
              {notifications.pendingRequests > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] bg-purple-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center px-1 shadow-sm animate-pulse">
                  {notifications.pendingRequests > 99 ? '99+' : notifications.pendingRequests}
                </span>
              )}
            </button>

            {/* Mini Profile Avatar */}
            <button
              onClick={() => navigate('/profile')}
              className="relative w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95 overflow-hidden"
              title="My Profile"
            >
              {user?.avatar ? (
                <img 
                  src={user.avatar} 
                  alt="Profile" 
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-pink-500 flex items-center justify-center text-white text-sm font-bold">
                  {user?.name?.charAt(0).toUpperCase() || user?.displayName?.charAt(0).toUpperCase() || '?'}
                </div>
              )}
              {/* Online indicator */}
              <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full"></span>
            </button>
          </div>

        </div>
      </div>
    </>
  );
}

// Named export for backwards compatibility
export { MapControlBar };
export default MapControlBar;
