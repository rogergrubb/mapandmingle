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
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [hasFetched, setHasFetched] = useState(false);

  useEffect(() => {
    if (!bounds) return;

    const fetchIncoming = async () => {
      setLoading(true);
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
        setVisitors([]);
      } finally {
        setLoading(false);
        setHasFetched(true);
      }
    };

    fetchIncoming();
  }, [bounds]);

  const totalCount = visitors.length;
  const todayCount = grouped.today.length;

  // Don't render anything until we've fetched AND have visitors
  // This prevents the loading skeleton from showing
  if (!hasFetched || totalCount === 0) {
    return null;
  }

  // Collapsed view - just a badge
  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-400 to-orange-500 text-white rounded-full shadow-lg hover:shadow-xl transition-all hover:scale-105 group"
      >
        <Plane className="w-4 h-4" />
        <span className="font-semibold">{totalCount} Coming</span>
        {todayCount > 0 && (
          <span className="bg-white/30 px-2 py-0.5 rounded-full text-xs font-bold">
            {todayCount} today
          </span>
        )}
        <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    );
  }

  // Expanded panel
  return (
    <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl overflow-hidden w-80 max-h-96">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Plane className="w-5 h-5" />
            <h3 className="font-bold">Incoming Visitors</h3>
          </div>
          <button
            onClick={() => setExpanded(false)}
            className="p-1 hover:bg-white/20 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-sm text-white/80 mt-1">
          {totalCount} {totalCount === 1 ? 'person' : 'people'} heading to your area
        </p>
      </div>

      {/* Visitor List */}
      <div className="overflow-y-auto max-h-64 p-2">
        {grouped.today.length > 0 && (
          <VisitorSection
            title="TODAY"
            visitors={grouped.today}
            urgencyColor="text-red-500 bg-red-50"
            onVisitorClick={onVisitorClick}
          />
        )}
        {grouped.tomorrow.length > 0 && (
          <VisitorSection
            title="TOMORROW"
            visitors={grouped.tomorrow}
            urgencyColor="text-orange-500 bg-orange-50"
            onVisitorClick={onVisitorClick}
          />
        )}
        {grouped.thisWeek.length > 0 && (
          <VisitorSection
            title="THIS WEEK"
            visitors={grouped.thisWeek}
            urgencyColor="text-blue-500 bg-blue-50"
            onVisitorClick={onVisitorClick}
          />
        )}
      </div>
    </div>
  );
}

interface VisitorSectionProps {
  title: string;
  visitors: Visitor[];
  urgencyColor: string;
  onVisitorClick?: (visitor: Visitor) => void;
}

function VisitorSection({ title, visitors, urgencyColor, onVisitorClick }: VisitorSectionProps) {
  return (
    <div className="mb-3">
      <div className={`text-xs font-bold px-2 py-1 rounded ${urgencyColor} mb-2`}>
        {title}
      </div>
      <div className="space-y-2">
        {visitors.map((visitor) => (
          <VisitorCard
            key={visitor.id}
            visitor={visitor}
            onClick={() => onVisitorClick?.(visitor)}
          />
        ))}
      </div>
    </div>
  );
}

interface VisitorCardProps {
  visitor: Visitor;
  onClick: () => void;
}

function VisitorCard({ visitor, onClick }: VisitorCardProps) {
  const urgencyStyles = {
    imminent: 'bg-red-500 animate-pulse',
    soon: 'bg-orange-500',
    upcoming: 'bg-amber-500',
    later: 'bg-blue-500',
  };

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-colors text-left"
    >
      {/* Avatar with countdown badge */}
      <div className="relative flex-shrink-0">
        {visitor.user.avatar ? (
          <img
            src={visitor.user.avatar}
            alt={visitor.user.name}
            className="w-12 h-12 rounded-full object-cover border-2 border-amber-200"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white font-bold text-lg border-2 border-amber-200">
            {visitor.user.name.charAt(0).toUpperCase()}
          </div>
        )}
        {/* Countdown badge */}
        <div
          className={`absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full text-white text-xs font-bold ${urgencyStyles[visitor.countdown.urgency]}`}
        >
          {visitor.countdown.label}
        </div>
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1">
          <span className="font-semibold text-gray-900 truncate">{visitor.user.name}</span>
          {visitor.user.isConnected && (
            <Sparkles className="w-3 h-3 text-amber-500" />
          )}
        </div>
        {visitor.user.location && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <MapPin className="w-3 h-3" />
            <span className="truncate">from {visitor.user.location}</span>
          </div>
        )}
        {visitor.user.interests && visitor.user.interests.length > 0 && (
          <div className="flex gap-1 mt-1 flex-wrap">
            {visitor.user.interests.slice(0, 2).map((interest, i) => (
              <span
                key={i}
                className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded-full"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight className="w-4 h-4 text-gray-400 flex-shrink-0" />
    </button>
  );
}

export default IncomingVisitors;
