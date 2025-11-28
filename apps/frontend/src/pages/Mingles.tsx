import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapPin, Users, Clock, Plus, Map as MapIcon, List, Zap } from 'lucide-react';
import { Button } from '../components/common/Button';
import { MapView } from '../components/Map';
import api from '../lib/api';

interface Mingle {
  id: string;
  title: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  category: string;
  participantsCount: number;
  maxParticipants: number;
  startsAt: Date;
  endsAt: Date;
  isActive: boolean;
  distance?: number;
  creator: {
    id: string;
    name: string;
    avatar: string;
  };
}

export function Mingles() {
  const [mingles, setMingles] = useState<Mingle[]>([]);
  const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
  const [loading, setLoading] = useState(true);
  const [map, setMap] = useState<any>(null);
  const [markers, setMarkers] = useState<any[]>([]);

  useEffect(() => {
    fetchMingles();
  }, []);

  useEffect(() => {
    if (viewMode === 'map' && map && mingles.length > 0) {
      // Clear existing markers
      markers.forEach((marker) => marker.setMap(null));

      // Add new markers
      const newMarkers = mingles.map((mingle) => {
        const marker = new (window as any).google.maps.Marker({
          position: { lat: mingle.latitude, lng: mingle.longitude },
          map,
          title: mingle.title,
          icon: {
            url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="40" viewBox="0 0 32 40">
                <path fill="#EC4899" d="M16 0C7.163 0 0 7.163 0 16c0 12 16 24 16 24s16-12 16-24c0-8.837-7.163-16-16-16z"/>
                <circle cx="16" cy="16" r="6" fill="white"/>
              </svg>
            `),
            scaledSize: new (window as any).google.maps.Size(32, 40),
          },
        });

        marker.addListener('click', () => {
          window.location.href = `/mingles/${mingle.id}`;
        });

        return marker;
      });

      setMarkers(newMarkers);

      // Fit bounds to show all markers
      const bounds = new (window as any).google.maps.LatLngBounds();
      mingles.forEach((mingle) => {
        bounds.extend({ lat: mingle.latitude, lng: mingle.longitude });
      });
      map.fitBounds(bounds);
    }
  }, [viewMode, map, mingles]);

  const fetchMingles = async () => {
    try {
      const response = await api.get('/api/mingles');
      setMingles(response.data);
    } catch (error) {
      console.error('Failed to fetch mingles:', error);
    } finally {
      setLoading(false);
    }
  };

  const activeMingles = mingles.filter((m) => m.isActive);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b px-4 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <Zap className="w-6 h-6 text-pink-600 mr-2" />
              Mingles
            </h1>
            <p className="text-sm text-gray-600">Spontaneous meetups happening now</p>
          </div>
          <Link href="/mingles/create">
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create
            </Button>
          </Link>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              viewMode === 'list'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <List className="w-4 h-4" />
            List
          </button>
          <button
            onClick={() => setViewMode('map')}
            className={`flex-1 py-2 px-4 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
              viewMode === 'map'
                ? 'bg-pink-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <MapIcon className="w-4 h-4" />
            Map
          </button>
        </div>
      </div>

      {/* Content */}
      {viewMode === 'list' ? (
        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="text-center py-12 text-gray-600">Loading mingles...</div>
          ) : activeMingles.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Active Mingles</h2>
              <p className="text-gray-600 mb-6">
                Be the first to create a spontaneous meetup!
              </p>
              <Link href="/mingles/create">
                <Button>Create Mingle</Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4 max-w-4xl mx-auto">
              {activeMingles.map((mingle) => (
                <Link key={mingle.id} href={`/mingles/${mingle.id}`}>
                  <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="inline-block px-2 py-1 bg-pink-100 text-pink-600 rounded text-xs font-medium">
                            {mingle.category}
                          </span>
                          <span className="inline-flex items-center px-2 py-1 bg-green-100 text-green-600 rounded text-xs font-medium">
                            <Zap className="w-3 h-3 mr-1" />
                            Active
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-1">{mingle.title}</h3>
                        <p className="text-gray-600 text-sm mb-3">{mingle.description}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 mr-1" />
                        {mingle.location}
                        {mingle.distance && <span className="ml-1">({mingle.distance.toFixed(1)}km)</span>}
                      </div>
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-1" />
                        {mingle.participantsCount}/{mingle.maxParticipants}
                      </div>
                      <div className="flex items-center">
                        <Clock className="w-4 h-4 mr-1" />
                        {new Date(mingle.endsAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <img
                        src={mingle.creator.avatar || '/default-avatar.png'}
                        alt={mingle.creator.name}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-gray-600">
                        Created by {mingle.creator.name}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1">
          <MapView
            onMapReady={(mapInstance) => {
              setMap(mapInstance);
            }}
          />
        </div>
      )}
    </div>
  );
}
