import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, MapPin, ArrowLeft, Clock, Battery, 
  Users, Search, X, Loader
} from 'lucide-react';
import api from '../lib/api';
import { haptic } from '../lib/haptics';

interface Circle {
  id: string;
  name: string;
  emoji: string;
}

interface LocationSuggestion {
  place_name: string;
  center: [number, number];
}

export default function StartTripPage() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [selectedCircle, setSelectedCircle] = useState<string | null>(null);
  const [destination, setDestination] = useState('');
  const [destCoords, setDestCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [updateInterval, setUpdateInterval] = useState<30 | 60>(60);
  const [shareBattery, setShareBattery] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);
  
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Fetch circles
    api.get('/api/circles').then(res => {
      setCircles(res.data.circles || []);
      if (res.data.circles?.length > 0) {
        setSelectedCircle(res.data.circles[0].id);
      }
    });

    // Get current location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCurrentLocation({
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
          });
        },
        (err) => console.error('Location error:', err),
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const searchDestination = async (query: string) => {
    if (!query.trim() || query.length < 3) {
      setSuggestions([]);
      return;
    }

    setSearchLoading(true);
    
    try {
      // Using Mapbox geocoding API (you'll need to add this endpoint or use directly)
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?access_token=${import.meta.env.VITE_MAPBOX_TOKEN || ''}&limit=5`
      );
      const data = await response.json();
      setSuggestions(data.features || []);
      setShowSuggestions(true);
    } catch (err) {
      console.error('Search failed:', err);
    } finally {
      setSearchLoading(false);
    }
  };

  const handleDestinationChange = (value: string) => {
    setDestination(value);
    setDestCoords(null);
    
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }
    
    searchTimeout.current = setTimeout(() => {
      searchDestination(value);
    }, 300);
  };

  const selectSuggestion = (suggestion: LocationSuggestion) => {
    setDestination(suggestion.place_name);
    setDestCoords({
      lng: suggestion.center[0],
      lat: suggestion.center[1],
    });
    setShowSuggestions(false);
    haptic.navTap();
  };

  const startTrip = async () => {
    if (!destCoords || !currentLocation) {
      alert('Please select a destination and enable location services');
      return;
    }

    setLoading(true);
    haptic.lightTap();

    try {
      // Get battery level if sharing
      let batteryLevel: number | undefined;
      if (shareBattery) {
        try {
          const battery = await (navigator as any).getBattery?.();
          batteryLevel = Math.round(battery.level * 100);
        } catch {}
      }

      const response = await api.post('/api/trips', {
        name: `Trip to ${destination.split(',')[0]}`,
        originLat: currentLocation.lat,
        originLng: currentLocation.lng,
        destLat: destCoords.lat,
        destLng: destCoords.lng,
        destName: destination,
        circleId: selectedCircle,
        updateInterval,
        batterySharing: shareBattery,
        batteryLevel,
      });

      haptic.confirm();
      navigate('/trip');
    } catch (err: any) {
      console.error('Failed to start trip:', err);
      haptic.softTick();
      alert(err.response?.data?.error || 'Failed to start trip');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Share My Trip</h1>
            <p className="text-sm text-gray-500">Let others track your journey</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Destination Input */}
        <div className="relative">
          <label className="text-sm font-medium text-gray-700 mb-2 block">Where are you going?</label>
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={destination}
              onChange={(e) => handleDestinationChange(e.target.value)}
              placeholder="Search destination..."
              className="w-full pl-11 pr-10 py-4 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none bg-white"
            />
            {destination && (
              <button
                onClick={() => {
                  setDestination('');
                  setDestCoords(null);
                  setSuggestions([]);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X size={18} />
              </button>
            )}
            {searchLoading && (
              <Loader size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-blue-500 animate-spin" />
            )}
          </div>

          {/* Suggestions Dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-2 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => selectSuggestion(suggestion)}
                  className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 border-b border-gray-50 last:border-0"
                >
                  <MapPin size={18} className="text-gray-400 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{suggestion.place_name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected destination indicator */}
        {destCoords && (
          <div className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl">
            <MapPin size={18} className="text-green-600" />
            <span className="text-sm text-green-700 font-medium">Destination set</span>
          </div>
        )}

        {/* Circle Selection */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">Share with</label>
          {circles.length === 0 ? (
            <div className="bg-white rounded-xl p-4 text-center border border-gray-200">
              <Users size={24} className="text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-500 mb-3">No circles yet</p>
              <button
                onClick={() => navigate('/circles/create')}
                className="text-sm text-blue-600 font-medium"
              >
                Create a Circle
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {circles.map((circle) => (
                <button
                  key={circle.id}
                  onClick={() => setSelectedCircle(circle.id)}
                  className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all ${
                    selectedCircle === circle.id
                      ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-500'
                      : 'bg-white text-gray-700 border border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <span>{circle.emoji}</span>
                  <span className="font-medium">{circle.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Update Interval */}
        <div>
          <label className="text-sm font-medium text-gray-700 mb-2 block">
            <Clock size={16} className="inline mr-1" />
            Location Update Frequency
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setUpdateInterval(60)}
              className={`p-4 rounded-xl border-2 transition-all ${
                updateInterval === 60
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Every 60s</div>
              <div className="text-xs text-gray-500 mt-1">Battery friendly</div>
            </button>
            <button
              onClick={() => setUpdateInterval(30)}
              className={`p-4 rounded-xl border-2 transition-all ${
                updateInterval === 30
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 bg-white hover:border-gray-300'
              }`}
            >
              <div className="font-semibold text-gray-900">Every 30s</div>
              <div className="text-xs text-orange-500 mt-1">~50% more battery</div>
            </button>
          </div>
        </div>

        {/* Battery Sharing Toggle */}
        <div className="bg-white rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Battery size={20} className="text-gray-500" />
            <div>
              <div className="font-medium text-gray-900">Share Battery Level</div>
              <div className="text-xs text-gray-500">Others can see your battery %</div>
            </div>
          </div>
          <button
            onClick={() => setShareBattery(!shareBattery)}
            className={`w-12 h-7 rounded-full transition-colors ${
              shareBattery ? 'bg-blue-500' : 'bg-gray-300'
            }`}
          >
            <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
              shareBattery ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>
      </div>

      {/* Start Button */}
      <div className="p-4 bg-white border-t border-gray-100">
        <button
          onClick={startTrip}
          disabled={!destCoords || !selectedCircle || loading}
          className="w-full py-4 bg-blue-600 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <Loader size={20} className="animate-spin" />
          ) : (
            <>
              <Navigation size={20} />
              Start Sharing Location
            </>
          )}
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Your location will be shared until you arrive or stop manually
        </p>
      </div>
    </div>
  );
}
