import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Locate, MapPin, Loader } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { MapStatusBar } from '../components/map/MapStatusBar';
import api from '../lib/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function MapController() {
  const map = useMap();
  const fetchPins = useMapStore((state) => state.fetchPins);

  useEffect(() => {
    const handleMoveEnd = () => {
      const bounds = map.getBounds();
      fetchPins({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    };

    map.on('moveend', handleMoveEnd);
    handleMoveEnd(); // Initial fetch

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, fetchPins]);

  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { pins, hotspots, filter, showHotspots, setFilter, setShowHotspots, setUserLocation } = useMapStore();
  const { user, isAuthenticated } = useAuthStore();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [creatingPin, setCreatingPin] = useState(false);
  const [pinCreationSuccess, setPinCreationSuccess] = useState(false);
  const [userPin, setUserPin] = useState<any>(null);
  const mapRef = useRef<L.Map>(null);

  // Load user's pin and geolocation
  useEffect(() => {
    const loadUserData = async () => {
      try {
        // Get user's pins
        const response = await api.get('/api/pins/user/mine');
        if (response.data && response.data.length > 0) {
          setUserPin(response.data[0]); // Get first pin
        }
      } catch (err) {
        console.log('No pins found');
      }
    };
    
    loadUserData();
    
    // Get geolocation
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(pos);
        setUserLocation({ latitude: pos[0], longitude: pos[1] });
        setIsLocating(false);
      },
      () => {
        setUserPosition([37.7749, -122.4194]);
        setIsLocating(false);
      }
    );
  }, [setUserLocation]);

  const handleCenterOnUser = () => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, mapRef.current.getZoom());
    }
  };

  const handleCreatePinAtLocation = async () => {
    if (!userPosition) {
      alert('Location not available');
      return;
    }

    if (!isAuthenticated) {
      navigate('/(auth)/login');
      return;
    }

    setCreatingPin(true);
    try {
      await api.post('/api/pins/auto-create', {
        latitude: userPosition[0],
        longitude: userPosition[1],
      });
      
      setPinCreationSuccess(true);
      setTimeout(() => {
        setPinCreationSuccess(false);
      }, 3000);
      
      // Refresh pins on map
      const bounds = mapRef.current?.getBounds();
      if (bounds) {
        useMapStore.getState().fetchPins({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    } catch (err: any) {
      console.error('Failed to create pin:', err);
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg?.includes('already has a pin')) {
        alert('You already have a pin on the map. Delete it in your profile to create a new one.');
      } else {
        alert(errorMsg || 'Failed to create pin');
      }
    } finally {
      setCreatingPin(false);
    }
  };

  if (isLocating) {
    return (
      <div className="flex items-center justify-center w-full h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">📍</div>
          <p className="text-gray-600">Finding your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen">
      <MapContainer
        ref={mapRef}
        center={userPosition || [37.7749, -122.4194]}
        zoom={13}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        <MapController />

        {/* Pins/Mingles */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            eventHandlers={{
              click: () => navigate(`/mingles/${pin.id}`),
            }}
          >
            <Popup>
              <div className="w-64">
                <h3 className="font-bold mb-1">{pin.title}</h3>
                <p className="text-sm text-gray-600 mb-2">{pin.description}</p>
                <button
                  onClick={() => navigate(`/mingles/${pin.id}`)}
                  className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-sm font-semibold"
                >
                  View Details
                </button>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hotspots */}
        {showHotspots &&
          hotspots.map((hotspot) => (
            <Circle
              key={`hotspot-${hotspot.latitude}-${hotspot.longitude}`}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={hotspot.radius}
              pathOptions={{
                color: '#ef4444',
                weight: 2,
                opacity: 0.2,
                fill: true,
                fillColor: '#ef4444',
                fillOpacity: 0.1,
              }}
            />
          ))}
      </MapContainer>

      {/* Map Status Bar */}
      <MapStatusBar
        peopleCount={pins.length}
        timeFilter={filter as "24h" | "week"}
        showHotspots={showHotspots}
        onTimeFilterChange={(newFilter) => setFilter(newFilter)}
        onToggleHotspots={() => setShowHotspots(!showHotspots)}
      />

      {/* Pin Creation Floating Actions */}
      <div className="absolute bottom-36 right-4 z-[1000] flex flex-col gap-3">
        {/* Success Message */}
        {pinCreationSuccess && (
          <div className="animate-in fade-in slide-in-from-bottom-2 bg-green-500 text-white px-4 py-3 rounded-full shadow-lg flex items-center gap-2 whitespace-nowrap">
            <span className="text-lg">✓</span>
            <span className="font-semibold">Pin created!</span>
          </div>
        )}

        {/* Center on User Button */}
        <button
          onClick={handleCenterOnUser}
          className="bg-white text-primary-500 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all flex items-center justify-center"
          title="Center map on your location"
        >
          <Locate size={24} />
        </button>

        {/* Create Pin Button */}
        <button
          onClick={handleCreatePinAtLocation}
          disabled={creatingPin}
          className={`p-3 rounded-full shadow-lg transition-all flex items-center justify-center font-bold text-lg ${
            creatingPin
              ? 'bg-purple-400 text-white opacity-75'
              : 'bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:shadow-xl hover:scale-110'
          }`}
          title={isAuthenticated ? 'Drop a pin at your location' : 'Login to create pin'}
        >
          {creatingPin ? (
            <Loader size={24} className="animate-spin" />
          ) : (
            <MapPin size={24} className="fill-current" />
          )}
        </button>
      </div>
    </div>
  );
}
