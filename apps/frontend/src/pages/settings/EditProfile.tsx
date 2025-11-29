import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, ArrowLeft, Loader2, Check, Plus, X } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

const INTERESTS_OPTIONS = [
  'Hiking', 'Coffee', 'Food', 'Music', 'Art', 'Sports', 'Gaming',
  'Reading', 'Travel', 'Photography', 'Fitness', 'Yoga', 'Dancing',
  'Movies', 'Cooking', 'Pets', 'Tech', 'Fashion', 'Nightlife', 'Volunteering'
];

export default function EditProfile() {
  const navigate = useNavigate();
  const { user, updateProfile } = useAuthStore();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [customInterestsInput, setCustomInterestsInput] = useState('');
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    username: user?.username || '',
    bio: user?.bio || '',
    interests: user?.interests || [],
    avatar: user?.avatar || '',
  });

  // Separate preset interests from custom ones
  const presetInterests = formData.interests.filter(i => INTERESTS_OPTIONS.includes(i));
  const customInterests = formData.interests.filter(i => !INTERESTS_OPTIONS.includes(i));

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('photo', file);
      const response: any = await api.post('/api/upload/profile', uploadFormData);
      setFormData(prev => ({ ...prev, avatar: response.url }));
    } catch (error) {
      console.error('Photo upload failed:', error);
      alert('Failed to upload photo. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter(i => i !== interest)
        : [...prev.interests, interest]
    }));
  };

  const handleAddCustomInterests = () => {
    if (!customInterestsInput.trim()) return;
    
    // Parse comma-separated interests
    const newInterests = customInterestsInput
      .split(',')
      .map(i => i.trim())
      .filter(i => i.length > 0 && i.length <= 30) // Max 30 chars per interest
      .slice(0, 10 - customInterests.length); // Limit to 10 custom interests total

    if (newInterests.length === 0) return;

    // Add only unique interests
    const uniqueNewInterests = newInterests.filter(
      i => !formData.interests.some(existing => existing.toLowerCase() === i.toLowerCase())
    );

    setFormData(prev => ({
      ...prev,
      interests: [...prev.interests, ...uniqueNewInterests]
    }));
    setCustomInterestsInput('');
  };

  const removeCustomInterest = (interest: string) => {
    setFormData(prev => ({
      ...prev,
      interests: prev.interests.filter(i => i !== interest)
    }));
  };

  const handleSave = async () => {
    setLoading(true);
    setSaved(false);

    try {
      await updateProfile(formData);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      {/* Fixed Header with blur */}
      <div className="fixed top-0 left-0 right-0 bg-white/70 backdrop-blur-xl border-b border-gray-200/50 z-50">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100/80 rounded-full transition-all duration-300 active:scale-95"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-xl font-semibold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
            Edit Profile
          </h1>
          <button
            onClick={handleSave}
            disabled={loading}
            className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-medium 
                       hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105
                       transition-all duration-300 active:scale-95 disabled:opacity-50 
                       flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving...</span>
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                <span>Saved!</span>
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>

      {/* Scrollable Content with smooth scrolling */}
      <div 
        className="pt-20 pb-32 overflow-y-auto overscroll-y-contain"
        style={{ 
          WebkitOverflowScrolling: 'touch',
          scrollBehavior: 'smooth'
        }}
      >
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
          
          {/* Profile Photo Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm shadow-gray-200/50 
                       border border-white/50 transform transition-all duration-500 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-6">Profile Photo</h2>
            <div className="flex items-center gap-8">
              <div className="relative group">
                <div 
                  className="w-28 h-28 rounded-full bg-gradient-to-br from-pink-400 via-purple-400 to-indigo-500 
                             flex items-center justify-center text-white text-3xl font-bold overflow-hidden
                             shadow-lg shadow-purple-500/20 transition-transform duration-300 group-hover:scale-105"
                >
                  {formData.avatar ? (
                    <img src={formData.avatar} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    formData.displayName?.[0]?.toUpperCase() || 'U'
                  )}
                </div>
                <button
                  onClick={handlePhotoClick}
                  className="absolute inset-0 bg-black/40 backdrop-blur-sm rounded-full 
                             flex items-center justify-center opacity-0 group-hover:opacity-100 
                             transition-all duration-300 transform group-hover:scale-105"
                >
                  <Camera className="w-7 h-7 text-white drop-shadow-lg" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </div>
              <div className="space-y-3">
                <button
                  onClick={handlePhotoClick}
                  className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-full font-medium 
                             transition-all duration-300 active:scale-95 hover:shadow-md"
                >
                  Change Photo
                </button>
                <p className="text-sm text-gray-500">JPG, PNG or GIF (max. 5MB)</p>
              </div>
            </div>
          </div>

          {/* Basic Info Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm shadow-gray-200/50 
                       border border-white/50 space-y-6 transform transition-all duration-500 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900">Basic Info</h2>
            
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Display Name</label>
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                className="w-full px-5 py-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl 
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
                           focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                placeholder="Your name"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Username</label>
              <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  className="w-full pl-10 pr-5 py-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl 
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
                             focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="username"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-600">Bio</label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value.slice(0, 500) }))}
                rows={4}
                className="w-full px-5 py-4 bg-gray-50/80 border border-gray-200/80 rounded-2xl 
                           focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
                           focus:bg-white transition-all duration-300 resize-none text-gray-900 placeholder-gray-400"
                placeholder="Tell us about yourself..."
              />
              <p className="text-sm text-gray-400 text-right">{formData.bio.length}/500</p>
            </div>
          </div>

          {/* Interests Card */}
          <div 
            className="bg-white/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm shadow-gray-200/50 
                       border border-white/50 transform transition-all duration-500 hover:shadow-lg"
          >
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Interests</h2>
            <p className="text-sm text-gray-500 mb-6">Select your interests to help others find you</p>
            
            {/* Preset Interests */}
            <div className="flex flex-wrap gap-3 mb-8">
              {INTERESTS_OPTIONS.map((interest) => (
                <button
                  key={interest}
                  onClick={() => toggleInterest(interest)}
                  className={`px-5 py-2.5 rounded-full font-medium transition-all duration-300 active:scale-95
                    ${formData.interests.includes(interest)
                      ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-md shadow-purple-500/25 scale-105'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                    }`}
                >
                  {interest}
                </button>
              ))}
            </div>

            {/* Custom Interests Section */}
            <div className="border-t border-gray-200/80 pt-6">
              <h3 className="text-md font-semibold text-gray-800 mb-2">Custom Interests</h3>
              <p className="text-sm text-gray-500 mb-4">
                Add your own interests. Separate multiple with commas (up to 10 custom interests).
              </p>
              
              {/* Custom Interests Input */}
              <div className="flex gap-3 mb-4">
                <input
                  type="text"
                  value={customInterestsInput}
                  onChange={(e) => setCustomInterestsInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomInterests()}
                  className="flex-1 px-5 py-3 bg-gray-50/80 border border-gray-200/80 rounded-2xl 
                             focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-400
                             focus:bg-white transition-all duration-300 text-gray-900 placeholder-gray-400"
                  placeholder="e.g. Surfing, Board Games, Wine Tasting"
                  disabled={customInterests.length >= 10}
                />
                <button
                  onClick={handleAddCustomInterests}
                  disabled={!customInterestsInput.trim() || customInterests.length >= 10}
                  className="px-5 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-2xl 
                             font-medium hover:shadow-lg hover:shadow-purple-500/25 hover:scale-105
                             transition-all duration-300 active:scale-95 disabled:opacity-50 disabled:hover:scale-100
                             flex items-center gap-2"
                >
                  <Plus className="w-5 h-5" />
                  <span className="hidden sm:inline">Add</span>
                </button>
              </div>

              {/* Custom Interests Display */}
              {customInterests.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {customInterests.map((interest) => (
                    <div
                      key={interest}
                      className="group px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 
                                 text-white rounded-full font-medium shadow-md shadow-indigo-500/25
                                 flex items-center gap-2 transition-all duration-300 hover:scale-105"
                    >
                      <span>{interest}</span>
                      <button
                        onClick={() => removeCustomInterest(interest)}
                        className="p-0.5 hover:bg-white/20 rounded-full transition-all duration-200"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              
              {customInterests.length >= 10 && (
                <p className="text-sm text-amber-600 mt-3">
                  Maximum 10 custom interests reached
                </p>
              )}
              
              <p className="text-xs text-gray-400 mt-4">
                {customInterests.length}/10 custom interests added
              </p>
            </div>
          </div>

          {/* Extra padding at bottom for smooth scroll end */}
          <div className="h-8" />
        </div>
      </div>
    </div>
  );
}
