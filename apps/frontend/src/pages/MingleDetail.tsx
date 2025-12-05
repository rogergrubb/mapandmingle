import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { MessageCircle, Flag, Heart, MapPin, Calendar, ArrowLeft } from 'lucide-react';
import api from '../lib/api';
import ReportModal from '../components/ReportModal';

export default function MingleDetail() {
  const navigate = useNavigate();
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
      const response: any = await api.get(`/api/pins/${id}`);
      setMingle(response);
      setLiked(response?.isLiked || false);
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

  // Get the owner's user ID - check multiple possible locations
  const getOwnerUserId = () => {
    if (!mingle) return null;
    // Try different possible locations for the user ID
    return mingle.userId || mingle.user?.id || mingle.ownerId || mingle.creatorId;
  };

  const handleMessage = () => {
    const ownerUserId = getOwnerUserId();
    if (ownerUserId) {
      navigate(`/chat/${ownerUserId}`);
    } else {
      console.error('Cannot message: no user ID found in mingle data', mingle);
      alert('Unable to start chat. User information not available.');
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>;
  }

  if (!mingle) {
    return <div className="flex justify-center items-center h-screen">Mingle not found</div>;
  }

  const ownerUserId = getOwnerUserId();
  const isOwnPin = user?.id === ownerUserId;

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Mingle Details</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 max-w-2xl mx-auto">
        {/* User Info */}
        {mingle.user && (
          <div className="flex items-center gap-3 mb-4">
            {mingle.user.avatar ? (
              <img
                src={mingle.user.avatar}
                alt={mingle.user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white font-bold">
                {(mingle.user.name || 'U')[0].toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold">{mingle.user.name || 'Anonymous'}</p>
              <p className="text-sm text-gray-500">@{mingle.user.username || 'user'}</p>
            </div>
          </div>
        )}

        {/* Date */}
        <div className="flex items-center gap-2 text-gray-600 mb-4">
          <Calendar size={18} />
          <span>{new Date(mingle.createdAt).toLocaleDateString()}</span>
        </div>

        {/* Description */}
        <p className="text-gray-800 mb-6">{mingle.description}</p>

        {/* Location if available */}
        {(mingle.latitude && mingle.longitude) && (
          <div className="flex items-center gap-2 text-gray-600 mb-6">
            <MapPin size={18} />
            <span>
              {mingle.latitude.toFixed(4)}, {mingle.longitude.toFixed(4)}
            </span>
          </div>
        )}

        {/* Photo if available */}
        {mingle.photoUrl && (
          <div className="mb-6">
            <img
              src={mingle.photoUrl}
              alt="Mingle photo"
              className="w-full rounded-lg object-cover max-h-96"
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
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
                onClick={handleMessage}
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
          reportedUserId={ownerUserId || ''}
          reportedUserName={mingle.user.name}
          pinId={id}
        />
      )}
    </div>
  );
}
