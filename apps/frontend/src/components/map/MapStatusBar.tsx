import { Users, Flame } from 'lucide-react';

interface MapStatusBarProps {
  peopleCount: number;
  timeFilter: '24h' | 'week';
  showHotspots: boolean;
  onTimeFilterChange: (filter: '24h' | 'week') => void;
  onToggleHotspots: () => void;
}

export function MapStatusBar({
  peopleCount,
  timeFilter,
  showHotspots,
  onTimeFilterChange,
  onToggleHotspots,
}: MapStatusBarProps) {
  return (
    <div className="absolute top-4 left-4 right-4 z-[1000]">
      {/* Consolidated Status Bar */}
      <div className="bg-white rounded-xl shadow-lg px-4 py-3 flex items-center justify-between">
        {/* Left: People Count */}
        <div className="flex items-center gap-2">
          <div className="bg-primary-100 rounded-full p-1.5">
            <Users size={16} className="text-primary-600" />
          </div>
          <span className="text-sm font-medium text-gray-700">
            {peopleCount} nearby
          </span>
        </div>

        {/* Center: Time Filters */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onTimeFilterChange('24h')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === '24h'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            24h
          </button>
          <button
            onClick={() => onTimeFilterChange('week')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'week'
                ? 'bg-primary-500 text-white shadow-sm'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Week
          </button>
        </div>

        {/* Right: Hotspot Toggle */}
        <button
          onClick={onToggleHotspots}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
            showHotspots
              ? 'bg-red-500 text-white shadow-sm'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <Flame size={14} />
          <span className="hidden sm:inline">Hotspots</span>
        </button>
      </div>
    </div>
  );
}
