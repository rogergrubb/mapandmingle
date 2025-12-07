import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapPin, Compass, MessageCircle, Heart, User, Bell } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';
import NotificationCenter, { NotificationBell } from '../NotificationCenter';

export default function MainLayout() {
  const location = useLocation();
  const [ghostMode, setGhostMode] = useState(false);
  const [loadingGhost, setLoadingGhost] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Load user data on mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await api.get('/api/users/me');
        setGhostMode(response.data?.profile?.ghostMode || false);
        setSubscriptionTier(response.data?.profile?.subscriptionStatus || 'free');
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    loadUserData();
  }, []);

  // Fetch unread message count
  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response: any = await api.get('/api/messages/unread-count');
        setUnreadCount(response.unreadCount || 0);
      } catch (err) {
        console.error('Failed to fetch unread count:', err);
      }
    };
    
    fetchUnreadCount();
    
    // Poll every 30 seconds for new messages
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleGhostModeToggle = async () => {
    setLoadingGhost(true);
    try {
      await api.patch('/api/users/me', {
        ghostMode: !ghostMode,
      });
      setGhostMode(!ghostMode);
    } catch (err) {
      console.error('Failed to toggle ghost mode:', err);
    } finally {
      setLoadingGhost(false);
    }
  };

  const navItems = [
    { path: '/', icon: MapPin, label: 'Map' },
    { path: '/events', icon: Compass, label: 'Discover' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/activity', icon: Heart, label: 'Connections' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  const getSubscriptionBadge = () => {
    switch (subscriptionTier) {
      case 'premium':
        return {
          label: 'Premium',
          color: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white',
          icon: '✨',
        };
      case 'basic':
        return {
          label: 'Basic',
          color: 'bg-blue-100 text-blue-700',
          icon: '⭐',
        };
      default:
        return null;
    }
  };

  const badge = getSubscriptionBadge();

  const isMapPage = location.pathname === '/' || location.pathname === '/map';

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Professional Top Navigation - Hidden on Map Page */}
      {!isMapPage && (
        <header className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 safe-area-top sticky top-0 z-40">
          <div className="max-w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
            {/* Left: Brand */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex-shrink-0">
                <div className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500 bg-clip-text text-transparent">
                  Map & Mingle
                </div>
              </div>
            </div>

            {/* Center: Status Indicators */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Subscription Badge */}
              {badge && (
                <div className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${badge.color}`}>
                  <span>{badge.icon}</span>
                  <span>{badge.label}</span>
                </div>
              )}

              {/* Online Status Indicator - More Prominent */}
              <div className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all shadow-md ${
                ghostMode
                  ? 'bg-gray-800 text-gray-300 border-2 border-gray-600'
                  : 'bg-gradient-to-r from-green-400 to-emerald-500 text-white border-2 border-green-300'
              }`}>
                {/* Pulsing dot indicator */}
                <span className="relative flex h-3 w-3">
                  {!ghostMode && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-3 w-3 ${
                    ghostMode ? 'bg-gray-500' : 'bg-white'
                  }`}></span>
                </span>
                <span>{ghostMode ? 'Invisible' : 'Visible'}</span>
                {!ghostMode && (
                  <span className="text-xs opacity-80 hidden sm:inline">• Online</span>
                )}
              </div>
            </div>

            {/* Right: Notifications & Ghost Toggle */}
            <div className="flex items-center gap-2 relative">
              {/* Notification Bell */}
              <NotificationBell onClick={() => setShowNotifications(!showNotifications)} />
              
              {/* Notification Center Dropdown */}
              <NotificationCenter 
                isOpen={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
              
              {/* Ghost Toggle Button */}
              <button
                onClick={handleGhostModeToggle}
                disabled={loadingGhost}
                className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 font-semibold text-lg ring-1 ring-transparent hover:ring-gray-300 ${
                  ghostMode
                    ? 'bg-gray-900 text-white shadow-md'
                    : 'bg-white text-gray-700 shadow-sm hover:shadow-md'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={ghostMode ? 'Become visible' : 'Go invisible'}
              >
                {loadingGhost ? (
                  <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                  '👻'
                )}
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Main Content */}
      <main 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          minHeight: 0 
        }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation - Redesigned */}
      <nav 
        className="flex-shrink-0 relative bg-white/90 backdrop-blur-xl border-t border-gray-200/50"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {/* Subtle gradient top line */}
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent" />
        
        {/* Navigation items */}
        <div className="relative flex justify-around items-stretch px-1">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = path === '/' 
              ? location.pathname === '/' || location.pathname === '/map'
              : location.pathname.startsWith(path);
            const showBadge = label === 'Messages' && unreadCount > 0;
            
            return (
              <Link
                key={path}
                to={path}
                className="flex-1 flex flex-col items-center justify-center py-2 px-2 transition-all duration-200 relative group"
                style={{
                  minHeight: '60px',
                  WebkitTapHighlightColor: 'transparent',
                }}
              >
                {/* Active background glow */}
                {isActive && (
                  <div className="absolute inset-1 bg-gradient-to-b from-pink-100/80 to-purple-100/50 rounded-2xl" />
                )}
                
                {/* Icon container */}
                <div className="relative z-10">
                  <div className="relative">
                    <div className={`
                      p-2 rounded-xl transition-all duration-200
                      ${isActive 
                        ? 'bg-gradient-to-br from-pink-500 to-purple-600 shadow-lg shadow-pink-500/30' 
                        : 'group-hover:bg-gray-100 group-active:scale-90'
                      }
                    `}>
                      <Icon
                        size={22}
                        strokeWidth={isActive ? 2.5 : 2}
                        className={isActive ? 'text-white' : 'text-gray-500 group-hover:text-gray-700'}
                      />
                    </div>
                    
                    {/* Badge */}
                    {showBadge && (
                      <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-md ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Label */}
                <span 
                  className={`
                    relative z-10 text-[10px] mt-1 font-medium
                    ${isActive 
                      ? 'text-pink-600 font-semibold' 
                      : 'text-gray-500 group-hover:text-gray-700'
                    }
                  `}
                >
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

