import { useState, useEffect } from 'react';

interface GeolocationCoordinates {
  latitude: number;
  longitude: number;
}

interface UseGeolocationReturn {
  coordinates: GeolocationCoordinates | null;
  loading: boolean;
  error: string | null;
  requestPermission: () => Promise<GeolocationCoordinates | null>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [coordinates, setCoordinates] = useState<GeolocationCoordinates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestPermission = async (): Promise<GeolocationCoordinates | null> => {
    setLoading(true);
    setError(null);

    return new Promise((resolve) => {
      if (!navigator.geolocation) {
        const errorMsg = 'Geolocation is not supported by your browser';
        setError(errorMsg);
        setLoading(false);
        resolve(null);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
          setCoordinates(coords);
          setLoading(false);
          resolve(coords);
        },
        (error) => {
          let errorMsg = 'Failed to get location';
          if (error.code === error.PERMISSION_DENIED) {
            errorMsg = 'Location permission denied. Please enable location access.';
          } else if (error.code === error.POSITION_UNAVAILABLE) {
            errorMsg = 'Location unavailable. Please try again.';
          } else if (error.code === error.TIMEOUT) {
            errorMsg = 'Location request timed out. Please try again.';
          }
          setError(errorMsg);
          setLoading(false);
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  return { coordinates, loading, error, requestPermission };
}
