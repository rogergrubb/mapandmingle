import { useState } from 'react';
import { MapPin, Navigation, ChevronDown, X } from 'lucide-react';

interface PresenceBarProps {
  isPlacementMode: boolean;
  placementType: 'here' | 'heading' | null;
  onImHere: () => void;
  onImHereManual: () => void;
  onHeadingThere: () => void;
  onCancelPlacement: () => void;
  hasGPS: boolean;
}

export function PresenceBar({
  isPlacementMode,
  placementType,
  onImHere,
  onImHereManual,
  onHeadingThere,
  onCancelPlacement,
  hasGPS,
}: PresenceBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImHere = () => {
    if (hasGPS) {
      onImHere();
    } else {
      onImHereManual();
    }
    setIsExpanded(false);
  };

  const handleHeadingThere = () => {
    onHeadingThere();
    setIsExpanded(false);
  };

  // Placement mode - show cancel bar
  if (isPlacementMode) {
    return (
      <div className="absolute top-36 left-4 right-4 z-[1000]">
        {/* Instruction Banner */}
        <div 
          className={`mb-3 text-white px-5 py-3 rounded-2xl shadow-xl text-center ${
            placementType === 'here' ? 'bg-pink-600' : 'bg-purple-600'
          }`}
        >
          <div className="font-semibold">Tap anywhere on the map</div>
          <div className={`text-sm ${placementType === 'here' ? 'text-pink-200' : 'text-purple-200'}`}>
            {placementType === 'here' ? 'to mark your current spot' : 'to mark where you\'re heading'}
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancelPlacement}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gray-800 text-white font-semibold rounded-full shadow-lg hover:bg-gray-700 transition-all active:scale-[0.98]"
        >
          <X size={20} />
          <span>Cancel placement</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-36 left-4 right-4 z-[1000]">
      {/* Collapsed State - Main Presence Bar */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="relative w-full flex items-center justify-center gap-3 px-6 py-4 rounded-full shadow-xl hover:shadow-2xl transition-all active:scale-[0.98] overflow-hidden"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
          }}
        >
          {/* Subtle pulse animation */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
              animation: 'presenceBarPulse 6s ease-in-out infinite',
            }}
          />
          
          <MapPin size={22} className="text-white relative z-10" />
          <span className="text-white font-bold text-[16px] relative z-10">Drop Your Presence</span>
          <ChevronDown size={18} className="text-white/80 relative z-10" />
        </button>
      ) : (
        /* Expanded State - Action Selection */
        <div 
          className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-4"
          style={{
            animation: 'expandDown 0.2s ease-out forwards',
          }}
        >
          {/* Header */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-center justify-center gap-3 px-4 py-2 mb-3"
          >
            <MapPin size={20} className="text-purple-600" />
            <span className="text-gray-800 font-bold">Drop Your Presence</span>
            <ChevronDown size={18} className="text-gray-400 rotate-180" />
          </button>

          {/* Action Chips */}
          <div className="flex gap-3">
            {/* I'm Here */}
            <button
              onClick={handleImHere}
              className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-pink-100"
              style={{
                animation: 'slideUp 0.2s ease-out forwards',
                animationDelay: '50ms',
                opacity: 0,
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <MapPin size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">I'm Here</div>
                <div className="text-xs text-gray-500">
                  {hasGPS ? 'Use my location' : 'Tap to place'}
                </div>
              </div>
            </button>

            {/* I'm Heading There */}
            <button
              onClick={handleHeadingThere}
              className="flex-1 flex items-center gap-3 p-4 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] border border-purple-100"
              style={{
                animation: 'slideUp 0.2s ease-out forwards',
                animationDelay: '100ms',
                opacity: 0,
              }}
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg flex-shrink-0">
                <Navigation size={24} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900">Heading There</div>
                <div className="text-xs text-gray-500">Tap map to mark</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes presenceBarPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.85;
            transform: scale(1.01);
          }
        }
        
        @keyframes expandDown {
          from {
            opacity: 0;
            transform: translateY(-10px) scale(0.98);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
