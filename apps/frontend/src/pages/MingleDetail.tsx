import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { MessageCircle, Flag, Share2, Heart, MapPin, Calendar } from 'lucide-react';
import api from '../lib/api';
import ReportModal from '../components/ReportModal';

export default function MingleDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuthStore();
  const [mingle, setMingle] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  useEffect(() => {
    loadMingle();
  }, [id]);

  const loadMingle = async () => {
    try {
      const response = await api.get(`/api/pins/${id}`);
      setMingle(response);
      setLiked(response.isLiked || false);
    } catch (error) {
      console.error('Failed to load mingle:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    try {
      await api.post(`/api/pins/${id}/like`);
      setLiked(!liked);
    } catch (error) {
      console.error('Failed to like:', error);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!mingle) {
    return <div className="flex justify-center items-center h-screen">Mingle not found</div>;
  }

  const isOwnPin = user?.id === mingle.userId;

  return (
    <div className="min-h-screen bg-white">
      {/* Header with image */}
      {mingle.image && (
        <div className="w-full h-96 bg-gray-200 overflow-hidden">
          <img src={mingle.image} alt={mingle.title} className="w-full h-full object-cover" />
        </div>
      )}

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Title and basic info */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{mingle.title}</h1>
          
          {/* Location and time */}
          <div className="flex flex-wrap gap-4 text-gray-600 mb-4">
            {mingle.address && (
              <div className="flex items-center gap-2">
                <MapPin size={18} />
                <span>{mingle.address}</span>
              </div>
            )}
            {mingle.createdAt && (
              <div className="flex items-center gap-2">
                <Calendar size={18} />
                <span>{new Date(mingle.createdAt).toLocaleDateString()}</span>
              </div>
            )}
          </div>

          {/* Tags */}
          {mingle.tags && mingle.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {mingle.tags.map((tag: string) => (
                <span key={tag} className="bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Description */}
        {mingle.description && (
          <div className="mb-6">
            <p className="text-gray-700 whitespace-pre-wrap">{mingle.description}</p>
          </div>
        )}

        {/* User info */}
        {mingle.user && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">Posted by</h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-semibold text-gray-900">{mingle.user.name}</p>
                <p className="text-sm text-gray-600">{mingle.user.email}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 sticky bottom-0 bg-white py-4 border-t">
          {!isOwnPin && (
            <>
              <button
                onClick={handleLike}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                  liked
                    ? 'bg-pink-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
                {liked ? 'Liked' : 'Like'}
              </button>

              <button
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600"
              >
                <MessageCircle size={20} />
                Message
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg font-semibold hover:bg-red-100"
              >
                <Flag size={20} />
                Report
              </button>
            </>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {mingle.user && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={mingle.userId}
          reportedUserName={mingle.user.name}
          pinId={id}
        />
      )}
    </div>
  );
}
