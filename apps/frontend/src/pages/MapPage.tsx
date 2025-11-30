import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Plus, Flame, Locate, Users } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
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
  const user = useAuthStore((state) => state.user);
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    // Get user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
          setUserPosition(pos);
          setUserLocation({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setIsLocating(false);
        },
        (error) => {
          console.error('Error getting location:', error);
          // Default to San Francisco
          setUserPosition([37.7749, -122.4194]);
          setIsLocating(false);
        }
      );
    } else {
      setUserPosition([37.7749, -122.4194]);
      setIsLocating(false);
    }
  }, [setUserLocation]);

  const handleCenterOnUser = () => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, 15);
    }
  };

  if (isLocating || !userPosition) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Finding your location...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative h-full">
      {/* Map */}
      <MapContainer
        center={userPosition}
        zoom={15}
        className="h-full w-full"
        ref={mapRef}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapController />
        
        {/* User Location Marker */}
        <Marker position={userPosition}>
          <Popup>You are here</Popup>
        </Marker>

        {/* Pin Markers */}
        {pins.map((pin) => (
          <Marker
            key={pin.id}
            position={[pin.latitude, pin.longitude]}
            eventHandlers={{
              click: () => navigate(`/pin/${pin.id}`),
            }}
          >
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold">{pin.title}</h3>
                <p className="text-sm text-gray-600">{pin.category}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hotspots */}
        {showHotspots && hotspots.map((hotspot, index) => (
          <Circle
            key={index}
            center={[hotspot.latitude, hotspot.longitude]}
            radius={hotspot.radius}
            pathOptions={{
              color: '#F97316',
              fillColor: '#F97316',
              fillOpacity: hotspot.intensity / 100,
            }}
          />
        ))}
      </MapContainer>

      {/* Top Bar - Filter Pills */}
      <div className="absolute top-4 left-4 right-20 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm rounded-full p-1 flex shadow-lg">
          {(['all', '24h', 'week'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2 px-4 rounded-full font-semibold transition-all ${
                filter === f
                  ? 'bg-primary-500 text-white'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f === 'all' ? 'All' : f === '24h' ? '24h' : 'Week'}
            </button>
          ))}
        </div>
      </div>

      {/* Hotspot Toggle */}
      <button
        onClick={() => setShowHotspots(!showHotspots)}
        className={`absolute top-4 right-4 z-[1000] p-3 rounded-full shadow-lg transition-all ${
          showHotspots ? 'bg-orange-500 text-white' : 'bg-white text-orange-500'
        }`}
      >
        <Flame size={24} />
      </button>

      {/* Quick Actions - Mingle Button */}
      <button
        onClick={() => navigate('/mingles/create')}
        className="absolute top-20 right-4 z-[1000] bg-purple-500 text-white p-3 rounded-full shadow-lg hover:bg-purple-600 transition-all"
      >
        <Users size={22} />
      </button>

      {/* Center on User Button */}
      <button
        onClick={handleCenterOnUser}
        className="absolute bottom-36 right-4 z-[1000] bg-white text-primary-500 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all"
      >
        <Locate size={24} />
      </button>

      {/* Create Pin FAB */}
      <button
        onClick={() => navigate('/create-pin')}
        className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] bg-primary-500 text-white p-4 rounded-full shadow-xl hover:bg-primary-600 hover:scale-110 transition-all"
      >
        <Plus size={28} />
      </button>

      {/* Bottom Info Card */}
      <div className="absolute bottom-20 left-4 right-4 z-[1000]">
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
              <span className="text-gray-700 font-medium">
                {pins.length} {pins.length === 1 ? 'person' : 'people'} nearby
              </span>
            </div>
            {showHotspots && hotspots.length > 0 && (
              <div className="flex items-center">
                <Flame size={16} className="text-orange-600 mr-1" />
                <span className="text-orange-600 font-medium">{hotspots.length} hotspots</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Activity Intent Badge */}
      {user?.activityIntent && (
        <div className="absolute top-20 left-4 z-[1000]">
          <div className="bg-white/90 backdrop-blur-sm rounded-full px-3 py-2 flex items-center shadow-md">
            <div className="w-2 h-2 rounded-full bg-green-500 mr-2"></div>
            <span className="text-gray-700 text-sm font-medium">{user.activityIntent}</span>
          </div>
        </div>
      )}
    </div>
  );
}
