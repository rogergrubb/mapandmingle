import { Link, useLocation } from 'react-router-dom';
import { 
  MapPin, Compass, MessageCircle, Heart, User
} from 'lucide-react';

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

  return (
    <nav 
      className="relative bg-white/80 backdrop-blur-xl border-t border-gray-200/50"
      style={{
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      }}
    >
      {/* Subtle top gradient line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-pink-300/50 to-transparent" />
      
      <div className="flex justify-around items-stretch px-1">
        {navItems.map(({ path, icon: Icon, label, badge }) => {
          const isActive = path === '/' 
            ? location.pathname === '/' || location.pathname === '/map'
            : location.pathname.startsWith(path);
          
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
                  {badge !== undefined && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 shadow-md ring-2 ring-white">
                      {badge > 99 ? '99+' : badge}
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
  );
}
