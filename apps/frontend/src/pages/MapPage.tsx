import { useEffect, useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, Circle, useMap, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Locate, Loader } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { MapControlBar, type MingleMode, type DistanceFilter } from '../components/map/MapControlBar';
import { MapFAB } from '../components/map/MapFAB';
import { HotspotOverlay, mockHotspots } from '../components/map/HotspotOverlay';
import WelcomeCard from '../components/WelcomeCard';
import ProfileInterestsSetup from '../components/ProfileInterestsSetup';
import api from '../lib/api';
import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import L from 'leaflet';
import 'leaflet.markercluster';

// Fix Leaflet default marker icon issue
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Mode-specific colors for pins
const modeColors = {
  dating: { primary: '#ec4899', secondary: '#f43f5e' },
  friends: { primary: '#8b5cf6', secondary: '#6366f1' },
  networking: { primary: '#3b82f6', secondary: '#06b6d4' },
  events: { primary: '#22c55e', secondary: '#10b981' },
  travel: { primary: '#f97316', secondary: '#f59e0b' },
};

// Create animated pin icon based on mode
function createPinIcon(mode: MingleMode, isActive: boolean = false) {
  const colors = modeColors[mode];
  const size = isActive ? 48 : 40;
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        ${isActive ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${colors.primary}40, ${colors.secondary}40);
            animation: pulse 2s ease-in-out infinite;
          "></div>
        ` : ''}
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          box-shadow: 0 4px 12px ${colors.primary}60;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 3px solid white;
        ">
          <div style="
            width: ${size * 0.4}px;
            height: ${size * 0.4}px;
            background: white;
            border-radius: 50%;
            opacity: 0.9;
          "></div>
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          transform: translateX(-50%) rotate(45deg);
        "></div>
      </div>
    `,
    className: 'custom-pin-icon',
    iconSize: L.point(size, size + 10, true),
    iconAnchor: L.point(size / 2, size + 6),
    popupAnchor: L.point(0, -size),
  });
}

// Clustered markers component with mode-aware styling
function ClusteredMarkers({ 
  pins, 
  mode,
  onPinClick 
}: { 
  pins: any[]; 
  mode: MingleMode;
  onPinClick: (pin: any) => void;
}) {
  const map = useMap();
  const clusterGroupRef = useRef<L.MarkerClusterGroup | null>(null);
  const colors = modeColors[mode];

  useEffect(() => {
    // Create cluster group with mode-specific styling
    if (!clusterGroupRef.current) {
      clusterGroupRef.current = (L as any).markerClusterGroup({
        chunkedLoading: true,
        maxClusterRadius: 60,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: false,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 16,
        spiderfyDistanceMultiplier: 1.5,
        iconCreateFunction: (cluster: any) => {
          const count = cluster.getChildCount();
          let size = count >= 100 ? 60 : count >= 50 ? 52 : count >= 20 ? 44 : 36;
          
          return L.divIcon({
            html: `
              <div style="
                position: relative;
                width: ${size}px;
                height: ${size}px;
              ">
                <div style="
                  position: absolute;
                  inset: 0;
                  border-radius: 50%;
                  background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
                  box-shadow: 0 4px 20px ${colors.primary}50;
                  display: flex;
                  align-items: center;
                  justify-content: center;
                  border: 3px solid white;
                  animation: gentlePulse 3s ease-in-out infinite;
                ">
                  <span style="
                    color: white;
                    font-weight: bold;
                    font-size: ${size > 50 ? '18px' : size > 40 ? '16px' : '14px'};
                    text-shadow: 0 1px 2px rgba(0,0,0,0.2);
                  ">${count}</span>
                </div>
              </div>
            `,
            className: 'custom-cluster-icon',
            iconSize: L.point(size, size, true),
          });
        },
      });
      map.addLayer(clusterGroupRef.current);
    }

    // Update cluster group styling when mode changes
    clusterGroupRef.current.refreshClusters();

    // Clear existing markers
    clusterGroupRef.current.clearLayers();

    // Add markers for each pin
    pins.forEach((pin) => {
      const isOnline = Math.random() > 0.5; // Simulated online status
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createPinIcon(mode, isOnline),
      });
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'min-w-[200px]';
      popupContent.innerHTML = `
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
            ">
              ${pin.createdBy?.avatar || '👤'}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 16px; color: #111;">
                ${pin.createdBy?.name || 'Mingler'}
              </div>
              <div style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">
                ${isOnline 
                  ? '<span style="width:8px;height:8px;background:#22c55e;border-radius:50%;"></span> Online now' 
                  : 'Active recently'
                }
              </div>
            </div>
          </div>
          <p style="font-size: 14px; color: #444; margin-bottom: 12px; line-height: 1.4;">
            ${pin.description || 'Ready to mingle!'}
          </p>
          <button 
            class="view-profile-btn"
            style="
              width: 100%;
              padding: 10px 16px;
              background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
              color: white;
              border: none;
              border-radius: 10px;
              font-weight: 600;
              font-size: 14px;
              cursor: pointer;
              transition: transform 0.1s, box-shadow 0.1s;
            "
            onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px ${colors.primary}40';"
            onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
          >
            View Profile
          </button>
        </div>
      `;
      
      // Add click handler to button
      const button = popupContent.querySelector('.view-profile-btn');
      if (button) {
        button.addEventListener('click', () => onPinClick(pin));
      }
      
      marker.bindPopup(popupContent, {
        className: 'custom-popup',
        closeButton: false,
        maxWidth: 280,
      });
      
      clusterGroupRef.current!.addLayer(marker);
    });

    return () => {};
  }, [pins, map, onPinClick, mode, colors]);

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (clusterGroupRef.current) {
        map.removeLayer(clusterGroupRef.current);
        clusterGroupRef.current = null;
      }
    };
  }, [map]);

  return null;
}

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
    handleMoveEnd();

    return () => {
      map.off('moveend', handleMoveEnd);
    };
  }, [map, fetchPins]);

  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { pins, hotspots, showHotspots, setShowHotspots, setUserLocation } = useMapStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Map state
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const mapRef = useRef<L.Map>(null);
  
  // UI state
  const [currentMode, setCurrentMode] = useState<MingleMode>('friends');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('city');
  const [isVisible, setIsVisible] = useState(true);
  const [creatingPin, setCreatingPin] = useState(false);
  const [pinCreationSuccess, setPinCreationSuccess] = useState(false);
  
  // Welcome/Onboarding state
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [showInterestsSetup, setShowInterestsSetup] = useState(false);

  // Load visibility status
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const response = await api.get('/api/users/me');
        setIsVisible(!response.data?.profile?.ghostMode);
      } catch (err) {
        console.error('Failed to load user data:', err);
      }
    };
    if (isAuthenticated) {
      loadUserData();
    }
  }, [isAuthenticated]);

  // Show welcome card for new users
  useEffect(() => {
    const welcomed = localStorage.getItem('mapandmingle_welcomed');
    if (!welcomed) {
      const timer = setTimeout(() => setShowWelcomeCard(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  // Get geolocation
  useEffect(() => {
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

  const handleCenterOnUser = useCallback(() => {
    if (userPosition && mapRef.current) {
      mapRef.current.setView(userPosition, mapRef.current.getZoom());
    }
  }, [userPosition]);

  const handlePinClick = useCallback((pin: any) => {
    if (pin.userId !== user?.id) {
      navigate(`/mingles/${pin.id}`);
    }
  }, [navigate, user?.id]);

  const handleVisibilityToggle = async () => {
    try {
      await api.patch('/api/users/me', {
        ghostMode: isVisible,
      });
      setIsVisible(!isVisible);
    } catch (err) {
      console.error('Failed to toggle visibility:', err);
    }
  };

  const handleDropPin = async () => {
    if (!userPosition) {
      alert('Location not available');
      return;
    }

    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setCreatingPin(true);
    try {
      await api.post('/api/pins/auto-create', {
        latitude: userPosition[0],
        longitude: userPosition[1],
      });
      
      setPinCreationSuccess(true);
      setTimeout(() => setPinCreationSuccess(false), 3000);
      
      // Refresh pins
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
      const errorMsg = err.response?.data?.error || err.message;
      if (errorMsg?.includes('already has a pin')) {
        // Pin was updated, show success
        setPinCreationSuccess(true);
        setTimeout(() => setPinCreationSuccess(false), 3000);
      } else {
        alert(errorMsg || 'Failed to create pin');
      }
    } finally {
      setCreatingPin(false);
    }
  };

  const handleHotspotClick = useCallback((hotspot: any) => {
    if (mapRef.current) {
      mapRef.current.setView([hotspot.latitude, hotspot.longitude], 15);
    }
  }, []);

  if (isLocating) {
    return (
      <div className="flex items-center justify-center w-full h-full bg-gradient-to-b from-purple-50 to-pink-50">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-ping opacity-20" />
            <div className="absolute inset-2 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full animate-pulse opacity-40" />
            <div className="absolute inset-4 bg-gradient-to-r from-pink-500 to-purple-600 rounded-full flex items-center justify-center">
              <span className="text-2xl">📍</span>
            </div>
          </div>
          <p className="text-gray-600 font-medium">Finding your location...</p>
          <p className="text-gray-400 text-sm mt-1">Getting ready to mingle</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-full">
      {/* Global styles */}
      <style>{`
        .custom-cluster-icon {
          background: transparent !important;
        }
        .custom-pin-icon {
          background: transparent !important;
        }
        .custom-popup .leaflet-popup-content-wrapper {
          border-radius: 16px;
          padding: 0;
          box-shadow: 0 10px 40px rgba(0,0,0,0.15);
        }
        .custom-popup .leaflet-popup-content {
          margin: 0;
        }
        .custom-popup .leaflet-popup-tip {
          display: none;
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); opacity: 0.5; }
          50% { transform: scale(1.3); opacity: 0; }
        }
        @keyframes gentlePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={userPosition || [37.7749, -122.4194]}
        zoom={13}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController />
        
        {/* Clustered Pins with mode-aware styling */}
        <ClusteredMarkers pins={pins} mode={currentMode} onPinClick={handlePinClick} />

        {/* Hotspot Circles */}
        {showHotspots &&
          mockHotspots.map((hotspot) => (
            <Circle
              key={`hotspot-${hotspot.id}`}
              center={[hotspot.latitude, hotspot.longitude]}
              radius={300}
              pathOptions={{
                color: modeColors[currentMode].primary,
                weight: 2,
                opacity: 0.3,
                fill: true,
                fillColor: modeColors[currentMode].primary,
                fillOpacity: 0.1,
              }}
            />
          ))}

        {/* User location marker */}
        {userPosition && (
          <Circle
            center={userPosition}
            radius={50}
            pathOptions={{
              color: '#3b82f6',
              weight: 2,
              fill: true,
              fillColor: '#3b82f6',
              fillOpacity: 0.2,
            }}
          />
        )}
      </MapContainer>

      {/* Control Bar */}
      <MapControlBar
        currentMode={currentMode}
        distanceFilter={distanceFilter}
        isVisible={isVisible}
        peopleCount={pins.length}
        onModeChange={setCurrentMode}
        onDistanceChange={setDistanceFilter}
        onVisibilityToggle={handleVisibilityToggle}
        onSearch={() => {}}
      />

      {/* Hotspot Overlay */}
      <HotspotOverlay
        hotspots={mockHotspots}
        isVisible={showHotspots}
        onToggle={() => setShowHotspots(!showHotspots)}
        onHotspotClick={handleHotspotClick}
      />

      {/* Location Button */}
      <button
        onClick={handleCenterOnUser}
        className="absolute bottom-32 left-4 z-[900] w-12 h-12 bg-white rounded-full shadow-lg flex items-center justify-center hover:bg-gray-50 transition-all hover:shadow-xl active:scale-95"
      >
        <Locate size={22} className="text-gray-700" />
      </button>

      {/* FAB */}
      <MapFAB
        currentMode={currentMode}
        onModeChange={setCurrentMode}
        onDropPin={handleDropPin}
        onCreateEvent={() => navigate('/events/create')}
        onBroadcast={() => {}}
      />

      {/* Success Toast */}
      {pinCreationSuccess && (
        <div className="absolute bottom-36 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-green-500 text-white px-6 py-3 rounded-full shadow-xl flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-semibold">You're on the map!</span>
          </div>
        </div>
      )}

      {/* Loading overlay for pin creation */}
      {creatingPin && (
        <div className="absolute inset-0 bg-black/20 backdrop-blur-sm z-[1100] flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 shadow-2xl flex flex-col items-center gap-3">
            <Loader size={32} className="animate-spin text-purple-600" />
            <span className="font-semibold text-gray-700">Dropping your pin...</span>
          </div>
        </div>
      )}

      {/* Welcome Card */}
      {showWelcomeCard && (
        <WelcomeCard
          onDismiss={() => {
            setShowWelcomeCard(false);
            localStorage.setItem('mapandmingle_welcomed', 'true');
          }}
          onAddInterests={() => {
            setShowWelcomeCard(false);
            localStorage.setItem('mapandmingle_welcomed', 'true');
            if (isAuthenticated) {
              setShowInterestsSetup(true);
            } else {
              navigate('/login');
            }
          }}
        />
      )}

      {/* Interests Setup Modal */}
      <ProfileInterestsSetup
        isOpen={showInterestsSetup}
        onComplete={() => setShowInterestsSetup(false)}
      />
    </div>
  );
}
