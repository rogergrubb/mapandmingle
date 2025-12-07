import { useState } from 'react';
import { 
  Plus, X, Heart, Users, Briefcase, Calendar, Plane,
  MapPin, Coffee, MessageCircle, Zap, Radio, Globe
} from 'lucide-react';
import type { MingleMode } from './MapControlBar';

interface MapFABProps {
  currentMode: MingleMode;
  onModeChange: (mode: MingleMode) => void;
  onDropPin: () => void;
  onCreateEvent: () => void;
  onBroadcast: () => void;
}

const modeConfig = {
  everybody: { icon: Globe, color: 'from-gray-600 to-gray-800', label: 'All' },
  dating: { icon: Heart, color: 'from-pink-500 to-rose-500', label: 'Dating' },
  friends: { icon: Users, color: 'from-purple-500 to-indigo-500', label: 'Friends' },
  networking: { icon: Briefcase, color: 'from-blue-500 to-cyan-500', label: 'Network' },
  events: { icon: Calendar, color: 'from-green-500 to-emerald-500', label: 'Events' },
  travel: { icon: Plane, color: 'from-orange-500 to-amber-500', label: 'Travel' },
};

export function MapFAB({
  currentMode,
  onModeChange,
  onDropPin,
  onCreateEvent,
  onBroadcast,
}: MapFABProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showModeRadial, setShowModeRadial] = useState(false);

  const config = modeConfig[currentMode];

  const quickActions = [
    { 
      icon: MapPin, 
      label: 'Drop Pin', 
      color: 'bg-purple-500',
      onClick: () => { onDropPin(); setIsOpen(false); }
    },
    { 
      icon: Calendar, 
      label: 'Create Event', 
      color: 'bg-green-500',
      onClick: () => { onCreateEvent(); setIsOpen(false); }
    },
    { 
      icon: Radio, 
      label: 'Broadcast', 
      color: 'bg-orange-500',
      onClick: () => { onBroadcast(); setIsOpen(false); }
    },
  ];

  return (
    <>
      {/* Backdrop */}
      {(isOpen || showModeRadial) && (
        <div 
          className="fixed inset-0 z-[999] bg-black/30 backdrop-blur-sm"
          onClick={() => {
            setIsOpen(false);
            setShowModeRadial(false);
          }}
        />
      )}

      {/* Mode Radial Selector */}
      {showModeRadial && (
        <div className="absolute bottom-32 right-4 z-[1001]">
          <div className="relative">
            {/* Mode buttons in arc */}
            {(Object.keys(modeConfig) as MingleMode[]).map((mode, index) => {
              const cfg = modeConfig[mode];
              const Icon = cfg.icon;
              const isActive = mode === currentMode;
              
              // Calculate position in arc
              const totalModes = 6;
              const arcSpan = 180; // degrees
              const startAngle = 180; // start from left
              const angle = startAngle + (index / (totalModes - 1)) * arcSpan;
              const radius = 100;
              const radian = (angle * Math.PI) / 180;
              const x = Math.cos(radian) * radius;
              const y = Math.sin(radian) * radius;

              return (
                <button
                  key={mode}
                  onClick={() => {
                    onModeChange(mode);
                    setShowModeRadial(false);
                  }}
                  className={`absolute w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-lg ${
                    isActive 
                      ? `bg-gradient-to-br ${cfg.color} scale-110` 
                      : 'bg-white hover:scale-110'
                  }`}
                  style={{
                    transform: `translate(${x}px, ${y}px)`,
                    animationDelay: `${index * 50}ms`,
                  }}
                >
                  <Icon 
                    size={24} 
                    className={isActive ? 'text-white' : 'text-gray-600'} 
                  />
                </button>
              );
            })}

            {/* Center info */}
            <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 whitespace-nowrap">
              <span className="text-white text-sm font-semibold bg-black/50 px-3 py-1 rounded-full">
                {config.label} Mode
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions Panel */}
      {isOpen && (
        <div className="absolute bottom-32 right-4 z-[1001] animate-in fade-in slide-in-from-bottom-4 duration-200">
          <div className="flex flex-col gap-3 items-end">
            {quickActions.map((action, index) => (
              <button
                key={action.label}
                onClick={action.onClick}
                className="flex items-center gap-3 pl-4 pr-5 py-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
                style={{ 
                  animationDelay: `${index * 50}ms`,
                  animation: 'slideInRight 0.2s ease-out forwards',
                }}
              >
                <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center`}>
                  <action.icon size={20} className="text-white" />
                </div>
                <span className="font-semibold text-gray-700 group-hover:text-gray-900">{action.label}</span>
              </button>
            ))}

            {/* Mode Switcher Option */}
            <button
              onClick={() => {
                setIsOpen(false);
                setShowModeRadial(true);
              }}
              className="flex items-center gap-3 pl-4 pr-5 py-3 bg-gradient-to-r from-pink-500 to-purple-500 rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105"
            >
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Zap size={20} className="text-white" />
              </div>
              <span className="font-semibold text-white">Switch Mode</span>
            </button>
          </div>
        </div>
      )}

      {/* Main FAB Button */}
      <div className="absolute bottom-20 right-4 z-[1000]">
        <button
          onClick={() => {
            if (showModeRadial) {
              setShowModeRadial(false);
            } else {
              setIsOpen(!isOpen);
            }
          }}
          className={`w-16 h-16 rounded-full flex items-center justify-center shadow-xl transition-all duration-300 ${
            isOpen || showModeRadial
              ? 'bg-gray-800 rotate-45 scale-90'
              : `bg-gradient-to-br ${config.color} hover:scale-110 hover:shadow-2xl`
          }`}
          style={{
            boxShadow: isOpen || showModeRadial 
              ? '0 10px 40px rgba(0,0,0,0.3)' 
              : '0 10px 40px rgba(139, 92, 246, 0.4)',
          }}
        >
          {isOpen || showModeRadial ? (
            <X size={28} className="text-white" />
          ) : (
            <Plus size={28} className="text-white" />
          )}
        </button>

        {/* Pulse ring when closed */}
        {!isOpen && !showModeRadial && (
          <div className={`absolute inset-0 rounded-full bg-gradient-to-br ${config.color} animate-ping opacity-30`} />
        )}
      </div>

      {/* Custom styles for animations */}
      <style>{`
        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </>
  );
}
