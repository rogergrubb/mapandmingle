import { useState } from 'react';
import { 
  Ghost, 
  Users, 
  Eye, 
  UserCheck,
  Globe, 
  Zap,
  ChevronDown,
  Info,
  X,
  Clock
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
  emoji: string;
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
      'Perfect for taking a break',
      'Your pins are hidden from everyone'
    ],
    whoCanSee: 'Nobody',
    emoji: '👻'
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
    description: 'Family & trusted friends only',
    details: [
      'Only your circles see your precise location',
      'Perfect for family safety tracking',
      'Invisible to all other users',
      'Real-time location for trusted people'
    ],
    whoCanSee: 'Your circles only',
    emoji: '👨‍👩‍👧‍👦'
  },
  {
    level: 'fuzzy',
    label: 'Fuzzy Location',
    shortLabel: 'Fuzzy',
    icon: <Eye className="w-5 h-5" />,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100',
    borderColor: 'border-yellow-400',
    glowColor: 'shadow-yellow-200',
    description: 'Approximate location to others',
    details: [
      'Circles see your exact location',
      'Others see only your neighborhood/area',
      'Good balance of privacy & discovery',
      'Can appear in "nearby" searches'
    ],
    whoCanSee: 'Circles (precise) • Others (area only)',
    emoji: '🔍'
  },
  {
    level: 'social',
    label: 'Social Mode',
    shortLabel: 'Social',
    icon: <UserCheck className="w-5 h-5" />,
    color: 'text-green-600',
    bgColor: 'bg-green-100',
    borderColor: 'border-green-400',
    glowColor: 'shadow-green-200',
    description: 'Visible to your connections',
    details: [
      'People you\'ve matched with can see you',
      'Friends & friends-of-friends included',
      'No strangers can see your location',
      'Great for networking with known people'
    ],
    whoCanSee: 'Your connections & their connections',
    emoji: '🤝'
  },
  {
    level: 'discoverable',
    label: 'Discoverable',
    shortLabel: 'Open',
    icon: <Globe className="w-5 h-5" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-400',
    glowColor: 'shadow-purple-200',
    description: 'Visible to all users',
    details: [
      'Anyone on MapMingle can see your pin',
      'Standard discovery mode',
      'Maximum exposure for meeting people',
      'Great for events & travel'
    ],
    whoCanSee: 'All MapMingle users nearby',
    emoji: '🌍'
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
      'Your pin glows and pulses on the map',
      'Appears higher in search results',
      'Shows "Open to Mingle NOW" status',
      'Auto-expires (you choose duration)'
    ],
    whoCanSee: 'Everyone + Promoted visibility',
    emoji: '⚡'
  }
];

interface VisibilitySliderProps {
  value: VisibilityLevel;
  onChange: (level: VisibilityLevel) => void;
  compact?: boolean;
  showDetails?: boolean;
  beaconDuration?: number;
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
  const [showInfo, setShowInfo] = useState(false);

  const handleSliderChange = (index: number) => {
    const newLevel = VISIBILITY_LEVELS[index].level;
    onChange(newLevel);
  };

  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
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
            title={`${level.label}: ${level.description}`}
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
        <div className="flex-1">
          <div className={`font-semibold ${currentConfig.color}`}>{currentConfig.label}</div>
          <div className="text-sm text-gray-600">{currentConfig.description}</div>
        </div>
        <span className="text-2xl">{currentConfig.emoji}</span>
      </div>

      {/* Level Selector */}
      <div className="flex justify-between items-center">
        {VISIBILITY_LEVELS.map((level, index) => (
          <button
            key={level.level}
            onClick={() => handleSliderChange(index)}
            className={`
              flex flex-col items-center gap-1 p-2 rounded-xl transition-all duration-200 min-w-[50px]
              ${value === level.level 
                ? `${level.bgColor} ${level.color} scale-110 ${level.glowColor} shadow-lg border ${level.borderColor}` 
                : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'
              }
            `}
            title={`${level.label}: ${level.description}`}
          >
            {level.icon}
            <span className="text-[10px] font-medium leading-tight">{level.shortLabel}</span>
          </button>
        ))}
      </div>
      
      {/* Track line */}
      <div className="relative h-2 bg-gray-200 rounded-full mx-2">
        <div 
          className={`absolute h-full rounded-full transition-all duration-300 ${
            currentConfig.level === 'beacon' 
              ? 'bg-gradient-to-r from-pink-400 to-orange-400' 
              : currentConfig.level === 'discoverable'
              ? 'bg-purple-400'
              : currentConfig.level === 'social'
              ? 'bg-green-400'
              : currentConfig.level === 'fuzzy'
              ? 'bg-yellow-400'
              : currentConfig.level === 'circles'
              ? 'bg-blue-400'
              : 'bg-gray-400'
          }`}
          style={{ 
            width: `${(currentIndex / (VISIBILITY_LEVELS.length - 1)) * 100}%` 
          }}
        />
      </div>

      {/* Beacon Duration Options */}
      {value === 'beacon' && (
        <div className="p-3 bg-gradient-to-r from-pink-50 to-orange-50 rounded-xl border border-pink-200">
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
                  px-3 py-1.5 rounded-full text-sm font-medium transition-all
                  ${beaconDuration === mins 
                    ? 'bg-pink-500 text-white shadow-lg' 
                    : 'bg-white text-pink-600 border border-pink-300 hover:bg-pink-50'
                  }
                `}
              >
                {mins >= 60 ? `${mins / 60}h` : `${mins}m`}
              </button>
            ))}
          </div>
          <p className="text-xs text-pink-600 mt-2 flex items-center gap-1">
            <Zap className="w-3 h-3" /> Your pin will glow and pulse to attract attention
          </p>
        </div>
      )}

      {/* Details */}
      {showDetails && (
        <div className="space-y-2 pt-2 border-t border-gray-100">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Info className="w-4 h-4" />
            <span>Who can see you: <strong className={currentConfig.color}>{currentConfig.whoCanSee}</strong></span>
          </div>
          <ul className="text-sm text-gray-600 space-y-1">
            {currentConfig.details.map((detail, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className={`mt-0.5 ${currentConfig.color}`}>•</span>
                {detail}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Info Modal for mobile/touch devices
function VisibilityInfoModal({ 
  isOpen, 
  onClose,
  currentLevel 
}: { 
  isOpen: boolean; 
  onClose: () => void;
  currentLevel: VisibilityLevel;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full max-h-[80vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Visibility Levels</h2>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-3">
          {VISIBILITY_LEVELS.map((level) => (
            <div 
              key={level.level}
              className={`p-4 rounded-xl border-2 transition-all ${
                level.level === currentLevel 
                  ? `${level.bgColor} ${level.borderColor} shadow-lg` 
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`text-2xl`}>{level.emoji}</span>
                <div>
                  <div className={`font-bold ${level.level === currentLevel ? level.color : 'text-gray-700'}`}>
                    {level.label}
                  </div>
                  <div className="text-sm text-gray-500">{level.description}</div>
                </div>
              </div>
              <div className={`text-sm ${level.level === currentLevel ? level.color : 'text-gray-600'} font-medium mb-2`}>
                👁️ {level.whoCanSee}
              </div>
              <ul className="text-xs text-gray-600 space-y-1">
                {level.details.map((detail, i) => (
                  <li key={i} className="flex items-start gap-1.5">
                    <span className="text-gray-400">•</span>
                    {detail}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
          <button
            onClick={onClose}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
}

// Quick Toggle Component for MapPage header - with info button
export function VisibilityQuickToggle({ 
  value, 
  onChange 
}: { 
  value: VisibilityLevel; 
  onChange: (level: VisibilityLevel) => void;
}) {
  const currentConfig = VISIBILITY_LEVELS.find(l => l.level === value) || VISIBILITY_LEVELS[0];
  const [showMenu, setShowMenu] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);

  return (
    <>
      <div className="relative flex items-center gap-2">
        {/* Main Toggle Button */}
        <button
          onClick={() => setShowMenu(!showMenu)}
          className={`flex items-center gap-2 px-3 py-2 rounded-full ${currentConfig.bgColor} ${currentConfig.color} border-2 ${currentConfig.borderColor} shadow-lg transition-all hover:scale-105 backdrop-blur-sm`}
        >
          {currentConfig.icon}
          <span className="text-sm font-semibold">{currentConfig.shortLabel}</span>
          <ChevronDown className={`w-4 h-4 transition-transform ${showMenu ? 'rotate-180' : ''}`} />
        </button>

        {/* Dropdown Menu */}
        {showMenu && (
          <>
            <div 
              className="fixed inset-0 z-40" 
              onClick={() => setShowMenu(false)} 
            />
            <div className="absolute top-full mt-2 left-0 z-50 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden min-w-[280px]">
              <div className="px-4 py-3 bg-gradient-to-r from-purple-50 to-pink-50 border-b border-gray-200">
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Your Visibility Level</span>
              </div>
              
              {VISIBILITY_LEVELS.map((level) => (
                <button
                  key={level.level}
                  onClick={() => {
                    onChange(level.level);
                    setShowMenu(false);
                  }}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                    level.level === value ? level.bgColor : ''
                  }`}
                >
                  <span className="text-xl">{level.emoji}</span>
                  <span className={level.color}>{level.icon}</span>
                  <div className="text-left flex-1">
                    <div className={`font-semibold ${level.level === value ? level.color : 'text-gray-700'}`}>
                      {level.label}
                    </div>
                    <div className="text-xs text-gray-500">{level.description}</div>
                  </div>
                  {level.level === value && (
                    <div className={`w-3 h-3 rounded-full ${level.color.replace('text-', 'bg-')}`} />
                  )}
                </button>
              ))}
              
              <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowInfoModal(true);
                  }}
                  className="text-xs text-purple-600 hover:text-purple-800 font-medium flex items-center gap-1"
                >
                  <Info className="w-3 h-3" />
                  Learn more about visibility levels
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Info Modal */}
      <VisibilityInfoModal 
        isOpen={showInfoModal} 
        onClose={() => setShowInfoModal(false)}
        currentLevel={value}
      />
    </>
  );
}

// Export the levels for use elsewhere
export { VISIBILITY_LEVELS };
