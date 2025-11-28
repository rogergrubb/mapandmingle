import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Shield, Eye, EyeOff, Lock, Users, MapPin, Bell } from 'lucide-react';
import api from '../../lib/api';

interface PrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  showLocation: boolean;
  showActivity: boolean;
  allowMessages: 'everyone' | 'friends' | 'nobody';
  allowTags: boolean;
  showOnlineStatus: boolean;
  shareData: boolean;
}

export default function PrivacySafety() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<PrivacySettings>({
    profileVisibility: 'public',
    showLocation: true,
    showActivity: true,
    allowMessages: 'everyone',
    allowTags: true,
    showOnlineStatus: true,
    shareData: false,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings/privacy', settings);
      alert('Privacy settings updated successfully!');
    } catch (error) {
      console.error('Failed to update privacy settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof PrivacySettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key as string]
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Privacy & Safety</h1>
              <p className="text-sm text-gray-600">Control your privacy and safety</p>
            </div>
          </div>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Profile Visibility */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <Eye className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Profile Visibility</h2>
              <p className="text-sm text-gray-600">Who can see your profile</p>
            </div>
          </div>

          <div className="space-y-2">
            {(['public', 'friends', 'private'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSettings(prev => ({ ...prev, profileVisibility: option }))}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 active:scale-98 ${
                  settings.profileVisibility === option
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-medium capitalize">{option}</div>
                    <div className="text-sm text-gray-600">
                      {option === 'public' && 'Anyone can see your profile'}
                      {option === 'friends' && 'Only your friends can see your profile'}
                      {option === 'private' && 'Only you can see your profile'}
                    </div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    settings.profileVisibility === option
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {settings.profileVisibility === option && (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Location Privacy */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-full">
              <MapPin className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Location</h2>
              <p className="text-sm text-gray-600">Control location sharing</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show My Location</div>
                <div className="text-sm text-gray-600">Let others see your approximate location</div>
              </div>
              <button
                onClick={() => toggleSetting('showLocation')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.showLocation ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.showLocation ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Activity Privacy */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-full">
              <Users className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Activity</h2>
              <p className="text-sm text-gray-600">Control activity visibility</p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Activity Status</div>
                <div className="text-sm text-gray-600">Let friends see when you're active</div>
              </div>
              <button
                onClick={() => toggleSetting('showActivity')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.showActivity ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.showActivity ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Show Online Status</div>
                <div className="text-sm text-gray-600">Display green dot when online</div>
              </div>
              <button
                onClick={() => toggleSetting('showOnlineStatus')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.showOnlineStatus ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.showOnlineStatus ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Messaging Privacy */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-pink-100 rounded-full">
              <Bell className="w-5 h-5 text-pink-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Messages</h2>
              <p className="text-sm text-gray-600">Who can message you</p>
            </div>
          </div>

          <div className="space-y-2">
            {(['everyone', 'friends', 'nobody'] as const).map((option) => (
              <button
                key={option}
                onClick={() => setSettings(prev => ({ ...prev, allowMessages: option }))}
                className={`w-full p-4 rounded-2xl border-2 transition-all duration-200 active:scale-98 ${
                  settings.allowMessages === option
                    ? 'border-purple-500 bg-purple-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="text-left">
                    <div className="font-medium capitalize">{option}</div>
                  </div>
                  <div className={`w-5 h-5 rounded-full border-2 ${
                    settings.allowMessages === option
                      ? 'border-purple-500 bg-purple-500'
                      : 'border-gray-300'
                  }`}>
                    {settings.allowMessages === option && (
                      <div className="w-full h-full flex items-center justify-center text-white text-xs">✓</div>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Blocked Users */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <Lock className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Blocked Users</h2>
              <p className="text-sm text-gray-600">Manage blocked accounts</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/settings/blocked-users')}
            className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl font-medium transition-all duration-200 active:scale-98"
          >
            View Blocked Users
          </button>
        </div>

        {/* Data Sharing */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-full">
              <Shield className="w-5 h-5 text-orange-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Data & Analytics</h2>
              <p className="text-sm text-gray-600">Help us improve MapMingle</p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Share Usage Data</div>
              <div className="text-sm text-gray-600">Help improve the app with anonymous data</div>
            </div>
            <button
              onClick={() => toggleSetting('shareData')}
              className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                settings.shareData ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                settings.shareData ? 'translate-x-6' : ''
              }`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
