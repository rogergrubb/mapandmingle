import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Camera, Images, MapPin, Info, X, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { api } from '../lib/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

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

function LocationPicker({
  onConfirm,
  onCancel,
  initialLocation,
}: {
  onConfirm: (coords: LocationCoords, name: string) => void;
  onCancel: () => void;
  initialLocation: LocationCoords;
}) {
  const [location, setLocation] = useState<LocationCoords>(initialLocation);
  const mapRef = useRef<any>(null);

  const MapUpdater = () => {
    const map = useMap();
    useEffect(() => {
      map.setView([location.lat, location.lng], 15);
    }, [map, location]);
    return null;
  };

  const handleMapClick = (e: any) => {
    setLocation({ lat: e.latlng.lat, lng: e.latlng.lng });
  };

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
    <div className="fixed inset-0 z-50 flex flex-col bg-black/50">
      <div className="flex-1 relative">
        <MapContainer
          center={[location.lat, location.lng]}
          zoom={15}
          className="h-full w-full"
          onClick={handleMapClick}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />
          <Marker position={[location.lat, location.lng]}>
            <Popup>Your Mingle Location</Popup>
          </Marker>
          <MapUpdater />
        </MapContainer>

        <button
          onClick={onCancel}
          className="absolute top-4 left-4 bg-white rounded-full p-2 shadow-lg hover:bg-gray-100"
        >
          <X size={20} />
        </button>
      </div>

      <div className="bg-white rounded-t-3xl p-6 shadow-lg">
        <p className="text-center text-lg font-bold text-gray-800 mb-4">
          Tap map to set location
        </p>
        <div className="bg-gray-50 rounded-lg p-4 mb-4">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">
            Coordinates
          </p>
          <p className="text-sm text-gray-700 font-mono">
            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
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
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [description, setDescription] = useState('');
  const [preferredPeople, setPreferredPeople] = useState('2-4');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public');
  const [tags, setTags] = useState('');
  const [location, setLocation] = useState<LocationCoords>({
    lat: 37.7749,
    lng: -122.4194,
  });
  const [locationName, setLocationName] = useState('San Francisco, CA');
  const [isMingleEnabled, setIsMingleEnabled] = useState(true);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setLocation({ lat: latitude, lng: longitude });

          fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          )
            .then((res) => res.json())
            .then((data) => {
              const name = data.address?.city || data.address?.town || 'Current Location';
              setLocationName(name);
            })
            .catch(() => setLocationName('Current Location'));
        },
        () => {
          console.log('Location access denied, using default');
        }
      );
    }
  }, []);

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleMapConfirm = (coords: LocationCoords, name: string) => {
    setLocation(coords);
    setLocationName(name);
    setShowMapPicker(false);
  };

  const saveDraft = async () => {
    if (!description.trim()) {
      alert('Please add a description before saving');
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('locationName', locationName);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', tags);
      formData.append('isDraft', 'true');
      formData.append('isActive', isMingleEnabled ? 'true' : 'false');

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await api.post('/api/mingles/draft', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('Draft saved! You can review and submit anytime.');
    } catch (error: any) {
      alert(error.message || 'Failed to save draft');
    } finally {
      setIsLoading(false);
    }
  };

  const submitMingle = async () => {
    if (!description.trim()) {
      alert('Please add a description');
      return;
    }

    if (!isMingleEnabled) {
      alert('Please enable the mingle feature to submit');
      return;
    }

    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append('description', description);
      formData.append('latitude', location.lat.toString());
      formData.append('longitude', location.lng.toString());
      formData.append('locationName', locationName);
      formData.append('maxParticipants', preferredPeople);
      formData.append('privacy', privacy);
      formData.append('tags', tags);
      formData.append('isDraft', 'false');
      formData.append('isActive', 'true');
      formData.append('startTime', new Date().toISOString());
      formData.append('endTime', new Date(Date.now() + 30 * 60000).toISOString());

      if (photoFile) {
        formData.append('photo', photoFile);
      }

      await api.post('/api/mingles', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      alert('🔥 You\'re Live! Your mingle is now active. Find your people!');
      navigate('/mingles');
    } catch (error: any) {
      alert(error.message || 'Failed to create mingle');
    } finally {
      setIsLoading(false);
    }
  };

  if (showMapPicker) {
    return (
      <LocationPicker
        initialLocation={location}
        onConfirm={handleMapConfirm}
        onCancel={() => setShowMapPicker(false)}
      />
    );
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-gradient-to-r from-orange-400 to-orange-500 text-white px-4 py-6">
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
            <Info className="text-blue-600 flex-shrink-0 mt-1" size={20} />
            <p className="text-blue-700 text-sm">
              You can turn off this spontaneous mingle feature anytime to stop finding matches
            </p>
          </div>

          <div className="mt-4 flex items-center bg-white rounded-lg p-3 gap-3">
            <Flame size={20} color={isMingleEnabled ? '#f97316' : '#d1d5db'} />
            <span className="flex-1 font-semibold text-gray-700">
              {isMingleEnabled ? 'Mingle Feature Active' : 'Mingle Feature Disabled'}
            </span>
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

        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3 text-gray-800">Your Vibe 📸</h2>
          {photoPreview ? (
            <div className="relative">
              <img
                src={photoPreview}
                alt="Preview"
                className="w-full h-64 object-cover rounded-xl mb-3"
              />
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
                <span className="font-semibold text-orange-700 text-sm text-center">
                  Take Photo
                </span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex flex-col items-center justify-center gap-2 bg-blue-100 border border-blue-300 rounded-xl p-6 hover:bg-blue-200 transition"
              >
                <Images size={32} className="text-blue-600" />
                <span className="font-semibold text-blue-700 text-sm text-center">
                  Choose Photo
                </span>
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoSelect}
            className="hidden"
          />
          <p className="text-gray-400 text-xs">💡 Show what you're up to or where you are</p>
        </div>

        <div className="mb-6">
          <label className="text-lg font-bold mb-2 block text-gray-800">
            What's Happening?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value.slice(0, 500))}
            placeholder="Tell people what this mingle is about... Coffee chat, game night, workout buddy, etc."
            maxLength={500}
            rows={4}
            className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-gray-400 text-xs text-right mt-2">
            {description.length}/500
          </p>
        </div>

        <div className="mb-6">
          <label className="text-lg font-bold mb-2 block text-gray-800">Tags</label>
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Add tags: #coffee #gaming #sports (space-separated)"
            maxLength={200}
            className="w-full border border-gray-300 rounded-xl p-4 text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
          <p className="text-gray-400 text-xs mt-2">
            Help people find mingles they're interested in
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800">How Many People?</h3>
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

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800">Who Can See This?</h3>
          <div className="space-y-3">
            {(['public', 'friends', 'private'] as const).map((privacyOption) => (
              <button
                key={privacyOption}
                onClick={() => setPrivacy(privacyOption)}
                className={`w-full flex items-start gap-4 p-4 rounded-xl border-2 transition ${
                  privacy === privacyOption
                    ? 'bg-orange-50 border-orange-500'
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex-shrink-0 mt-1 transition ${
                    privacy === privacyOption ? 'bg-orange-500' : 'bg-gray-300'
                  }`}
                />
                <div className="text-left">
                  <p className="font-semibold text-gray-800 capitalize">
                    {privacyOption === 'public' && 'Public'}
                    {privacyOption === 'friends' && 'Friends Only'}
                    {privacyOption === 'private' && 'Private (Invite Only)'}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {privacyOption === 'public' && 'Anyone can see & join'}
                    {privacyOption === 'friends' && 'Only your friends can see'}
                    {privacyOption === 'private' && 'Only people you invite'}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-bold mb-3 text-gray-800">📍 Your Location</h3>
          <div className="bg-gray-100 rounded-xl p-4 mb-3 flex items-center gap-3">
            <MapPin size={20} className="text-orange-500 flex-shrink-0" />
            <p className="font-semibold text-gray-800">{locationName}</p>
          </div>
          <button
            onClick={() => setShowMapPicker(true)}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <MapPin size={20} />
            Change Location
          </button>
        </div>

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
    </div>
  );
}
