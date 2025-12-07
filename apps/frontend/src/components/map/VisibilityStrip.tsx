interface VisibilityStripProps {
  isVisible: boolean;
  onVisibilityToggle: () => void;
  liveNow: number;
  inView: number;
}

export function VisibilityStrip({
  isVisible,
  onVisibilityToggle,
  liveNow,
  inView,
}: VisibilityStripProps) {
  // Determine the contextual message
  const getMessage = () => {
    if (liveNow >= 1) {
      return { text: "People are around you right now. Zoom in and say hi!", color: 'text-green-600' };
    }
    if (inView >= 1) {
      return { text: "People have been active here recently.", color: 'text-gray-600' };
    }
    return { text: "You're early — be the first to drop your presence.", color: 'text-purple-600' };
  };

  const message = getMessage();

  return (
    <div className="absolute top-16 left-4 right-4 z-[1000]">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-lg px-4 py-3">
        {/* Visibility Toggle */}
        <div className="flex justify-center mb-2">
          <button
            onClick={onVisibilityToggle}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isVisible 
                ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-md' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className="relative flex h-2.5 w-2.5">
              {isVisible && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isVisible ? 'bg-white' : 'bg-gray-400'}`}></span>
            </span>
            <span className="text-sm">{isVisible ? 'Visible' : 'Hidden'}</span>
          </button>
        </div>

        {/* Activity Stats */}
        <div className="flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              {liveNow > 0 && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${liveNow > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
            </span>
            <span className="text-gray-700 font-medium">{liveNow} live now</span>
          </div>
          
          <div className="flex items-center gap-1.5">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            <span className="text-gray-700 font-medium">{inView} in view</span>
          </div>
        </div>

        {/* Contextual Message */}
        <div className={`text-center text-xs mt-2 ${message.color}`}>
          {message.text}
        </div>
      </div>
    </div>
  );
}
