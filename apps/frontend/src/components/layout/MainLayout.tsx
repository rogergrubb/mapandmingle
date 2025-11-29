import { Outlet, Link, useLocation } from 'react-router-dom';
import { MapPin, Calendar, Activity, MessageCircle, User } from 'lucide-react';

export default function MainLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: MapPin, label: 'Map' },
    { path: '/events', icon: Calendar, label: 'Events' },
    { path: '/activity', icon: Activity, label: 'Activity' },
    { path: '/messages', icon: MessageCircle, label: 'Messages' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
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
                className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                  isActive ? 'text-primary-500' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <Icon size={24} className={isActive ? 'stroke-2' : 'stroke-1.5'} />
                <span className={`text-xs mt-1 ${isActive ? 'font-semibold' : 'font-medium'}`}>
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
