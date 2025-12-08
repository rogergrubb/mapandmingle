import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Calendar, MapPin, Users, Plus, Search, 
  ChevronRight, Bookmark, BookmarkCheck, Share2,
  SlidersHorizontal, CalendarDays, Sparkles, TrendingUp,
  MapPinned, Ticket, Crown, Check, Heart, Star, Clock
} from 'lucide-react';
import api from '../lib/api';
import { useAuthStore } from '../stores/authStore';
import { formatCountdown, getCountdownColor } from '../utils/countdown';

interface Event {
  id: string;
  title: string;
  description: string;
  startTime: string;
  endTime?: string;
  address: string;
  latitude: number;
  longitude: number;
  category: string;
  subcategory?: string;
  attendees: number;
  capacity: number;
  price?: number;
  isPremium?: boolean;
  isAttending?: boolean;
  isSaved?: boolean;
  isHosting?: boolean;
  image?: string;
  host: {
    id: string;
    name: string;
    avatar?: string;
    verified?: boolean;
  };
  tags?: string[];
  distance?: number;
}

const CATEGORIES = [
  { id: 'all', label: 'All', icon: Sparkles },
  { id: 'social', label: 'Social', icon: Users },
  { id: 'sports', label: 'Sports', icon: TrendingUp },
  { id: 'food', label: 'Food & Drink', icon: Star },
  { id: 'music', label: 'Music', icon: Heart },
  { id: 'outdoors', label: 'Outdoors', icon: MapPinned },
  { id: 'networking', label: 'Networking', icon: Ticket },
  { id: 'arts', label: 'Arts & Culture', icon: Sparkles },
];

const SORT_OPTIONS = [
  { id: 'recommended', label: 'Recommended' },
  { id: 'date', label: 'Date (Soonest)' },
  { id: 'distance', label: 'Distance (Nearest)' },
  { id: 'popular', label: 'Most Popular' },
  { id: 'price-low', label: 'Price (Low to High)' },
  { id: 'price-high', label: 'Price (High to Low)' },
];

export default function EventsPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [activeTab, setActiveTab] = useState<'discover' | 'attending' | 'hosting' | 'saved'>('discover');
  const [sortBy, setSortBy] = useState('recommended');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    dateRange: 'anytime',
    priceRange: 'all',
    distance: 50,
    hasSpots: false,
  });

  useEffect(() => {
    fetchEvents();
  }, [activeTab, selectedCategory, sortBy, filters]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const params: any = {
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        sort: sortBy,
        ...filters,
      };

      let endpoint = '/api/events';
      if (activeTab === 'attending') endpoint = '/api/events/attending';
      else if (activeTab === 'hosting') endpoint = '/api/events/hosting';
      else if (activeTab === 'saved') endpoint = '/api/events/saved';

      const data: any = await api.get(endpoint, { params });
      setEvents(Array.isArray(data) ? data : data.events || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      setEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveEvent = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/api/events/${eventId}/save`);
      setEvents(prev => prev.map(ev => 
        ev.id === eventId ? { ...ev, isSaved: !ev.isSaved } : ev
      ));
    } catch (error) {
      console.error('Failed to save event:', error);
    }
  };

  const handleShareEvent = async (e: React.MouseEvent, event: Event) => {
    e.stopPropagation();
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.title,
          text: event.description,
          url: `${window.location.origin}/events/${event.id}`,
        });
      } catch (error) {
        console.error('Share failed:', error);
      }
    }
  };

  const handleQuickRSVP = async (e: React.MouseEvent, eventId: string) => {
    e.stopPropagation();
    try {
      await api.post(`/api/events/${eventId}/rsvp`, { status: 'going' });
      setEvents(prev => prev.map(ev => 
        ev.id === eventId ? { ...ev, isAttending: true, attendees: ev.attendees + 1 } : ev
      ));
    } catch (error) {
      console.error('Failed to RSVP:', error);
    }
  };

  const filteredEvents = useMemo(() => {
    if (!searchQuery) return events;
    const query = searchQuery.toLowerCase();
    return events.filter(e => 
      e.title.toLowerCase().includes(query) ||
      e.description?.toLowerCase().includes(query) ||
      e.address?.toLowerCase().includes(query) ||
      e.category?.toLowerCase().includes(query)
    );
  }, [events, searchQuery]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === now.toDateString()) {
      return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    } else if (date.toDateString() === tomorrow.toDateString()) {
      return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
    }
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  };

  const getEventStatus = (event: Event) => {
    const spotsLeft = event.capacity - event.attendees;
    if (spotsLeft === 0) return { text: 'Sold Out', color: 'text-red-500 bg-red-50' };
    if (spotsLeft <= 5) return { text: `${spotsLeft} spots left`, color: 'text-orange-500 bg-orange-50' };
    if (event.isAttending) return { text: 'Going', color: 'text-green-500 bg-green-50' };
    return null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-4 py-4">
          {/* Title & Create */}
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-pink-600 to-purple-600 bg-clip-text text-transparent">
              Events
            </h1>
            <button
              onClick={() => navigate('/events/create')}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 
                         text-white rounded-full font-medium shadow-lg shadow-purple-500/25
                         hover:shadow-xl hover:scale-105 transition-all duration-300 active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Create Event</span>
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search events, locations, categories..."
              className="w-full pl-12 pr-12 py-3 bg-gray-100/80 border border-gray-200/50 rounded-2xl
                         focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white
                         transition-all duration-300 text-gray-900 placeholder-gray-500"
            />
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`absolute right-3 top-1/2 -translate-y-1/2 p-2 rounded-xl transition-all duration-300
                         ${showFilters ? 'bg-purple-100 text-purple-600' : 'hover:bg-gray-200 text-gray-500'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-hide pb-1">
            {[
              { id: 'discover', label: 'Discover', icon: Sparkles },
              { id: 'attending', label: 'Attending', icon: Check },
              { id: 'hosting', label: 'Hosting', icon: Crown },
              { id: 'saved', label: 'Saved', icon: Bookmark },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium whitespace-nowrap
                           transition-all duration-300 active:scale-95
                           ${activeTab === tab.id
                             ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                             : 'bg-white text-gray-600 hover:bg-gray-100'
                           }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Category Pills */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-medium text-sm
                           whitespace-nowrap transition-all duration-300 active:scale-95
                           ${selectedCategory === cat.id
                             ? 'bg-gray-900 text-white'
                             : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                           }`}
              >
                <cat.icon className="w-4 h-4" />
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-t border-gray-200/50 bg-white/90 backdrop-blur-xl">
            <div className="max-w-6xl mx-auto px-4 py-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">When</label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => setFilters(f => ({ ...f, dateRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="anytime">Anytime</option>
                    <option value="today">Today</option>
                    <option value="tomorrow">Tomorrow</option>
                    <option value="this-week">This Week</option>
                    <option value="this-weekend">This Weekend</option>
                    <option value="this-month">This Month</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Price</label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(f => ({ ...f, priceRange: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    <option value="all">All Prices</option>
                    <option value="free">Free Only</option>
                    <option value="paid">Paid Only</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Distance: {filters.distance}km</label>
                  <input
                    type="range"
                    min="1"
                    max="100"
                    value={filters.distance}
                    onChange={(e) => setFilters(f => ({ ...f, distance: parseInt(e.target.value) }))}
                    className="w-full accent-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-2">Sort By</label>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-100 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
                <span className="text-sm text-gray-600">Only show events with available spots</span>
                <button
                  onClick={() => setFilters(f => ({ ...f, hasSpots: !f.hasSpots }))}
                  className={`relative w-12 h-7 rounded-full transition-all duration-300
                             ${filters.hasSpots ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                >
                  <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300
                                  ${filters.hasSpots ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Events Content */}
      <div className="max-w-6xl mx-auto px-4 py-6 pb-24">
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl overflow-hidden shadow-sm animate-pulse">
                <div className="h-48 bg-gray-200" />
                <div className="p-5">
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                  <div className="h-6 bg-gray-200 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-gray-200 rounded w-full mb-4" />
                  <div className="h-4 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-gradient-to-br from-pink-100 to-purple-100 rounded-full 
                            flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-purple-500" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'discover' ? 'No Events Found' : 
               activeTab === 'attending' ? 'No Events Yet' :
               activeTab === 'hosting' ? 'No Events Created' : 'No Saved Events'}
            </h2>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              {activeTab === 'discover' ? 'Try adjusting your filters or search to find events near you.' :
               activeTab === 'attending' ? 'Start exploring and RSVP to events to see them here.' :
               activeTab === 'hosting' ? 'Create your first event to bring people together!' :
               'Save events you\'re interested in to find them here later.'}
            </p>
            <button
              onClick={() => activeTab === 'hosting' ? navigate('/events/create') : setActiveTab('discover')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white 
                         rounded-full font-medium shadow-lg shadow-purple-500/25
                         hover:shadow-xl hover:scale-105 transition-all duration-300"
            >
              {activeTab === 'hosting' ? 'Create Event' : 'Explore Events'}
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-600">
                {filteredEvents.length} event{filteredEvents.length !== 1 ? 's' : ''} found
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((event) => {
                const status = getEventStatus(event);
                return (
                  <div
                    key={event.id}
                    onClick={() => navigate(`/events/${event.id}`)}
                    className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl 
                               transition-all duration-500 cursor-pointer transform hover:-translate-y-1"
                  >
                    <div className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100">
                      {event.image ? (
                        <img 
                          src={event.image} 
                          alt={event.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Calendar className="w-16 h-16 text-purple-300" />
                        </div>
                      )}

                      <div className="absolute top-3 right-3 flex gap-2">
                        <button
                          onClick={(e) => handleSaveEvent(e, event.id)}
                          className={`p-2 rounded-full backdrop-blur-sm transition-all duration-300
                                     ${event.isSaved 
                                       ? 'bg-pink-500 text-white' 
                                       : 'bg-white/80 text-gray-700 hover:bg-white'}`}
                        >
                          {event.isSaved ? <BookmarkCheck className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                        </button>
                        <button
                          onClick={(e) => handleShareEvent(e, event)}
                          className="p-2 bg-white/80 backdrop-blur-sm rounded-full text-gray-700 
                                     hover:bg-white transition-all duration-300"
                        >
                          <Share2 className="w-5 h-5" />
                        </button>
                      </div>

                      {status && (
                        <div className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-medium ${status.color}`}>
                          {status.text}
                        </div>
                      )}

                      {event.isPremium && (
                        <div className="absolute bottom-3 left-3 flex items-center gap-1 px-2 py-1 
                                        bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full">
                          <Crown className="w-3 h-3 text-white" />
                          <span className="text-xs font-medium text-white">Premium</span>
                        </div>
                      )}

                      {/* Countdown Timer Badge */}
                      <div 
                        className="absolute bottom-3 left-3 flex items-center gap-1 px-3 py-1.5 rounded-full backdrop-blur-md shadow-lg"
                        style={{ 
                          backgroundColor: getCountdownColor(event.startTime) + '20',
                          borderLeft: `3px solid ${getCountdownColor(event.startTime)}`
                        }}
                      >
                        <Clock className="w-3.5 h-3.5" style={{ color: getCountdownColor(event.startTime) }} />
                        <span 
                          className="text-xs font-bold"
                          style={{ color: getCountdownColor(event.startTime) }}
                        >
                          {formatCountdown(event.startTime)}
                        </span>
                      </div>

                      <div className="absolute bottom-3 right-3 px-3 py-1 bg-white/90 backdrop-blur-sm 
                                      rounded-full text-sm font-semibold text-gray-900">
                        {event.price ? `$${event.price}` : 'Free'}
                      </div>
                    </div>

                    <div className="p-5">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                          {event.category}
                        </span>
                        {event.distance && (
                          <span className="text-xs text-gray-500">
                            {event.distance < 1 ? `${(event.distance * 1000).toFixed(0)}m` : `${event.distance.toFixed(1)}km`} away
                          </span>
                        )}
                      </div>

                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-purple-600 transition-colors">
                        {event.title}
                      </h3>

                      <div className="flex items-center text-sm text-gray-600 mb-2">
                        <CalendarDays className="w-4 h-4 mr-2 text-pink-500" />
                        {formatDate(event.startTime)}
                      </div>

                      <div className="flex items-center text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4 mr-2 text-pink-500 flex-shrink-0" />
                        <span className="line-clamp-1">{event.address || 'Location TBA'}</span>
                      </div>

                      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 
                                          flex items-center justify-center overflow-hidden">
                            {event.host?.avatar ? (
                              <img src={event.host.avatar} alt={event.host.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-white text-sm font-medium">
                                {event.host?.name?.[0]?.toUpperCase() || 'H'}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm text-gray-600 line-clamp-1">{event.host?.name || 'Host'}</span>
                            {event.host?.verified && (
                              <Check className="w-4 h-4 text-blue-500" />
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1 text-sm text-gray-600">
                          <Users className="w-4 h-4" />
                          <span>{event.attendees}/{event.capacity}</span>
                        </div>
                      </div>

                      {!event.isAttending && !event.isHosting && event.attendees < event.capacity && (
                        <button
                          onClick={(e) => handleQuickRSVP(e, event.id)}
                          className="w-full mt-4 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 
                                     text-white rounded-xl font-medium opacity-0 group-hover:opacity-100
                                     transition-all duration-300 hover:shadow-lg active:scale-95"
                        >
                          RSVP Now
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* Floating Create Button (Mobile) */}
      <button
        onClick={() => navigate('/events/create')}
        className="fixed bottom-24 right-4 md:hidden w-14 h-14 bg-gradient-to-r from-pink-500 to-purple-600 
                   text-white rounded-full shadow-lg shadow-purple-500/30 flex items-center justify-center
                   hover:shadow-xl hover:scale-110 transition-all duration-300 active:scale-95 z-30"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
