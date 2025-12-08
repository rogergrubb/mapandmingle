import { useEffect, useState, useRef, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Circle, useMap, Marker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { Loader, Info } from 'lucide-react';
import { useMapStore } from '../stores/mapStore';
import { useAuthStore } from '../stores/authStore';
import { MapControlBar, type MingleMode, type DistanceFilter } from '../components/map/MapControlBar';
import { PresenceButtonRow } from '../components/map/PresenceButtonRow';
import { TimePickerModal } from '../components/map/TimePickerModal';
import { LegendModal } from '../components/map/LegendModal';
import { ConfirmDialog } from '../components/map/ConfirmDialog';
import WelcomeCard from '../components/WelcomeCard';
import haptic from '../lib/haptics';
import ProfileInterestsSetup from '../components/ProfileInterestsSetup';
import api from '../lib/api';
import { formatCountdown } from '../utils/countdown';
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
  everybody: { primary: '#4b5563', secondary: '#1f2937' },
  dating: { primary: '#ec4899', secondary: '#f43f5e' },
  friends: { primary: '#8b5cf6', secondary: '#6366f1' },
  networking: { primary: '#3b82f6', secondary: '#06b6d4' },
  events: { primary: '#22c55e', secondary: '#10b981' },
  travel: { primary: '#f97316', secondary: '#f59e0b' },
};

// Format countdown for pin popups
function formatCountdownForPin(arrivalTime: string): string {
  const now = new Date();
  const arrival = new Date(arrivalTime);
  const diff = arrival.getTime() - now.getTime();
  
  if (diff < 0) return 'Arrived!';
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  
  if (days > 0) return `Arriving in ${days} day${days > 1 ? 's' : ''}`;
  if (hours > 0) return `Arriving in ${hours} hour${hours > 1 ? 's' : ''}`;
  if (minutes > 0) return `Arriving in ${minutes} minute${minutes > 1 ? 's' : ''}`;
  return 'Arriving now!';
}

// Create animated pin icon based on mode
function createPinIcon(
  mode: MingleMode, 
  isActive: boolean = false, 
  isGhost: boolean = false, 
  isFriend: boolean = false,
  arrivalTime?: string  // For "Where I'll Be" pins
) {
  // If this is a "Where I'll Be" pin, use YELLOW colors
  const isDestination = !!arrivalTime;
  const colors = isDestination 
    ? { primary: '#eab308', secondary: '#f59e0b' } // YELLOW for "Where I'll Be"
    : modeColors[mode]; // Regular mode colors for "Where I'm At"
  
  const size = isActive ? 48 : 40;
  const opacity = isGhost ? 0.5 : 1;
  
  // Friend pins get a special gold ring
  const borderColor = isFriend ? '#FFD700' : 'white';
  const borderWidth = isFriend ? 4 : 3;
  const friendGlow = isFriend ? 'box-shadow: 0 0 12px #FFD70080, 0 4px 12px ' + colors.primary + '60;' : 'box-shadow: 0 4px 12px ' + colors.primary + (isGhost ? '30' : '60') + ';';
  
  // Calculate countdown for arrival time - BIGGER AND MORE VISIBLE
  const countdownBadge = arrivalTime ? (() => {
    const now = new Date();
    const arrival = new Date(arrivalTime);
    const diff = arrival.getTime() - now.getTime();
    
    if (diff < 0) return null; // Already arrived
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    let text = '';
    let color = '#a855f7'; // purple
    
    if (days > 0) {
      text = `${days}d`;
      color = '#3b82f6'; // blue
    } else if (hours > 0) {
      text = `${hours}h`;
      color = hours < 4 ? '#eab308' : '#3b82f6'; // yellow if <4h, blue otherwise
    } else if (minutes > 5) {
      text = `${minutes}m`;
      color = minutes < 30 ? '#f97316' : '#eab308'; // orange if <30m, yellow otherwise
    } else {
      text = 'Now!';
      color = '#ef4444'; // red
    }
    
    return `
      <div style="
        position: absolute;
        top: -12px;
        right: -12px;
        background: ${color};
        color: white;
        font-size: 13px;
        font-weight: 800;
        padding: 5px 9px;
        border-radius: 12px;
        box-shadow: 0 3px 12px ${color}80;
        border: 2px solid white;
        white-space: nowrap;
        z-index: 10;
        animation: countdownPulse 1.5s ease-in-out infinite;
      ">🕐 ${text}</div>
    `;
  })() : '';
  
  return L.divIcon({
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
        opacity: ${opacity};
      ">
        ${countdownBadge || ''}
        ${isActive && !isGhost ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: linear-gradient(135deg, ${isFriend ? '#FFD70040' : colors.primary + '40'}, ${isFriend ? '#FFA50040' : colors.secondary + '40'});
            animation: pulse 2s ease-in-out infinite;
          "></div>
        ` : ''}
        ${isDestination && !isGhost ? `
          <div style="
            position: absolute;
            inset: -4px;
            border-radius: 50%;
            background: linear-gradient(135deg, #eab30840, #f59e0b40);
            animation: pulse 2s ease-in-out infinite;
          "></div>
        ` : ''}
        ${isFriend ? `
          <div style="
            position: absolute;
            inset: -2px;
            border-radius: 50%;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            animation: friendGlow 1.5s ease-in-out infinite alternate;
          "></div>
        ` : ''}
        <div style="
          position: absolute;
          inset: 0;
          border-radius: 50%;
          background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
          ${friendGlow}
          display: flex;
          align-items: center;
          justify-content: center;
          border: ${borderWidth}px solid ${borderColor};
        ">
          ${isFriend ? `
            <div style="
              font-size: ${size * 0.4}px;
              line-height: 1;
            ">⭐</div>
          ` : isDestination ? `
            <div style="
              font-size: ${size * 0.5}px;
              line-height: 1;
            ">📍</div>
          ` : `
            <div style="
              width: ${size * 0.4}px;
              height: ${size * 0.4}px;
              background: white;
              border-radius: 50%;
              opacity: 0.9;
            "></div>
          `}
        </div>
        <div style="
          position: absolute;
          bottom: -6px;
          left: 50%;
          transform: translateX(-50%);
          width: 10px;
          height: 10px;
          background: linear-gradient(135deg, ${isFriend ? '#FFD700' : colors.primary}, ${isFriend ? '#FFA500' : colors.secondary});
          transform: translateX(-50%) rotate(45deg);
        "></div>
        <style>
          @keyframes countdownPulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.15); opacity: 0.9; }
          }
        </style>
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
      // Use isActive from API response (true = active in last 24h, false = ghost pin 1-30 days)
      const isActive = pin.isActive === true;
      const isGhost = pin.isActive === false;
      const isFriend = pin.isFriend === true;
      const marker = L.marker([pin.latitude, pin.longitude], {
        icon: createPinIcon(mode, isActive, isGhost, isFriend, pin.arrivalTime),
      });
      
      // Create popup content
      const popupContent = document.createElement('div');
      popupContent.className = 'min-w-[200px]';
      
      // Check if avatar is a URL or emoji/fallback
      const avatarUrl = pin.createdBy?.avatar;
      const hasImageAvatar = avatarUrl && (avatarUrl.startsWith('http') || avatarUrl.startsWith('/'));
      
      const avatarHtml = hasImageAvatar 
        ? `<img src="${avatarUrl}" alt="" style="width: 100%; height: 100%; object-fit: cover; border-radius: 50%;" onerror="this.style.display='none'; this.nextSibling.style.display='flex';" /><span style="display:none; width:100%; height:100%; align-items:center; justify-content:center;">👤</span>`
        : '👤';
      
      // Determine connection button HTML
      let connectionBtnHtml = '';
      const connectionStatus = pin.connectionStatus || 'none';
      
      if (isFriend) {
        connectionBtnHtml = `
          <div style="
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            padding: 8px;
            background: linear-gradient(135deg, #FFD700, #FFA500);
            color: white;
            border-radius: 8px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 8px;
          ">
            ⭐ Connected Friend
          </div>
        `;
      } else if (connectionStatus === 'pending') {
        if (pin.isRequester) {
          connectionBtnHtml = `
            <button 
              class="connection-btn"
              disabled
              style="
                width: 100%;
                padding: 8px;
                background: #e5e7eb;
                color: #6b7280;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                cursor: not-allowed;
              "
            >
              ⏳ Request Pending
            </button>
          `;
        } else {
          connectionBtnHtml = `
            <button 
              class="connection-btn accept-btn"
              data-user-id="${pin.createdBy?.id}"
              data-connection-id="${pin.connectionId}"
              style="
                width: 100%;
                padding: 8px;
                background: linear-gradient(135deg, #22c55e, #16a34a);
                color: white;
                border: none;
                border-radius: 8px;
                font-size: 12px;
                font-weight: 600;
                margin-bottom: 8px;
                cursor: pointer;
              "
            >
              ✓ Accept Connection
            </button>
          `;
        }
      } else {
        connectionBtnHtml = `
          <button 
            class="connection-btn quick-connect-btn"
            data-user-id="${pin.createdBy?.id}"
            style="
              width: 100%;
              padding: 8px;
              background: linear-gradient(135deg, #8b5cf6, #6366f1);
              color: white;
              border: none;
              border-radius: 8px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 8px;
              cursor: pointer;
              transition: transform 0.1s;
            "
            onmouseover="this.style.transform='scale(1.02)';"
            onmouseout="this.style.transform='scale(1)';"
          >
            🤝 Quick Connect
          </button>
        `;
      }
      
      // Check if this is the current user's pin
      const isOwnPin = pin.userId === user?.id;
      
      popupContent.innerHTML = `
        <div style="padding: 12px;">
          <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
            <div style="
              width: 48px;
              height: 48px;
              border-radius: 50%;
              background: linear-gradient(135deg, ${colors.primary}, ${colors.secondary});
              ${isFriend ? 'border: 3px solid #FFD700;' : ''}
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 20px;
              overflow: hidden;
              flex-shrink: 0;
            ">
              ${avatarHtml}
            </div>
            <div>
              <div style="font-weight: 600; font-size: 16px; color: #111; display: flex; align-items: center; gap: 6px;">
                ${pin.createdBy?.name || 'Mingler'}
                ${isFriend ? '<span style="color: #FFD700;">⭐</span>' : ''}
                ${isOwnPin ? '<span style="font-size: 11px; padding: 2px 6px; background: #a855f7; color: white; border-radius: 4px; font-weight: 700;">YOU</span>' : ''}
              </div>
              <div style="font-size: 12px; color: #666; display: flex; align-items: center; gap: 4px;">
                ${isActive 
                  ? '<span style="width:8px;height:8px;background:#22c55e;border-radius:50%;"></span> Online now' 
                  : '<span style="width:8px;height:8px;background:#9ca3af;border-radius:50%;"></span> Active recently'
                }
              </div>
            </div>
          </div>
          <p style="font-size: 14px; color: #444; margin-bottom: 12px; line-height: 1.4;">
            ${pin.description || (pin.pinType === 'future' ? 'Heading there!' : 'Mingling here!')}
          </p>
          ${pin.arrivalTime && pin.pinType === 'future' ? `
            <div style="
              margin-bottom: 12px;
              padding: 10px 12px;
              background: linear-gradient(135deg, #a855f720, #ec489920);
              border-left: 3px solid #a855f7;
              border-radius: 8px;
            ">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="font-size: 16px;">🕐</span>
                <span style="font-size: 12px; font-weight: 600; color: #7c3aed;">ARRIVING</span>
              </div>
              <div style="font-size: 14px; font-weight: 700; color: #6b21a8;">
                ${formatCountdownForPin(pin.arrivalTime)}
              </div>
              <div style="font-size: 11px; color: #9333ea; margin-top: 2px;">
                ${new Date(pin.arrivalTime).toLocaleString('en-US', { 
                  month: 'short', 
                  day: 'numeric', 
                  hour: 'numeric', 
                  minute: '2-digit' 
                })}
              </div>
            </div>
          ` : ''}
          ${connectionBtnHtml}
          ${isOwnPin ? `
            <button 
              class="delete-pin-btn"
              style="
                width: 100%;
                padding: 10px 16px;
                background: linear-gradient(135deg, #ef4444, #dc2626);
                color: white;
                border: none;
                border-radius: 10px;
                font-weight: 600;
                font-size: 14px;
                cursor: pointer;
                transition: transform 0.1s, box-shadow 0.1s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
              "
              onmouseover="this.style.transform='scale(1.02)'; this.style.boxShadow='0 4px 12px #ef444440';"
              onmouseout="this.style.transform='scale(1)'; this.style.boxShadow='none';"
            >
              <span style="font-size: 16px;">🗑️</span>
              Delete Pin
            </button>
          ` : `
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
          `}
        </div>
      `;
      
      // Add click handler for View Profile
      const button = popupContent.querySelector('.view-profile-btn');
      if (button) {
        button.addEventListener('click', () => onPinClick(pin));
      }
      
      // Add click handler for Quick Connect
      const quickConnectBtn = popupContent.querySelector('.quick-connect-btn');
      if (quickConnectBtn) {
        quickConnectBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const userId = (quickConnectBtn as HTMLElement).dataset.userId;
          if (!userId) return;
          
          try {
            (quickConnectBtn as HTMLButtonElement).disabled = true;
            (quickConnectBtn as HTMLButtonElement).innerHTML = '⏳ Sending...';
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/request`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
              },
              body: JSON.stringify({ addresseeId: userId }),
            });
            
            if (response.ok) {
              (quickConnectBtn as HTMLButtonElement).innerHTML = '✓ Request Sent!';
              (quickConnectBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #22c55e, #16a34a)';
            } else {
              const data = await response.json();
              (quickConnectBtn as HTMLButtonElement).innerHTML = data.error || 'Failed';
              (quickConnectBtn as HTMLButtonElement).style.background = '#ef4444';
            }
          } catch (err) {
            (quickConnectBtn as HTMLButtonElement).innerHTML = '✗ Error';
            (quickConnectBtn as HTMLButtonElement).style.background = '#ef4444';
          }
        });
      }
      
      // Add click handler for Accept Connection
      const acceptBtn = popupContent.querySelector('.accept-btn');
      if (acceptBtn) {
        acceptBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const connectionId = (acceptBtn as HTMLElement).dataset.connectionId;
          if (!connectionId) return;
          
          try {
            (acceptBtn as HTMLButtonElement).disabled = true;
            (acceptBtn as HTMLButtonElement).innerHTML = '⏳ Accepting...';
            
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/connections/${connectionId}/accept`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            });
            
            if (response.ok) {
              (acceptBtn as HTMLButtonElement).innerHTML = '⭐ Connected!';
              (acceptBtn as HTMLButtonElement).style.background = 'linear-gradient(135deg, #FFD700, #FFA500)';
            } else {
              const data = await response.json();
              (acceptBtn as HTMLButtonElement).innerHTML = data.error || 'Failed';
              (acceptBtn as HTMLButtonElement).style.background = '#ef4444';
            }
          } catch (err) {
            (acceptBtn as HTMLButtonElement).innerHTML = '✗ Error';
            (acceptBtn as HTMLButtonElement).style.background = '#ef4444';
          }
        });
      }
      
      // Add click handler for Delete Pin
      const deletePinBtn = popupContent.querySelector('.delete-pin-btn');
      if (deletePinBtn) {
        deletePinBtn.addEventListener('click', (e) => {
          e.stopPropagation();
          haptic.softTick();
          
          setDeleteDialog({
            isOpen: true,
            pinId: pin.id,
            pinType: pin.pinType as 'current' | 'future',
          });
        });
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

// Component to handle map clicks in placement mode
function PlacementModeHandler({ 
  isActive, 
  onLocationSelected 
}: { 
  isActive: boolean; 
  onLocationSelected: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useEffect(() => {
    if (!isActive) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationSelected(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    
    // Change cursor to crosshair
    map.getContainer().style.cursor = 'crosshair';

    return () => {
      map.off('click', handleClick);
      map.getContainer().style.cursor = '';
    };
  }, [map, isActive, onLocationSelected]);

  return null;
}

// Component to track popup open/close state
function PopupStateHandler({ 
  onPopupChange 
}: { 
  onPopupChange: (isOpen: boolean) => void;
}) {
  const map = useMap();

  useEffect(() => {
    const handlePopupOpen = () => onPopupChange(true);
    const handlePopupClose = () => onPopupChange(false);

    map.on('popupopen', handlePopupOpen);
    map.on('popupclose', handlePopupClose);

    return () => {
      map.off('popupopen', handlePopupOpen);
      map.off('popupclose', handlePopupClose);
    };
  }, [map, onPopupChange]);

  return null;
}

export default function MapPage() {
  const navigate = useNavigate();
  const { pins, setUserLocation, setLookingForFilter, fetchPins } = useMapStore();
  const { user, isAuthenticated } = useAuthStore();
  
  // Map state
  const [userPosition, setUserPosition] = useState<[number, number] | null>(null);
  const [isLocating, setIsLocating] = useState(true);
  const [optimalZoom, setOptimalZoom] = useState(13); // Default zoom
  const [hasGPS, setHasGPS] = useState(true); // Track if GPS is available
  const mapRef = useRef<L.Map>(null);
  
  // Activity counts for the strip
  const [activityStats, setActivityStats] = useState({
    liveNow: 0,
    activeToday: 0,
    activeWeek: 0,
    total: 0,
    isEmpty: true,
  });
  
  // UI state
  const [currentMode, setCurrentMode] = useState<MingleMode>('everybody');
  const [distanceFilter, setDistanceFilter] = useState<DistanceFilter>('city');
  const [isVisible, setIsVisible] = useState(true);
  const [creatingPin, setCreatingPin] = useState(false);
  const [pinCreationSuccess, setPinCreationSuccess] = useState(false);
  const [pinSuccessMessage, setPinSuccessMessage] = useState('');
  const [isPlacementMode, setIsPlacementMode] = useState(false);
  const [placementType, setPlacementType] = useState<'here' | 'there' | null>(null);
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showTimePickerModal, setShowTimePickerModal] = useState(false);
  const [pendingPinCoordinates, setPendingPinCoordinates] = useState<{ lat: number; lng: number } | null>(null);
  
  // Welcome/Onboarding state
  const [showWelcomeCard, setShowWelcomeCard] = useState(false);
  const [showInterestsSetup, setShowInterestsSetup] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  
  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    pinId: string | null;
    pinType: 'current' | 'future' | null;
  }>({ isOpen: false, pinId: null, pinType: null });
  const [isDeleting, setIsDeleting] = useState(false);

  // Calculate viewport activity counts from pins
  const viewportStats = useMemo(() => {
    const liveNow = pins.filter(p => p.isActive === true).length;
    const activeToday = pins.length; // All pins returned are within 30 days, active ones are "today"
    return { liveNow, activeToday };
  }, [pins]);

  // Handle mode change - update store and refetch pins
  const handleModeChange = (mode: MingleMode) => {
    setCurrentMode(mode);
    setLookingForFilter(mode);
    
    // Refetch pins with new filter
    if (mapRef.current) {
      const bounds = mapRef.current.getBounds();
      fetchPins({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    }
  };

  // Manual refresh - refetch all pins
  const handleRefresh = async () => {
    if (isRefreshing || !mapRef.current) return;
    
    setIsRefreshing(true);
    try {
      const bounds = mapRef.current.getBounds();
      await fetchPins({
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      });
    } finally {
      // Minimum 500ms spin for visual feedback
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

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

  // Get geolocation and fetch optimal zoom
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const pos: [number, number] = [position.coords.latitude, position.coords.longitude];
        setUserPosition(pos);
        setUserLocation({ latitude: pos[0], longitude: pos[1] });
        setHasGPS(true);
        
        // Fetch nearby stats for auto-zoom
        try {
          const response = await api.get(`/api/pins/nearby?lat=${pos[0]}&lng=${pos[1]}`);
          if (response.data?.optimal) {
            setOptimalZoom(response.data.optimal.zoom);
            setActivityStats({
              liveNow: response.data.optimal.liveNow || 0,
              activeToday: response.data.optimal.activeToday || 0,
              activeWeek: response.data.optimal.activeWeek || 0,
              total: response.data.optimal.total || 0,
              isEmpty: response.data.isEmpty || false,
            });
          }
        } catch (err) {
          console.error('Failed to fetch nearby stats:', err);
        }
        
        setIsLocating(false);
      },
      () => {
        setUserPosition([37.7749, -122.4194]);
        setHasGPS(false); // GPS not available
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
      // GPS not available - fall back to manual placement
      setPlacementType('here');
      setIsPlacementMode(true);
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
      
      haptic.confirm(); // Haptic feedback on pin drop
      setPinSuccessMessage("You're checked in here.");
      setPinCreationSuccess(true);
      haptic.microPulse(); // Haptic for toast
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
        haptic.confirm();
        setPinSuccessMessage("You're checked in here.");
        setPinCreationSuccess(true);
        haptic.microPulse();
        setTimeout(() => setPinCreationSuccess(false), 3000);
      } else {
        alert(errorMsg || 'Failed to create pin');
      }
    } finally {
      setCreatingPin(false);
    }
  };

  // Handler for "Where I'll Be" or manual placement - drop pin at selected location
  const handlePlacementPinDrop = useCallback(async (lat: number, lng: number) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    const wasPlacementType = placementType;
    
    // If it's a "Where I'll Be" pin, show time picker first
    if (wasPlacementType === 'there') {
      setPendingPinCoordinates({ lat, lng });
      setShowTimePickerModal(true);
      setIsPlacementMode(false);
      setPlacementType(null);
      return;
    }

    // For "Where I'm At" pins, create immediately
    haptic.confirm(); // Haptic on map tap placement
    
    setIsPlacementMode(false);
    setPlacementType(null);
    setCreatingPin(true);
    
    try {
      await api.post('/api/pins/auto-create', {
        latitude: lat,
        longitude: lng,
      });
      
      haptic.confirm(); // Haptic on pin drop
      setPinSuccessMessage("You're checked in here.");
      setPinCreationSuccess(true);
      haptic.microPulse(); // Haptic for toast
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
        haptic.confirm();
        setPinSuccessMessage("You're checked in here.");
        setPinCreationSuccess(true);
        haptic.microPulse();
        setTimeout(() => setPinCreationSuccess(false), 3000);
      } else {
        alert(errorMsg || 'Failed to create pin');
      }
    } finally {
      setCreatingPin(false);
    }
  }, [isAuthenticated, navigate, placementType]);

  // Handle time picker confirmation for "Where I'll Be" pins
  const handleTimePickerConfirm = useCallback(async (arrivalTime: Date) => {
    if (!pendingPinCoordinates) return;
    
    setShowTimePickerModal(false);
    setCreatingPin(true);
    haptic.confirm();
    
    try {
      await api.post('/api/pins/auto-create', {
        latitude: pendingPinCoordinates.lat,
        longitude: pendingPinCoordinates.lng,
        arrivalTime: arrivalTime.toISOString(),
        pinType: 'future', // Mark as a future/destination pin
      });
      
      haptic.confirm();
      setPinSuccessMessage(`You'll arrive ${formatArrivalTime(arrivalTime)}!`);
      setPinCreationSuccess(true);
      haptic.microPulse();
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
      alert(errorMsg || 'Failed to create pin');
    } finally {
      setCreatingPin(false);
      setPendingPinCoordinates(null);
    }
  }, [pendingPinCoordinates]);

  // Format arrival time for success message
  const formatArrivalTime = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((date.getTime() - now.getTime()) / (1000 * 60));
    
    if (diffMinutes < 15) return 'in a few minutes';
    if (diffMinutes < 60) return `in ${diffMinutes} minutes`;
    if (diffMinutes < 120) return 'in about an hour';
    if (diffMinutes < 1440) return `in ${Math.floor(diffMinutes / 60)} hours`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Handle pin deletion
  const handleDeletePin = async () => {
    if (!deleteDialog.pinId) return;
    
    setIsDeleting(true);
    
    try {
      haptic.mediumImpact();
      
      // Optimistic update - remove pin from UI
      setPins(prev => prev.filter(p => p.id !== deleteDialog.pinId));
      
      // Call API
      await api.delete(`/api/pins/${deleteDialog.pinId}`);
      
      haptic.success();
      
      // Close dialog
      setDeleteDialog({ isOpen: false, pinId: null, pinType: null });
      
      // Refresh pins from server
      const bounds = mapRef.current?.getBounds();
      if (bounds) {
        useMapStore.getState().fetchPins({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
      
    } catch (error) {
      console.error('Error deleting pin:', error);
      haptic.error();
      
      // Revert optimistic update on error
      const bounds = mapRef.current?.getBounds();
      if (bounds) {
        useMapStore.getState().fetchPins({
          north: bounds.getNorth(),
          south: bounds.getSouth(),
          east: bounds.getEast(),
          west: bounds.getWest(),
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

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
        @keyframes friendGlow {
          0% { opacity: 0.7; transform: scale(1); }
          100% { opacity: 1; transform: scale(1.02); }
        }
      `}</style>

      {/* Top Control Bar with Visibility + Stats */}
      <MapControlBar
        currentMode={currentMode}
        onModeChange={handleModeChange}
        onMyLocation={handleCenterOnUser}
        isVisible={isVisible}
        onVisibilityToggle={handleVisibilityToggle}
        liveNow={viewportStats.liveNow}
        inView={viewportStats.activeToday}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing}
      />

      {/* Legend Info Button - Top Right */}
      <button
        onClick={() => setShowLegend(true)}
        style={{
          position: 'absolute',
          top: '16px',
          right: '16px',
          zIndex: 1000,
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(255, 255, 255, 0.98))',
          backdropFilter: 'blur(20px)',
          border: '2px solid rgba(168, 85, 247, 0.2)',
          boxShadow: '0 4px 20px rgba(168, 85, 247, 0.2)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(168, 85, 247, 0.4)';
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 4px 20px rgba(168, 85, 247, 0.2)';
        }}
      >
        <Info size={24} style={{ color: '#a855f7' }} />
      </button>

      {/* Two-Button Presence Row - directly below top bar */}
      <PresenceButtonRow
        isPlacementMode={isPlacementMode}
        placementType={placementType}
        hasGPS={hasGPS}
        hidden={isPopupOpen}
        onWhereImAt={handleDropPin}
        onWhereIllBe={() => {
          setPlacementType('there');
          setIsPlacementMode(true);
        }}
        onCancelPlacement={() => {
          haptic.softTick();
          setIsPlacementMode(false);
          setPlacementType(null);
        }}
      />

      {/* Map Container */}
      <MapContainer
        ref={mapRef}
        center={userPosition || [37.7749, -122.4194]}
        zoom={optimalZoom}
        className="w-full h-full"
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
        />

        <MapController />
        
        {/* Track popup open/close state */}
        <PopupStateHandler onPopupChange={setIsPopupOpen} />
        
        {/* Placement Mode Handler - for "I'm Heading There" */}
        <PlacementModeHandler 
          isActive={isPlacementMode} 
          onLocationSelected={handlePlacementPinDrop} 
        />
        
        {/* Clustered Pins with mode-aware styling */}
        <ClusteredMarkers pins={pins} mode={currentMode} onPinClick={handlePinClick} />

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

      {/* Success Toast */}
      {pinCreationSuccess && (
        <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-[1000] animate-in fade-in slide-in-from-bottom-4">
          <div className="bg-gray-900 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="text-lg">✓</span>
            <span className="font-medium">{pinSuccessMessage || "You're checked in!"}</span>
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

      {/* Time Picker Modal for "Where I'll Be" */}
      <TimePickerModal
        isOpen={showTimePickerModal}
        onClose={() => {
          setShowTimePickerModal(false);
          setPendingPinCoordinates(null);
        }}
        onConfirm={handleTimePickerConfirm}
      />

      {/* Legend Modal */}
      <LegendModal 
        isOpen={showLegend}
        onClose={() => setShowLegend(false)}
      />

      {/* Delete Pin Confirmation */}
      <ConfirmDialog
        isOpen={deleteDialog.isOpen}
        onClose={() => setDeleteDialog({ isOpen: false, pinId: null, pinType: null })}
        onConfirm={handleDeletePin}
        title="Delete Pin?"
        message={
          deleteDialog.pinType === 'future'
            ? "Remove your 'Where I'll Be' pin? Others won't see your arrival countdown."
            : "Remove your 'Where I'm At' pin? Others won't see your current location."
        }
        confirmText="Delete"
        cancelText="Keep Pin"
        variant="danger"
        isLoading={isDeleting}
      />
    </div>
  );
}
