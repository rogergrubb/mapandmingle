import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Navigation, MapPin, ArrowLeft, Clock, Battery, 
  Pause, Play, X, Check, Loader, Settings, Users
} from 'lucide-react';
import api from '../lib/api';
import { haptic } from '../lib/haptics';

interface Trip {
  id: string;
  name: string;
  origin: {
    lat: number;
    lng: number;
    name: string | null;
  };
  destination: {
    lat: number;
    lng: number;
    name: string | null;
  };
  status: string;
  startedAt: string;
  expectedArrival: string | null;
  currentLocation: {
    lat: number;
    lng: number;
    updatedAt: string | null;
  } | null;
  batteryLevel: number | null;
  batterySharing: boolean;
  updateInterval: number;
  circle: {
    id: string;
    name: string;
    emoji: string;
  } | null;
}

export default function TripPage() {
  const navigate = useNavigate();
  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [ending, setEnding] = useState(false);
  const locationWatchId = useRef<number | null>(null);

  const fetchTrip = useCallback(async () => {
    try {
      const res = await api.get('/api/trips/active');
      setTrip(res.data.trip);
      
      // If no active trip, redirect to start page
      if (!res.data.trip) {
        navigate('/trip/start');
      }
    } catch (err) {
      console.error('Failed to fetch trip:', err);
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  const updateLocation = useCallback(async (lat: number, lng: number) => {
    if (!trip || updating) return;
    
    setUpdating(true);
    
    try {
      // Get battery level
      let batteryLevel: number | undefined;
      if (trip.batterySharing) {
        try {
          const battery = await (navigator as any).getBattery?.();
          batteryLevel = Math.round(battery.level * 100);
        } catch {}
      }

      const res = await api.put(`/api/trips/${trip.id}/location`, {
        latitude: lat,
        longitude: lng,
        batteryLevel,
      });

      // If arrived, show message and navigate back
      if (res.data.arrived) {
        haptic.confirm();
        alert('You have arrived at your destination!');
        navigate('/safety');
      }
    } catch (err) {
      console.error('Failed to update location:', err);
    } finally {
      setUpdating(false);
    }
  }, [trip, updating, navigate]);

  // Start location tracking
  useEffect(() => {
    fetchTrip();
  }, [fetchTrip]);

  useEffect(() => {
    if (!trip || trip.status !== 'active') return;

    // Watch position and update periodically
    if (navigator.geolocation) {
      locationWatchId.current = navigator.geolocation.watchPosition(
        (position) => {
          updateLocation(position.coords.latitude, position.coords.longitude);
        },
        (error) => {
          console.error('Location watch error:', error);
        },
        {
          enableHighAccuracy: true,
          timeout: 30000,
          maximumAge: trip.updateInterval * 1000,
        }
      );
    }

    return () => {
      if (locationWatchId.current !== null) {
        navigator.geolocation.clearWatch(locationWatchId.current);
      }
    };
  }, [trip?.id, trip?.status, trip?.updateInterval, updateLocation]);

  const pauseTrip = async () => {
    if (!trip) return;
    
    haptic.lightTap();
    
    try {
      await api.put(`/api/trips/${trip.id}/pause`);
      fetchTrip();
    } catch (err) {
      console.error('Failed to pause trip:', err);
    }
  };

  const resumeTrip = async () => {
    if (!trip) return;
    
    haptic.lightTap();
    
    try {
      await api.put(`/api/trips/${trip.id}/resume`);
      fetchTrip();
    } catch (err) {
      console.error('Failed to resume trip:', err);
    }
  };

  const endTrip = async () => {
    if (!trip) return;
    if (!confirm('Stop sharing your location?')) return;
    
    setEnding(true);
    haptic.lightTap();
    
    try {
      await api.delete(`/api/trips/${trip.id}`);
      haptic.confirm();
      navigate('/safety');
    } catch (err) {
      console.error('Failed to end trip:', err);
      haptic.softTick();
    } finally {
      setEnding(false);
    }
  };

  const markArrived = async () => {
    if (!trip) return;
    
    haptic.confirm();
    
    try {
      // Get current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 10000,
        });
      });

      await api.put(`/api/trips/${trip.id}/location`, {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });

      navigate('/safety');
    } catch (err) {
      console.error('Failed to mark arrived:', err);
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 60) return `${diffMins} min`;
    const hours = Math.floor(diffMins / 60);
    const mins = diffMins % 60;
    return `${hours}h ${mins}m`;
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="h-full flex flex-col items-center justify-center bg-gray-50 p-4">
        <Navigation size={48} className="text-gray-300 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">No Active Trip</h2>
        <p className="text-gray-500 mb-6">Start sharing your location with your circles</p>
        <button
          onClick={() => navigate('/trip/start')}
          className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium"
        >
          Start a Trip
        </button>
      </div>
    );
  }

  const isPaused = trip.status === 'paused';

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className={`px-4 py-4 ${isPaused ? 'bg-yellow-500' : 'bg-green-500'} text-white`}>
        <div className="flex items-center gap-3 mb-3">
          <button 
            onClick={() => navigate('/safety')}
            className="p-2 -ml-2 rounded-full hover:bg-white/20"
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {isPaused ? (
                <Pause size={18} />
              ) : (
                <div className="w-3 h-3 bg-white rounded-full animate-pulse" />
              )}
              <span className="font-semibold">
                {isPaused ? 'Sharing Paused' : 'Sharing Location'}
              </span>
            </div>
          </div>
          {updating && <Loader size={18} className="animate-spin" />}
        </div>

        {/* Trip info */}
        <div className="bg-white/20 rounded-xl p-3">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Navigation size={20} />
            </div>
            <div className="flex-1">
              <div className="font-medium text-white/90 text-sm">Heading to</div>
              <div className="font-semibold">{trip.destination.name || 'Destination'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-white rounded-xl p-4 text-center">
            <Clock size={20} className="text-gray-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{formatDuration(trip.startedAt)}</div>
            <div className="text-xs text-gray-500">Duration</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <Navigation size={20} className="text-gray-400 mx-auto mb-1" />
            <div className="text-lg font-bold text-gray-900">{trip.updateInterval}s</div>
            <div className="text-xs text-gray-500">Update rate</div>
          </div>
          <div className="bg-white rounded-xl p-4 text-center">
            <Battery size={20} className={`mx-auto mb-1 ${
              trip.batteryLevel && trip.batteryLevel < 20 ? 'text-red-500' : 'text-gray-400'
            }`} />
            <div className="text-lg font-bold text-gray-900">
              {trip.batteryLevel ? `${trip.batteryLevel}%` : '--'}
            </div>
            <div className="text-xs text-gray-500">Battery</div>
          </div>
        </div>

        {/* Sharing with */}
        {trip.circle && (
          <div className="bg-white rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-xl">
                {trip.circle.emoji}
              </div>
              <div>
                <div className="text-sm text-gray-500">Sharing with</div>
                <div className="font-semibold text-gray-900">{trip.circle.name}</div>
              </div>
            </div>
          </div>
        )}

        {/* Last update */}
        {trip.currentLocation?.updatedAt && (
          <div className="bg-white rounded-xl p-4">
            <div className="text-sm text-gray-500 mb-1">Last location update</div>
            <div className="font-medium text-gray-900">
              {new Date(trip.currentLocation.updatedAt).toLocaleTimeString()}
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 bg-white border-t border-gray-100 space-y-3">
        {/* Pause/Resume */}
        <div className="grid grid-cols-2 gap-3">
          {isPaused ? (
            <button
              onClick={resumeTrip}
              className="py-3 bg-green-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-green-600"
            >
              <Play size={18} />
              Resume
            </button>
          ) : (
            <button
              onClick={pauseTrip}
              className="py-3 bg-yellow-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-yellow-600"
            >
              <Pause size={18} />
              Pause
            </button>
          )}
          <button
            onClick={markArrived}
            className="py-3 bg-blue-500 text-white rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-blue-600"
          >
            <Check size={18} />
            I've Arrived
          </button>
        </div>

        {/* End Trip */}
        <button
          onClick={endTrip}
          disabled={ending}
          className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-gray-200"
        >
          {ending ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <>
              <X size={18} />
              Stop Sharing
            </>
          )}
        </button>
      </div>
    </div>
  );
}
