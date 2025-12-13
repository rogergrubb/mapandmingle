import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  ChevronDown, Globe, Locate, RefreshCw,
  Ghost, Eye, UserCheck, Zap, Shield
} from 'lucide-react';
import haptic from '../../lib/haptics';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';
export type VisibilityLevel = 'ghost' | 'circles' | 'fuzzy' | 'social' | 'discoverable' | 'beacon';

interface MapControlBarProps {
  currentMode: MingleMode;
  onModeChange: (mode: MingleMode) => void;
  onMyLocation: () => void;
  liveNow: number;
  inView: number;
  onRefresh: () => void;
  isRefreshing: boolean;
  // Visibility props
  visibilityLevel: VisibilityLevel;
  onVisibilityChange: (level: VisibilityLevel) => void;
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

const visibilityConfig: Record<VisibilityLevel, { 
  icon: typeof Ghost; 
  label: string; 
  shortLabel: string;
  color: string;
  bgColor: string;
  description: string;
}> = {
  ghost: {
    icon: Ghost,
    label: 'Ghost Mode',
    shortLabel: 'Ghost',
    color: 'text-gray-600',
    bgColor: 'bg-gray-100 border-gray-300',
    description: 'Completely invisible',
  },
  circles: {
    icon: Shield,
    label: 'Circles Only',
    shortLabel: 'Circles',
    color: 'text-blue-600',
    bgColor: 'bg-blue-100 border-blue-300',
    description: 'Family & trusted friends',
  },
  fuzzy: {
    icon: Eye,
    label: 'Fuzzy Location',
    shortLabel: 'Fuzzy',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100 border-yellow-400',
    description: 'Approximate location',
  },
  social: {
    icon: UserCheck,
    label: 'Social Mode',
    shortLabel: 'Social',
    color: 'text-green-600',
    bgColor: 'bg-green-100 border-green-400',
    description: 'Your connections',
  },
  discoverable: {
    icon: Globe,
    label: 'Discoverable',
    shortLabel: 'Open',
    color: 'text-purple-600',
    bgColor: 'bg-purple-100 border-purple-400',
    description: 'Visible to all',
  },
  beacon: {
    icon: Zap,
    label: 'Beacon Mode',
    shortLabel: 'Beacon',
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-pink-100 to-orange-100 border-pink-400',
    description: 'Broadcasting NOW',
  },
};

export function MapControlBar({
  currentMode,
  onModeChange,
  onMyLocation,
  liveNow,
  inView,
  onRefresh,
  isRefreshing,
  visibilityLevel,
  onVisibilityChange,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showVisibilitySelector, setShowVisibilitySelector] = useState(false);

  const modeConf = modeConfig[currentMode];
  const ModeIcon = modeConf.icon;
  
  const visConf = visibilityConfig[visibilityLevel];
  const VisIcon = visConf.icon;

  return (
    <>
      {/* Backdrop for dropdowns */}
      {(showModeSelector || showVisibilitySelector) && (
        <div 
          className="fixed inset-0 z-[1001]"
          onClick={() => {
            setShowModeSelector(false);
            setShowVisibilitySelector(false);
          }}
        />
      )}

      {/* Top Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-[1000]">
        <div className="flex items-center justify-between">
          
          {/* Left: Refresh + My Location + Looking For + Visibility */}
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                haptic.softTick();
                onRefresh();
              }}
              disabled={isRefreshing}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
              title="Refresh map"
            >
              <RefreshCw 
                size={16} 
                className={`text-gray-600 ${isRefreshing ? 'animate-spin' : ''}`} 
              />
            </button>

            <button
              onClick={onMyLocation}
              className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-md flex items-center justify-center hover:shadow-lg transition-all hover:scale-105 active:scale-95"
              title="My location"
            >
              <Locate size={16} className="text-blue-500" />
            </button>

            {/* Looking For Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowModeSelector(!showModeSelector);
                  setShowVisibilitySelector(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-gradient-to-r ${modeConf.color} text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <ModeIcon size={14} />
                <span>{modeConf.shortLabel}</span>
                <ChevronDown size={12} className={`transition-transform opacity-70 ${showModeSelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Mode Dropdown */}
              {showModeSelector && (
                <div className="absolute top-full mt-2 left-0 z-[1002] bg-white rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Looking For</span>
                  </div>
                  {Object.entries(modeConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onModeChange(key as MingleMode);
                          setShowModeSelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition-colors ${
                          currentMode === key ? 'bg-gray-100 font-semibold' : ''
                        }`}
                      >
                        <Icon size={14} className={currentMode === key ? 'text-purple-500' : 'text-gray-400'} />
                        <span>{cfg.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Visibility Selector */}
            <div className="relative">
              <button
                onClick={() => {
                  setShowVisibilitySelector(!showVisibilitySelector);
                  setShowModeSelector(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full ${visConf.bgColor} ${visConf.color} border text-xs font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
              >
                <VisIcon size={14} />
                <span>{visConf.shortLabel}</span>
                <ChevronDown size={12} className={`transition-transform opacity-70 ${showVisibilitySelector ? 'rotate-180' : ''}`} />
              </button>

              {/* Visibility Dropdown */}
              {showVisibilitySelector && (
                <div className="absolute top-full mt-2 left-0 z-[1002] bg-white rounded-xl shadow-xl overflow-hidden min-w-[200px]">
                  <div className="px-3 py-2 bg-gray-50 border-b border-gray-100">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Visibility</span>
                  </div>
                  {Object.entries(visibilityConfig).map(([key, cfg]) => {
                    const Icon = cfg.icon;
                    return (
                      <button
                        key={key}
                        onClick={() => {
                          onVisibilityChange(key as VisibilityLevel);
                          setShowVisibilitySelector(false);
                        }}
                        className={`w-full flex items-center gap-2 px-3 py-2.5 text-sm hover:bg-gray-50 transition-colors ${
                          visibilityLevel === key ? `${cfg.bgColor}` : ''
                        }`}
                      >
                        <Icon size={16} className={cfg.color} />
                        <div className="text-left">
                          <div className={`font-medium ${visibilityLevel === key ? cfg.color : 'text-gray-700'}`}>
                            {cfg.label}
                          </div>
                          <div className="text-[10px] text-gray-400">{cfg.description}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Right: Activity Stats */}
          <div className="flex items-center gap-3">
            {/* Visibility Status Badge */}
            <div className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs font-semibold ${
              visibilityLevel === 'ghost' 
                ? 'bg-gray-200 text-gray-600' 
                : 'bg-green-500 text-white shadow-sm'
            }`}>
              <span className="relative flex h-2 w-2">
                {visibilityLevel !== 'ghost' && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${visibilityLevel === 'ghost' ? 'bg-gray-400' : 'bg-white'}`}></span>
              </span>
              <span>{visibilityLevel === 'ghost' ? 'Hidden' : 'Visible'}</span>
            </div>

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
              <span className="text-gray-300">•</span>
              <div className="flex items-center gap-1">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-400"></span>
                </span>
                <span className="text-gray-600 font-medium">{inView} in view</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
