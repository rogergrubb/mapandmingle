import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, User, Locate
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';

interface MapControlBarProps {
  currentMode: MingleMode;
  onModeChange: (mode: MingleMode) => void;
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
  onModeChange,
  onMyLocation,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  return (
    <>
      {/* Backdrop for dropdown */}
      {showModeSelector && (
        <div 
          className="fixed inset-0 z-[1001]"
          onClick={() => setShowModeSelector(false)}
        />
      )}

      {/* ROW 1 - Top Controls: Mode + My Location + Profile */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="flex items-center justify-between">
          
          {/* Left: My Location + Mode Selector */}
          <div className="flex items-center gap-2">
            {/* My Location Button */}
            <button
              onClick={onMyLocation}
              className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105 active:scale-95"
            >
              <Locate size={18} className="text-blue-600" />
            </button>

            {/* Mode Selector */}
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <ModeIcon size={16} />
              <span className="text-sm">{config.shortLabel}</span>
              <ChevronDown size={14} className={`transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Right: Profile */}
          <Link
            to="/profile"
            className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
          >
            <User size={18} className="text-gray-700" />
          </Link>
        </div>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelector && (
        <div className="absolute top-14 left-14 z-[1002] bg-white rounded-2xl shadow-2xl p-2 min-w-[180px] animate-in fade-in slide-in-from-top-2 duration-200">
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
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all ${
                  isActive 
                    ? `bg-gradient-to-r ${cfg.color} text-white` 
                    : 'hover:bg-gray-50 text-gray-700'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium text-sm">{cfg.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </>
  );
}
