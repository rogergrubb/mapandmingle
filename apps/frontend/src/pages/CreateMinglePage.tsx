import { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Flame, Camera, Images, MapPin, Info, X, Loader } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface LocationCoords {
  lat: number;
  lng: number;
}

// Map click handler component - must be inside MapContainer
function MapClickHandler({ onLocationChange }: { onLocationChange: (lat: number, lng: number) => void }) {
  const map = useMap();

  useEffect(() => {
    const handleClick = (e: L.LeafletMouseEvent) => {
      onLocationChange(e.latlng.lat, e.latlng.lng);
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [map, onLocationChange]);

  return null;
}

// Map updater - keeps map centered on location
function MapUpdater({ location }: { location: LocationCoords }) {
  const map = useMap();
  useEffect(() => {
    map.setView([location.lat, location.lng], 15);
  }, [map, location]);
  return null;
}

function LocationPickerModal({
  initialLocation,
  onConfirm,
  onCancel,
}: {
  initialLocation: LocationCoords;
  onConfirm: (location: LocationCoords, name: string) => void;
  onCancel: () => void;
}) {
  const [location, setLocation] = useState<LocationCoords>(initialLocation);

  const handleConfirm = async () => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.lat}&lon=${location.lng}`
      );
      const data = await response.json();
      const name = data.address?.city || data.address?.town || 'Selected Location';
      onConfirm(location, name);
    } catch (error) {
      onConfirm(location, `Selected Location (${location.lat.toFixed(4)}, ${location.lng.toFixed(4)})`);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex flex-col">
      <div className="flex-1 relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={15}
          className="h-full w-full"
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={[location.lat, location.lng]}>
            <Popup>Your Mingle Location</Popup>
          </Marker>
          <MapUpdater location={location} />
          <MapClickHandler onLocationChange={(lat, lng) => setLocation({ lat, lng })} />
        </MapContainer>

        <button
          onClick={onCancel}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100 z-10"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-white rounded-t-3xl p-6 shadow-lg">
        <p className="text-center text-lg font-bold text-gray-800 mb-4">
          Tap map to set location
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-600">
            <strong>Latitude:</strong> {location.lat.toFixed(6)}
          </p>
          <p className="text-sm text-gray-600">
            <strong>Longitude:</strong> {location.lng.toFixed(6)}
          </p>
        </div>

        <button
          onClick={handleConfirm}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-lg transition"
        >
          Confirm Location
        </button>
      </div>
    </div>
  );
}

export default function CreateMinglePage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [showMapPicker, setShowMapPicker] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [location, setLocation] = useState<LocationCoords>({ lat: 37.7749, lng: -122.4194 });
  const [description, setDescription] = useState('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [preferredPeople, setPreferredPeople] = useState('1-2');
  const [privacy, setPrivacy] = useState('public');
  const [tags, setTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMingleEnabled, setIsMingleEnabled] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/(auth)/login');
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        console.log('Using default location');
      }
    );
  }, [isAuthenticated, navigate]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPhotoPreview(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveDraft = async () => {
    if (!description.trim()) {
      alert('Please add a description');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('locationName', locationName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', JSON.stringify(tags));
      formData.append('isDraft', 'true');
      formData.append('isActive', 'false');

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await api.post('/api/mingles/draft', formData);
      alert('Draft saved! You can continue later.');
      navigate(-1);
    } catch (error: any) {
      alert('Failed to save draft: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  const submitMingle = async () => {
    if (!description.trim()) {
      alert('Please add a description');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('locationName', locationName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', JSON.stringify(tags));
      formData.append('isDraft', 'false');
      formData.append('isActive', 'true');
      formData.append('startTime', new Date().toISOString());
      formData.append('endTime', new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString());

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      const response = await api.post('/api/mingles', formData);
      alert('🔥 Your mingle is live!');
      navigate(-1);
    } catch (error: any) {
      alert('Failed to create mingle: ' + (error.message || 'Unknown error'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-500 to-orange-600 text-white pb-20">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 p-2 hover:bg-orange-600 rounded transition"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-4xl font-bold mb-2">Ready to Mingle</h1>
        <p className="text-orange-100">I'm hot 🔥 & ready right now</p>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 pb-20">
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <Info size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-blue-900">What's a Mingle?</p>
              <p className="text-sm text-blue-800">
                A spontaneous meetup for people who want to connect right now. Set it, go live, and meet people in your area!
              </p>
            </div>
          </div>
        </div>

        {/* Mingle Enabled Toggle */}
        <div className="bg-white rounded-xl p-4 mb-6 text-gray-800">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold">Ready to Mingle?</p>
              <p className="text-sm text-gray-600">Turn this on to go live</p>
            </div>
            <button
              onClick={() => setIsMingleEnabled(!isMingleEnabled)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                isMingleEnabled ? 'bg-orange-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                  isMingleEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Photo Upload */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">Photo</label>
          {photoPreview ? (
            <div className="relative mb-3">
              <img src={photoPreview} alt="Preview" className="w-full h-64 object-cover rounded-lg" />
              <button
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview(null);
                }}
                className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 bg-orange-100 border border-orange-300 rounded-xl p-6 hover:bg-orange-200 transition"
              >
                <Camera size={32} className="text-orange-600" />
                <span className="font-semibold text-orange-700 text-sm text-center">Take Photo</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 bg-blue-100 border border-blue-300 rounded-xl p-6 hover:bg-blue-200 transition"
              >
                <Images size={32} className="text-blue-600" />
                <span className="font-semibold text-blue-700 text-sm text-center">Choose Photo</span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
          />
        </div>

        {/* Description */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-2">What's happening?</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Describe your mingle (e.g., 'Coffee meetup at the park, let's chat!')"
            className="w-full h-32 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-gray-800 resize-none"
          />
          <p className="text-xs text-gray-500 mt-1">{description.length}/500</p>
        </div>

        {/* Tags */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">Add Tags</label>
          <div className="flex flex-wrap gap-2 mb-3">
            {['coffee', 'gaming', 'sports', 'music', 'art', 'hiking', 'movies', 'cooking', 'reading', 'yoga'].map(
              (tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setTags(tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag]);
                  }}
                  className={`px-3 py-1 rounded-full text-sm font-semibold transition ${
                    tags.includes(tag)
                      ? 'bg-orange-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  #{tag}
                </button>
              )
            )}
          </div>
        </div>

        {/* How Many People */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">How many people?</label>
          <div className="grid grid-cols-4 gap-2">
            {['1-2', '2-4', '4-6', '6+'].map((option) => (
              <button
                key={option}
                onClick={() => setPreferredPeople(option)}
                className={`rounded-xl p-4 font-bold transition ${
                  preferredPeople === option
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">Who can see this?</label>
          <div className="space-y-2">
            {[
              { value: 'public', label: 'Public', desc: 'Anyone can see & join' },
              { value: 'friends', label: 'Friends Only', desc: 'Only your friends' },
              { value: 'private', label: 'Private', desc: 'Invite only' },
            ].map((privacyOption) => (
              <button
                key={privacyOption.value}
                onClick={() => setPrivacy(privacyOption.value)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition ${
                  privacy === privacyOption.value
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 transition ${
                    privacy === privacyOption.value ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
                <div className="text-left">
                  <p className="font-bold text-gray-800">{privacyOption.label}</p>
                  <p className="text-sm text-gray-600">{privacyOption.desc}</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location */}
        <div className="bg-white rounded-xl p-4 mb-6">
          <label className="block text-sm font-bold text-gray-700 mb-3">Your Location</label>
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-600">
              <strong>Location:</strong> {locationName || `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
            </p>
          </div>
          <button
            onClick={() => setShowMapPicker(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <MapPin size={20} />
            Change Location
          </button>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={saveDraft}
            disabled={isLoading}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-50"
          >
            {isLoading ? <Loader className="animate-spin" size={20} /> : null}
            💾 Save as Draft
          </button>

          <button
            onClick={submitMingle}
            disabled={isLoading || !description.trim() || !isMingleEnabled}
            className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition ${
              description.trim() && isMingleEnabled
                ? 'bg-orange-500 hover:bg-orange-600 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {isLoading ? <Loader className="animate-spin" size={20} /> : <Flame size={20} />}
            🔥 Go Live Now
          </button>
        </div>
      </div>

      {/* Map Picker Modal */}
      {showMapPicker && (
        <LocationPickerModal
          initialLocation={location}
          onConfirm={(newLocation, name) => {
            setLocation(newLocation);
            setLocationName(name);
            setShowMapPicker(false);
          }}
          onCancel={() => setShowMapPicker(false)}
        />
      )}
    </div>
  );
}
