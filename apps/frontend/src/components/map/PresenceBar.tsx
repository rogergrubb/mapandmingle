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
  gpsAccuracyPoor?: boolean;
}

export function PresenceBar({
  isPlacementMode,
  placementType,
  onImHere,
  onImHereManual,
  onHeadingThere,
  onCancelPlacement,
  hasGPS,
  gpsAccuracyPoor,
}: PresenceBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleImHere = () => {
    if (hasGPS && !gpsAccuracyPoor) {
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
    const isGPSFallback = placementType === 'here' && !hasGPS;
    return (
      <div className="absolute top-[124px] left-4 right-4 z-[1000]">
        {/* Instruction Banner */}
        <div 
          className={`mb-2 text-white px-4 py-2.5 rounded-xl shadow-lg text-center text-sm ${
            placementType === 'here' ? 'bg-pink-600' : 'bg-purple-600'
          }`}
        >
          <div className="font-semibold">
            {isGPSFallback 
              ? "We couldn't get your location" 
              : placementType === 'here' 
                ? 'Tap to mark your spot' 
                : 'Tap anywhere on the map'}
          </div>
          <div className={`text-xs ${placementType === 'here' ? 'text-pink-200' : 'text-purple-200'}`}>
            {isGPSFallback 
              ? 'Tap the map to place your pin'
              : placementType === 'here' 
                ? 'Choose your location manually' 
                : 'Mark where you\'re heading'}
          </div>
        </div>

        {/* Cancel Button */}
        <button
          onClick={onCancelPlacement}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-gray-700 text-white text-sm font-semibold rounded-full shadow-md hover:bg-gray-600 transition-all active:scale-[0.98]"
        >
          <X size={16} />
          <span>Cancel</span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-[124px] left-4 right-4 z-[1000]">
      {/* Collapsed State - Main Presence Bar */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="presence-bar relative w-full flex items-center justify-between px-5 py-3 rounded-full shadow-xl transition-all active:scale-[0.98] hover:translate-y-[-1px] hover:shadow-2xl overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #8b5cf6 100%)',
            boxShadow: '0 8px 24px rgba(168, 85, 247, 0.35), 0 0 16px rgba(236, 72, 153, 0.08)',
          }}
        >
          {/* Ambient glow layer */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity"
            style={{
              background: 'linear-gradient(135deg, #f472b6 0%, #c084fc 50%, #a78bfa 100%)',
            }}
          />
          
          {/* Pulse animation layer */}
          <div 
            className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: 'linear-gradient(135deg, #ec4899 0%, #a855f7 50%, #8b5cf6 100%)',
              animation: 'presenceBarPulse 8s ease-out infinite',
            }}
          />
          
          {/* Content */}
          <div className="flex items-center gap-2.5 relative z-10 pl-1">
            <MapPin size={20} className="text-white" />
            <span className="text-white font-bold text-[15px] tracking-tight">Drop Your Presence</span>
          </div>
          <ChevronDown size={16} className="text-white/70 relative z-10 mr-1" />
        </button>
      ) : (
        /* Expanded State - Action Selection */
        <div 
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
          style={{
            animation: 'expandDown 0.2s ease-out forwards',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.12)',
          }}
        >
          {/* Header - Collapsed bar style */}
          <button
            onClick={() => setIsExpanded(false)}
            className="w-full flex items-center justify-between px-5 py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500"
          >
            <div className="flex items-center gap-2.5 pl-1">
              <MapPin size={18} className="text-white" />
              <span className="text-white font-bold text-sm">Drop Your Presence</span>
            </div>
            <ChevronDown size={16} className="text-white/70 rotate-180 mr-1" />
          </button>

          {/* Action Chips */}
          <div className="flex gap-2.5 p-3">
            {/* I'm Here */}
            <button
              onClick={handleImHere}
              className="flex-1 flex items-center gap-2.5 p-3 bg-gradient-to-br from-pink-50 to-rose-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-pink-100/50"
              style={{
                animation: 'chipSlideUp 0.18s ease-out forwards',
                animationDelay: '60ms',
                opacity: 0,
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-pink-500 to-rose-500 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <MapPin size={20} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-sm">I'm Here</div>
                <div className="text-[11px] text-gray-500">
                  {hasGPS && !gpsAccuracyPoor ? 'Use GPS' : 'Tap to place'}
                </div>
              </div>
            </button>

            {/* I'm Heading There */}
            <button
              onClick={handleHeadingThere}
              className="flex-1 flex items-center gap-2.5 p-3 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-sm hover:shadow-md transition-all hover:scale-[1.02] active:scale-[0.98] border border-purple-100/50"
              style={{
                animation: 'chipSlideUp 0.18s ease-out forwards',
                animationDelay: '100ms',
                opacity: 0,
              }}
            >
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-md flex-shrink-0">
                <Navigation size={20} className="text-white" />
              </div>
              <div className="text-left">
                <div className="font-bold text-gray-900 text-sm">Heading There</div>
                <div className="text-[11px] text-gray-500">Tap map</div>
              </div>
            </button>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes presenceBarPulse {
          0%, 90%, 100% {
            transform: scale(1);
            opacity: 0;
          }
          95% {
            transform: scale(1.025);
            opacity: 0.15;
          }
        }
        
        @keyframes expandDown {
          from {
            opacity: 0.9;
            transform: scaleY(0.95);
            transform-origin: top;
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }
        
        @keyframes chipSlideUp {
          from {
            opacity: 0;
            transform: translateY(8px);
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
