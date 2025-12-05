import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapPin, Calendar, Activity, MessageCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function MainLayout() {
  const location = useLocation();
  const [ghostMode, setGhostMode] = useState(false);
  const [loadingGhost, setLoadingGhost] = useState(false);
  const [subscriptionTier, setSubscriptionTier] = useState('free');

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
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
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

  return (
    <div className="h-screen flex flex-col bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Professional Top Navigation - Apple-inspired */}
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

          {/* Right: Ghost Toggle Button */}
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
      </header>

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

      {/* Bottom Navigation - Clean & Minimal */}
      <nav className="bg-white/80 backdrop-blur-xl border-t border-gray-200/50 safe-area-bottom flex-shrink-0">
        <div className="flex justify-around items-stretch px-2 sm:px-4">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={`flex-1 flex flex-col items-center justify-center py-3 sm:py-4 px-2 transition-colors relative group ${
                  isActive
                    ? 'text-pink-600'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon
                  size={24}
                  strokeWidth={isActive ? 2 : 1.5}
                  className={`transition-transform ${isActive ? 'scale-110' : 'group-hover:scale-105'}`}
                />
                <span className={`text-xs mt-1 font-medium transition-all ${
                  isActive ? 'font-semibold' : ''
                }`}>
                  {label}
                </span>
                {isActive && (
                  <div className="absolute bottom-0 h-0.5 w-6 bg-pink-600 rounded-t" />
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

