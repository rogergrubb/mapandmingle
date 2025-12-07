import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, User, Plus, X, MapPin, Navigation, Locate
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';

interface MapControlBarProps {
  currentMode: MingleMode;
  distanceFilter: DistanceFilter;
  isVisible: boolean;
  onModeChange: (mode: MingleMode) => void;
  onDistanceChange: (distance: DistanceFilter) => void;
  onVisibilityToggle: () => void;
  onSearch: () => void;
  onDropPin: () => void;
  onCreateEvent: () => void;
  onMyLocation: () => void;
}

const modeConfig = {
  everybody: { 
    icon: Globe, 
    label: 'Everybody', 
    shortLabel: 'All',
    color: 'from-gray-600 to-gray-800',
  },
  dating: { 
    icon: Heart, 
    label: 'Dating', 
    shortLabel: 'Dating',
    color: 'from-pink-500 to-rose-500',
  },
  friends: { 
    icon: Users, 
    label: 'Friends', 
    shortLabel: 'Friends',
    color: 'from-purple-500 to-indigo-500',
  },
  networking: { 
    icon: Briefcase, 
    label: 'Networking', 
    shortLabel: 'Network',
    color: 'from-blue-500 to-cyan-500',
  },
  events: { 
    icon: Calendar, 
    label: 'Events', 
    shortLabel: 'Events',
    color: 'from-green-500 to-emerald-500',
  },
  travel: { 
    icon: Plane, 
    label: 'Travel', 
    shortLabel: 'Travel',
    color: 'from-orange-500 to-amber-500',
  },
};

export function MapControlBar({
  currentMode,
  isVisible,
  onModeChange,
  onVisibilityToggle,
  onDropPin,
  onCreateEvent,
  onMyLocation,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  const actions = [
    { 
      icon: Locate, 
      label: 'My Location', 
      color: 'bg-blue-500',
      onClick: () => { onMyLocation(); setShowActions(false); }
    },
    { 
      icon: MapPin, 
      label: 'Drop a Pin', 
      color: 'bg-purple-500',
      onClick: () => { onDropPin(); setShowActions(false); }
    },
    { 
      icon: Users, 
      label: 'Quick Meet-Up', 
      color: 'bg-pink-500',
      sublabel: 'Coming Soon',
      disabled: true,
      onClick: () => { setShowActions(false); }
    },
    { 
      icon: Calendar, 
      label: 'Create Event', 
      color: 'bg-green-500',
      onClick: () => { onCreateEvent(); setShowActions(false); }
    },
    { 
      icon: Navigation, 
      label: 'Heading Here', 
      color: 'bg-orange-500',
      sublabel: 'Coming Soon',
      disabled: true,
      onClick: () => { setShowActions(false); }
    },
  ];

  return (
    <>
      {/* Backdrop for dropdowns */}
      {(showModeSelector || showActions) && (
        <div 
          className="fixed inset-0 z-[1001]"
          onClick={() => {
            setShowModeSelector(false);
            setShowActions(false);
          }}
        />
      )}

      {/* Single Consolidated Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="flex items-center justify-between gap-2">
          
          {/* Left: Mode Selector */}
          <button
            onClick={() => { setShowModeSelector(!showModeSelector); setShowActions(false); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <ModeIcon size={18} />
            <span className="hidden sm:inline">{config.shortLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </button>

          {/* Center: Visibility Toggle */}
          <button
            onClick={onVisibilityToggle}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isVisible 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white' 
                : 'bg-gray-800 text-gray-300'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isVisible && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVisible ? 'bg-white' : 'bg-gray-500'}`}></span>
            </span>
            <span className="text-sm">{isVisible ? 'Visible' : 'Hidden'}</span>
          </button>

          {/* Right: Actions + and Profile */}
          <div className="flex items-center gap-2">
            {/* + Button */}
            <button
              onClick={() => { setShowActions(!showActions); setShowModeSelector(false); }}
              className={`w-11 h-11 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 active:scale-95 ${
                showActions 
                  ? 'bg-gray-800 rotate-45' 
                  : 'bg-gradient-to-br from-pink-500 to-purple-600'
              }`}
            >
              {showActions ? (
                <X size={20} className="text-white" />
              ) : (
                <Plus size={20} className="text-white" />
              )}
            </button>

            {/* Profile */}
            <Link
              to="/profile"
              className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
            >
              <User size={20} className="text-gray-700" />
            </Link>
          </div>
        </div>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelector && (
        <div className="absolute top-16 left-4 z-[1002] bg-white rounded-2xl shadow-2xl p-2 min-w-[200px] animate-in fade-in slide-in-from-top-2 duration-200">
          {(Object.keys(modeConfig) as MingleMode[]).map((mode) => {
            const cfg = modeConfig[mode];
            const Icon = cfg.icon;
            const isActive = mode === currentMode;
            
            return (
              <button
                key={mode}
                onClick={() => {
                  onModeChange(mode);
                  setShowModeSelector(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${cfg.color} text-white` 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon size={20} />
                <span className="font-medium">{cfg.label}</span>
                {isActive && (
                  <span className="ml-auto text-xs bg-white/20 px-2 py-0.5 rounded-full">Active</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Actions Dropdown */}
      {showActions && (
        <div className="absolute top-16 right-4 z-[1002] bg-white rounded-2xl shadow-2xl p-2 min-w-[220px] animate-in fade-in slide-in-from-top-2 duration-200">
          {actions.map((action, index) => (
            <button
              key={action.label}
              onClick={action.onClick}
              disabled={action.disabled}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                action.disabled 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:bg-gray-50 active:bg-gray-100'
              }`}
              style={{
                animation: `slideIn 0.15s ease-out forwards`,
                animationDelay: `${index * 30}ms`,
                opacity: 0,
              }}
            >
              <div className={`w-10 h-10 ${action.color} rounded-full flex items-center justify-center shadow-md`}>
                <action.icon size={18} className="text-white" />
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

      {/* Animation */}
      <style>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
