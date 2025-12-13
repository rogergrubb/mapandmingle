import { useState, useEffect } from 'react';
import { 
  Ghost, 
  Users, 
  UserCheck,
  Globe, 
  Sparkles, 
  Shield,
  MapPin,
  Clock,
  ChevronDown,
  ChevronUp,
  Info,
  Zap,
  Heart,
  Bell
} from 'lucide-react';

export type VisibilityLevel = 'ghost' | 'circles' | 'connections' | 'visible' | 'beacon';

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
    description: 'Complete invisibility',
    details: [
      'No one can see your location',
      'You can still browse the map',
      'Perfect for taking a break'
    ],
    whoCanSee: 'Nobody'
  },
  {
    level: 'circles',
    label: 'Inner Circle',
    shortLabel: 'Circle',
    icon: <Shield className="w-5 h-5" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-300',
    glowColor: 'shadow-blue-200',
    description: 'Family & trusted friends only',
    details: [
      'Pre-approved trusted contacts only',
      'Real-time location for safety',
      'Perfect for family tracking',
      'Location history available'
    ],
    whoCanSee: 'Your trusted circles only'
  },
  {
    level: 'connections',
    label: 'Known Connections',
    shortLabel: 'Friends',
    icon: <UserCheck className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-300',
    glowColor: 'shadow-green-200',
    description: 'People you\'ve connected with',
    details: [
      'Matched and messaged users can see you',
      'Approved connections only',
      'Social but controlled - no strangers'
    ],
    whoCanSee: 'People you\'ve connected with'
  },
  {
    level: 'visible',
    label: 'Full Visibility',
    shortLabel: 'Visible',
    icon: <Globe className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-300',
    glowColor: 'shadow-purple-200',
    description: 'Visible to all users',
    details: [
      'All MapMingle users in your area',
      'Standard discovery mode',
      'Great for meeting new people'
    ],
    whoCanSee: 'All MapMingle users nearby'
  },
  {
    level: 'beacon',
    label: 'Beacon Mode',
    shortLabel: 'Beacon',
    icon: <Zap className="w-5 h-5" />,
    color: 'text-pink-600',
    bgColor: 'bg-gradient-to-r from-pink-100 to-orange-100',
    borderColor: 'border-pink-400',
    glowColor: 'shadow-pink-300',
    description: 'Highlighted & broadcasting NOW',
    details: [
      'Glowing/pulsing pin on map',
      'Higher in search results',
      'Shows "Open to Mingle NOW"',
      'Auto-expires after 2 hours'
    ],
    whoCanSee: 'Everyone + Promoted visibility'
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
  beaconDuration = 120,
  onBeaconDurationChange 
}: VisibilitySliderProps) {
  const currentIndex = VISIBILITY_LEVELS.findIndex(l => l.level === value);
  const currentConfig = VISIBILITY_LEVELS[currentIndex] || VISIBILITY_LEVELS[0];
  const [showBeaconOptions, setShowBeaconOptions] = useState(false);

  const handleSliderChange = (index: number) => {
    const newLevel = VISIBILITY_LEVELS[index].level;
    onChange(newLevel);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        {VISIBILITY_LEVELS.map((level, index) => (
          <button
            key={level.level}
            onClick={() => handleSliderChange(index)}
            className={`
              p-2 rounded-full transition-all duration-200
              ${value === level.level 
                ? `${level.bgColor} ${level.borderColor} border-2 scale-110 ${level.glowColor} shadow-lg` 
                : 'bg-white/80 border border-gray-200 hover:scale-105'
              }
            `}
            title={level.label}
          >
            <span className={value === level.level ? level.color : 'text-gray-400'}>
              {level.icon}
            </span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-xl p-4 space-y-4">
      {/* Current Level Display */}
      <div className={`flex items-center gap-3 p-3 rounded-xl ${currentConfig.bgColor} ${currentConfig.borderColor} border`}>
        <span className={currentConfig.color}>{currentConfig.icon}</span>
        <div>
          <div className={`font-semibold ${currentConfig.color}`}>{currentConfig.label}</div>
          <div className="text-sm text-gray-600">{currentConfig.description}</div>
        </div>
      </div>

      {/* Slider Track */}
      <div className="relative px-2">
        <div className="flex justify-between items-center mb-2">
          {VISIBILITY_LEVELS.map((level, index) => (
            <button
              key={level.level}
              onClick={() => handleSliderChange(index)}
              className={`
                flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200
                ${value === level.level 
                  ? `${level.bgColor} ${level.color} scale-110 ${level.glowColor} shadow-lg` 
                  : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
                }
              `}
            >
              {level.icon}
              <span className="text-xs font-medium">{level.shortLabel}</span>
            </button>
          ))}
        </div>
        
        {/* Track line */}
        <div className="relative h-2 bg-gray-200 rounded-full mx-4">
          <div 
            className={`absolute h-full rounded-full transition-all duration-300 ${
              currentConfig.level === 'beacon' 
                ? 'bg-gradient-to-r from-pink-400 to-orange-400' 
                : currentConfig.level === 'visible'
                ? 'bg-purple-400'
                : currentConfig.level === 'connections'
                ? 'bg-green-400'
                : currentConfig.level === 'circles'
                ? 'bg-blue-400'
                : 'bg-gray-400'
            }`}
            style={{ 
              width: `${(currentIndex / (VISIBILITY_LEVELS.length - 1)) * 100}%` 
            }}
          />
        </div>
      </div>

      {/* Beacon Duration Options */}
      {value === 'beacon' && (
        <div className="mt-4 p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-200">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-pink-500" />
            <span className="text-sm font-medium text-pink-700">Beacon Duration</span>
          </div>
          <div className="flex gap-2">
            {[30, 60, 120].map((mins) => (
              <button
                key={mins}
                onClick={() => onBeaconDurationChange?.(mins)}
                className={`
                  px-3 py-1 rounded-full text-sm font-medium transition-all
                  ${beaconDuration === mins 
                    ? 'bg-pink-500 text-white' 
                    : 'bg-white text-pink-600 border border-pink-300 hover:bg-pink-50'
                  }
                `}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
          <p className="text-xs text-pink-600 mt-2">
            ⚡ Your pin will glow and pulse to attract attention
          </p>
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Info className="w-4 h-4" />
            <span>Who can see you: <strong className={currentConfig.color}>{currentConfig.whoCanSee}</strong></span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {currentConfig.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-1 ${currentConfig.color}`}>•</span>
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Quick Toggle Component for MapPage header
export function VisibilityQuickToggle({ 
  value, 
  onChange 
}: { 
  value: VisibilityLevel; 
  onChange: (level: VisibilityLevel) => void;
}) {
  const currentConfig = VISIBILITY_LEVELS.find(l => l.level === value) || VISIBILITY_LEVELS[0];
  const [showMenu, setShowMenu] = useState(false);

  return (
    <div className="relative">
      <button
        onClick={() => setShowMenu(!showMenu)}
        className={`flex items-center gap-2 px-3 py-2 rounded-full ${currentConfig.bgColor} ${currentConfig.color} border ${currentConfig.borderColor} shadow-lg transition-all hover:scale-105 backdrop-blur-sm`}
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
          <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden min-w-[240px]">
            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Visibility Level</span>
            </div>
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
                <div className="text-left flex-1">
                  <div className={`font-medium ${level.level === value ? level.color : 'text-gray-700'}`}>
                    {level.label}
                  </div>
                  <div className="text-xs text-gray-500">{level.description}</div>
                </div>
                {level.level === value && (
                  <div className={`w-2 h-2 rounded-full ${level.color.replace('text-', 'bg-')}`} />
                )}
              </button>
            ))}
            <div className="px-4 py-2 bg-gray-50 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                Safety first - control who sees your location
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// Export the levels for use elsewhere
export { VISIBILITY_LEVELS };
