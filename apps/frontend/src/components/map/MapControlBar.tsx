import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  Filter, X, ChevronDown,
  Eye, EyeOff, Search, Globe, Bell, User, GraduationCap
} from 'lucide-react';
import { Link } from 'react-router-dom';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';
export type CampusFilter = 'all' | 'campus' | 'global';

interface MapControlBarProps {
  currentMode: MingleMode;
  distanceFilter: DistanceFilter;
  campusFilter?: CampusFilter;
  userSchool?: string;
  isVisible: boolean;
  peopleCount?: number; // Now optional - activity strip shows this instead
  onModeChange: (mode: MingleMode) => void;
  onDistanceChange: (distance: DistanceFilter) => void;
  onCampusChange?: (campus: CampusFilter) => void;
  onVisibilityToggle: () => void;
  onSearch: () => void;
}

const modeConfig = {
  everybody: { 
    icon: Globe, 
    label: 'Everybody', 
    shortLabel: 'All',
    color: 'from-gray-600 to-gray-800',
    bgColor: 'bg-gray-600',
    lightBg: 'bg-gray-50',
    textColor: 'text-gray-700',
    description: 'See all users on the map'
  },
  dating: { 
    icon: Heart, 
    label: 'Dating', 
    shortLabel: 'Dating',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500',
    lightBg: 'bg-pink-50',
    textColor: 'text-pink-600',
    description: 'Find romantic connections'
  },
  friends: { 
    icon: Users, 
    label: 'Friends', 
    shortLabel: 'Friends',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    description: 'Meet new friends nearby'
  },
  networking: { 
    icon: Briefcase, 
    label: 'Networking', 
    shortLabel: 'Network',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Connect with professionals'
  },
  events: { 
    icon: Calendar, 
    label: 'Events', 
    shortLabel: 'Events',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500',
    lightBg: 'bg-green-50',
    textColor: 'text-green-600',
    description: 'Discover local events'
  },
  travel: { 
    icon: Plane, 
    label: 'Travel', 
    shortLabel: 'Travel',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-500',
    lightBg: 'bg-orange-50',
    textColor: 'text-orange-600',
    description: 'Meet fellow travelers'
  },
};

const distanceOptions = [
  { value: 'nearby' as DistanceFilter, label: 'Nearby', sublabel: '< 1 mi' },
  { value: 'walking' as DistanceFilter, label: 'Walking', sublabel: '< 3 mi' },
  { value: 'city' as DistanceFilter, label: 'My City', sublabel: '< 25 mi' },
  { value: 'anywhere' as DistanceFilter, label: 'Anywhere', sublabel: 'No limit' },
];

export function MapControlBar({
  currentMode,
  distanceFilter,
  campusFilter = 'all',
  userSchool,
  isVisible,
  onModeChange,
  onDistanceChange,
  onCampusChange,
  onVisibilityToggle,
  onSearch,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;

  const campusOptions = [
    { value: 'all' as CampusFilter, label: 'All People' },
    { value: 'campus' as CampusFilter, label: userSchool ? `My Campus` : 'Set Your School', disabled: !userSchool },
    { value: 'global' as CampusFilter, label: 'Global' },
  ];

  return (
    <>
      {/* Floating Controls - Centered at Top */}
      <div className="absolute top-4 left-0 right-0 z-[1000] pointer-events-none">
        <div className="flex items-center justify-center gap-2 sm:gap-3 px-4">
          
          {/* Mode Selector Pill */}
          <button
            onClick={() => setShowModeSelector(!showModeSelector)}
            className={`pointer-events-auto flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full bg-gradient-to-r ${config.color} text-white font-semibold shadow-lg hover:shadow-xl transition-all hover:scale-[1.02] active:scale-[0.98]`}
          >
            <ModeIcon size={18} className="flex-shrink-0" />
            <span className="hidden sm:inline">{config.shortLabel}</span>
            <ChevronDown size={14} className={`transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
          </button>

          {/* Visibility Status Pill */}
          <button
            onClick={onVisibilityToggle}
            className={`pointer-events-auto flex items-center gap-2 px-3 sm:px-4 py-2.5 rounded-full font-semibold shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] ${
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
            <span className="text-sm hidden sm:inline">{isVisible ? 'Visible' : 'Hidden'}</span>
          </button>
        </div>
      </div>

      {/* Top Right - Notifications & Profile */}
      <div className="absolute top-4 right-4 z-[1000] flex items-center gap-2">
        <Link
          to="/messages"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
        >
          <Bell size={18} className="text-gray-700" />
        </Link>
        <Link
          to="/profile"
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
        >
          <User size={18} className="text-gray-700" />
        </Link>
      </div>

      {/* Top Left - Filter & Search */}
      <div className="absolute top-4 left-4 z-[1000] flex items-center gap-2">
        <button
          onClick={onSearch}
          className="w-10 h-10 rounded-full bg-white/95 backdrop-blur-xl shadow-lg flex items-center justify-center hover:shadow-xl transition-all hover:scale-105"
        >
          <Search size={18} className="text-gray-700" />
        </button>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-10 h-10 rounded-full shadow-lg flex items-center justify-center transition-all hover:scale-105 ${
            showFilters 
              ? 'bg-purple-500 text-white' 
              : 'bg-white/95 backdrop-blur-xl text-gray-700 hover:shadow-xl'
          }`}
        >
          <Filter size={18} />
        </button>
      </div>

      {/* Mode Selector Dropdown - Centered */}
      {showModeSelector && (
        <>
          <div 
            className="fixed inset-0 z-[1001]" 
            onClick={() => setShowModeSelector(false)} 
          />
          <div className="absolute top-16 left-1/2 -translate-x-1/2 z-[1002] w-80 max-w-[calc(100%-2rem)] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
              <div className="p-3 border-b border-gray-100">
                <h3 className="font-bold text-gray-900 text-center text-sm">What are you looking for?</h3>
              </div>
              <div className="p-2 space-y-1 max-h-80 overflow-y-auto">
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
                      className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all ${
                        isActive 
                          ? `${cfg.lightBg} ${cfg.textColor}` 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                        <Icon size={18} className="text-white" />
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="font-semibold text-sm">{cfg.label}</div>
                        <div className="text-xs text-gray-500 truncate">{cfg.description}</div>
                      </div>
                      {isActive && (
                        <div className={`w-5 h-5 rounded-full ${cfg.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white text-xs">✓</span>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Filters Popup */}
      {showFilters && (
        <>
          <div 
            className="fixed inset-0 z-[1001] bg-black/10" 
            onClick={() => setShowFilters(false)} 
          />
          <div className="absolute top-16 left-4 z-[1002] w-72 animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/50 overflow-hidden">
              <div className="p-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-bold text-gray-900 text-sm">Filters</h3>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-1 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={16} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-3 space-y-3">
                {/* Campus Filter - Only show if user has a school set */}
                {userSchool && onCampusChange && (
                  <div>
                    <label className="text-xs font-medium text-gray-700 mb-1.5 flex items-center gap-1.5">
                      <GraduationCap size={14} className="text-purple-500" />
                      Campus Filter
                    </label>
                    <div className="grid grid-cols-3 gap-1.5">
                      {campusOptions.filter(o => !o.disabled).map((option) => {
                        const isActive = option.value === campusFilter;
                        return (
                          <button
                            key={option.value}
                            onClick={() => onCampusChange(option.value)}
                            className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                              isActive 
                                ? 'bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-md' 
                                : 'bg-gray-100 hover:bg-purple-100 hover:text-purple-700 text-gray-700'
                            }`}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                    {campusFilter === 'campus' && (
                      <p className="text-xs text-purple-600 mt-1.5">{userSchool}</p>
                    )}
                  </div>
                )}
                
                {/* Distance Filter */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Distance</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {distanceOptions.map((option) => {
                      const isActive = option.value === distanceFilter;
                      return (
                        <button
                          key={option.value}
                          onClick={() => onDistanceChange(option.value)}
                          className={`py-2 px-2 rounded-lg text-xs font-medium transition-all ${
                            isActive 
                              ? `bg-gradient-to-r ${config.color} text-white shadow-md` 
                              : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                          }`}
                        >
                          {option.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Interests */}
                <div>
                  <label className="text-xs font-medium text-gray-700 mb-1.5 block">Interests</label>
                  <div className="flex flex-wrap gap-1.5">
                    {['Coffee', 'Hiking', 'Music', 'Tech', 'Art', 'Sports'].map((interest) => (
                      <button
                        key={interest}
                        className="py-1 px-2.5 rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-xs transition-all"
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => setShowFilters(false)}
                  className={`w-full py-2.5 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold text-sm shadow-md hover:shadow-lg transition-all`}
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
