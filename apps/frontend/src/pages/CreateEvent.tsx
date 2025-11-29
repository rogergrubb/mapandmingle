import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, Camera, Calendar, Clock, MapPin, Users, DollarSign,
  Tag, FileText, Image, X, Plus, Sparkles, Globe, Lock, Eye,
  Repeat, Bell, Share2, Check, Loader2, Info, Map, Navigation
} from 'lucide-react';
import api from '../lib/api';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

// Mapbox token
mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1Ijoicm9nZXJncnViYiIsImEiOiJjbWF6cXIycTYwMGxqMnFzZTVhdnRpajFjIn0.bjRucGclYXa7bDyMCawJmg';

const CATEGORIES = [
  'Social', 'Sports', 'Food & Drink', 'Music', 'Outdoors', 
  'Networking', 'Arts & Culture', 'Gaming', 'Wellness', 'Education'
];

const VISIBILITY_OPTIONS = [
  { id: 'public', label: 'Public', description: 'Anyone can see and join', icon: Globe },
  { id: 'friends', label: 'Friends Only', description: 'Only your friends can see', icon: Users },
  { id: 'private', label: 'Private', description: 'Invite only', icon: Lock },
];

const RECURRENCE_OPTIONS = [
  { id: 'none', label: 'Does not repeat' },
  { id: 'daily', label: 'Daily' },
  { id: 'weekly', label: 'Weekly' },
  { id: 'biweekly', label: 'Every 2 weeks' },
  { id: 'monthly', label: 'Monthly' },
];

export default function CreateEvent() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const totalSteps = 3;

  const [formData, setFormData] = useState({
    // Basic Info
    title: '',
    description: '',
    category: '',
    tags: [] as string[],
    image: '',
    
    // Date & Time
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    recurrence: 'none',
    
    // Location
    locationType: 'in-person' as 'in-person' | 'online' | 'hybrid',
    address: '',
    city: '',
    latitude: 0,
    longitude: 0,
    virtualLink: '',
    
    // Capacity & Pricing
    capacity: 50,
    unlimitedCapacity: false,
    price: 0,
    isFree: true,
    
    // Settings
    visibility: 'public',
    requireApproval: false,
    allowWaitlist: true,
    allowGuests: true,
    maxGuestsPerPerson: 1,
    
    // Notifications
    sendReminders: true,
    reminderTimes: ['1day', '1hour'] as string[],
  });

  const [tagInput, setTagInput] = useState('');

  // Initialize map when showMapPicker is true
  useEffect(() => {
    if (showMapPicker && mapContainerRef.current && !mapRef.current) {
      const initialCenter: [number, number] = formData.longitude && formData.latitude 
        ? [formData.longitude, formData.latitude]
        : [-122.4194, 37.7749]; // Default to San Francisco
      
      const map = new mapboxgl.Map({
        container: mapContainerRef.current,
        style: 'mapbox://styles/mapbox/streets-v12',
        center: initialCenter,
        zoom: 13,
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');

      // Add marker if we have coordinates
      if (formData.longitude && formData.latitude) {
        markerRef.current = new mapboxgl.Marker({ color: '#ec4899', draggable: true })
          .setLngLat([formData.longitude, formData.latitude])
          .addTo(map);
        
        markerRef.current.on('dragend', () => {
          const lngLat = markerRef.current?.getLngLat();
          if (lngLat) {
            reverseGeocode(lngLat.lng, lngLat.lat);
          }
        });
      }

      // Click to place pin
      map.on('click', (e) => {
        const { lng, lat } = e.lngLat;
        
        if (markerRef.current) {
          markerRef.current.setLngLat([lng, lat]);
        } else {
          markerRef.current = new mapboxgl.Marker({ color: '#ec4899', draggable: true })
            .setLngLat([lng, lat])
            .addTo(map);
          
          markerRef.current.on('dragend', () => {
            const lngLat = markerRef.current?.getLngLat();
            if (lngLat) {
              reverseGeocode(lngLat.lng, lngLat.lat);
            }
          });
        }
        
        reverseGeocode(lng, lat);
      });

      mapRef.current = map;
    }

    return () => {
      if (!showMapPicker && mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [showMapPicker]);

  // Reverse geocode coordinates to address
  const reverseGeocode = async (lng: number, lat: number) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${mapboxgl.accessToken}`
      );
      const data = await response.json();
      
      if (data.features && data.features.length > 0) {
        const place = data.features[0];
        const address = place.place_name;
        const city = place.context?.find((c: any) => c.id.startsWith('place'))?.text || '';
        
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          address: address,
          city: city,
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
        }));
      }
    } catch (error) {
      console.error('Reverse geocode failed:', error);
      setFormData(prev => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
    }
  };

  // Get user's current location
  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        
        if (mapRef.current) {
          mapRef.current.flyTo({ center: [longitude, latitude], zoom: 15 });
          
          if (markerRef.current) {
            markerRef.current.setLngLat([longitude, latitude]);
          } else {
            markerRef.current = new mapboxgl.Marker({ color: '#ec4899', draggable: true })
              .setLngLat([longitude, latitude])
              .addTo(mapRef.current);
            
            markerRef.current.on('dragend', () => {
              const lngLat = markerRef.current?.getLngLat();
              if (lngLat) {
                reverseGeocode(lngLat.lng, lngLat.lat);
              }
            });
          }
        }
        
        reverseGeocode(longitude, latitude);
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enable location services.');
        setIsGettingLocation(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('photo', file);
      const response: any = await api.post('/api/upload/profile', uploadFormData);
      setFormData(prev => ({ ...prev, image: response.url }));
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('Failed to upload image. Please try again.');
    }
  };

  const addTag = () => {
    if (tagInput.trim() && formData.tags.length < 5) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const eventData = {
        ...formData,
        startTime: `${formData.startDate}T${formData.startTime}`,
        endTime: formData.endDate && formData.endTime 
          ? `${formData.endDate}T${formData.endTime}` 
          : null,
        price: formData.isFree ? 0 : formData.price,
        capacity: formData.unlimitedCapacity ? null : formData.capacity,
      };

      const response: any = await api.post('/api/events', eventData);
      navigate(`/events/${response.id}`);
    } catch (error) {
      console.error('Failed to create event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (currentStep === 1) {
      return formData.title && formData.category && formData.description;
    }
    if (currentStep === 2) {
      return formData.startDate && formData.startTime && 
             (formData.locationType === 'online' || formData.address);
    }
    return true;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-200/50 sticky top-0 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => currentStep > 1 ? setCurrentStep(currentStep - 1) : navigate(-1)}
            className="p-2 hover:bg-gray-100/80 rounded-full transition-all duration-300"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <div className="text-center">
            <h1 className="text-lg font-semibold text-gray-900">Create Event</h1>
            <p className="text-xs text-gray-500">Step {currentStep} of {totalSteps}</p>
          </div>
          <div className="w-10" />
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-pink-500 to-purple-600 transition-all duration-500"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-8 pb-32">
        
        {/* Step 1: Basic Info */}
        {currentStep === 1 && (
          <div className="space-y-6">
            {/* Cover Image */}
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="relative h-48 bg-gradient-to-br from-pink-100 to-purple-100 rounded-3xl 
                         overflow-hidden cursor-pointer group"
            >
              {formData.image ? (
                <>
                  <img src={formData.image} alt="Event cover" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 
                                  transition-opacity flex items-center justify-center">
                    <Camera className="w-8 h-8 text-white" />
                  </div>
                </>
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center text-purple-400">
                  <Image className="w-12 h-12 mb-2" />
                  <span className="text-sm font-medium">Add Cover Photo</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
            </div>

            {/* Title */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Event Title *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Give your event a catchy name"
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white
                           transition-all duration-300"
                maxLength={100}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.title.length}/100</p>
            </div>

            {/* Category */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-3">Category *</label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFormData(prev => ({ ...prev, category: cat }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                               ${formData.category === cat
                                 ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md'
                                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                               }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Description *</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                placeholder="What's your event about? Include details attendees should know."
                rows={5}
                className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:bg-white
                           transition-all duration-300 resize-none"
                maxLength={2000}
              />
              <p className="text-xs text-gray-400 mt-1 text-right">{formData.description.length}/2000</p>
            </div>

            {/* Tags */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags (up to 5)</label>
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  placeholder="Add a tag"
                  className="flex-1 px-4 py-2 bg-gray-50 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  disabled={formData.tags.length >= 5}
                />
                <button
                  onClick={addTag}
                  disabled={!tagInput.trim() || formData.tags.length >= 5}
                  className="px-4 py-2 bg-purple-100 text-purple-600 rounded-xl font-medium
                             hover:bg-purple-200 disabled:opacity-50 transition-all"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <span key={tag} className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full 
                                               text-sm flex items-center gap-1">
                      #{tag}
                      <button onClick={() => removeTag(tag)} className="hover:text-purple-900">
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Date, Time & Location */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Date & Time */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-pink-500" />
                Date & Time
              </h3>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Start Time *</label>
                  <input
                    type="time"
                    value={formData.startTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, startTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">End Time</label>
                  <input
                    type="time"
                    value={formData.endTime}
                    onChange={(e) => setFormData(prev => ({ ...prev, endTime: e.target.value }))}
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Repeat</label>
                <select
                  value={formData.recurrence}
                  onChange={(e) => setFormData(prev => ({ ...prev, recurrence: e.target.value }))}
                  className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                >
                  {RECURRENCE_OPTIONS.map(opt => (
                    <option key={opt.id} value={opt.id}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location Type */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-pink-500" />
                Location
              </h3>
              
              <div className="flex gap-2 mb-4">
                {(['in-person', 'online', 'hybrid'] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setFormData(prev => ({ ...prev, locationType: type }))}
                    className={`flex-1 py-3 rounded-xl font-medium capitalize transition-all
                               ${formData.locationType === type
                                 ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white'
                                 : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                               }`}
                  >
                    {type}
                  </button>
                ))}
              </div>

              {(formData.locationType === 'in-person' || formData.locationType === 'hybrid') && (
                <div className="space-y-4">
                  {/* Toggle between address input and map picker */}
                  <div className="flex gap-2 mb-2">
                    <button
                      onClick={() => setShowMapPicker(false)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                                 ${!showMapPicker
                                   ? 'bg-purple-100 text-purple-700'
                                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                 }`}
                    >
                      <FileText className="w-4 h-4" />
                      Enter Address
                    </button>
                    <button
                      onClick={() => setShowMapPicker(true)}
                      className={`flex-1 py-2 px-3 rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2
                                 ${showMapPicker
                                   ? 'bg-purple-100 text-purple-700'
                                   : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                 }`}
                    >
                      <Map className="w-4 h-4" />
                      Pin on Map
                    </button>
                  </div>

                  {!showMapPicker ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">Address *</label>
                        <input
                          type="text"
                          value={formData.address}
                          onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                          placeholder="Enter the venue address"
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                                     focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-600 mb-2">City</label>
                        <input
                          type="text"
                          value={formData.city}
                          onChange={(e) => setFormData(prev => ({ ...prev, city: e.target.value }))}
                          placeholder="City name"
                          className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                                     focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                        />
                      </div>
                    </>
                  ) : (
                    <div className="space-y-3">
                      {/* Map Container */}
                      <div 
                        ref={mapContainerRef}
                        className="w-full h-64 rounded-2xl overflow-hidden border border-gray-200"
                      />
                      
                      {/* Use Current Location Button */}
                      <button
                        onClick={getCurrentLocation}
                        disabled={isGettingLocation}
                        className="w-full py-3 bg-gray-100 text-gray-700 rounded-xl font-medium
                                   hover:bg-gray-200 transition-all flex items-center justify-center gap-2"
                      >
                        {isGettingLocation ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Getting location...
                          </>
                        ) : (
                          <>
                            <Navigation className="w-4 h-4" />
                            Use My Current Location
                          </>
                        )}
                      </button>

                      <p className="text-xs text-gray-500 text-center">
                        Tap on the map to place a pin, or drag the pin to adjust
                      </p>

                      {/* Show selected address */}
                      {formData.address && (
                        <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                          <div className="flex items-start gap-2">
                            <MapPin className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <div>
                              <p className="text-sm font-medium text-purple-900">{formData.address}</p>
                              {formData.latitude && formData.longitude && (
                                <p className="text-xs text-purple-600 mt-1">
                                  {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {(formData.locationType === 'online' || formData.locationType === 'hybrid') && (
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-600 mb-2">Virtual Meeting Link</label>
                  <input
                    type="url"
                    value={formData.virtualLink}
                    onChange={(e) => setFormData(prev => ({ ...prev, virtualLink: e.target.value }))}
                    placeholder="https://zoom.us/j/..."
                    className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                               focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 3: Settings */}
        {currentStep === 3 && (
          <div className="space-y-6">
            {/* Capacity & Pricing */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-pink-500" />
                Capacity & Pricing
              </h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">Unlimited capacity</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, unlimitedCapacity: !prev.unlimitedCapacity }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.unlimitedCapacity ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.unlimitedCapacity ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {!formData.unlimitedCapacity && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Max Attendees</label>
                    <input
                      type="number"
                      value={formData.capacity}
                      onChange={(e) => setFormData(prev => ({ ...prev, capacity: parseInt(e.target.value) || 0 }))}
                      min="1"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                                 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <span className="text-sm text-gray-700">Free event</span>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, isFree: !prev.isFree }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.isFree ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.isFree ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                {!formData.isFree && (
                  <div>
                    <label className="block text-sm font-medium text-gray-600 mb-2">Ticket Price ($)</label>
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) => setFormData(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      min="0"
                      step="0.01"
                      className="w-full px-4 py-3 bg-gray-50 rounded-xl border border-gray-200
                                 focus:outline-none focus:ring-2 focus:ring-purple-500/50"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Visibility */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Eye className="w-5 h-5 text-pink-500" />
                Visibility
              </h3>

              <div className="space-y-3">
                {VISIBILITY_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => setFormData(prev => ({ ...prev, visibility: opt.id }))}
                    className={`w-full p-4 rounded-2xl border-2 text-left transition-all
                               ${formData.visibility === opt.id
                                 ? 'border-purple-500 bg-purple-50'
                                 : 'border-gray-200 hover:border-gray-300'
                               }`}
                  >
                    <div className="flex items-center gap-3">
                      <opt.icon className={`w-5 h-5 ${formData.visibility === opt.id ? 'text-purple-600' : 'text-gray-400'}`} />
                      <div>
                        <div className="font-medium text-gray-900">{opt.label}</div>
                        <div className="text-sm text-gray-500">{opt.description}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Additional Settings */}
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Settings</h3>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Require approval</div>
                    <div className="text-xs text-gray-500">Manually approve each attendee</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, requireApproval: !prev.requireApproval }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.requireApproval ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.requireApproval ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Enable waitlist</div>
                    <div className="text-xs text-gray-500">Allow signups when full</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, allowWaitlist: !prev.allowWaitlist }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.allowWaitlist ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.allowWaitlist ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Allow +1 guests</div>
                    <div className="text-xs text-gray-500">Attendees can bring guests</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, allowGuests: !prev.allowGuests }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.allowGuests ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.allowGuests ? 'translate-x-5' : ''}`} />
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-sm font-medium text-gray-700">Send reminders</div>
                    <div className="text-xs text-gray-500">Notify attendees before event</div>
                  </div>
                  <button
                    onClick={() => setFormData(prev => ({ ...prev, sendReminders: !prev.sendReminders }))}
                    className={`relative w-12 h-7 rounded-full transition-all
                               ${formData.sendReminders ? 'bg-gradient-to-r from-pink-500 to-purple-600' : 'bg-gray-300'}`}
                  >
                    <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform
                                    ${formData.sendReminders ? 'translate-x-5' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-gray-200 p-4 z-40">
        <div className="max-w-2xl mx-auto flex gap-3">
          {currentStep > 1 && (
            <button
              onClick={() => setCurrentStep(currentStep - 1)}
              className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium
                         hover:bg-gray-200 transition-all"
            >
              Back
            </button>
          )}
          
          {currentStep < totalSteps ? (
            <button
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!canProceed()}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white 
                         rounded-xl font-medium shadow-lg shadow-purple-500/25
                         hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Continue
            </button>
          ) : (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !canProceed()}
              className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white 
                         rounded-xl font-medium shadow-lg shadow-purple-500/25
                         hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Create Event
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
