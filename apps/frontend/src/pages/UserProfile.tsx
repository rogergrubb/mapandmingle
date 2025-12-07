import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  MapPin, Calendar, Heart, MessageCircle, UserPlus, UserMinus,
  Shield, Award, Flame, Users, Camera, Flag, ArrowLeft,
  Sparkles, Briefcase, Plane
} from 'lucide-react';
import { Button } from '../components/common/Button';
import { useAuthStore } from '../stores/authStore';
import api from '../lib/api';

interface UserProfile {
  id: string;
  name: string;
  avatar: string;
  coverPhoto?: string;
  bio: string;
  location: string;
  joinedAt: Date;
  interests: string[];
  lookingFor: string[];
  trustScore: number;
  isVerified: boolean;
  streak: number;
  badges: Array<{
    id: string;
    name: string;
    icon: string;
    description: string;
  }>;
  stats: {
    pinsCreated: number;
    eventsAttended: number;
    followersCount: number;
    followingCount: number;
  };
  isFollowing: boolean;
  isOwnProfile: boolean;
}

// Looking For config with colors and icons
const lookingForConfig: Record<string, { emoji: string; label: string; color: string; bgColor: string; description: string }> = {
  dating: { 
    emoji: '💕', 
    label: 'Dating', 
    color: 'text-pink-700',
    bgColor: 'bg-gradient-to-r from-pink-100 to-rose-100 border-pink-200',
    description: 'Open to romantic connections'
  },
  friends: { 
    emoji: '👯', 
    label: 'Friends', 
    color: 'text-purple-700',
    bgColor: 'bg-gradient-to-r from-purple-100 to-indigo-100 border-purple-200',
    description: 'Looking to make new friends'
  },
  networking: { 
    emoji: '💼', 
    label: 'Networking', 
    color: 'text-blue-700',
    bgColor: 'bg-gradient-to-r from-blue-100 to-cyan-100 border-blue-200',
    description: 'Professional connections welcome'
  },
  events: { 
    emoji: '🎉', 
    label: 'Events', 
    color: 'text-green-700',
    bgColor: 'bg-gradient-to-r from-green-100 to-emerald-100 border-green-200',
    description: 'Interested in local events'
  },
  travel: { 
    emoji: '✈️', 
    label: 'Travel', 
    color: 'text-orange-700',
    bgColor: 'bg-gradient-to-r from-orange-100 to-amber-100 border-orange-200',
    description: 'Open to meeting fellow travelers'
  },
};

export function UserProfile() {
  const params = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const currentUser = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);

  useEffect(() => {
    if (params.userId) {
      fetchProfile();
    }
  }, [params.userId]);

  const fetchProfile = async () => {
    try {
      const response: any = await api.get(`/api/users/${params.userId}`);
      const userData = response.user || response;
      
      // Map API response to UserProfile interface
      const mappedProfile: UserProfile = {
        id: userData.id,
        name: userData.displayName || userData.name || 'Anonymous',
        avatar: userData.avatar || '/default-avatar.png',
        coverPhoto: userData.coverPhoto,
        bio: userData.bio || '',
        location: userData.location || 'Somewhere on Earth',
        joinedAt: new Date(userData.memberSince || userData.createdAt || Date.now()),
        interests: userData.interests || [],
        lookingFor: userData.lookingFor || [],
        trustScore: userData.trustScore || 50,
        isVerified: userData.isVerified || false,
        streak: userData.streak || 0,
        badges: userData.badges || [],
        stats: {
          pinsCreated: userData.pinsCreated || 0,
          eventsAttended: userData.eventsAttended || 0,
          followersCount: userData.followersCount || 0,
          followingCount: userData.followingCount || 0,
        },
        isFollowing: userData.isFollowing || false,
        isOwnProfile: currentUser?.id === userData.id,
      };
      
      setProfile(mappedProfile);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!profile) return;

    try {
      if (profile.isFollowing) {
        await api.delete(`/api/users/${profile.id}/follow`);
        setProfile({
          ...profile,
          isFollowing: false,
          stats: {
            ...profile.stats,
            followersCount: profile.stats.followersCount - 1,
          },
        });
      } else {
        await api.post(`/api/users/${profile.id}/follow`);
        setProfile({
          ...profile,
          isFollowing: true,
          stats: {
            ...profile.stats,
            followersCount: profile.stats.followersCount + 1,
          },
        });
      }
    } catch (error) {
      console.error('Failed to follow/unfollow:', error);
    }
  };

  const handleMessage = () => {
    if (!profile) return;
    // Navigate directly to chat with user ID
    navigate(`/chat/${profile.id}`);
  };

  const handleReport = async () => {
    if (!profile || !confirm('Report this user?')) return;

    try {
      await api.post(`/api/users/${profile.id}/report`, {
        reason: 'inappropriate_content',
      });
      alert('User reported. Our team will review this.');
    } catch (error) {
      console.error('Failed to report user:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading profile...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">User Not Found</h2>
          <Link to="/map">
            <Button>Back to Map</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Back Button */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-20">
        <div className="max-w-4xl mx-auto px-4 py-3">
          <button onClick={() => navigate(-1)} className="flex items-center text-gray-600 hover:text-gray-900">
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>
        </div>
      </div>

      {/* Cover Photo */}
      <div className="h-48 bg-gradient-to-r from-pink-500 to-purple-600 relative">
        {profile.coverPhoto && (
          <img
            src={profile.coverPhoto}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        )}
      </div>

      <div className="max-w-4xl mx-auto px-4">
        {/* Profile Header */}
        <div className="relative -mt-20 mb-6">
          <div className="flex items-end gap-4">
            <div className="relative">
              <img
                src={profile.avatar || '/default-avatar.png'}
                alt={profile.name}
                className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
              />
              {profile.isVerified && (
                <div className="absolute bottom-2 right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center border-2 border-white">
                  <Shield className="w-5 h-5 text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 bg-white rounded-lg shadow-md p-4 mb-2">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    {profile.name}
                    {profile.streak > 0 && (
                      <span className="inline-flex items-center px-2 py-1 bg-orange-100 text-orange-600 rounded text-sm">
                        <Flame className="w-4 h-4 mr-1" />
                        {profile.streak}
                      </span>
                    )}
                  </h1>
                  <div className="flex items-center text-gray-600 text-sm mt-1">
                    <MapPin className="w-4 h-4 mr-1" />
                    {profile.location}
                  </div>
                  <div className="flex items-center text-gray-500 text-sm mt-1">
                    <Calendar className="w-4 h-4 mr-1" />
                    Joined {new Date(profile.joinedAt).toLocaleDateString()}
                  </div>
                </div>

                {!profile.isOwnProfile && (
                  <div className="flex gap-2">
                    <Button
                      variant={profile.isFollowing ? 'outline' : 'primary'}
                      onClick={handleFollow}
                    >
                      {profile.isFollowing ? (
                        <>
                          <UserMinus className="w-4 h-4 mr-2" />
                          Unfollow
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-4 h-4 mr-2" />
                          Follow
                        </>
                      )}
                    </Button>
                    <Button variant="outline" onClick={handleMessage}>
                      <MessageCircle className="w-4 h-4 mr-2" />
                      Message
                    </Button>
                    <button
                      onClick={handleReport}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Flag className="w-5 h-5" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.stats.pinsCreated}</div>
            <div className="text-sm text-gray-600">Pins</div>
          </div>
          <div className="bg-white rounded-lg shadow-md p-4 text-center">
            <div className="text-2xl font-bold text-gray-900">{profile.stats.eventsAttended}</div>
            <div className="text-sm text-gray-600">Events</div>
          </div>
          <button
            onClick={() => setShowFollowers(true)}
            className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-2xl font-bold text-gray-900">{profile.stats.followersCount}</div>
            <div className="text-sm text-gray-600">Followers</div>
          </button>
          <button
            onClick={() => setShowFollowing(true)}
            className="bg-white rounded-lg shadow-md p-4 text-center hover:shadow-lg transition"
          >
            <div className="text-2xl font-bold text-gray-900">{profile.stats.followingCount}</div>
            <div className="text-sm text-gray-600">Following</div>
          </button>
        </div>

        {/* Trust Score */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center">
              <Shield className="w-5 h-5 mr-2 text-blue-600" />
              Trust Score
            </h2>
            <div className="text-3xl font-bold text-blue-600">{profile.trustScore}/100</div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className="bg-blue-600 h-3 rounded-full transition-all"
              style={{ width: `${profile.trustScore}%` }}
            />
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Trust score is based on activity, verification, and community feedback
          </p>
        </div>

        {/* Bio */}
        {profile.bio && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3">About</h2>
            <p className="text-gray-700 whitespace-pre-wrap">{profile.bio}</p>
          </div>
        )}

        {/* Interests */}
        {profile.interests.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-3 flex items-center">
              <Heart className="w-5 h-5 mr-2 text-pink-600" />
              Interests
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((interest) => (
                <span
                  key={interest}
                  className="px-3 py-1 bg-pink-100 text-pink-600 rounded-full text-sm"
                >
                  {interest}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Looking For */}
        {profile.lookingFor && profile.lookingFor.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
              Open To
            </h2>
            <div className="space-y-3">
              {profile.lookingFor.map((item) => {
                const cfg = lookingForConfig[item];
                if (!cfg) return null;
                return (
                  <div
                    key={item}
                    className={`flex items-center gap-4 p-4 rounded-xl border ${cfg.bgColor}`}
                  >
                    <div className="text-3xl">{cfg.emoji}</div>
                    <div className="flex-1">
                      <div className={`font-semibold ${cfg.color}`}>{cfg.label}</div>
                      <div className="text-sm text-gray-600">{cfg.description}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Badges */}
        {profile.badges.length > 0 && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Badges
            </h2>
            <div className="grid grid-cols-3 gap-4">
              {profile.badges.map((badge) => (
                <div
                  key={badge.id}
                  className="flex flex-col items-center p-4 border rounded-lg hover:bg-gray-50"
                  title={badge.description}
                >
                  <div className="text-4xl mb-2">{badge.icon}</div>
                  <div className="text-sm font-medium text-gray-900 text-center">
                    {badge.name}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

