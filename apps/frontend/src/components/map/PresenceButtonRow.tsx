import { MapPin, Navigation, X } from 'lucide-react';
import haptic from '../../lib/haptics';

interface PresenceButtonRowProps {
  isPlacementMode: boolean;
  placementType: 'here' | 'there' | null;
  onWhereImAt: () => void;
  onWhereIllBe: () => void;
  onCancelPlacement: () => void;
  hasGPS: boolean;
  gpsAccuracyPoor?: boolean;
  hidden?: boolean;
  visibilityLevel?: string;
}

export function PresenceButtonRow({
  isPlacementMode,
  placementType,
  onWhereImAt,
  onWhereIllBe,
  onCancelPlacement,
  hasGPS,
  gpsAccuracyPoor,
  hidden = false,
  visibilityLevel = 'discoverable',
}: PresenceButtonRowProps) {
  
  const handleWhereImAt = () => {
    haptic.lightTap();
    onWhereImAt();
  };

  const handleWhereIllBe = () => {
    haptic.lightTap();
    onWhereIllBe();
  };

  const handleCancel = () => {
    haptic.softTick();
    onCancelPlacement();
  };

  const isVisible = visibilityLevel !== 'ghost';

  // Placement mode - show cancel bar + instruction banner
  if (isPlacementMode) {
    const isGPSFallback = placementType === 'here' && !hasGPS;
    const bannerText = isGPSFallback 
      ? "We couldn't get your location — tap the map to set it."
      : placementType === 'here'
        ? "Tap anywhere to choose your location."
        : "Tap anywhere to choose where you'll be.";

    return (
      <div className="absolute top-[52px] left-0 right-0 z-[1000] flex flex-col items-center px-3">
        {/* Instruction Banner */}
        <div 
          className={`mb-2 px-4 py-2.5 rounded-xl shadow-lg text-center text-sm max-w-md ${
            placementType === 'here' 
              ? 'bg-pink-500 text-white' 
              : 'bg-purple-500 text-white'
          }`}
          style={{ animation: 'slideDown 0.2s ease-out' }}
        >
          <span className="font-medium">{bannerText}</span>
        </div>

        {/* Cancel Pill */}
        <button
          onClick={handleCancel}
          className="flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 text-sm font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          style={{ boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' }}
        >
          <X size={18} className="text-gray-500" />
          <span>Cancel</span>
        </button>

        <style>{`
          @keyframes slideDown {
            from { opacity: 0; transform: translateY(-8px); }
            to { opacity: 1; transform: translateY(0); }
          }
        `}</style>
      </div>
    );
  }

  // Default state - Visible badge centered above two action buttons
  return (
    <div 
      className={`absolute top-[52px] left-0 right-0 z-[999] flex flex-col items-center transition-all duration-300 ease-out ${
        hidden ? 'opacity-0 -translate-y-4 pointer-events-none' : 'opacity-100 translate-y-0'
      }`}
    >
      {/* Visibility Status Badge - Centered */}
      <div className={`mb-2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md ${
        isVisible 
          ? 'bg-green-500 text-white' 
          : 'bg-gray-200 text-gray-600'
      }`}>
        <span className="relative flex h-2 w-2">
          {isVisible && (
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
          )}
          <span className={`relative inline-flex rounded-full h-2 w-2 ${isVisible ? 'bg-white' : 'bg-gray-400'}`}></span>
        </span>
        <span>{isVisible ? 'Visible' : 'Hidden'}</span>
      </div>

      {/* Action Buttons Row */}
      <div className="flex gap-2">
        {/* Where I'm At */}
        <button
          onClick={handleWhereImAt}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:translate-y-[-1px] active:scale-[0.98]"
          style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-pink-100 to-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <MapPin size={16} className="text-pink-500" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-xs leading-tight">Where I'm At</div>
            <div className="text-[10px] text-gray-500">
              {hasGPS && !gpsAccuracyPoor ? 'Use location' : 'Tap map'}
            </div>
          </div>
        </button>

        {/* Where I'll Be */}
        <button
          onClick={handleWhereIllBe}
          className="flex items-center gap-2 px-3.5 py-2.5 bg-white rounded-xl shadow-md hover:shadow-lg transition-all hover:translate-y-[-1px] active:scale-[0.98]"
          style={{ boxShadow: '0 2px 10px rgba(0, 0, 0, 0.1)' }}
        >
          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Navigation size={16} className="text-purple-500" />
          </div>
          <div className="text-left">
            <div className="font-semibold text-gray-900 text-xs leading-tight">Where I'll Be</div>
            <div className="text-[10px] text-gray-500">Tap map</div>
          </div>
        </button>
      </div>
    </div>
  );
}
