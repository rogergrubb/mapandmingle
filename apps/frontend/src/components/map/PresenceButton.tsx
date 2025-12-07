import { useState } from 'react';
import { MapPin, Navigation, X } from 'lucide-react';

interface PresenceButtonProps {
  isPlacementMode: boolean;
  onImHere: () => void;
  onHeadingThere: () => void;
  onCancelPlacement: () => void;
}

export function PresenceButton({
  isPlacementMode,
  onImHere,
  onHeadingThere,
  onCancelPlacement,
}: PresenceButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleImHere = () => {
    onImHere();
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
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex gap-4">
            {/* I'm Heading There - Left */}
            <button
              onClick={handleHeadingThere}
              className="flex items-center gap-3 px-5 py-4 bg-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95"
              style={{
                animation: 'slideUpLeft 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                transform: 'translateY(20px)',
                opacity: 0,
              }}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
                <Navigation size={22} className="text-white" />
              </div>
              <div className="text-left pr-2">
                <div className="font-bold text-gray-900 text-[15px]">I'm Heading There</div>
                <div className="text-xs text-gray-500">Tap the map to mark it</div>
              </div>
            </button>

            {/* I'm Here - Right */}
            <button
              onClick={handleImHere}
              className="flex items-center gap-3 px-5 py-4 bg-white rounded-full shadow-2xl hover:shadow-3xl transition-all hover:scale-105 active:scale-95"
              style={{
                animation: 'slideUpRight 0.28s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
                animationDelay: '60ms',
                transform: 'translateY(20px)',
                opacity: 0,
              }}
            >
              <div className="w-11 h-11 bg-gradient-to-br from-pink-500 to-rose-500 rounded-full flex items-center justify-center shadow-lg">
                <MapPin size={22} className="text-white" />
              </div>
              <div className="text-left pr-2">
                <div className="font-bold text-gray-900 text-[15px]">I'm Here</div>
                <div className="text-xs text-gray-500">Drop your pin now</div>
              </div>
            </button>
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
            className="bg-purple-600 text-white px-6 py-3 rounded-2xl shadow-xl text-center"
            style={{
              animation: 'slideDown 0.3s ease-out forwards',
            }}
          >
            <div className="font-semibold">Tap anywhere on the map</div>
            <div className="text-sm text-purple-200">to mark where you're heading</div>
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
        
        @keyframes slideUpLeft {
          from {
            opacity: 0;
            transform: translate(20px, 20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }
        
        @keyframes slideUpRight {
          from {
            opacity: 0;
            transform: translate(-20px, 20px) scale(0.9);
          }
          to {
            opacity: 1;
            transform: translate(0, 0) scale(1);
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
