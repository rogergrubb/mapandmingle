import { useState } from 'react';
import { 
  Heart, Users, Briefcase, Calendar, Plane, 
  MapPin, Filter, X, ChevronDown, Sparkles,
  Eye, EyeOff, Search, Globe
} from 'lucide-react';

export type MingleMode = 'everybody' | 'dating' | 'friends' | 'networking' | 'events' | 'travel';
export type DistanceFilter = 'nearby' | 'walking' | 'city' | 'anywhere';

interface MapControlBarProps {
  currentMode: MingleMode;
  distanceFilter: DistanceFilter;
  isVisible: boolean;
  peopleCount: number;
  onModeChange: (mode: MingleMode) => void;
  onDistanceChange: (distance: DistanceFilter) => void;
  onVisibilityToggle: () => void;
  onSearch: () => void;
}

const modeConfig = {
  everybody: { 
    icon: Globe, 
    label: 'Everybody', 
    color: 'from-gray-600 to-gray-800',
    bgColor: 'bg-gray-600',
    lightBg: 'bg-gray-50',
    textColor: 'text-gray-700',
    description: 'See all users on the map'
  },
  dating: { 
    icon: Heart, 
    label: 'Dating', 
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-500',
    lightBg: 'bg-pink-50',
    textColor: 'text-pink-600',
    description: 'Find romantic connections'
  },
  friends: { 
    icon: Users, 
    label: 'Friends', 
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-500',
    lightBg: 'bg-purple-50',
    textColor: 'text-purple-600',
    description: 'Meet new friends nearby'
  },
  networking: { 
    icon: Briefcase, 
    label: 'Networking', 
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-500',
    lightBg: 'bg-blue-50',
    textColor: 'text-blue-600',
    description: 'Connect with professionals'
  },
  events: { 
    icon: Calendar, 
    label: 'Events', 
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-500',
    lightBg: 'bg-green-50',
    textColor: 'text-green-600',
    description: 'Discover local events'
  },
  travel: { 
    icon: Plane, 
    label: 'Travel', 
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
  isVisible,
  peopleCount,
  onModeChange,
  onDistanceChange,
  onVisibilityToggle,
  onSearch,
}: MapControlBarProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showDistanceSelector, setShowDistanceSelector] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const config = modeConfig[currentMode];
  const ModeIcon = config.icon;
  const currentDistance = distanceOptions.find(d => d.value === distanceFilter);

  return (
    <>
      {/* Main Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000]">
        <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg shadow-black/10 border border-white/50 overflow-hidden">
          {/* Top Row - Mode & Quick Stats */}
          <div className="flex items-center gap-2 p-3">
            {/* Mode Selector Button */}
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]`}
            >
              <ModeIcon size={18} className="flex-shrink-0" />
              <span className="hidden sm:inline">{config.label}</span>
              <ChevronDown size={16} className={`transition-transform ${showModeSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Distance Filter */}
            <button
              onClick={() => setShowDistanceSelector(!showDistanceSelector)}
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-gray-700 font-medium"
            >
              <MapPin size={16} className="text-gray-500" />
              <span className="text-sm">{currentDistance?.label}</span>
              <ChevronDown size={14} className={`transition-transform text-gray-400 ${showDistanceSelector ? 'rotate-180' : ''}`} />
            </button>

            {/* Spacer */}
            <div className="flex-1" />

            {/* People Count - Animated */}
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-gradient-to-r from-pink-50 to-purple-50">
              <div className="relative">
                <Sparkles size={16} className="text-pink-500" />
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              </div>
              <span className="text-sm font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
                {peopleCount}
              </span>
              <span className="text-xs text-gray-500 hidden sm:inline">active</span>
            </div>

            {/* Visibility Toggle */}
            <button
              onClick={onVisibilityToggle}
              className={`p-2.5 rounded-xl transition-all ${
                isVisible 
                  ? 'bg-green-100 text-green-600 hover:bg-green-200' 
                  : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
              }`}
              title={isVisible ? 'You are visible' : 'You are hidden'}
            >
              {isVisible ? <Eye size={18} /> : <EyeOff size={18} />}
            </button>

            {/* Search Button */}
            <button
              onClick={onSearch}
              className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 transition-all text-gray-600"
            >
              <Search size={18} />
            </button>

            {/* Filter Button */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2.5 rounded-xl transition-all ${
                showFilters 
                  ? 'bg-purple-100 text-purple-600' 
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              }`}
            >
              <Filter size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* Mode Selector Dropdown */}
      {showModeSelector && (
        <>
          <div 
            className="fixed inset-0 z-[1001]" 
            onClick={() => setShowModeSelector(false)} 
          />
          <div className="absolute top-20 left-4 right-4 z-[1002] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white rounded-2xl shadow-xl shadow-black/15 border border-gray-100 overflow-hidden max-w-md mx-auto">
              <div className="p-4 border-b border-gray-100">
                <h3 className="font-bold text-gray-900">What are you looking for?</h3>
                <p className="text-sm text-gray-500">Choose your connection mode</p>
              </div>
              <div className="p-2 space-y-1">
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
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                        isActive 
                          ? `${cfg.lightBg} ${cfg.textColor}` 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center shadow-md`}>
                        <Icon size={20} className="text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <div className="font-semibold">{cfg.label}</div>
                        <div className="text-xs text-gray-500">{cfg.description}</div>
                      </div>
                      {isActive && (
                        <div className={`w-6 h-6 rounded-full ${cfg.bgColor} flex items-center justify-center`}>
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

      {/* Distance Selector Dropdown */}
      {showDistanceSelector && (
        <>
          <div 
            className="fixed inset-0 z-[1001]" 
            onClick={() => setShowDistanceSelector(false)} 
          />
          <div className="absolute top-20 left-4 z-[1002] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white rounded-2xl shadow-xl shadow-black/15 border border-gray-100 overflow-hidden w-48">
              <div className="p-1">
                {distanceOptions.map((option) => {
                  const isActive = option.value === distanceFilter;
                  return (
                    <button
                      key={option.value}
                      onClick={() => {
                        onDistanceChange(option.value);
                        setShowDistanceSelector(false);
                      }}
                      className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                        isActive 
                          ? 'bg-purple-50 text-purple-600' 
                          : 'hover:bg-gray-50 text-gray-700'
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-gray-400">{option.sublabel}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Quick Filters Drawer */}
      {showFilters && (
        <>
          <div 
            className="fixed inset-0 z-[1001] bg-black/20" 
            onClick={() => setShowFilters(false)} 
          />
          <div className="absolute top-20 left-4 right-4 z-[1002] animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="bg-white rounded-2xl shadow-xl shadow-black/15 border border-gray-100 overflow-hidden max-w-md mx-auto">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-gray-900">Quick Filters</h3>
                  <p className="text-sm text-gray-500">Refine your search</p>
                </div>
                <button 
                  onClick={() => setShowFilters(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={18} className="text-gray-500" />
                </button>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Age Range - For Dating/Friends */}
                {(currentMode === 'dating' || currentMode === 'friends') && (
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 block">Age Range</label>
                    <div className="flex gap-2">
                      {['18-25', '25-35', '35-45', '45+'].map((range) => (
                        <button
                          key={range}
                          className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-sm font-medium transition-all"
                        >
                          {range}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Interests */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Interests</label>
                  <div className="flex flex-wrap gap-2">
                    {['Coffee', 'Hiking', 'Music', 'Tech', 'Art', 'Sports', 'Food', 'Travel'].map((interest) => (
                      <button
                        key={interest}
                        className="py-1.5 px-3 rounded-full bg-gray-100 hover:bg-purple-100 hover:text-purple-600 text-sm transition-all"
                      >
                        {interest}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Activity Level */}
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-2 block">Show me</label>
                  <div className="flex gap-2">
                    <button className="flex-1 py-2 px-3 rounded-lg bg-green-100 text-green-600 text-sm font-medium">
                      Online Now
                    </button>
                    <button className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-all">
                      Active Today
                    </button>
                    <button className="flex-1 py-2 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-sm font-medium transition-all">
                      All
                    </button>
                  </div>
                </div>

                {/* Apply Button */}
                <button
                  onClick={() => setShowFilters(false)}
                  className={`w-full py-3 rounded-xl bg-gradient-to-r ${config.color} text-white font-semibold shadow-md hover:shadow-lg transition-all`}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
