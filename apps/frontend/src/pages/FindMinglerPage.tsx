import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Search, MapPin, MessageCircle, Filter, Map as MapIcon, Users, Calendar, Lock, Globe } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MingleResult {
  id: string;
  title: string;
  description: string;
  latitude: number;
  longitude: number;
  locationName: string;
  tags: string[];
  privacy: string;
  startTime: string;
  maxParticipants: string;
  participantCount: number;
  distance: number;
  photoUrl?: string;
  host: {
    id: string;
    name: string;
    image?: string;
    username?: string;
    displayName?: string;
    bio?: string;
    avatar?: string;
  };
}

const ALL_TAGS = [
  'coffee', 'gaming', 'sports', 'music', 'art', 'hiking', 'movies',
  'cooking', 'reading', 'yoga', 'fitness', 'tech', 'business', 'travel',
];

export default function FindMinglerPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [radiusKm, setRadiusKm] = useState('50');
  const [sortBy, setSortBy] = useState<'distance' | 'recent' | 'popular'>('distance');
  const [showMap, setShowMap] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [results, setResults] = useState<MingleResult[]>([]);
  const [selectedMingle, setSelectedMingle] = useState<MingleResult | null>(null);

  const searchMingles = async () => {
    try {
      setIsLoading(true);

      const params = new URLSearchParams({
        latitude: user?.location?.latitude?.toString() || '37.7749',
        longitude: user?.location?.longitude?.toString() || '-122.4194',
        radius: radiusKm,
        sort: sortBy,
      });

      if (selectedTags.length > 0) {
        params.append('tags', selectedTags.join(','));
      }

      const response = await api.get(`/api/mingles/search?${params.toString()}`);
      setResults(response || []);
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    searchMingles();
  }, []);

  if (showMap && results.length > 0) {
    return (
      <div className="relative w-full h-screen">
        <MapContainer
          center={[37.7749, -122.4194]}
          zoom={12}
          className="w-full h-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          {results.map((mingle) => (
            <Marker
              key={mingle.id}
              position={[mingle.latitude, mingle.longitude]}
              eventHandlers={{
                click: () => setSelectedMingle(mingle),
              }}
            >
              <Popup>
                <div className="w-64">
                  <h3 className="font-bold mb-1">{mingle.title}</h3>
                  <p className="text-sm text-gray-600 mb-2">
                    by {mingle.host.displayName || mingle.host.name}
                  </p>
                  <button
                    onClick={() => {
                      navigate(`/chat/${mingle.host.id}`);
                    }}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white px-2 py-1 rounded text-sm"
                  >
                    Message
                  </button>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>

        <button
          onClick={() => setShowMap(false)}
          className="absolute top-4 left-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 z-50"
        >
          <span className="text-2xl">✕</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 p-2 hover:bg-purple-600 rounded transition"
          >
            ←
          </button>
          <h1 className="text-4xl font-bold mb-2">Find a Mingler</h1>
          <p className="text-purple-100">Discover people ready to mingle near you</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Search & Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          {/* Search Bar */}
          <div className="flex gap-2 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search by interest..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg flex items-center gap-2"
            >
              <Filter size={20} />
              Filters
            </button>
            <button
              onClick={searchMingles}
              disabled={isLoading}
              className="px-6 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold disabled:opacity-50"
            >
              {isLoading ? 'Searching...' : 'Search'}
            </button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="border-t pt-4 space-y-4">
              {/* Tags */}
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Filter by Interest
                </label>
                <div className="flex flex-wrap gap-2">
                  {ALL_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => {
                        setSelectedTags(
                          selectedTags.includes(tag)
                            ? selectedTags.filter((t) => t !== tag)
                            : [...selectedTags, tag]
                        );
                      }}
                      className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                        selectedTags.includes(tag)
                          ? 'bg-purple-500 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Distance & Sort */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Distance (km)
                  </label>
                  <input
                    type="number"
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    max={200}
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">
                    Sort By
                  </label>
                  <select
                    value={sortBy}
                    onChange={(e) =>
                      setSortBy(e.target.value as 'distance' | 'recent' | 'popular')
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="distance">Distance</option>
                    <option value="recent">Recent</option>
                    <option value="popular">Popular</option>
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Map Toggle */}
        {results.length > 0 && (
          <button
            onClick={() => setShowMap(true)}
            className="w-full mb-6 px-4 py-3 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold flex items-center justify-center gap-2"
          >
            <MapIcon size={20} />
            View {results.length} Mingles on Map
          </button>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-20">
            <div className="animate-spin mb-4">🔄</div>
            <p className="text-gray-500">Searching minglers...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-20">
            <Search className="mx-auto mb-4 text-gray-300" size={48} />
            <p className="text-gray-500">
              No minglers found. Try adjusting your filters!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {results.map((mingle) => (
              <div
                key={mingle.id}
                className="bg-white rounded-xl shadow hover:shadow-lg transition overflow-hidden"
              >
                {mingle.photoUrl && (
                  <img
                    src={mingle.photoUrl}
                    alt={mingle.title}
                    className="w-full h-48 object-cover"
                  />
                )}

                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-bold text-lg text-gray-800">
                        {mingle.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        by {mingle.host.displayName || mingle.host.name}
                      </p>
                    </div>
                    <div className="bg-blue-100 rounded-full px-2 py-1 text-xs font-bold text-blue-700">
                      {mingle.distance.toFixed(1)} km
                    </div>
                  </div>

                  <p className="text-gray-700 text-sm mb-3 line-clamp-2">
                    {mingle.description}
                  </p>

                  <div className="flex flex-wrap gap-1 mb-3">
                    {mingle.tags.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="bg-purple-100 text-purple-700 px-2 py-1 rounded-full text-xs"
                      >
                        #{tag}
                      </span>
                    ))}
                    {mingle.tags.length > 3 && (
                      <span className="text-gray-500 text-xs self-center">
                        +{mingle.tags.length - 3}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t">
                    <div className="flex items-center gap-2">
                      <Users size={16} />
                      <span>{mingle.participantCount} joined</span>
                    </div>
                    <button
                      onClick={() =>
                        navigate(`/chat/${mingle.host.id}`, {
                          state: { hostName: mingle.host.displayName || mingle.host.name },
                        })
                      }
                      className="px-3 py-1 bg-purple-500 hover:bg-purple-600 text-white rounded text-xs font-bold"
                    >
                      Message
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
