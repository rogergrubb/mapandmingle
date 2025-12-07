import { useState } from 'react';
import { Heart, X, Check, MapPin, Loader, Users, Briefcase, Calendar, Plane, Sparkles } from 'lucide-react';
import api from '../lib/api';
import { useGeolocation } from '../hooks/useGeolocation';

interface ProfileInterestsSetupProps {
  isOpen: boolean;
  onComplete: () => void;
  initialInterests?: string[];
  initialLookingFor?: string[];
}

const INTEREST_OPTIONS = [
  { id: 'sports', label: '⚽ Sports', emoji: '⚽' },
  { id: 'fitness', label: '💪 Fitness', emoji: '💪' },
  { id: 'hiking', label: '🥾 Hiking', emoji: '🥾' },
  { id: 'coffee', label: '☕ Coffee', emoji: '☕' },
  { id: 'food', label: '🍕 Food', emoji: '🍕' },
  { id: 'cooking', label: '👨‍🍳 Cooking', emoji: '👨‍🍳' },
  { id: 'music', label: '🎵 Music', emoji: '🎵' },
  { id: 'concerts', label: '🎤 Concerts', emoji: '🎤' },
  { id: 'art', label: '🎨 Art', emoji: '🎨' },
  { id: 'photography', label: '📷 Photography', emoji: '📷' },
  { id: 'travel', label: '✈️ Travel', emoji: '✈️' },
  { id: 'books', label: '📚 Books', emoji: '📚' },
  { id: 'movies', label: '🎬 Movies', emoji: '🎬' },
  { id: 'gaming', label: '🎮 Gaming', emoji: '🎮' },
  { id: 'tech', label: '💻 Tech', emoji: '💻' },
  { id: 'business', label: '💼 Business', emoji: '💼' },
  { id: 'meditation', label: '🧘 Meditation', emoji: '🧘' },
  { id: 'yoga', label: '🧘‍♀️ Yoga', emoji: '🧘‍♀️' },
  { id: 'dancing', label: '💃 Dancing', emoji: '💃' },
  { id: 'language', label: '🌍 Languages', emoji: '🌍' },
  { id: 'volunteering', label: '🤝 Volunteering', emoji: '🤝' },
  { id: 'nature', label: '🌿 Nature', emoji: '🌿' },
  { id: 'animals', label: '🐾 Animals', emoji: '🐾' },
  { id: 'outdoor', label: '⛺ Outdoor', emoji: '⛺' },
];

const LOOKING_FOR_OPTIONS = [
  { 
    id: 'dating', 
    label: 'Dating', 
    description: 'Find romantic connections',
    emoji: '💕',
    color: 'from-pink-500 to-rose-500',
    bgColor: 'bg-pink-50',
    borderColor: 'border-pink-500',
    textColor: 'text-pink-600'
  },
  { 
    id: 'friends', 
    label: 'Friends', 
    description: 'Meet new friends nearby',
    emoji: '👯',
    color: 'from-purple-500 to-indigo-500',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-500',
    textColor: 'text-purple-600'
  },
  { 
    id: 'networking', 
    label: 'Networking', 
    description: 'Connect with professionals',
    emoji: '💼',
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-500',
    textColor: 'text-blue-600'
  },
  { 
    id: 'events', 
    label: 'Events', 
    description: 'Discover & join local events',
    emoji: '🎉',
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-500',
    textColor: 'text-green-600'
  },
  { 
    id: 'travel', 
    label: 'Travel', 
    description: 'Meet fellow travelers',
    emoji: '✈️',
    color: 'from-orange-500 to-amber-500',
    bgColor: 'bg-orange-50',
    borderColor: 'border-orange-500',
    textColor: 'text-orange-600'
  },
];

type Step = 'interests' | 'lookingFor' | 'pin';

export default function ProfileInterestsSetup({ isOpen, onComplete, initialInterests = [], initialLookingFor = [] }: ProfileInterestsSetupProps) {
  const [step, setStep] = useState<Step>('interests');
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [selectedLookingFor, setSelectedLookingFor] = useState<string[]>(initialLookingFor);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { coordinates, loading: geoLoading, error: geoError, requestPermission } = useGeolocation();
  const [pinCreated, setPinCreated] = useState(false);
  const [ghostModeEnabled, setGhostModeEnabled] = useState(false);
  const [enablingGhost, setEnablingGhost] = useState(false);

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleLookingFor = (id: string) => {
    setSelectedLookingFor(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleCompleteInterests = async () => {
    if (selectedInterests.length === 0) {
      setError('Please select at least one interest');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.patch('/api/users/me', {
        interests: selectedInterests,
      });
      setStep('lookingFor');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save interests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCompleteLookingFor = async () => {
    if (selectedLookingFor.length === 0) {
      setError('Please select at least one option');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.patch('/api/users/me', {
        lookingFor: selectedLookingFor,
      });
      setStep('pin');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save preferences');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreatePin = async () => {
    if (!coordinates) {
      setError('Location not available. Please enable location access.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      await api.post('/api/pins/auto-create', {
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
      });
      
      setPinCreated(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create pin');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEnableGhostMode = async () => {
    setEnablingGhost(true);
    try {
      await api.patch('/api/users/me', {
        ghostMode: true,
      });
      setGhostModeEnabled(true);
    } catch (err: any) {
      console.error('Failed to enable ghost mode:', err);
    } finally {
      setEnablingGhost(false);
    }
  };

  const handleRequestLocation = async () => {
    await requestPermission();
  };

  if (step === 'interests') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 p-6 border-b border-pink-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Heart className="w-6 h-6 text-white fill-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">Your Interests</h2>
                  <p className="text-pink-100 text-sm">Step 1 of 3</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-8">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2">
                <span className="text-red-600 font-medium text-sm">{error}</span>
              </div>
            )}

            <p className="text-gray-600 mb-6 text-center">
              Pick at least 1 interest to help us match you with like-minded people
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 mb-8">
              {INTEREST_OPTIONS.map(interest => (
                <button
                  key={interest.id}
                  onClick={() => toggleInterest(interest.id)}
                  className={`p-4 rounded-2xl border-2 transition-all duration-200 flex flex-col items-center gap-2 ${
                    selectedInterests.includes(interest.id)
                      ? 'border-pink-500 bg-pink-50 shadow-md scale-105'
                      : 'border-gray-200 bg-white hover:border-pink-300'
                  }`}
                >
                  <span className="text-3xl">{interest.emoji}</span>
                  <span className="text-xs font-medium text-gray-700 text-center line-clamp-2">
                    {interest.label.split(' ').slice(1).join(' ')}
                  </span>
                  {selectedInterests.includes(interest.id) && (
                    <Check className="w-4 h-4 text-pink-500 absolute mt-12" />
                  )}
                </button>
              ))}
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-bold text-pink-600">{selectedInterests.length}</span> interest{selectedInterests.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={onComplete}
                disabled={isLoading}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Skip for now
              </button>
              <button
                onClick={handleCompleteInterests}
                disabled={isLoading || selectedInterests.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Next Step
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Looking For
  if (step === 'lookingFor') {
    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
          <div className="sticky top-0 bg-gradient-to-r from-purple-500 to-indigo-600 p-6 border-b border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-2xl font-bold text-white">What Are You Looking For?</h2>
                  <p className="text-purple-100 text-sm">Step 2 of 3</p>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2">
                <span className="text-red-600 font-medium text-sm">{error}</span>
              </div>
            )}

            <p className="text-gray-600 mb-6 text-center">
              Select all that apply. This helps others know your intentions.
            </p>

            <div className="space-y-3 mb-6">
              {LOOKING_FOR_OPTIONS.map(option => {
                const isSelected = selectedLookingFor.includes(option.id);
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleLookingFor(option.id)}
                    className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-200 ${
                      isSelected
                        ? `${option.borderColor} ${option.bgColor} shadow-md`
                        : 'border-gray-200 bg-white hover:border-gray-300'
                    }`}
                  >
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${option.color} flex items-center justify-center shadow-md flex-shrink-0`}>
                      <span className="text-2xl">{option.emoji}</span>
                    </div>
                    <div className="flex-1 text-left">
                      <div className={`font-semibold ${isSelected ? option.textColor : 'text-gray-900'}`}>
                        {option.label}
                      </div>
                      <div className="text-sm text-gray-500">{option.description}</div>
                    </div>
                    {isSelected && (
                      <div className={`w-6 h-6 rounded-full bg-gradient-to-br ${option.color} flex items-center justify-center`}>
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="text-center mb-6">
              <p className="text-sm text-gray-600">
                Selected: <span className="font-bold text-purple-600">{selectedLookingFor.length}</span> option{selectedLookingFor.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep('interests')}
                disabled={isLoading}
                className="px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleCompleteLookingFor}
                disabled={isLoading || selectedLookingFor.length === 0}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Next Step
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Step 3: Create Pin
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full">
        <div className="bg-gradient-to-r from-pink-500 to-purple-600 p-6 border-b border-pink-200">
          <div className="flex items-center gap-3">
            <MapPin className="w-6 h-6 text-white fill-white" />
            <div>
              <h2 className="text-2xl font-bold text-white">Create Your Pin</h2>
              <p className="text-pink-100 text-sm">Step 3 of 3</p>
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-2">
              <span className="text-red-600 font-medium text-sm">{error}</span>
            </div>
          )}

          {pinCreated && (
            <div className="text-center space-y-6">
              <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center animate-bounce">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900">Pin Created!</h3>
                <p className="text-gray-600 text-sm mt-1">You're now visible on the map</p>
              </div>
              
              <div className="relative pt-4">
                {!ghostModeEnabled ? (
                  <>
                    <div className="flex justify-center mb-2">
                      <div className="text-2xl animate-bounce" style={{ animationDelay: '0.1s' }}>↓</div>
                    </div>
                    
                    <button
                      onClick={handleEnableGhostMode}
                      disabled={enablingGhost}
                      className="w-full px-6 py-3 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:shadow-lg hover:from-gray-800 hover:to-black transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {enablingGhost ? (
                        <>
                          <Loader className="w-5 h-5 animate-spin" />
                          Enabling...
                        </>
                      ) : (
                        <>
                          <span className="text-xl">👻</span>
                          Go Ghost (Invisible Mode)
                        </>
                      )}
                    </button>
                    
                    <p className="text-xs text-gray-500 mt-2">
                      Hide your pin and browse secretly
                    </p>
                  </>
                ) : (
                  <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-2xl">👻</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">Ghost Mode Active</p>
                        <p className="text-xs text-gray-600">You're invisible to other users</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {!pinCreated && (
            <>
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <p className="text-blue-900 font-medium text-sm">
                  📍 Your pin will be placed at your current location
                </p>
              </div>

              {coordinates && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                  <p className="text-xs text-gray-500 font-semibold">LOCATION DETECTED</p>
                  <p className="text-sm text-gray-700 font-mono">
                    {coordinates.latitude.toFixed(4)}, {coordinates.longitude.toFixed(4)}
                  </p>
                </div>
              )}

              <div className="space-y-3">
                {!coordinates ? (
                  <button
                    onClick={handleRequestLocation}
                    disabled={geoLoading || isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {geoLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Getting Location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-5 h-5" />
                        Enable Location
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    onClick={handleCreatePin}
                    disabled={isLoading}
                    className="w-full px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isLoading ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Creating Pin...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Create Pin
                      </>
                    )}
                  </button>
                )}

                {geoError && (
                  <p className="text-xs text-red-600 text-center">{geoError}</p>
                )}
              </div>

              <button
                onClick={onComplete}
                disabled={isLoading}
                className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors disabled:opacity-50"
              >
                Skip & Finish
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
