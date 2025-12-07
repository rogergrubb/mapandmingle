import { useState } from 'react';
import { 
  Flame, Coffee, Users, Calendar, Plane, X, ChevronRight,
  TrendingUp, MapPin, Sparkles
} from 'lucide-react';

interface Hotspot {
  id: string;
  name: string;
  type: 'venue' | 'area' | 'event' | 'travelers';
  latitude: number;
  longitude: number;
  activeCount: number;
  description: string;
  trending?: boolean;
}

interface HotspotOverlayProps {
  hotspots: Hotspot[];
  isVisible: boolean;
  onToggle: () => void;
  onHotspotClick: (hotspot: Hotspot) => void;
}

const typeConfig = {
  venue: { icon: Coffee, color: 'from-amber-500 to-orange-500', label: 'Venue' },
  area: { icon: MapPin, color: 'from-purple-500 to-pink-500', label: 'Area' },
  event: { icon: Calendar, color: 'from-green-500 to-emerald-500', label: 'Event' },
  travelers: { icon: Plane, color: 'from-blue-500 to-cyan-500', label: 'Travelers' },
};

export function HotspotOverlay({
  hotspots,
  isVisible,
  onToggle,
  onHotspotClick,
}: HotspotOverlayProps) {
  const [expanded, setExpanded] = useState(false);

  const topHotspots = hotspots.slice(0, 5);
  const hasMore = hotspots.length > 5;

  return (
    <>
      {/* Hotspot Toggle Button - floats on left side below controls */}
      <div className="absolute top-20 left-4 z-[900]">
        <button
          onClick={onToggle}
          className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg transition-all text-sm ${
            isVisible
              ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white'
              : 'bg-white/95 backdrop-blur-xl text-gray-700 hover:shadow-xl'
          }`}
        >
          <Flame size={16} className={isVisible ? 'animate-pulse' : ''} />
          <span className="font-semibold hidden sm:inline">Hotspots</span>
          {isVisible && hotspots.length > 0 && (
            <span className="bg-white/20 px-1.5 py-0.5 rounded-full text-xs font-bold">
              {hotspots.length}
            </span>
          )}
        </button>
      </div>

      {/* Hotspot List Panel */}
      {isVisible && hotspots.length > 0 && (
        <div className="absolute bottom-32 left-4 z-[900] w-80 max-w-[calc(100vw-2rem)]">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 overflow-hidden">
            {/* Header */}
            <div className="p-4 bg-gradient-to-r from-orange-500 to-red-500">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Flame size={20} className="text-white" />
                  <h3 className="font-bold text-white">Active Hotspots</h3>
                </div>
                <button 
                  onClick={() => setExpanded(!expanded)}
                  className="text-white/80 hover:text-white transition-colors"
                >
                  {expanded ? <X size={18} /> : <ChevronRight size={18} />}
                </button>
              </div>
              <p className="text-white/80 text-sm mt-1">
                {hotspots.reduce((sum, h) => sum + h.activeCount, 0)} people active nearby
              </p>
            </div>

            {/* Hotspot List */}
            <div className={`transition-all duration-300 ${expanded ? 'max-h-96' : 'max-h-48'} overflow-y-auto`}>
              {(expanded ? hotspots : topHotspots).map((hotspot) => {
                const cfg = typeConfig[hotspot.type];
                const Icon = cfg.icon;
                
                return (
                  <button
                    key={hotspot.id}
                    onClick={() => onHotspotClick(hotspot)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-0"
                  >
                    {/* Icon */}
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${cfg.color} flex items-center justify-center flex-shrink-0`}>
                      <Icon size={18} className="text-white" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 text-left min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 truncate">{hotspot.name}</span>
                        {hotspot.trending && (
                          <div className="flex items-center gap-1 px-1.5 py-0.5 bg-orange-100 rounded-full">
                            <TrendingUp size={10} className="text-orange-600" />
                            <span className="text-[10px] text-orange-600 font-bold">HOT</span>
                          </div>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 truncate">{hotspot.description}</p>
                    </div>

                    {/* Active count */}
                    <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-100 rounded-full flex-shrink-0">
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                      </span>
                      <span className="text-xs font-bold text-green-700">{hotspot.activeCount}</span>
                    </div>
                  </button>
                );
              })}

              {!expanded && hasMore && (
                <button
                  onClick={() => setExpanded(true)}
                  className="w-full py-3 text-center text-sm font-medium text-purple-600 hover:bg-purple-50 transition-colors"
                >
                  Show {hotspots.length - 5} more hotspots
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {isVisible && hotspots.length === 0 && (
        <div className="absolute bottom-32 left-4 z-[900] w-72">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-xl shadow-black/10 border border-white/50 p-6 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Sparkles size={24} className="text-gray-400" />
            </div>
            <h4 className="font-semibold text-gray-700 mb-1">No hotspots yet</h4>
            <p className="text-sm text-gray-500">
              Be the first to start mingling in this area!
            </p>
          </div>
        </div>
      )}
    </>
  );
}

// Mock hotspots for demo
export const mockHotspots: Hotspot[] = [
  {
    id: '1',
    name: 'Blue Bottle Coffee',
    type: 'venue',
    latitude: 37.7849,
    longitude: -122.4094,
    activeCount: 12,
    description: '12 people chatting now',
    trending: true,
  },
  {
    id: '2',
    name: 'Mission Dolores Park',
    type: 'area',
    latitude: 37.7596,
    longitude: -122.4269,
    activeCount: 28,
    description: 'Popular weekend hangout',
    trending: true,
  },
  {
    id: '3',
    name: 'Tech Networking Mixer',
    type: 'event',
    latitude: 37.7749,
    longitude: -122.4194,
    activeCount: 45,
    description: 'Happening now • Free entry',
  },
  {
    id: '4',
    name: 'Backpackers Hub',
    type: 'travelers',
    latitude: 37.7849,
    longitude: -122.4394,
    activeCount: 8,
    description: '8 travelers staying nearby',
  },
];
