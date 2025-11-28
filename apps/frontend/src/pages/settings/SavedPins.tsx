import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MapPin, Heart, MessageCircle, Trash2, ExternalLink } from 'lucide-react';
import api from '../../lib/api';

interface SavedPin {
  id: string;
  title: string;
  description: string;
  category: string;
  location: string;
  image?: string;
  likes: number;
  comments: number;
  savedAt: string;
}

export default function SavedPins() {
  const navigate = useNavigate();
  const [pins, setPins] = useState<SavedPin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const categories = ['All', 'Food', 'Coffee', 'Nightlife', 'Events', 'Activities'];

  useEffect(() => {
    loadSavedPins();
  }, []);

  const loadSavedPins = async () => {
    try {
      const response = await api.get('/api/pins/saved');
      setPins(response.data);
    } catch (error) {
      console.error('Failed to load saved pins:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUnsave = async (pinId: string) => {
    try {
      await api.delete(`/api/pins/${pinId}/save`);
      setPins(prev => prev.filter(p => p.id !== pinId));
    } catch (error) {
      console.error('Failed to unsave pin:', error);
    }
  };

  const filteredPins = selectedCategory === 'All'
    ? pins
    : pins.filter(p => p.category === selectedCategory);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Saved Pins</h1>
              <p className="text-sm text-gray-600">{filteredPins.length} pins saved</p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full font-medium whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  selectedCategory === category
                    ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-3xl p-4 shadow-sm animate-pulse">
                <div className="aspect-video bg-gray-200 rounded-2xl mb-3" />
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : filteredPins.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
              <MapPin className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No saved pins yet</h3>
            <p className="text-gray-600 mb-6">Start exploring and save your favorite places!</p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 active:scale-95"
            >
              Explore Map
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPins.map((pin) => (
              <div
                key={pin.id}
                className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group"
              >
                {/* Pin Image */}
                <div className="aspect-video bg-gradient-to-br from-pink-200 to-purple-200 relative overflow-hidden">
                  {pin.image ? (
                    <img src={pin.image} alt={pin.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <MapPin className="w-16 h-16 text-white/50" />
                    </div>
                  )}
                  
                  {/* Overlay Actions */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2">
                    <button
                      onClick={() => navigate(`/pins/${pin.id}`)}
                      className="p-3 bg-white rounded-full hover:scale-110 transition-transform duration-200"
                    >
                      <ExternalLink className="w-5 h-5 text-gray-900" />
                    </button>
                    <button
                      onClick={() => handleUnsave(pin.id)}
                      className="p-3 bg-white rounded-full hover:scale-110 transition-transform duration-200"
                    >
                      <Trash2 className="w-5 h-5 text-red-500" />
                    </button>
                  </div>
                </div>

                {/* Pin Info */}
                <div className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 line-clamp-1">{pin.title}</h3>
                      <p className="text-sm text-gray-600 line-clamp-2 mt-1">{pin.description}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-sm text-gray-600 mt-3">
                    <div className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      <span>{pin.likes}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MessageCircle className="w-4 h-4" />
                      <span>{pin.comments}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <span className="text-xs px-2 py-1 bg-purple-100 text-purple-700 rounded-full font-medium">
                      {pin.category}
                    </span>
                    <span className="text-xs text-gray-500">
                      Saved {new Date(pin.savedAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
