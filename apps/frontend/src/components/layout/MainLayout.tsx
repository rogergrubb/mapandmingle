import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapPin, Calendar, Activity, MessageCircle, User } from 'lucide-react';
import { useState, useEffect } from 'react';
import api from '../../lib/api';

export default function MainLayout() {
  const location = useLocation();
  const [ghostMode, setGhostMode] = useState(false);
  const [loadingGhost, setLoadingGhost] = useState(false);
  const [showArrow, setShowArrow] = useState(true);

  // Load ghost mode state on mount
  useEffect(() => {
    const loadGhostMode = async () => {
      try {
        const response = await api.get('/api/users/me');
        setGhostMode(response.data?.profile?.ghostMode || false);
      } catch (err) {
        console.error('Failed to load ghost mode state:', err);
      }
    };
    loadGhostMode();
  }, []);

  const handleGhostModeToggle = async () => {
    setLoadingGhost(true);
    try {
      await api.patch('/api/users/me', {
        ghostMode: !ghostMode,
      });
      setGhostMode(!ghostMode);
      // Hide arrow for 5 seconds after first click
      setShowArrow(false);
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
      {/* Top Header with Ghost Mode Button */}
      <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between safe-area-top">
        <div className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600">
          MapMingle
        </div>
        
        {/* Ghost Mode Button - Upper Right */}
        <div className="relative">
          {showArrow && (
            <div className="absolute -top-6 right-0 flex flex-col items-center">
              <div className="text-sm text-gray-600 font-semibold mb-1">Go Ghost</div>
              <div className="text-xl animate-bounce">↓</div>
            </div>
          )}
          
          <button
            onClick={handleGhostModeToggle}
            disabled={loadingGhost}
            className={\`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-300 font-bold text-lg \${
              ghostMode
                ? 'bg-gray-900 text-white shadow-lg'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            } disabled:opacity-50\`}
            title={ghostMode ? 'Click to become visible' : 'Click to go invisible'}
          >
            {loadingGhost ? (
              <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
            ) : (
              '👻'
            )}
          </button>
          
          {/* Status indicator */}
          {ghostMode && (
            <div className="absolute -bottom-6 right-0 text-xs font-semibold text-gray-600 whitespace-nowrap">
              Invisible
            </div>
          )}
        </div>
      </header>

      {/* Main Content - scrollable container */}
      <main 
        className="flex-1 overflow-y-auto overscroll-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          minHeight: 0 
        }}
      >
        <Outlet />
      </main>

      {/* Bottom Navigation - fixed at bottom */}
      <nav className="bg-white border-t border-gray-200 safe-area-bottom flex-shrink-0">
        <div className="flex justify-around items-center h-16 px-2">
          {navItems.map(({ path, icon: Icon, label }) => {
            const isActive = location.pathname === path;
            return (
              <Link
                key={path}
                to={path}
                className={\`flex flex-col items-center justify-center flex-1 h-full transition-colors \${
                  isActive ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'
                }\`}
              >
                <Icon size={24} className={isActive ? 'stroke-2' : 'stroke-1.5'} />
                <span className={\`text-xs mt-1 \${isActive ? 'font-semibold' : 'font-medium'}\`}>
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
