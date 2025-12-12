import { useState, useEffect } from 'react';
import { 
  Ghost, 
  Users, 
  Eye, 
  Globe, 
  Sparkles, 
  Shield,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react';

export type VisibilityLevel = 'ghost' | 'circles' | 'fuzzy' | 'social' | 'discoverable' | 'beacon';

interface VisibilityConfig {
  level: VisibilityLevel;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  description: string;
  details: string[];
  whoCanSee: string;
}

const VISIBILITY_LEVELS: VisibilityConfig[] = [
  {
    level: 'ghost',
    label: 'Ghost Mode',
    shortLabel: 'Ghost',
    icon: <Ghost className="w-5 h-5" />,
    color: 'text-gray-600',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-300',
    glowColor: 'shadow-gray-200',
    description: 'Completely invisible',
    details: [
      'No one can see your location',
      'You can still browse the map',
      'Perfect for taking a break'
    ],
    whoCanSee: 'No one'
  },
  {
    level: 'circles',
    label: 'Circles Only',
    shortLabel: 'Circles',
    icon: <Users className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    glowColor: 'shadow-blue-200',
    description: 'Family & trusted friends',
    details: [
      'Your circles see your precise location',
      'Perfect for family safety',
      'Invisible to everyone else'
    ],
    whoCanSee: 'Only your circles'
  },
  {
    level: 'fuzzy',
    label: 'Fuzzy Social',
    shortLabel: 'Fuzzy',
    icon: <Eye className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-300',
    glowColor: 'shadow-yellow-200',
    description: 'Approximate location to others',
    details: [
      'Circles see precise location',
      'Others see your neighborhood only',
      'Can appear in "nearby" searches'
    ],
    whoCanSee: 'Circles (precise) + Others (area only)'
  },
  {
    level: 'social',
    label: 'Social',
    shortLabel: 'Social',
    icon: <MapPin className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    glowColor: 'shadow-green-200',
    description: 'Visible to connections',
    details: [
      'Friends & friends-of-friends can see you',
      'Appear in "nearby" suggestions',
      'Good for casual networking'
    ],
    whoCanSee: 'Your network + nearby searches'
  },
  {
    level: 'discoverable',
    label: 'Discoverable',
    shortLabel: 'Open',
    icon: <Globe className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    glowColor: 'shadow-purple-200',
    description: 'Visible on public map',
    details: [
      'Anyone can see your pin',
      'Maximum exposure for meeting people',
      'Great for events & travel'
    ],
    whoCanSee: 'Everyone on MapMingle'
  },
  {
    level: 'beacon',
    label: 'Beacon Mode',
    shortLabel: 'Beacon',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-pink-100 to-purple-100',
    borderColor: 'border-pink-300',
    glowColor: 'shadow-pink-300',
    description: 'Highlighted & broadcasting',
    details: [
      'Featured prominently on map',
      'Nearby users get notified',
      'Time-limited (auto-expires)'
    ],
    whoCanSee: 'Everyone + Push notifications nearby'
  }
];

interface VisibilitySliderProps {
  value: VisibilityLevel;
  onChange: (level: VisibilityLevel) => void;
  compact?: boolean;
  showDetails?: boolean;
  beaconDuration?: number; // minutes
  onBeaconDurationChange?: (minutes: number) => void;
}

export default function VisibilitySlider({ 
  value, 
  onChange, 
  compact = false,
  showDetails = true,
  beaconDuration = 60,
  onBeaconDurationChange
}: VisibilitySliderProps) {
  const [expanded, setExpanded] = useState(!compact);
  const [showAllDetails, setShowAllDetails] = useState(false);
  
  const currentIndex = VISIBILITY_LEVELS.findIndex(l => l.level === value);
  const currentConfig = VISIBILITY_LEVELS[currentIndex];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const index = parseInt(e.target.value);
    onChange(VISIBILITY_LEVELS[index].level);
  };

  const handleLevelClick = (level: VisibilityLevel) => {
    onChange(level);
  };

  // Beacon duration options
  const beaconDurations = [30, 60, 120, 240];

  return (
    <div className={`rounded-3xl overflow-hidden transition-all duration-300 ${
      currentConfig.bgColor
    } border-2 ${currentConfig.borderColor} ${
      value === 'beacon' ? 'animate-pulse-subtle shadow-lg ' + currentConfig.glowColor : ''
    }`}>
      {/* Header - Always visible */}
      <div 
        className={`p-4 cursor-pointer ${compact ? 'pb-4' : ''}`}
        onClick={() => compact && setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-2xl ${currentConfig.bgColor} ${currentConfig.color} border ${currentConfig.borderColor}`}>
              {currentConfig.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className={`font-semibold ${currentConfig.color}`}>
                  {currentConfig.label}
                </h3>
                {value === 'beacon' && (
                  <span className="px-2 py-0.5 bg-pink-500 text-white text-xs rounded-full animate-pulse">
                    LIVE
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-600">{currentConfig.description}</p>
            </div>
          </div>
          {compact && (
            <button className="p-2 hover:bg-white/50 rounded-full transition-colors">
              {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
          )}
        </div>
      </div>

      {/* Expandable content */}
      {(expanded || !compact) && (
        <div className="px-4 pb-4 space-y-4">
          {/* Visual Slider */}
          <div className="relative pt-2">
            {/* Track background with gradient */}
            <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-3 rounded-full bg-gradient-to-r from-gray-200 via-yellow-200 via-green-200 via-purple-200 to-pink-300" />
            
            {/* Level markers */}
            <div className="relative flex justify-between px-1">
              {VISIBILITY_LEVELS.map((level, index) => (
                <button
                  key={level.level}
                  onClick={() => handleLevelClick(level.level)}
                  className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 ${
                    index === currentIndex 
                      ? `${level.bgColor} ${level.color} border-2 ${level.borderColor} scale-125 shadow-lg`
                      : 'bg-white/80 text-gray-400 hover:scale-110 border border-gray-200'
                  }`}
                  title={level.label}
                >
                  {level.icon}
                </button>
              ))}
            </div>

            {/* Hidden range input for accessibility */}
            <input
              type="range"
              min="0"
              max={VISIBILITY_LEVELS.length - 1}
              value={currentIndex}
              onChange={handleSliderChange}
              className="absolute inset-0 w-full opacity-0 cursor-pointer"
            />
          </div>

          {/* Level labels */}
          <div className="flex justify-between text-xs text-gray-500 px-1">
            <span>Private</span>
            <span>Social</span>
            <span>Public</span>
          </div>

          {/* Who can see you */}
          <div className={`flex items-center gap-2 p-3 rounded-2xl bg-white/60 border ${currentConfig.borderColor}`}>
            <Shield className={`w-4 h-4 ${currentConfig.color}`} />
            <span className="text-sm">
              <strong>Who sees you:</strong> {currentConfig.whoCanSee}
            </span>
          </div>

          {/* Beacon duration selector */}
          {value === 'beacon' && onBeaconDurationChange && (
            <div className="p-3 rounded-2xl bg-white/60 border border-pink-200">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-pink-600" />
                <span className="text-sm font-medium">Beacon duration</span>
              </div>
              <div className="flex gap-2">
                {beaconDurations.map(duration => (
                  <button
                    key={duration}
                    onClick={() => onBeaconDurationChange(duration)}
                    className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all ${
                      beaconDuration === duration
                        ? 'bg-pink-500 text-white'
                        : 'bg-white text-gray-600 hover:bg-pink-50'
                    }`}
                  >
                    {duration < 60 ? `${duration}m` : `${duration/60}h`}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Beacon automatically turns off after this time
              </p>
            </div>
          )}

          {/* Details toggle */}
          {showDetails && (
            <button
              onClick={() => setShowAllDetails(!showAllDetails)}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700"
            >
              <Info className="w-4 h-4" />
              {showAllDetails ? 'Hide details' : 'What does each level do?'}
            </button>
          )}

          {/* All levels detail view */}
          {showAllDetails && (
            <div className="space-y-2 pt-2">
              {VISIBILITY_LEVELS.map((level) => (
                <div 
                  key={level.level}
                  onClick={() => handleLevelClick(level.level)}
                  className={`p-3 rounded-2xl cursor-pointer transition-all ${
                    level.level === value 
                      ? `${level.bgColor} border-2 ${level.borderColor}`
                      : 'bg-white/40 border border-gray-200 hover:bg-white/60'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={level.color}>{level.icon}</span>
                    <span className={`font-medium ${level.level === value ? level.color : 'text-gray-700'}`}>
                      {level.label}
                    </span>
                  </div>
                  <ul className="text-xs text-gray-600 space-y-0.5 ml-7">
                    {level.details.map((detail, i) => (
                      <li key={i}>• {detail}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Compact version for map overlay
export function VisibilityQuickToggle({ 
  value, 
  onChange 
}: { 
  value: VisibilityLevel; 
  onChange: (level: VisibilityLevel) => void;
}) {
  const currentConfig = VISIBILITY_LEVELS.find(l => l.level === value)!;
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full ${currentConfig.bgColor} ${currentConfig.color} border ${currentConfig.borderColor} shadow-lg transition-all hover:scale-105`}
      >
        {currentConfig.icon}
        <span className="text-sm font-medium">{currentConfig.shortLabel}</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
      </button>

      {showMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setShowMenu(false)} 
          />
          <div className="absolute bottom-full mb-2 right-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-w-[200px]">
            {VISIBILITY_LEVELS.map((level) => (
              <button
                key={level.level}
                onClick={() => {
                  onChange(level.level);
                  setShowMenu(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors ${
                  level.level === value ? level.bgColor : ''
                }`}
              >
                <span className={level.color}>{level.icon}</span>
                <div className="text-left">
                  <div className={`font-medium ${level.level === value ? level.color : 'text-gray-700'}`}>
                    {level.label}
                  </div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
