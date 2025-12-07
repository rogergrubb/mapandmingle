import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, User
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
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  return (
    <>
      {/* Single Consolidated Top Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="flex items-center justify-between">
          
          {/* Left: Mode Selector */}
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
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

          {/* Right: Profile */}
          <Link
            to="/profile"
            className="w-11 h-11 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
          >
            <User size={20} className="text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelector && (
        <>
          <div 
            className="fixed inset-0 z-[1001]"
            onClick={() => setShowModeSelector(false)}
          />
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
        </>
      )}
    </>
  );
}
