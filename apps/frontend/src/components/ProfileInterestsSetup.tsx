import { useState } from 'react';
import { Heart, X, Check } from 'lucide-react';
import api from '../lib/api';

interface ProfileInterestsSetupProps {
  isOpen: boolean;
  onComplete: () => void;
  initialInterests?: string[];
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

export default function ProfileInterestsSetup({ isOpen, onComplete, initialInterests = [] }: ProfileInterestsSetupProps) {
  const [selectedInterests, setSelectedInterests] = useState<string[]>(initialInterests);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const toggleInterest = (id: string) => {
    setSelectedInterests(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleComplete = async () => {
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
      onComplete();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save interests');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-pink-500 to-purple-600 p-6 border-b border-pink-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-white fill-white" />
              <div>
                <h2 className="text-2xl font-bold text-white">Tell Us About You</h2>
                <p className="text-pink-100 text-sm">Select your interests to find your people</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-2">
              <span className="text-red-600 font-medium text-sm">{error}</span>
            </div>
          )}

          {/* Instructions */}
          <p className="text-gray-600 mb-6 text-center">
            Pick at least 1 interest to help us match you with like-minded people
          </p>

          {/* Interest Grid */}
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

          {/* Selected Count */}
          <div className="text-center mb-6">
            <p className="text-sm text-gray-600">
              Selected: <span className="font-bold text-pink-600">{selectedInterests.length}</span> interest{selectedInterests.length !== 1 ? 's' : ''}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              onClick={onComplete}
              disabled={isLoading}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold
                         hover:bg-gray-300 transition-colors disabled:opacity-50"
            >
              Skip for now
            </button>
            <button
              onClick={handleComplete}
              disabled={isLoading || selectedInterests.length === 0}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-xl font-semibold
                         hover:shadow-lg hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed
                         flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  Continue
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
