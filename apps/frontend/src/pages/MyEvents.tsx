import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Plus, ArrowLeft } from 'lucide-react';
import { Button } from '../components/common/Button';
import api from '../lib/api';

interface Event {
  id: string;
  title: string;
  description: string;
  date: Date;
  time: string;
  location: string;
  category: string;
  attendeesCount: number;
  capacity: number;
  image?: string;
}

export function MyEvents() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'attending' | 'created'>('attending');
  const [attendingEvents, setAttendingEvents] = useState<Event[]>([]);
  const [createdEvents, setCreatedEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMyEvents();
  }, []);

  const fetchMyEvents = async () => {
    try {
      const [attending, created] = await Promise.all([
        api.get('/api/events/my-attending'),
        api.get('/api/events/my-created'),
      ]);
      setAttendingEvents(attending.data);
      setCreatedEvents(created.data);
    } catch (error) {
      console.error('Failed to fetch events:', error);
    } finally {
      setLoading(false);
    }
  };

  const events = activeTab === 'attending' ? attendingEvents : createdEvents;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900 mb-3">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <Link to="/events/create">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Create Event
              </Button>
            </Link>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('attending')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                activeTab === 'attending'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Attending ({attendingEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('created')}
              className={`flex-1 py-2 px-4 rounded-lg font-medium transition ${
                activeTab === 'created'
                  ? 'bg-pink-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Created ({createdEvents.length})
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="text-center py-12 text-gray-600">Loading events...</div>
        ) : events.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              {activeTab === 'attending' ? 'No Events Yet' : 'No Events Created'}
            </h2>
            <p className="text-gray-600 mb-6">
              {activeTab === 'attending'
                ? 'Start exploring and join events to see them here'
                : 'Create your first event to bring people together'}
            </p>
            <Link to={activeTab === 'attending' ? '/events' : '/events/create'}>
              <Button>
                {activeTab === 'attending' ? 'Explore Events' : 'Create Event'}
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {events.map((event) => (
              <Link key={event.id} href={`/events/${event.id}`}>
                <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition overflow-hidden">
                  <div className="flex">
                    {event.image && (
                      <div className="w-32 h-32 bg-gray-200 flex-shrink-0">
                        <img
                          src={event.image}
                          alt={event.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="flex-1 p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="inline-block px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs font-medium mb-2">
                            {event.category}
                          </span>
                          <h3 className="text-lg font-bold text-gray-900">{event.title}</h3>
                        </div>
                      </div>
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">
                        {event.description}
                      </p>
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {new Date(event.date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center">
                          <MapPin className="w-4 h-4 mr-1" />
                          {event.location}
                        </div>
                        <div className="flex items-center">
                          <Users className="w-4 h-4 mr-1" />
                          {event.attendeesCount}/{event.capacity}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
