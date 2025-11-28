import { useState, useCallback, useMemo, useRef, forwardRef, useImperativeHandle } from 'react';
import { View, Text, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Region, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import type { Pin } from '@mapmingle/contracts';

const { width, height } = Dimensions.get('window');

// Configuration
const CLUSTER_RADIUS = 50; // pixels
const MIN_CLUSTER_SIZE = 2;
const MAX_ZOOM_FOR_CLUSTERING = 0.05; // latitudeDelta threshold

interface ClusteredMapViewProps {
  pins: Pin[];
  initialRegion?: Region;
  onRegionChange?: (region: Region) => void;
  onPinPress?: (pin: Pin) => void;
  onClusterPress?: (cluster: Cluster, region: Region) => void;
  showHotspots?: boolean;
  hotspots?: Hotspot[];
  showUserLocation?: boolean;
  style?: object;
}

interface Cluster {
  id: string;
  coordinate: {
    latitude: number;
    longitude: number;
  };
  pins: Pin[];
  count: number;
}

interface Hotspot {
  id: string;
  latitude: number;
  longitude: number;
  radius: number;
  intensity: number;
  name: string;
}

export interface ClusteredMapViewRef {
  animateToRegion: (region: Region) => void;
  fitToCoordinates: (coordinates: { latitude: number; longitude: number }[]) => void;
  getMapBoundaries: () => Promise<{ northEast: { latitude: number; longitude: number }; southWest: { latitude: number; longitude: number } }>;
}

// Utility: Calculate distance between two coordinates in pixels
const getPixelDistance = (
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
  region: Region
): number => {
  const latDiff = Math.abs(lat1 - lat2);
  const lngDiff = Math.abs(lng1 - lng2);
  
  // Convert to pixels based on current region
  const latPixels = (latDiff / region.latitudeDelta) * height;
  const lngPixels = (lngDiff / region.longitudeDelta) * width;
  
  return Math.sqrt(latPixels * latPixels + lngPixels * lngPixels);
};

// Utility: Create clusters from pins
const clusterPins = (pins: Pin[], region: Region): (Pin | Cluster)[] => {
  // Don't cluster if zoomed in enough
  if (region.latitudeDelta < MAX_ZOOM_FOR_CLUSTERING) {
    return pins;
  }

  const clusters: Cluster[] = [];
  const processedPins = new Set<string>();

  pins.forEach((pin) => {
    if (processedPins.has(pin.id)) return;

    // Find nearby pins
    const nearbyPins = pins.filter((otherPin) => {
      if (processedPins.has(otherPin.id) || pin.id === otherPin.id) return false;
      
      const distance = getPixelDistance(
        pin.latitude,
        pin.longitude,
        otherPin.latitude,
        otherPin.longitude,
        region
      );
      
      return distance < CLUSTER_RADIUS;
    });

    if (nearbyPins.length >= MIN_CLUSTER_SIZE - 1) {
      // Create cluster
      const clusterPins = [pin, ...nearbyPins];
      clusterPins.forEach((p) => processedPins.add(p.id));

      // Calculate center of cluster
      const avgLat = clusterPins.reduce((sum, p) => sum + p.latitude, 0) / clusterPins.length;
      const avgLng = clusterPins.reduce((sum, p) => sum + p.longitude, 0) / clusterPins.length;

      clusters.push({
        id: `cluster-${pin.id}`,
        coordinate: {
          latitude: avgLat,
          longitude: avgLng,
        },
        pins: clusterPins,
        count: clusterPins.length,
      });
    }
  });

  // Return unclustered pins + clusters
  const unclusteredPins = pins.filter((pin) => !processedPins.has(pin.id));
  return [...unclusteredPins, ...clusters];
};

// Check if item is a cluster
const isCluster = (item: Pin | Cluster): item is Cluster => {
  return 'count' in item;
};

// Pin category colors
const getPinColor = (category?: string): string => {
  const colors: Record<string, string> = {
    social: '#FF6B9D',
    food: '#F97316',
    sports: '#22C55E',
    music: '#8B5CF6',
    travel: '#06B6D4',
    gaming: '#EAB308',
    art: '#EC4899',
    study: '#3B82F6',
    default: '#FF6B9D',
  };
  return colors[category || 'default'] || colors.default;
};

// Pin category icons
const getPinIcon = (category?: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    social: 'people',
    food: 'restaurant',
    sports: 'basketball',
    music: 'musical-notes',
    travel: 'airplane',
    gaming: 'game-controller',
    art: 'color-palette',
    study: 'book',
    default: 'location',
  };
  return icons[category || 'default'] || icons.default;
};

const ClusteredMapView = forwardRef<ClusteredMapViewRef, ClusteredMapViewProps>(
  (
    {
      pins,
      initialRegion,
      onRegionChange,
      onPinPress,
      onClusterPress,
      showHotspots = false,
      hotspots = [],
      showUserLocation = true,
      style,
    },
    ref
  ) => {
    const mapRef = useRef<MapView>(null);
    const [currentRegion, setCurrentRegion] = useState<Region>(
      initialRegion || {
        latitude: 37.78825,
        longitude: -122.4324,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }
    );

    // Expose map methods to parent
    useImperativeHandle(ref, () => ({
      animateToRegion: (region: Region) => {
        mapRef.current?.animateToRegion(region);
      },
      fitToCoordinates: (coordinates: { latitude: number; longitude: number }[]) => {
        mapRef.current?.fitToCoordinates(coordinates, {
          edgePadding: { top: 100, right: 50, bottom: 100, left: 50 },
          animated: true,
        });
      },
      getMapBoundaries: async () => {
        const boundaries = await mapRef.current?.getMapBoundaries();
        return boundaries || {
          northEast: { latitude: 0, longitude: 0 },
          southWest: { latitude: 0, longitude: 0 },
        };
      },
    }));

    // Compute clusters
    const clusteredItems = useMemo(() => {
      return clusterPins(pins, currentRegion);
    }, [pins, currentRegion]);

    const handleRegionChange = useCallback(
      (region: Region) => {
        setCurrentRegion(region);
        onRegionChange?.(region);
      },
      [onRegionChange]
    );

    const handlePinPress = useCallback(
      (pin: Pin) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPinPress?.(pin);
      },
      [onPinPress]
    );

    const handleClusterPress = useCallback(
      (cluster: Cluster) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        
        // Calculate zoom region to show all pins in cluster
        const latitudes = cluster.pins.map((p) => p.latitude);
        const longitudes = cluster.pins.map((p) => p.longitude);
        
        const minLat = Math.min(...latitudes);
        const maxLat = Math.max(...latitudes);
        const minLng = Math.min(...longitudes);
        const maxLng = Math.max(...longitudes);
        
        const zoomRegion: Region = {
          latitude: (minLat + maxLat) / 2,
          longitude: (minLng + maxLng) / 2,
          latitudeDelta: Math.max((maxLat - minLat) * 1.5, 0.01),
          longitudeDelta: Math.max((maxLng - minLng) * 1.5, 0.01),
        };

        if (onClusterPress) {
          onClusterPress(cluster, zoomRegion);
        } else {
          mapRef.current?.animateToRegion(zoomRegion, 300);
        }
      },
      [onClusterPress]
    );

    // Get cluster size for styling
    const getClusterSize = (count: number): number => {
      if (count < 10) return 40;
      if (count < 50) return 48;
      if (count < 100) return 56;
      return 64;
    };

    return (
      <MapView
        ref={mapRef}
        style={[{ flex: 1 }, style]}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={initialRegion || currentRegion}
        onRegionChangeComplete={handleRegionChange}
        showsUserLocation={showUserLocation}
        showsMyLocationButton={false}
        showsCompass={false}
        rotateEnabled={false}
        pitchEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 80, left: 0 }}
      >
        {/* Hotspot Circles */}
        {showHotspots &&
          hotspots.map((hotspot) => (
            <Circle
              key={hotspot.id}
              center={{
                latitude: hotspot.latitude,
                longitude: hotspot.longitude,
              }}
              radius={hotspot.radius}
              fillColor={`rgba(249, 115, 22, ${0.1 + hotspot.intensity * 0.2})`}
              strokeColor="rgba(249, 115, 22, 0.5)"
              strokeWidth={2}
            />
          ))}

        {/* Pins and Clusters */}
        {clusteredItems.map((item) => {
          if (isCluster(item)) {
            // Render Cluster
            const size = getClusterSize(item.count);
            return (
              <Marker
                key={item.id}
                coordinate={item.coordinate}
                onPress={() => handleClusterPress(item)}
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <View
                  style={{
                    width: size,
                    height: size,
                    borderRadius: size / 2,
                    backgroundColor: '#FF6B9D',
                    alignItems: 'center',
                    justifyContent: 'center',
                    shadowColor: '#FF6B9D',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <View
                    style={{
                      width: size - 6,
                      height: size - 6,
                      borderRadius: (size - 6) / 2,
                      backgroundColor: '#FF6B9D',
                      borderWidth: 2,
                      borderColor: 'white',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{
                        color: 'white',
                        fontWeight: 'bold',
                        fontSize: size > 48 ? 16 : 14,
                      }}
                    >
                      {item.count > 99 ? '99+' : item.count}
                    </Text>
                  </View>
                </View>
              </Marker>
            );
          }

          // Render Individual Pin
          const pin = item as Pin;
          const pinColor = getPinColor(pin.category);
          const pinIcon = getPinIcon(pin.category);

          return (
            <Marker
              key={pin.id}
              coordinate={{
                latitude: pin.latitude,
                longitude: pin.longitude,
              }}
              onPress={() => handlePinPress(pin)}
              anchor={{ x: 0.5, y: 1 }}
            >
              <View style={{ alignItems: 'center' }}>
                <View
                  style={{
                    backgroundColor: pinColor,
                    borderRadius: 20,
                    padding: 8,
                    shadowColor: pinColor,
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.4,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Ionicons name={pinIcon} size={20} color="white" />
                </View>
                {/* Pin tail */}
                <View
                  style={{
                    width: 0,
                    height: 0,
                    borderLeftWidth: 8,
                    borderRightWidth: 8,
                    borderTopWidth: 8,
                    borderLeftColor: 'transparent',
                    borderRightColor: 'transparent',
                    borderTopColor: pinColor,
                    marginTop: -1,
                  }}
                />
              </View>
            </Marker>
          );
        })}
      </MapView>
    );
  }
);

ClusteredMapView.displayName = 'ClusteredMapView';

export default ClusteredMapView;
export type { Cluster, Hotspot };
