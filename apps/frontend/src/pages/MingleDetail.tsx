import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAuthStore } from '../stores/authStore';
import { 
  MessageCircle, Flag, Heart, MapPin, Calendar, ArrowLeft,
  Briefcase, GraduationCap, Globe, Languages, Eye, EyeOff,
  Users, Plane, Sparkles, Clock
} from 'lucide-react';
import api from '../lib/api';
import ReportModal from '../components/ReportModal';

interface UserProfile {
  id: string;
  name: string;
  image?: string;
  avatar?: string;
  displayName?: string;
  bio?: string;
  age?: number;
  gender?: string;
  interests?: string[];
  lookingFor?: string[];
  occupation?: string;
  education?: string;
  location?: string;
  languages?: string[];
  lastActiveAt?: string;
  privacy?: {
    hideBio: boolean;
    hideAge: boolean;
    hideInterests: boolean;
    hideLookingFor: boolean;
    hideOccupation: boolean;
    hideEducation: boolean;
    hideLocation: boolean;
    hideLanguages: boolean;
  };
}

const lookingForConfig: Record<string, { emoji: string; label: string; color: string; bgColor: string }> = {
  dating: { emoji: '💕', label: 'Dating', color: 'text-pink-600', bgColor: 'bg-gradient-to-r from-pink-100 to-rose-100' },
  friends: { emoji: '👯', label: 'Friends', color: 'text-purple-600', bgColor: 'bg-gradient-to-r from-purple-100 to-indigo-100' },
  networking: { emoji: '💼', label: 'Networking', color: 'text-blue-600', bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100' },
  events: { emoji: '🎉', label: 'Events', color: 'text-green-600', bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100' },
  travel: { emoji: '✈️', label: 'Travel', color: 'text-orange-600', bgColor: 'bg-gradient-to-r from-orange-100 to-amber-100' },
};

function PrivateSection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg text-gray-400 text-sm">
      <EyeOff size={14} />
      <span>This user prefers not to share their {label.toLowerCase()}</span>
    </div>
  );
}

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

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

  const getOwnerUserId = () => {
    if (!mingle) return null;
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
    return (
      <div className="flex justify-center items-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-pink-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!mingle) {
    return <div className="flex justify-center items-center h-screen">Mingle not found</div>;
  }

  const ownerUserId = getOwnerUserId();
  const isOwnPin = user?.id === ownerUserId;
  const profile = mingle.user as UserProfile;
  const privacy = profile?.privacy || {};

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold ml-2">Profile</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto">
        {/* Profile Header Card */}
        <div className="bg-white m-4 rounded-2xl shadow-sm overflow-hidden">
          {/* Cover gradient */}
          <div className="h-24 bg-gradient-to-r from-pink-500 via-purple-500 to-blue-500"></div>
          
          <div className="px-6 pb-6 -mt-12">
            {/* Avatar */}
            <div className="flex items-end gap-4 mb-4">
              {profile?.avatar || profile?.image ? (
                <img
                  src={profile.avatar || profile.image}
                  alt={profile?.displayName || profile?.name}
                  className="w-24 h-24 rounded-2xl object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-3xl font-bold border-4 border-white shadow-lg">
                  {(profile?.displayName || profile?.name || 'U')[0].toUpperCase()}
                </div>
              )}
              
              <div className="flex-1 pt-12">
                <h2 className="text-2xl font-bold text-gray-900">
                  {profile?.displayName || profile?.name || 'Anonymous'}
                </h2>
                {profile?.age && !privacy.hideAge && (
                  <p className="text-gray-500">{profile.age} years old</p>
                )}
                {privacy.hideAge && (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <EyeOff size={12} /> Age hidden
                  </p>
                )}
              </div>
            </div>
            
            {/* Last active */}
            {profile?.lastActiveAt && (
              <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                <Clock size={14} />
                <span>Active {formatTimeAgo(profile.lastActiveAt)}</span>
              </div>
            )}
            
            {/* Bio */}
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">About</h3>
              {privacy.hideBio ? (
                <PrivateSection label="Bio" />
              ) : profile?.bio ? (
                <p className="text-gray-600 leading-relaxed">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 italic">No bio yet</p>
              )}
            </div>
          </div>
        </div>

        {/* Pin Details Card */}
        <div className="bg-white mx-4 mb-4 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <MapPin size={16} className="text-pink-500" />
            Pin Info
          </h3>
          
          <div className="flex items-center gap-2 text-gray-600 mb-2">
            <Calendar size={16} />
            <span>Dropped on {new Date(mingle.createdAt).toLocaleDateString()}</span>
          </div>
          
          {mingle.description && mingle.description !== 'Mingling here!' && (
            <p className="text-gray-700 bg-gray-50 rounded-lg p-3 mt-3 italic">
              "{mingle.description}"
            </p>
          )}
          
          {mingle.photoUrl && (
            <img
              src={mingle.photoUrl}
              alt="Pin photo"
              className="w-full rounded-lg object-cover max-h-64 mt-4"
            />
          )}
        </div>

        {/* Looking For Card */}
        <div className="bg-white mx-4 mb-4 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Sparkles size={16} className="text-purple-500" />
            Open To
          </h3>
          
          {privacy.hideLookingFor ? (
            <PrivateSection label="Connection preferences" />
          ) : profile?.lookingFor && profile.lookingFor.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.lookingFor.map((item) => {
                const config = lookingForConfig[item];
                if (!config) return null;
                return (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${config.bgColor}`}
                  >
                    <span className="text-lg">{config.emoji}</span>
                    <span className={`font-medium ${config.color}`}>{config.label}</span>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-400 italic">Not specified</p>
          )}
        </div>

        {/* Interests Card */}
        <div className="bg-white mx-4 mb-4 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Heart size={16} className="text-red-500" />
            Interests
          </h3>
          
          {privacy.hideInterests ? (
            <PrivateSection label="Interests" />
          ) : profile?.interests && profile.interests.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest, idx) => (
                <span
                  key={idx}
                  className="px-3 py-1.5 bg-gradient-to-r from-pink-50 to-purple-50 text-gray-700 rounded-full text-sm font-medium"
                >
                  {interest}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-gray-400 italic">No interests added</p>
          )}
        </div>

        {/* Details Card */}
        <div className="bg-white mx-4 mb-4 rounded-2xl shadow-sm p-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-4">Details</h3>
          
          <div className="space-y-4">
            {/* Occupation */}
            <div className="flex items-start gap-3">
              <Briefcase size={18} className="text-blue-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Work</p>
                {privacy.hideOccupation ? (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <EyeOff size={12} /> Hidden
                  </p>
                ) : profile?.occupation ? (
                  <p className="text-gray-700">{profile.occupation}</p>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
            </div>
            
            {/* Education */}
            <div className="flex items-start gap-3">
              <GraduationCap size={18} className="text-green-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Education</p>
                {privacy.hideEducation ? (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <EyeOff size={12} /> Hidden
                  </p>
                ) : profile?.education ? (
                  <p className="text-gray-700">{profile.education}</p>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
            </div>
            
            {/* Location */}
            <div className="flex items-start gap-3">
              <Globe size={18} className="text-purple-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                {privacy.hideLocation ? (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <EyeOff size={12} /> Hidden
                  </p>
                ) : profile?.location ? (
                  <p className="text-gray-700">{profile.location}</p>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
            </div>
            
            {/* Languages */}
            <div className="flex items-start gap-3">
              <Languages size={18} className="text-orange-500 mt-0.5" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Languages</p>
                {privacy.hideLanguages ? (
                  <p className="text-gray-400 text-sm flex items-center gap-1">
                    <EyeOff size={12} /> Hidden
                  </p>
                ) : profile?.languages && profile.languages.length > 0 ? (
                  <p className="text-gray-700">{profile.languages.join(', ')}</p>
                ) : (
                  <p className="text-gray-400 italic">Not specified</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons - Fixed at Bottom */}
        {!isOwnPin && (
          <div className="fixed bottom-20 left-0 right-0 bg-white border-t px-4 py-3 z-20">
            <div className="max-w-2xl mx-auto flex gap-3">
              <button
                onClick={handleLike}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-semibold transition-all ${
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
                className="flex-[2] flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                <MessageCircle size={20} />
                Message
              </button>

              <button
                onClick={() => setShowReportModal(true)}
                className="w-12 flex items-center justify-center py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-all"
              >
                <Flag size={20} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Report Modal */}
      {profile && (
        <ReportModal
          isOpen={showReportModal}
          onClose={() => setShowReportModal(false)}
          reportedUserId={ownerUserId || ''}
          reportedUserName={profile.displayName || profile.name || 'User'}
          pinId={id}
        />
      )}
    </div>
  );
}
