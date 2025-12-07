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
}

export function PresenceButtonRow({
  isPlacementMode,
  placementType,
  onWhereImAt,
  onWhereIllBe,
  onCancelPlacement,
  hasGPS,
  gpsAccuracyPoor,
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

  // Placement mode - show cancel bar + instruction banner
  if (isPlacementMode) {
    const isGPSFallback = placementType === 'here' && !hasGPS;
    const bannerText = isGPSFallback 
      ? "We couldn't get your location — tap the map to set it."
      : placementType === 'here'
        ? "Tap anywhere to choose your location."
        : "Tap anywhere to choose where you'll be.";

    return (
      <div className="absolute top-[108px] left-3 right-3 z-[1000]">
        {/* Instruction Banner */}
        <div 
          className={`mb-2 px-4 py-2.5 rounded-xl shadow-lg text-center text-sm ${
            placementType === 'here' 
              ? 'bg-pink-500 text-white' 
              : 'bg-purple-500 text-white'
          }`}
          style={{
            animation: 'slideDown 0.2s ease-out',
          }}
        >
          <span className="font-medium">{bannerText}</span>
        </div>

        {/* Cancel Pill */}
        <button
          onClick={handleCancel}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-white text-gray-700 text-sm font-semibold rounded-2xl shadow-md hover:shadow-lg transition-all active:scale-[0.98]"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
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

  // Default state - Two buttons side by side
  return (
    <div className="absolute top-[108px] left-3 right-3 z-[1000]">
      <div className="flex gap-2">
        {/* Where I'm At */}
        <button
          onClick={handleWhereImAt}
          className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:translate-y-[-1px] active:scale-[1.02]"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-pink-100 to-rose-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <MapPin size={20} className="text-pink-500" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">Where I'm At</div>
            <div className="text-xs text-gray-500 truncate">
              {hasGPS && !gpsAccuracyPoor ? 'Use my location' : 'Tap the map'}
            </div>
          </div>
        </button>

        {/* Where I'll Be */}
        <button
          onClick={handleWhereIllBe}
          className="flex-1 flex items-center gap-3 px-4 py-3 bg-white rounded-2xl shadow-md hover:shadow-lg transition-all hover:translate-y-[-1px] active:scale-[1.02]"
          style={{
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
          }}
        >
          <div className="w-10 h-10 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <Navigation size={20} className="text-purple-500" />
          </div>
          <div className="text-left min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate">Where I'll Be</div>
            <div className="text-xs text-gray-500 truncate">Tap the map</div>
          </div>
        </button>
      </div>
    </div>
  );
}
