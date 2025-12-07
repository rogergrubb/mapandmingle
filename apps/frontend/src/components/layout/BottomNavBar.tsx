import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, Compass, MessageCircle, Heart, User
} from 'lucide-react';
import haptic from '../../lib/haptics';

interface BottomNavBarProps {
  unreadCount?: number;
  connectionsCount?: number;
}

export function BottomNavBar({ unreadCount = 0, connectionsCount = 0 }: BottomNavBarProps) {
  const location = useLocation();

  const navItems = [
    { 
      path: '/', 
      icon: MapPin, 
      label: 'Map',
      description: 'Explore nearby'
    },
    { 
      path: '/events', 
      icon: Compass, 
      label: 'Discover',
      description: 'Events & hotspots'
    },
    { 
      path: '/messages', 
      icon: MessageCircle, 
      label: 'Messages',
      badge: unreadCount,
      description: 'Your chats'
    },
    { 
      path: '/activity', 
      icon: Heart, 
      label: 'Connections',
      badge: connectionsCount,
      description: 'Your matches'
    },
    { 
      path: '/profile', 
      icon: User, 
      label: 'Profile',
      description: 'Settings'
    },
  ];

  const handleNavClick = () => {
    haptic.navTap();
  };

  return (
    <nav 
      className="relative bg-white border-t border-gray-100"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      <div className="flex justify-around items-stretch px-1">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = path === '/' 
            ? location.pathname === '/' || location.pathname === '/map'
            : location.pathname.startsWith(path);
          
          return (
            <Link
              key={path}
              to={path}
              onClick={handleNavClick}
              className="flex-1 flex flex-col items-center justify-center py-2 px-2 transition-all duration-200 relative group"
              style={{
                minHeight: '56px',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Icon container */}
              <div className="relative z-10">
                <div className="relative">
                  <div className={`
                    p-1.5 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-gray-900' 
                      : 'group-hover:bg-gray-100 group-active:scale-95'
                    }
                  `}>
                    <Icon
                      size={20}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-600'}
                    />
                  </div>
                  
                  {/* Badge */}
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] flex items-center justify-center bg-pink-500 text-white text-[9px] font-bold rounded-full px-1 ring-2 ring-white">
                      {badge > 99 ? '99+' : badge}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Label */}
              <span 
                className={`
                  relative z-10 text-[10px] mt-0.5 font-medium
                  ${isActive 
                    ? 'text-gray-900 font-semibold' 
                    : 'text-gray-400 group-hover:text-gray-600'
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
  );
}
