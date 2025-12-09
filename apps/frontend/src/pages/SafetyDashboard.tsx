import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Users, MapPin, Navigation, Home, Check, AlertTriangle,
  Battery, Clock, ChevronRight, Plus, Bell, Phone
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';
import { triggerHaptic } from '../lib/haptics';
import branding from '../config/branding';

interface CircleMember {
  userId: string;
  name: string;
  image: string | null;
  hasActiveTrip: boolean;
  trip: {
    id: string;
    name: string;
    destName: string;
    status: string;
    currentLat: number | null;
    currentLng: number | null;
    expectedArrival: string | null;
    batteryLevel: number | null;
    lastUpdatedAt: string | null;
  } | null;
  lastKnownLocation: {
    lat: number;
    lng: number;
    lastUpdated: string | null;
  } | null;
}

interface Circle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isOwner: boolean;
  memberCount: number;
}

interface CheckIn {
  id: string;
  type: string;
  message: string | null;
  user: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
}

interface ActiveTrip {
  id: string;
  name: string;
  destination: {
    lat: number;
    lng: number;
    name: string;
  };
  status: string;
  startedAt: string;
  expectedArrival: string | null;
  updateInterval: number;
}

export default function SafetyDashboard() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [memberLocations, setMemberLocations] = useState<CircleMember[]>([]);
  const [recentCheckIns, setRecentCheckIns] = useState<CheckIn[]>([]);
  const [activeTrip, setActiveTrip] = useState<ActiveTrip | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingIn, setCheckingIn] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [circlesRes, checkInsRes, tripRes] = await Promise.all([
        api.get('/api/circles'),
        api.get('/api/safety/features/checkins'),
        api.get('/api/trips/active'),
      ]);

      setCircles(circlesRes.data.circles || []);
      setRecentCheckIns(checkInsRes.data.checkIns || []);
      setActiveTrip(tripRes.data.trip);

      // If user has circles, get locations for first circle
      if (circlesRes.data.circles?.length > 0) {
        const locRes = await api.get(`/api/circles/${circlesRes.data.circles[0].id}/locations`);
        setMemberLocations(locRes.data.locations || []);
      }
    } catch (err) {
      console.error('Failed to fetch safety data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    // Refresh every 30 seconds
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const handleCheckIn = async (type: 'home' | 'arrived' | 'safe') => {
    setCheckingIn(true);
    triggerHaptic('medium');
    
    try {
      // Get current location
      let latitude: number | undefined;
      let longitude: number | undefined;
      
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
        }).catch(() => null);
        
        if (pos) {
          latitude = pos.coords.latitude;
          longitude = pos.coords.longitude;
        }
      }

      await api.post('/api/safety/features/checkin', {
        type,
        latitude,
        longitude,
      });

      triggerHaptic('success');
      fetchData();
    } catch (err) {
      console.error('Check-in failed:', err);
      triggerHaptic('error');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleEmergency = async () => {
    triggerHaptic('heavy');
    
    // Confirm emergency
    if (!confirm('This will alert all your circle members with your location. Continue?')) {
      return;
    }

    try {
      let latitude = 0;
      let longitude = 0;
      
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, { 
            enableHighAccuracy: true,
            timeout: 10000 
          });
        });
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      }

      const batteryLevel = await (navigator as any).getBattery?.()
        .then((b: any) => Math.round(b.level * 100))
        .catch(() => null);

      await api.post('/api/safety/features/emergency', {
        latitude,
        longitude,
        batteryLevel,
      });

      triggerHaptic('success');
      alert('Emergency alert sent to all your circle members.');
    } catch (err) {
      console.error('Emergency alert failed:', err);
      alert('Failed to send emergency alert. Please call emergency services directly.');
    }
  };

  const formatTimeAgo = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col overflow-y-auto pb-20">
      {/* Header */}
      <div className="text-white px-4 pt-6 pb-8" style={{ background: branding.safetyGradient }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Safety</h1>
            <p className="text-blue-100 text-sm">{branding.safetyTagline}</p>
          </div>
          <button 
            onClick={() => navigate('/circles')}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <Users size={20} />
          </button>
        </div>

        {/* Quick Check-in Buttons */}
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={() => handleCheckIn('home')}
            disabled={checkingIn}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <Home size={24} />
            <span className="text-xs font-medium">I'm Home</span>
          </button>
          <button
            onClick={() => handleCheckIn('arrived')}
            disabled={checkingIn}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <MapPin size={24} />
            <span className="text-xs font-medium">Arrived</span>
          </button>
          <button
            onClick={() => handleCheckIn('safe')}
            disabled={checkingIn}
            className="flex flex-col items-center gap-1 p-3 rounded-xl bg-white/20 hover:bg-white/30 transition-colors disabled:opacity-50"
          >
            <Check size={24} />
            <span className="text-xs font-medium">I'm Safe</span>
          </button>
        </div>
      </div>

      {/* Active Trip Banner */}
      {activeTrip && (
        <div className="mx-4 -mt-4 bg-white rounded-xl shadow-lg p-4 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <Navigation size={20} className="text-green-600" />
              </div>
              <div>
                <div className="font-semibold text-gray-900">Sharing Location</div>
                <div className="text-sm text-gray-500">
                  To: {activeTrip.destination.name || 'Destination'}
                </div>
              </div>
            </div>
            <button 
              onClick={() => navigate('/trip')}
              className="px-3 py-1.5 rounded-full bg-green-100 text-green-700 text-sm font-medium"
            >
              View
            </button>
          </div>
        </div>
      )}

      {/* Start Trip Button (if no active trip) */}
      {!activeTrip && (
        <div className="mx-4 -mt-4">
          <button
            onClick={() => navigate('/trip/start')}
            className="w-full bg-white rounded-xl shadow-lg p-4 flex items-center justify-between hover:shadow-xl transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Navigation size={20} className="text-blue-600" />
              </div>
              <div className="text-left">
                <div className="font-semibold text-gray-900">Share My Trip</div>
                <div className="text-sm text-gray-500">Let others know where you're going</div>
              </div>
            </div>
            <ChevronRight size={20} className="text-gray-400" />
          </button>
        </div>
      )}

      {/* Circle Members */}
      <div className="px-4 mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-gray-900">Family & Friends</h2>
          {circles.length > 0 && (
            <button 
              onClick={() => navigate('/circles')}
              className="text-sm text-blue-600 font-medium"
            >
              Manage
            </button>
          )}
        </div>

        {circles.length === 0 ? (
          <div className="bg-white rounded-xl p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center mx-auto mb-3">
              <Users size={28} className="text-blue-400" />
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Create Your First Circle</h3>
            <p className="text-sm text-gray-500 mb-4">
              Add family members to share locations and stay connected
            </p>
            <button
              onClick={() => navigate('/circles/create')}
              className="px-4 py-2 bg-blue-600 text-white rounded-full text-sm font-medium hover:bg-blue-700"
            >
              <Plus size={16} className="inline mr-1" />
              Create Circle
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {memberLocations.map((member) => (
              <div 
                key={member.userId}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                      {member.image ? (
                        <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                      ) : (
                        member.name?.charAt(0).toUpperCase() || '?'
                      )}
                    </div>
                    {member.hasActiveTrip && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Navigation size={12} className="text-white" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900">{member.name}</div>
                    {member.hasActiveTrip && member.trip ? (
                      <div className="text-sm text-green-600 flex items-center gap-1">
                        <Navigation size={12} />
                        Heading to {member.trip.destName || 'destination'}
                      </div>
                    ) : member.lastKnownLocation?.lastUpdated ? (
                      <div className="text-sm text-gray-500">
                        Last seen {formatTimeAgo(member.lastKnownLocation.lastUpdated)}
                      </div>
                    ) : (
                      <div className="text-sm text-gray-400">Location not shared</div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {member.trip?.batteryLevel != null && (
                      <div className="flex items-center gap-1 text-sm text-gray-500">
                        <Battery size={14} className={member.trip.batteryLevel < 20 ? 'text-red-500' : ''} />
                        {member.trip.batteryLevel}%
                      </div>
                    )}
                    <button 
                      onClick={() => navigate(`/profile/${member.userId}`)}
                      className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <ChevronRight size={16} className="text-gray-500" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recent Check-ins */}
      {recentCheckIns.length > 0 && (
        <div className="px-4 mt-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Activity</h2>
          <div className="bg-white rounded-xl divide-y divide-gray-100">
            {recentCheckIns.slice(0, 5).map((checkIn) => (
              <div key={checkIn.id} className="p-3 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm">
                  {checkIn.user.image ? (
                    <img src={checkIn.user.image} alt={checkIn.user.name} className="w-full h-full rounded-full object-cover" />
                  ) : (
                    checkIn.user.name?.charAt(0).toUpperCase() || '?'
                  )}
                </div>
                <div className="flex-1">
                  <div className="text-sm">
                    <span className="font-medium text-gray-900">{checkIn.user.name}</span>
                    <span className="text-gray-500">
                      {' '}checked in as{' '}
                      <span className="font-medium text-green-600">{checkIn.type}</span>
                    </span>
                  </div>
                  <div className="text-xs text-gray-400">{formatTimeAgo(checkIn.createdAt)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Emergency Button */}
      <div className="px-4 mt-6 mb-8">
        <button
          onClick={handleEmergency}
          className="w-full bg-red-500 hover:bg-red-600 text-white rounded-xl p-4 flex items-center justify-center gap-2 shadow-lg transition-colors"
        >
          <AlertTriangle size={20} />
          <span className="font-semibold">Emergency Alert</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Press to immediately share your location with all circle members
        </p>
      </div>
    </div>
  );
}
