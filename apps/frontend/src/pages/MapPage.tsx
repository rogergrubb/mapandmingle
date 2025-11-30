import { useEffect, useState, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Flame, Locate, Menu, MapPin, MessageCircle, Search } from 'lucide-react';
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
  const { user, isAuthenticated } = useAuthStore();
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [showHotZoneMenu, setShowHotZoneMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowHotZoneMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(pos);
        setUserLocation(pos);
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
              key={hotspot.id}
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

      {/* Hot Zone Menu */}
      <div className="absolute top-4 left-4 z-[1000]" ref={menuRef}>
        <button
          onClick={() => setShowHotZoneMenu(!showHotZoneMenu)}
          className="flex items-center gap-2 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full shadow-lg font-bold transition-all"
        >
          <Flame size={20} />
          <span>Hot Zone</span>
          <Menu size={20} />
        </button>

        {/* Dropdown Menu */}
        {showHotZoneMenu && (
          <div className="absolute top-full mt-2 left-0 bg-white rounded-xl shadow-xl overflow-hidden min-w-[280px] border border-gray-200">
            {/* Mingle Hot Zone */}
            <button
              onClick={() => {
                setShowHotspots(!showHotspots);
                setShowHotZoneMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-orange-50 transition border-b border-gray-100"
            >
              <div className="bg-orange-100 rounded-full p-2">
                <Flame size={20} className="text-orange-500" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-800">Mingle Hot Zone</p>
                <p className="text-xs text-gray-500">Browse active mingles</p>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            {/* Create a Mingle Now */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/(auth)/login');
                } else {
                  navigate('/mingles/create');
                }
                setShowHotZoneMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-green-50 transition border-b border-gray-100"
            >
              <div className="bg-green-100 rounded-full p-2">
                <MapPin size={20} className="text-green-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-800">Create a Mingle</p>
                <p className="text-xs text-gray-500">Start your own meetup</p>
              </div>
              <span className="text-gray-400">→</span>
            </button>

            {/* Find a Mingler Now */}
            <button
              onClick={() => {
                if (!isAuthenticated) {
                  navigate('/(auth)/login');
                } else {
                  navigate('/find-mingler');
                }
                setShowHotZoneMenu(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-purple-50 transition"
            >
              <div className="bg-purple-100 rounded-full p-2">
                <Search size={20} className="text-purple-600" />
              </div>
              <div className="text-left flex-1">
                <p className="font-bold text-gray-800">Find a Mingler</p>
                <p className="text-xs text-gray-500">Search & message users</p>
              </div>
              <span className="text-gray-400">→</span>
            </button>
          </div>
        )}
      </div>

      {/* Center on User Button */}
      <button
        onClick={handleCenterOnUser}
        className="absolute bottom-36 right-4 z-[1000] bg-white text-primary-500 p-3 rounded-full shadow-lg hover:bg-gray-50 transition-all"
      >
        <Locate size={24} />
      </button>

      {/* Close Menu on Map Click */}
      {showHotZoneMenu && (
        <div
          className="absolute inset-0 z-[999]"
          onClick={() => setShowHotZoneMenu(false)}
        />
      )}
    </div>
  );
}
