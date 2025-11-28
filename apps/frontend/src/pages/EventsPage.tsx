import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, Clock } from 'lucide-react';
import api from '../lib/api';
import { Event } from '../types';

export default function EventsPage() {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'attending' | 'hosting'>('all');

  useEffect(() => {
    fetchEvents();
  }, [filter]);

  const fetchEvents = async () => {
    try {
      const data: any = await api.get('/api/events', { params: { filter } });
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Events</h1>
          <button
            onClick={() => navigate('/create-event')}
            className="bg-primary-500 text-white p-2 rounded-full hover:bg-primary-600 transition-all"
          >
            <Plus size={24} />
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {(['all', 'attending', 'hosting'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg font-medium transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Events List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600 mb-4">No events found</p>
            <button
              onClick={() => navigate('/create-event')}
              className="btn btn-primary"
            >
              Create First Event
            </button>
          </div>
        ) : (
          events.map((event) => (
            <div
              key={event.id}
              onClick={() => navigate(`/event/${event.id}`)}
              className="card hover:shadow-md transition-shadow cursor-pointer"
            >
              {event.image && (
                <img
                  src={event.image}
                  alt={event.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
              )}
              
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-900">{event.title}</h3>
                <span className="badge badge-primary">{event.category}</span>
              </div>

              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{event.description}</p>

              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center">
                  <Clock size={16} className="mr-2" />
                  {formatDate(event.startTime)}
                </div>
                <div className="flex items-center">
                  <MapPin size={16} className="mr-2" />
                  {event.address || 'Location on map'}
                </div>
                <div className="flex items-center">
                  <Users size={16} className="mr-2" />
                  {event.attendees} attending
                  {event.capacity && ` / ${event.capacity}`}
                </div>
              </div>

              {event.isAttending && (
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <span className="text-primary-500 font-medium text-sm">✓ You're attending</span>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
