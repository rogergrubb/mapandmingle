import { useState } from 'react';
import { 
  Plus, X, MapPin, Users, Navigation, Calendar, Locate
} from 'lucide-react';

interface MapFABProps {
  onDropPin: () => void;
  onCreateEvent: () => void;
  onMyLocation: () => void;
}

export function MapFAB({
  onDropPin,
  onCreateEvent,
  onMyLocation,
}: MapFABProps) {
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    { 
      icon: Locate, 
      label: 'My Location', 
      color: 'bg-blue-500',
      onClick: () => { onMyLocation(); setIsOpen(false); }
    },
    { 
      icon: MapPin, 
      label: 'Drop a Pin', 
      color: 'bg-purple-500',
      onClick: () => { onDropPin(); setIsOpen(false); }
    },
    { 
      icon: Users, 
      label: 'Quick Meet-Up', 
      color: 'bg-pink-500',
      sublabel: 'Coming Soon',
      disabled: true,
      onClick: () => { setIsOpen(false); }
    },
    { 
      icon: Calendar, 
      label: 'Create Event', 
      color: 'bg-green-500',
      onClick: () => { onCreateEvent(); setIsOpen(false); }
    },
    { 
      icon: Navigation, 
      label: 'Heading Here', 
      color: 'bg-orange-500',
      sublabel: 'Coming Soon',
      disabled: true,
      onClick: () => { setIsOpen(false); }
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[998] bg-black/40 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB Container - Bottom Right */}
      <div className="absolute bottom-24 right-4 z-[1000]">
        
        {/* Expanding Actions */}
        {isOpen && (
          <div className="absolute bottom-20 right-0 flex flex-col gap-3 items-end mb-4">
            {actions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                disabled={action.disabled}
                className={`flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-xl transition-all ${
                  action.disabled 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-2xl hover:scale-105 active:scale-95'
                }`}
                style={{ 
                  animation: `slideIn 0.2s ease-out forwards`,
                  animationDelay: `${index * 40}ms`,
                  opacity: 0,
                }}
              >
                <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center shadow-lg`}>
                  <action.icon size={20} className="text-white" />
                </div>
                <div className="text-left">
                  <span className="font-semibold text-gray-800 block">{action.label}</span>
                  {action.sublabel && (
                    <span className="text-xs text-gray-400">{action.sublabel}</span>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main FAB Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isOpen
              ? 'bg-gray-800 rotate-45'
              : 'bg-gradient-to-br from-pink-500 to-purple-600 hover:shadow-2xl hover:scale-110'
          }`}
        >
          {isOpen ? (
            <X size={28} className="text-white" />
          ) : (
            <Plus size={28} className="text-white" />
          )}
        </button>

        {/* Subtle pulse when closed */}
        {!isOpen && (
          <div 
            className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 pointer-events-none"
            style={{
              animation: 'gentlePulse 2.5s ease-in-out infinite',
            }}
          />
        )}
      </div>

      {/* Animations */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes gentlePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.2);
            opacity: 0.3;
          }
        }
      `}</style>
    </>
  );
}
