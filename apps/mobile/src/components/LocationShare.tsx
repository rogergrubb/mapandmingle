import { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Animated,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import MapView, { Marker, PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { LinearGradient } from 'expo-linear-gradient';

interface LocationShareProps {
  visible: boolean;
  onClose: () => void;
  onShare: (location: SharedLocation) => void;
}

interface SharedLocation {
  latitude: number;
  longitude: number;
  address?: string;
  duration?: number; // in minutes, for live sharing
  isLive?: boolean;
}

interface LocationMessageProps {
  location: SharedLocation;
  isOwn: boolean;
  senderName?: string;
  onPress: () => void;
}

// Location Share Modal
export default function LocationShareModal({
  visible,
  onClose,
  onShare,
}: LocationShareProps) {
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [shareMode, setShareMode] = useState<'current' | 'live' | 'custom'>('current');
  const [liveDuration, setLiveDuration] = useState(15); // minutes
  const [address, setAddress] = useState<string>('');

  const mapRef = useRef<MapView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      fetchLocation();
      
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const fetchLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to share your location.');
        onClose();
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setCurrentLocation(location);
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      // Reverse geocode for address
      const [geocode] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocode) {
        const addressParts = [
          geocode.street,
          geocode.city,
          geocode.region,
        ].filter(Boolean);
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Unable to get your location. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleMapPress = async (event: any) => {
    if (shareMode !== 'custom') return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const { coordinate } = event.nativeEvent;
    setSelectedLocation(coordinate);

    // Reverse geocode
    try {
      const [geocode] = await Location.reverseGeocodeAsync(coordinate);
      if (geocode) {
        const addressParts = [
          geocode.street,
          geocode.city,
          geocode.region,
        ].filter(Boolean);
        setAddress(addressParts.join(', '));
      }
    } catch (error) {
      setAddress('Custom location');
    }
  };

  const handleShare = () => {
    if (!selectedLocation) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    const sharedLocation: SharedLocation = {
      latitude: selectedLocation.latitude,
      longitude: selectedLocation.longitude,
      address,
      isLive: shareMode === 'live',
      duration: shareMode === 'live' ? liveDuration : undefined,
    };

    onShare(sharedLocation);
    handleClose();
  };

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => onClose());
  };

  const durationOptions = [15, 30, 60, 120];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View
        style={{ opacity: fadeAnim }}
        className="flex-1 bg-black/50"
      >
        <TouchableOpacity
          className="flex-1"
          activeOpacity={1}
          onPress={handleClose}
        />

        <Animated.View
          style={{ transform: [{ translateY: slideAnim }] }}
          className="bg-white rounded-t-3xl h-[80%]"
        >
          {/* Handle */}
          <View className="items-center py-3">
            <View className="w-10 h-1 bg-gray-300 rounded-full" />
          </View>

          {/* Header */}
          <View className="flex-row items-center justify-between px-4 pb-4">
            <Text className="text-xl font-bold text-gray-900">Share Location</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {/* Map */}
          <View className="flex-1 mx-4 rounded-2xl overflow-hidden">
            {isLoading ? (
              <View className="flex-1 bg-gray-100 items-center justify-center">
                <ActivityIndicator size="large" color="#FF6B9D" />
                <Text className="text-gray-500 mt-2">Getting your location...</Text>
              </View>
            ) : (
              <MapView
                ref={mapRef}
                style={{ flex: 1 }}
                initialRegion={{
                  latitude: currentLocation?.coords.latitude || 37.78825,
                  longitude: currentLocation?.coords.longitude || -122.4324,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
                showsUserLocation={shareMode !== 'custom'}
              >
                {selectedLocation && shareMode === 'custom' && (
                  <Marker coordinate={selectedLocation}>
                    <View className="bg-primary-500 p-2 rounded-full">
                      <Ionicons name="location" size={24} color="white" />
                    </View>
                  </Marker>
                )}
              </MapView>
            )}
          </View>

          {/* Share Options */}
          <View className="p-4">
            {/* Mode Selection */}
            <View className="flex-row mb-4 bg-gray-100 rounded-xl p-1">
              {[
                { key: 'current', label: 'Current', icon: 'locate' },
                { key: 'live', label: 'Live', icon: 'pulse' },
                { key: 'custom', label: 'Pin', icon: 'pin' },
              ].map((mode) => (
                <TouchableOpacity
                  key={mode.key}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setShareMode(mode.key as any);
                    if (mode.key === 'current' && currentLocation) {
                      setSelectedLocation({
                        latitude: currentLocation.coords.latitude,
                        longitude: currentLocation.coords.longitude,
                      });
                    }
                  }}
                  className={`flex-1 flex-row items-center justify-center py-2 rounded-lg ${
                    shareMode === mode.key ? 'bg-white shadow-sm' : ''
                  }`}
                >
                  <Ionicons
                    name={mode.icon as any}
                    size={16}
                    color={shareMode === mode.key ? '#FF6B9D' : '#6B7280'}
                  />
                  <Text
                    className={`ml-1 font-medium ${
                      shareMode === mode.key ? 'text-primary-500' : 'text-gray-600'
                    }`}
                  >
                    {mode.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Live Duration Options */}
            {shareMode === 'live' && (
              <View className="mb-4">
                <Text className="text-sm text-gray-600 mb-2">Share for:</Text>
                <View className="flex-row space-x-2">
                  {durationOptions.map((duration) => (
                    <TouchableOpacity
                      key={duration}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setLiveDuration(duration);
                      }}
                      className={`flex-1 py-2 rounded-lg items-center ${
                        liveDuration === duration
                          ? 'bg-primary-500'
                          : 'bg-gray-100'
                      }`}
                    >
                      <Text
                        className={`font-medium ${
                          liveDuration === duration ? 'text-white' : 'text-gray-700'
                        }`}
                      >
                        {duration < 60 ? `${duration}m` : `${duration / 60}h`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Address Display */}
            {address && (
              <View className="flex-row items-center mb-4 p-3 bg-gray-50 rounded-xl">
                <Ionicons name="location" size={20} color="#FF6B9D" />
                <Text className="flex-1 ml-2 text-gray-700" numberOfLines={1}>
                  {address}
                </Text>
              </View>
            )}

            {/* Share Button */}
            <TouchableOpacity
              onPress={handleShare}
              disabled={!selectedLocation || isLoading}
            >
              <LinearGradient
                colors={selectedLocation ? ['#FF6B9D', '#FF8FB1'] : ['#E5E7EB', '#E5E7EB']}
                className="py-4 rounded-xl items-center flex-row justify-center"
              >
                <Ionicons
                  name={shareMode === 'live' ? 'pulse' : 'location'}
                  size={20}
                  color={selectedLocation ? 'white' : '#9CA3AF'}
                />
                <Text
                  className={`ml-2 font-semibold ${
                    selectedLocation ? 'text-white' : 'text-gray-400'
                  }`}
                >
                  {shareMode === 'live' ? 'Start Live Sharing' : 'Share Location'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

// Location Message Bubble Component
export function LocationMessage({
  location,
  isOwn,
  senderName,
  onPress,
}: LocationMessageProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className={`max-w-[75%] ${isOwn ? 'self-end' : 'self-start'}`}
      activeOpacity={0.8}
    >
      <View
        className={`rounded-2xl overflow-hidden ${
          isOwn ? 'bg-primary-500' : 'bg-white border border-gray-200'
        }`}
      >
        {/* Mini Map Preview */}
        <View className="h-32 w-56">
          <MapView
            style={{ flex: 1 }}
            initialRegion={{
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            rotateEnabled={false}
            pitchEnabled={false}
          >
            <Marker
              coordinate={{
                latitude: location.latitude,
                longitude: location.longitude,
              }}
            >
              <View className="bg-primary-500 p-1.5 rounded-full">
                <Ionicons name="location" size={16} color="white" />
              </View>
            </Marker>
          </MapView>
        </View>

        {/* Location Info */}
        <View className="p-3">
          <View className="flex-row items-center">
            {location.isLive && (
              <View className="flex-row items-center mr-2">
                <View className="w-2 h-2 rounded-full bg-green-500 mr-1" />
                <Text className={`text-xs font-medium ${isOwn ? 'text-white/80' : 'text-green-600'}`}>
                  Live
                </Text>
              </View>
            )}
            <Ionicons
              name="location"
              size={14}
              color={isOwn ? 'white' : '#6B7280'}
            />
            <Text
              className={`ml-1 text-sm font-medium ${
                isOwn ? 'text-white' : 'text-gray-900'
              }`}
            >
              {location.isLive ? `${senderName}'s Location` : 'Shared Location'}
            </Text>
          </View>
          
          {location.address && (
            <Text
              className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-gray-500'}`}
              numberOfLines={1}
            >
              {location.address}
            </Text>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

// Live Location Tracker (for real-time updates)
interface LiveLocationTrackerProps {
  isActive: boolean;
  onLocationUpdate: (location: { latitude: number; longitude: number }) => void;
  updateInterval?: number; // in seconds
}

export function useLiveLocationTracker({
  isActive,
  onLocationUpdate,
  updateInterval = 10,
}: LiveLocationTrackerProps) {
  useEffect(() => {
    if (!isActive) return;

    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: updateInterval * 1000,
          distanceInterval: 10, // minimum 10 meters
        },
        (location) => {
          onLocationUpdate({
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          });
        }
      );
    };

    startTracking();

    return () => {
      subscription?.remove();
    };
  }, [isActive, updateInterval, onLocationUpdate]);
}
