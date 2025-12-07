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
      return { text: "People are around you right now!", color: 'text-green-600' };
    }
    if (inView >= 1) {
      return { text: "People have been active here recently.", color: 'text-gray-500' };
    }
    return { text: "Be the first to drop your presence.", color: 'text-purple-600' };
  };

  const message = getMessage();

  return (
    <div className="absolute top-14 left-4 right-4 z-[1000]">
      <div 
        className="bg-white/95 backdrop-blur-xl rounded-xl px-3 py-2"
        style={{
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.05)',
        }}
      >
        {/* Row: Visibility + Activity */}
        <div className="flex items-center justify-between gap-3">
          {/* Visibility Toggle */}
          <button
            onClick={onVisibilityToggle}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] ${
              isVisible 
                ? 'bg-green-500 text-white shadow-sm' 
                : 'bg-gray-200 text-gray-600'
            }`}
          >
            <span className="relative flex h-2 w-2">
              {isVisible && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-60"></span>
              )}
              <span className={`relative inline-flex rounded-full h-2 w-2 ${isVisible ? 'bg-white' : 'bg-gray-400'}`}></span>
            </span>
            <span>{isVisible ? 'Visible' : 'Hidden'}</span>
          </button>

          {/* Activity Stats */}
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                {liveNow > 0 && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${liveNow > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></span>
              </span>
              <span className="text-gray-700 font-medium">{liveNow} live</span>
            </div>
            
            <div className="flex items-center gap-1">
              <span className="relative flex h-1.5 w-1.5">
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-blue-500"></span>
              </span>
              <span className="text-gray-700 font-medium">{inView} in view</span>
            </div>
          </div>
        </div>

        {/* Contextual Message */}
        <div className={`text-center text-[11px] mt-1.5 ${message.color}`}>
          {message.text}
        </div>
      </div>
    </div>
  );
}
