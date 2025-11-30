import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, Platform, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { Region } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useAuthStore } from '../../src/stores/auth';
import { api } from '../../src/lib/api';
import ClusteredMapView, { ClusteredMapViewRef, Hotspot } from '../../src/components/MapViewClustered';
import MapTutorialOverlay from '../../src/components/MapTutorialOverlay';
import type { Pin } from '@mapmingle/contracts';

export default function MapScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const mapRef = useRef<ClusteredMapViewRef>(null);
  
  const [pins, setPins] = useState<Pin[]>([]);
  const [hotspots, setHotspots] = useState<Hotspot[]>([]);
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [region, setRegion] = useState<Region | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [showHotZoneMenu, setShowHotZoneMenu] = useState(false);

  const fabScale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setIsLoading(false);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({});
      setLocation(loc);
      setRegion({
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });

      // Fetch nearby mingles
      try {
        const response = await api.get('/api/mingles', {
          params: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
          },
        });
        setPins(response || []);
      } catch (error) {
        console.error('Failed to fetch mingles:', error);
      }

      setIsLoading(false);
    })();
  }, []);

  const handlePinPress = (pin: Pin) => {
    router.push(`/pin/${pin.id}`);
  };

  const handleCenterOnUser = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-white">
        <ActivityIndicator size="large" color="#FF6B9D" />
        <Text className="mt-4 text-gray-500">Finding your location...</Text>
      </View>
    );
  }

  return (
    <View className="flex-1">
      {/* Clustered Map */}
      <ClusteredMapView
        ref={mapRef}
        pins={pins}
        initialRegion={region || {
          latitude: 37.78825,
          longitude: -122.4324,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        onPinPress={handlePinPress}
        showUserLocation
      />

      {/* Hot Zone Menu Button */}
      <View className="absolute top-12 left-4 z-40">
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowHotZoneMenu(!showHotZoneMenu)}
          className="bg-red-500 rounded-full p-4 shadow-lg flex-row items-center gap-2"
          style={{
            shadowColor: '#ef4444',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 4,
            elevation: 5,
          }}
        >
          <Ionicons name="flame" size={24} color="white" />
          <Text className="text-white font-bold">Hot Zone</Text>
        </TouchableOpacity>

        {/* Hot Zone Menu Dropdown */}
        {showHotZoneMenu && (
          <BlurView intensity={90} className="absolute top-16 left-0 rounded-xl overflow-hidden shadow-lg">
            <View className="bg-white/95 rounded-xl overflow-hidden">
              {/* Mingle Hot Zone */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  router.push('/mingles');
                  setShowHotZoneMenu(false);
                }}
                className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-200"
              >
                <View className="bg-orange-100 rounded-full p-2">
                  <Ionicons name="flame" size={20} color="#f97316" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800">Mingle Hot Zone</Text>
                  <Text className="text-xs text-gray-500">Browse active mingles</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {/* Create a Mingle */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (!isAuthenticated) {
                    router.push('/(auth)/login');
                  } else {
                    router.push('/create-mingle');
                  }
                  setShowHotZoneMenu(false);
                }}
                className="flex-row items-center gap-3 px-4 py-4 border-b border-gray-200"
              >
                <View className="bg-green-100 rounded-full p-2">
                  <Ionicons name="add-circle" size={20} color="#16a34a" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800">Create a Mingle</Text>
                  <Text className="text-xs text-gray-500">Start your own meetup</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>

              {/* Find a Mingler */}
              <TouchableOpacity
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  if (!isAuthenticated) {
                    router.push('/(auth)/login');
                  } else {
                    router.push('/find-mingler');
                  }
                  setShowHotZoneMenu(false);
                }}
                className="flex-row items-center gap-3 px-4 py-4"
              >
                <View className="bg-purple-100 rounded-full p-2">
                  <Ionicons name="search" size={20} color="#a855f7" />
                </View>
                <View className="flex-1">
                  <Text className="font-bold text-gray-800">Find a Mingler</Text>
                  <Text className="text-xs text-gray-500">Search & message users</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#999" />
              </TouchableOpacity>
            </View>
          </BlurView>
        )}
      </View>

      {/* Center on User Button */}
      <View className="absolute bottom-36 right-4 z-30">
        <TouchableOpacity
          onPress={handleCenterOnUser}
          className="bg-white p-3 rounded-full shadow-lg"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons name="locate" size={24} color="#FF6B9D" />
        </TouchableOpacity>
      </View>

      {/* Tutorial Overlay */}
      {showTutorial && (
        <MapTutorialOverlay
          onComplete={() => setShowTutorial(false)}
        />
      )}

      {/* Close Hot Zone Menu when tapping map */}
      {showHotZoneMenu && (
        <TouchableOpacity
          activeOpacity={1}
          onPress={() => setShowHotZoneMenu(false)}
          className="absolute inset-0 z-20"
        />
      )}
    </View>
  );
}
