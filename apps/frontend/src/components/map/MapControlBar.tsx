import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, User, Locate
} from 'lucide-react';
import { Link } from 'react-router-dom';
import haptic from '../../lib/haptics';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';

interface MapControlBarProps {
  currentMode: MingleMode;
  onModeChange: (mode: MingleMode) => void;
  onMyLocation: () => void;
  isVisible: boolean;
  onVisibilityToggle: () => void;
  liveNow: number;
  inView: number;
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

export function MapControlBar({
  currentMode,
  onModeChange,
  onMyLocation,
  isVisible,
  onVisibilityToggle,
  liveNow,
  inView,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  const handleVisibilityToggle = () => {
    haptic.softTick();
    onVisibilityToggle();
  };

  return (
    <>
      {/* Backdrop for dropdown */}
      {showModeSelector && (
        <div 
          className="fixed inset-0 z-[1001]"
          onClick={() => setShowModeSelector(false)}
        />
      )}

      {/* Top Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="flex items-center justify-between">
          
          {/* Left: My Location + Mode Selector */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={onMyLocation}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Locate size={16} className="text-blue-500" />
            </button>

            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r ${config.color} text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <ModeIcon size={14} />
              <span>{config.shortLabel}</span>
              <ChevronDown size={12} className={`transition-transform opacity-70 ${showModeSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Center: Visibility + Activity Stats */}
          <div className="flex items-center gap-3">
            {/* Visibility Toggle */}
            <button
              onClick={handleVisibilityToggle}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
                isVisible 
                  ? 'bg-green-500 text-white shadow-sm' 
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              <span className="relative flex h-2 w-2">
                {isVisible && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${isVisible ? 'bg-white' : 'bg-gray-400'}`}></span>
              </span>
              <span>{isVisible ? 'Visible' : 'Hidden'}</span>
            </button>

            {/* Activity Stats */}
            <div className="flex items-center gap-2 text-xs">
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  {liveNow > 0 && (
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  )}
                  <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${liveNow > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
                </span>
                <span className="text-gray-600 font-medium">{liveNow} live</span>
              </div>
              
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
                </span>
                <span className="text-gray-600 font-medium">{inView} in view</span>
              </div>
            </div>
          </div>

          {/* Right: Profile */}
          <Link
            to="/profile"
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105"
          >
            <User size={16} className="text-gray-600" />
          </Link>
        </div>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelector && (
        <div 
          className="absolute top-12 left-12 z-[1002] bg-white rounded-xl shadow-xl p-1.5 min-w-[160px]"
          style={{
            animation: 'dropdownFade 0.15s ease-out forwards',
          }}
        >
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
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${cfg.color} text-white` 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon size={16} />
                <span className="font-medium text-sm">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      )}

      <style>{`
        @keyframes dropdownFade {
          from {
            opacity: 0;
            transform: translateY(-4px);
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
