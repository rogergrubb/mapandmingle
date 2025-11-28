import { useNavigate } from 'react-router-dom';
import { Settings, Crown, Award, Flame, MapPin, Calendar, Heart, MessageCircle, LogOut } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

export default function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  const stats = [
    { label: 'Pins', value: '24', icon: MapPin },
    { label: 'Events', value: '8', icon: Calendar },
    { label: 'Likes', value: '156', icon: Heart },
    { label: 'Chats', value: '12', icon: MessageCircle },
  ];

  const menuItems = [
    { label: 'Edit Profile', path: '/settings/edit-profile', icon: Settings },
    { label: 'Saved Pins', path: '/settings/saved-pins', icon: MapPin },
    { label: 'Privacy & Safety', path: '/settings/privacy', icon: Settings },
    { label: 'Notifications', path: '/settings/notifications', icon: Settings },
    { label: 'Subscription', path: '/settings/subscription', icon: Crown },
    { label: 'Account', path: '/settings/account', icon: Settings },
    { label: 'Help & Support', path: '/settings/help', icon: Settings },
  ];

  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      {/* Header with Cover */}
      <div className="bg-gradient-to-br from-primary-500 to-purple-600 h-32"></div>

      {/* Profile Info */}
      <div className="bg-white -mt-16 mx-4 rounded-2xl shadow-lg p-6 mb-4">
        <div className="flex flex-col items-center -mt-16 mb-4">
          {/* Avatar */}
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.displayName}
                className="w-24 h-24 rounded-full border-4 border-white object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full border-4 border-white bg-primary-100 flex items-center justify-center">
                <span className="text-primary-600 font-bold text-3xl">
                  {user.displayName[0].toUpperCase()}
                </span>
              </div>
            )}
            {user.isPremium && (
              <div className="absolute -top-1 -right-1 bg-yellow-400 rounded-full p-1">
                <Crown size={16} className="text-white" />
              </div>
            )}
            {user.isVerified && (
              <div className="absolute bottom-0 right-0 bg-blue-500 rounded-full p-1">
                <Award size={16} className="text-white" />
              </div>
            )}
          </div>

          {/* Name and Username */}
          <h1 className="text-2xl font-bold text-gray-900 mt-4">{user.displayName}</h1>
          <p className="text-gray-600">@{user.username}</p>

          {/* Bio */}
          {user.bio && (
            <p className="text-gray-700 text-center mt-2 max-w-md">{user.bio}</p>
          )}

          {/* Trust Score & Streak */}
          <div className="flex items-center space-x-4 mt-4">
            <div className="flex items-center space-x-1">
              <Award size={16} className="text-yellow-500" />
              <span className="text-sm font-medium">{user.trustScore} Trust</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame size={16} className="text-orange-500" />
              <span className="text-sm font-medium">{user.streak} Day Streak</span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
          {stats.map(({ label, value, icon: Icon }) => (
            <div key={label} className="text-center">
              <Icon size={20} className="mx-auto text-gray-400 mb-1" />
              <p className="text-lg font-bold text-gray-900">{value}</p>
              <p className="text-xs text-gray-600">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Interests */}
      {user.interests && user.interests.length > 0 && (
        <div className="bg-white mx-4 rounded-2xl shadow-sm p-4 mb-4">
          <h2 className="font-semibold text-gray-900 mb-3">Interests</h2>
          <div className="flex flex-wrap gap-2">
            {user.interests.map((interest) => (
              <span key={interest} className="badge badge-primary">
                {interest}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="bg-white mx-4 rounded-2xl shadow-sm mb-4 overflow-hidden">
        {menuItems.map((item, index) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors ${
              index !== menuItems.length - 1 ? 'border-b border-gray-100' : ''
            }`}
          >
            <div className="flex items-center space-x-3">
              <item.icon size={20} className="text-gray-600" />
              <span className="text-gray-900 font-medium">{item.label}</span>
            </div>
            <span className="text-gray-400">›</span>
          </button>
        ))}
      </div>

      {/* Logout Button */}
      <button
        onClick={logout}
        className="w-full bg-white mx-4 rounded-2xl shadow-sm p-4 mb-8 flex items-center justify-center space-x-2 text-red-600 hover:bg-red-50 transition-colors"
      >
        <LogOut size={20} />
        <span className="font-medium">Log Out</span>
      </button>
    </div>
  );
}
