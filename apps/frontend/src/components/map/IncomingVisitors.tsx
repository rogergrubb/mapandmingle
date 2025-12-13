import { useState, useEffect } from 'react';
import { Plane, Clock, MapPin, Users, ChevronRight, X, Sparkles } from 'lucide-react';
import api from '../../lib/api';

interface Visitor {
  id: string;
  userId: string;
  latitude: number;
  longitude: number;
  description: string;
  arrivalTime: string;
  countdown: {
    days: number;
    hours: number;
    totalHours: number;
    urgency: 'imminent' | 'soon' | 'upcoming' | 'later';
    label: string;
  };
  user: {
    id: string;
    name: string;
    avatar: string | null;
    bio: string | null;
    interests: string[];
    lookingFor: string[];
    location: string | null;
    isConnected: boolean;
  };
}

interface IncomingVisitorsProps {
  bounds: {
    north: number;
    south: number;
    east: number;
    west: number;
  } | null;
  onVisitorClick?: (visitor: Visitor) => void;
  onClose?: () => void;
}

export function IncomingVisitors({ bounds, onVisitorClick, onClose }: IncomingVisitorsProps) {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [grouped, setGrouped] = useState<{
    today: Visitor[];
    tomorrow: Visitor[];
    thisWeek: Visitor[];
  }>({ today: [], tomorrow: [], thisWeek: [] });
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    if (!bounds) return;

    const fetchIncoming = async () => {
      try {
        const res = await api.get('/api/pins/incoming', {
          params: {
            north: bounds.north,
            south: bounds.south,
            east: bounds.east,
            west: bounds.west,
            days: 7,
          },
        });
        setVisitors(res.visitors || []);
        setGrouped(res.grouped || { today: [], tomorrow: [], thisWeek: [] });
      } catch (err) {
        console.error('Failed to fetch incoming visitors:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchIncoming();
  }, [bounds]);

  const totalCount = visitors.length;
  const todayCount = grouped.today.length;

  if (loading) {
    return (
      <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-200 rounded w-32 mb-2"></div>
        <div className="h-4 bg-gray-100 rounded w-24"></div>
      </div>
    );
  }

  if (totalCount === 0) {
    return null; // Don't show if no incoming visitors
  }

  // Collapsed view - just a badge
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        <div className="relative">
          <Plane size={18} className="transform -rotate-45" />
          {todayCount > 0 && (
            <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
          )}
        </div>
        <span className="font-semibold">{totalCount} Coming</span>
        {todayCount > 0 && (
          <span className="text-xs bg-white/20 px-1.5 py-0.5 rounded-full">
            {todayCount} today!
          </span>
        )}
        <ChevronRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
      </button>
    );
  }

  // Expanded view
  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden max-w-sm w-full animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white">
            <Plane size={20} className="transform -rotate-45" />
            <h3 className="font-bold text-lg">Visitors Incoming!</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X size={18} className="text-white" />
          </button>
        </div>
        <p className="text-white/80 text-sm mt-1">
          {totalCount} {totalCount === 1 ? 'person' : 'people'} heading to your area
        </p>
      </div>

      {/* Content */}
      <div className="max-h-80 overflow-y-auto">
        {/* Today Section */}
        {grouped.today.length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-bold rounded-full animate-pulse">
                🔥 TODAY
              </span>
              <span className="text-xs text-gray-500">{grouped.today.length} arriving</span>
            </div>
            {grouped.today.map(visitor => (
              <VisitorCard key={visitor.id} visitor={visitor} onClick={onVisitorClick} />
            ))}
          </div>
        )}

        {/* Tomorrow Section */}
        {grouped.tomorrow.length > 0 && (
          <div className="p-3 border-b border-gray-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-orange-100 text-orange-700 text-xs font-bold rounded-full">
                ⏰ TOMORROW
              </span>
              <span className="text-xs text-gray-500">{grouped.tomorrow.length} arriving</span>
            </div>
            {grouped.tomorrow.map(visitor => (
              <VisitorCard key={visitor.id} visitor={visitor} onClick={onVisitorClick} />
            ))}
          </div>
        )}

        {/* This Week Section */}
        {grouped.thisWeek.length > 0 && (
          <div className="p-3">
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-bold rounded-full">
                📅 THIS WEEK
              </span>
              <span className="text-xs text-gray-500">{grouped.thisWeek.length} arriving</span>
            </div>
            {grouped.thisWeek.map(visitor => (
              <VisitorCard key={visitor.id} visitor={visitor} onClick={onVisitorClick} />
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 bg-gray-50 border-t">
        <p className="text-xs text-gray-500 text-center">
          💡 Connect with travelers before they arrive!
        </p>
      </div>
    </div>
  );
}

function VisitorCard({ visitor, onClick }: { visitor: Visitor; onClick?: (v: Visitor) => void }) {
  const urgencyStyles = {
    imminent: 'bg-red-500 animate-pulse',
    soon: 'bg-orange-500',
    upcoming: 'bg-amber-500',
    later: 'bg-blue-500',
  };

  return (
    <button
      onClick={() => onClick?.(visitor)}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left group"
    >
      {/* Avatar with countdown badge */}
      <div className="relative flex-shrink-0">
        {visitor.user.avatar ? (
          <img
            src={visitor.user.avatar}
            alt={visitor.user.name}
            className="w-12 h-12 rounded-full object-cover ring-2 ring-amber-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg">
            {visitor.user.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Countdown badge */}
        <div className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white ${urgencyStyles[visitor.countdown.urgency]}`}>
          {visitor.countdown.label}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="font-semibold text-gray-900 truncate">{visitor.user.name}</span>
          {visitor.user.isConnected && (
            <span className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded-full">
              Connected
            </span>
          )}
        </div>
        {visitor.user.location && (
          <p className="text-xs text-gray-500 flex items-center gap-1">
            <MapPin size={10} />
            From {visitor.user.location}
          </p>
        )}
        {visitor.user.interests.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {visitor.user.interests.slice(0, 2).map((interest, i) => (
              <span key={i} className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                {interest}
              </span>
            ))}
            {visitor.user.interests.length > 2 && (
              <span className="text-[10px] text-gray-400">+{visitor.user.interests.length - 2}</span>
            )}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-gray-300 group-hover:text-amber-500 transition-colors flex-shrink-0" />
    </button>
  );
}

export default IncomingVisitors;
