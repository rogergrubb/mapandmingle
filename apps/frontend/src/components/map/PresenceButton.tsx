import { useState } from 'react';
import { MapPin, Navigation, X, Crosshair } from 'lucide-react';

interface PresenceButtonProps {
  isPlacementMode: boolean;
  placementType: 'here' | 'heading' | null;
  onImHere: () => void;
  onPlaceManually: () => void;
  onHeadingThere: () => void;
  onCancelPlacement: () => void;
}

export function PresenceButton({
  isPlacementMode,
  placementType,
  onImHere,
  onPlaceManually,
  onHeadingThere,
  onCancelPlacement,
}: PresenceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleImHere = () => {
    onImHere();
    setIsOpen(false);
  };

  const handlePlaceManually = () => {
    onPlaceManually();
    setIsOpen(false);
  };

  const handleHeadingThere = () => {
    onHeadingThere();
    setIsOpen(false);
  };

  const handleMainButtonClick = () => {
    if (isPlacementMode) {
      onCancelPlacement();
    } else {
      setIsOpen(!isOpen);
    }
  };

  // Get placement mode message
  const getPlacementMessage = () => {
    if (placementType === 'here') {
      return { title: 'Tap to mark your spot', subtitle: 'Choose your location on the map' };
    }
    return { title: 'Tap anywhere on the map', subtitle: 'Mark where you\'re heading' };
  };

  const placementMessage = getPlacementMessage();

  return (
    <>
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999] bg-black/50 backdrop-blur-sm transition-opacity duration-300"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Button container - positioned above bottom nav */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000]">
        
        {/* Action buttons - arc layout */}
        {isOpen && (
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2">
            {/* Three options in a row */}
            <div className="flex gap-3 items-end">
              {/* I'm Heading There - Left */}
              <button
                onClick={handleHeadingThere}
                className="flex flex-col items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95 min-w-[100px]"
                style={{
                  animation: 'slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  transform: 'translateY(20px)',
                  opacity: 0,
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                  <Navigation size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">Heading</div>
                  <div className="font-bold text-gray-900 text-sm">There</div>
                </div>
              </button>

              {/* I'm Here (GPS) - Center, larger */}
              <button
                onClick={handleImHere}
                className="flex flex-col items-center gap-2 px-5 py-4 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95 min-w-[110px] -mt-2"
                style={{
                  animation: 'slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  animationDelay: '40ms',
                  transform: 'translateY(20px)',
                  opacity: 0,
                }}
              >
                <div className="w-14 h-14 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                  <MapPin size={28} className="text-white" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-[15px]">I'm Here</div>
                  <div className="text-xs text-gray-500">Use GPS</div>
                </div>
              </button>

              {/* Pick My Spot - Right */}
              <button
                onClick={handlePlaceManually}
                className="flex flex-col items-center gap-2 px-4 py-3 bg-white rounded-2xl shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95 min-w-[100px]"
                style={{
                  animation: 'slideUp 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                  animationDelay: '80ms',
                  transform: 'translateY(20px)',
                  opacity: 0,
                }}
              >
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                  <Crosshair size={24} className="text-white" />
                </div>
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-sm">Pick My</div>
                  <div className="font-bold text-gray-900 text-sm">Spot</div>
                </div>
              </button>
            </div>
          </div>
        )}

        {/* Main Presence Button */}
        <button
          onClick={handleMainButtonClick}
          className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all duration-200 ${
            isPlacementMode
              ? 'bg-gray-700 scale-90'
              : isOpen
                ? 'bg-gray-800 rotate-45 scale-95'
                : 'bg-gradient-to-br from-pink-500 to-purple-600 hover:scale-105 active:scale-95'
          }`}
          style={{
            boxShadow: isOpen || isPlacementMode
              ? '0 8px 32px rgba(0, 0, 0, 0.3)'
              : '0 8px 32px rgba(236, 72, 153, 0.4)',
            border: '3px solid white',
          }}
        >
          {isPlacementMode ? (
            <X size={28} className="text-white" />
          ) : isOpen ? (
            <X size={28} className="text-white" />
          ) : (
            <MapPin size={28} className="text-white" />
          )}

          {/* Pulse animation ring - only when idle */}
          {!isOpen && !isPlacementMode && (
            <div 
              className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500 to-purple-600 pointer-events-none"
              style={{
                animation: 'presencePulse 3s ease-in-out infinite',
              }}
            />
          )}
        </button>
      </div>

      {/* Placement Mode Instruction Banner */}
      {isPlacementMode && (
        <div className="absolute top-20 left-4 right-4 z-[1000]">
          <div 
            className={`text-white px-6 py-3 rounded-2xl shadow-xl text-center ${
              placementType === 'here' 
                ? 'bg-blue-600' 
                : 'bg-purple-600'
            }`}
            style={{
              animation: 'slideDown 0.3s ease-out forwards',
            }}
          >
            <div className="font-semibold">{placementMessage.title}</div>
            <div className={`text-sm ${placementType === 'here' ? 'text-blue-200' : 'text-purple-200'}`}>
              {placementMessage.subtitle}
            </div>
          </div>
        </div>
      )}

      {/* Animations */}
      <style>{`
        @keyframes presencePulse {
          0%, 100% {
            transform: scale(1);
            opacity: 0;
          }
          50% {
            transform: scale(1.25);
            opacity: 0.4;
          }
        }
        
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </>
  );
}
