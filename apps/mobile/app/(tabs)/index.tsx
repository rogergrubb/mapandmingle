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
  const [filter, setFilter] = useState<'all' | '24h' | 'week'>('all');
  const [showHotspots, setShowHotspots] = useState(true);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [showTutorial, setShowTutorial] = useState(true);

  // Animations
  const fabScale = useRef(new Animated.Value(1)).current;
  const filterBgAnim = useRef(new Animated.Value(0)).current;

  // Get user location
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission denied');
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
      setIsLoading(false);
    })();
  }, []);

  // Fetch pins when region changes
  const fetchPins = useCallback(async (r: Region) => {
    try {
      const response = await api.get<Pin[]>('/api/pins', {
        params: {
          north: r.latitude + r.latitudeDelta / 2,
          south: r.latitude - r.latitudeDelta / 2,
          east: r.longitude + r.longitudeDelta / 2,
          west: r.longitude - r.longitudeDelta / 2,
          filter,
        },
      });
      setPins(response);
      setNearbyCount(response.length);
    } catch (error) {
      console.error('Error fetching pins:', error);
    }
  }, [filter]);

  // Fetch hotspots when enabled
  const fetchHotspots = useCallback(async (r: Region) => {
    if (!showHotspots) return;
    
    try {
      const response = await api.get<Hotspot[]>('/api/hotspots', {
        params: {
          latitude: r.latitude,
          longitude: r.longitude,
          radius: Math.max(r.latitudeDelta, r.longitudeDelta) * 111, // km
        },
      });
      setHotspots(response);
    } catch (error) {
      console.error('Error fetching hotspots:', error);
    }
  }, [showHotspots]);

  useEffect(() => {
    if (region) {
      fetchPins(region);
      fetchHotspots(region);
    }
  }, [region, filter, fetchPins, fetchHotspots]);

  const handleRegionChange = (r: Region) => {
    setRegion(r);
  };

  const handleCreatePin = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate FAB
    Animated.sequence([
      Animated.timing(fabScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(fabScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/create-pin');
  };

  const handleCreateMingle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    router.push('/create-mingle');
  };

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

  const handleFilterChange = (newFilter: 'all' | '24h' | 'week') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setFilter(newFilter);
    
    // Animate filter background
    Animated.spring(filterBgAnim, {
      toValue: newFilter === 'all' ? 0 : newFilter === '24h' ? 1 : 2,
      useNativeDriver: false,
      tension: 50,
      friction: 8,
    }).start();
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
        onRegionChange={handleRegionChange}
        onPinPress={handlePinPress}
        showHotspots={showHotspots}
        hotspots={hotspots}
        showUserLocation
      />

      {/* Top Bar - Filter Pills */}
      <View className="absolute top-12 left-4 right-16">
        <View className="bg-white/90 rounded-full p-1 flex-row shadow-lg">
          {(['all', '24h', 'week'] as const).map((f, index) => (
            <TouchableOpacity
              key={f}
              onPress={() => handleFilterChange(f)}
              className={`flex-1 py-2 px-4 rounded-full ${
                filter === f ? 'bg-primary-500' : 'bg-transparent'
              }`}
            >
              <Text 
                className={`text-center font-semibold ${
                  filter === f ? 'text-white' : 'text-gray-600'
                }`}
              >
                {f === 'all' ? 'All' : f === '24h' ? '24h' : 'Week'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Create Mingle Button - Flame Icon */}
      <View className="absolute top-12 right-4">
        <Text className="text-xs text-gray-600 font-semibold text-right mb-1">Start Mingle</Text>
        <TouchableOpacity
          onPress={handleCreateMingle}
          className={`p-3 rounded-full shadow-lg bg-orange-500`}
          style={{
            shadowColor: '#F97316',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 4,
          }}
        >
          <Ionicons 
            name="flame" 
            size={24} 
            color="white" 
          />
        </TouchableOpacity>
      </View>

      {/* Center on User Button */}
      <View className="absolute bottom-36 right-4">
        <TouchableOpacity
          onPress={handleCenterOnUser}
          className="bg-white p-3 rounded-full shadow-lg mb-1"
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
        <Text className="text-xs text-gray-600 font-semibold text-center">My Location</Text>
      </View>

      {/* Create Pin FAB */}
      <View
        style={{
          position: 'absolute',
          bottom: 160,
          left: '50%',
          marginLeft: -28,
        }}
      >
        <Text className="text-xs text-gray-600 font-semibold text-center mb-1">Add Pin</Text>
        <Animated.View
          style={{
            transform: [{ scale: fabScale }],
          }}
        >
          <TouchableOpacity
            onPress={handleCreatePin}
            className="bg-primary-500 p-4 rounded-full shadow-xl"
            style={{
              shadowColor: '#FF6B9D',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 8,
              elevation: 8,
            }}
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={28} color="white" />
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Bottom Info Card */}
      <View className="absolute bottom-24 left-4 right-4">
        <BlurView intensity={80} className="rounded-2xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 py-3 bg-white/70">
            <View className="flex-row items-center">
              <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
              <Text className="text-gray-700 font-medium">
                {nearbyCount} {nearbyCount === 1 ? 'person' : 'people'} nearby
              </Text>
            </View>
            
            {showHotspots && hotspots.length > 0 && (
              <View className="flex-row items-center">
                <Ionicons name="flame" size={16} color="#F97316" />
                <Text className="text-orange-600 font-medium ml-1">
                  {hotspots.length} hotspots
                </Text>
              </View>
            )}
          </View>
        </BlurView>
      </View>

      {/* Activity Intent Quick Status */}
      {user?.activityIntent && (
        <View className="absolute top-28 left-4">
          <View className="bg-white/90 rounded-full px-3 py-2 flex-row items-center shadow-md">
            <View className="w-2 h-2 rounded-full bg-green-500 mr-2" />
            <Text className="text-gray-700 text-sm font-medium">
              {user.activityIntent}
            </Text>
          </View>
        </View>
      )}

      {/* Map Tutorial Overlay - First Time Users */}
      {showTutorial && (
        <MapTutorialOverlay
          onComplete={() => setShowTutorial(false)}
        />
      )}
    </View>
  );
}
