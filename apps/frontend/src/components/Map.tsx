import { useEffect, useRef } from 'react';

interface MapViewProps {
  onMapReady?: (map: any) => void;
}

export function MapView({ onMapReady }: MapViewProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize Google Maps
    const initMap = () => {
      if (!(window as any).google) {
        console.error('Google Maps not loaded');
        return;
      }

      const map = new (window as any).google.maps.Map(mapRef.current, {
        center: { lat: 37.7749, lng: -122.4194 }, // Default to San Francisco
        zoom: 12,
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
      });

      mapInstanceRef.current = map;

      if (onMapReady) {
        onMapReady(map);
      }
    };

    // Check if Google Maps is already loaded
    if ((window as any).google) {
      initMap();
    } else {
      // Wait for Google Maps to load
      const checkGoogleMaps = setInterval(() => {
        if ((window as any).google) {
          clearInterval(checkGoogleMaps);
          initMap();
        }
      }, 100);

      return () => clearInterval(checkGoogleMaps);
    }
  }, [onMapReady]);

  return <div ref={mapRef} className="w-full h-full" />;
}
