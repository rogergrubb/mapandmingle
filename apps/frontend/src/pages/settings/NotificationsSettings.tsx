import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Bell, MessageCircle, Calendar, Heart, Users, MapPin, TrendingUp } from 'lucide-react';
import api from '../../lib/api';

interface NotificationSettings {
  messages: boolean;
  events: boolean;
  likes: boolean;
  comments: boolean;
  follows: boolean;
  nearby: boolean;
  trending: boolean;
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

export default function NotificationsSettings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState<NotificationSettings>({
    messages: true,
    events: true,
    likes: true,
    comments: true,
    follows: true,
    nearby: true,
    trending: false,
    emailNotifications: true,
    pushNotifications: true,
    soundEnabled: true,
  });

  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/api/settings/notifications', settings);
      alert('Notification settings updated successfully!');
    } catch (error) {
      console.error('Failed to update notification settings:', error);
      alert('Failed to update settings. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const toggleSetting = (key: keyof NotificationSettings) => {
    setSettings(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const notificationTypes = [
    { key: 'messages' as const, label: 'Messages', description: 'New messages from other users', icon: MessageCircle, color: 'blue' },
    { key: 'events' as const, label: 'Events', description: 'Event updates and reminders', icon: Calendar, color: 'purple' },
    { key: 'likes' as const, label: 'Likes', description: 'When someone likes your content', icon: Heart, color: 'pink' },
    { key: 'comments' as const, label: 'Comments', description: 'New comments on your posts', icon: MessageCircle, color: 'green' },
    { key: 'follows' as const, label: 'Follows', description: 'New followers', icon: Users, color: 'indigo' },
    { key: 'nearby' as const, label: 'Nearby Activity', description: 'Activity near your location', icon: MapPin, color: 'orange' },
    { key: 'trending' as const, label: 'Trending', description: 'Popular content and events', icon: TrendingUp, color: 'red' },
  ];

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
              <h1 className="text-xl font-semibold">Notifications</h1>
              <p className="text-sm text-gray-600">Manage your notification preferences</p>
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
        {/* Notification Types */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-full">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Notification Types</h2>
              <p className="text-sm text-gray-600">Choose what you want to be notified about</p>
            </div>
          </div>

          <div className="space-y-4">
            {notificationTypes.map(({ key, label, description, icon: Icon, color }) => (
              <div key={key} className="flex items-center justify-between p-4 rounded-2xl hover:bg-gray-50 transition-colors duration-200">
                <div className="flex items-center gap-4">
                  <div className={`p-2 bg-${color}-100 rounded-full`}>
                    <Icon className={`w-5 h-5 text-${color}-600`} />
                  </div>
                  <div>
                    <div className="font-medium">{label}</div>
                    <div className="text-sm text-gray-600">{description}</div>
                  </div>
                </div>
                <button
                  onClick={() => toggleSetting(key)}
                  className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                    settings[key] ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                  }`}
                >
                  <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                    settings[key] ? 'translate-x-6' : ''
                  }`} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Delivery Methods */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Delivery Methods</h2>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Push Notifications</div>
                <div className="text-sm text-gray-600">Receive notifications on your device</div>
              </div>
              <button
                onClick={() => toggleSetting('pushNotifications')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.pushNotifications ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.pushNotifications ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Email Notifications</div>
                <div className="text-sm text-gray-600">Receive notifications via email</div>
              </div>
              <button
                onClick={() => toggleSetting('emailNotifications')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.emailNotifications ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.emailNotifications ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Sound</div>
                <div className="text-sm text-gray-600">Play sound for notifications</div>
              </div>
              <button
                onClick={() => toggleSetting('soundEnabled')}
                className={`relative w-14 h-8 rounded-full transition-all duration-200 ${
                  settings.soundEnabled ? 'bg-gradient-to-r from-pink-500 to-purple-500' : 'bg-gray-300'
                }`}
              >
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                  settings.soundEnabled ? 'translate-x-6' : ''
                }`} />
              </button>
            </div>
          </div>
        </div>

        {/* Do Not Disturb */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Do Not Disturb</h2>
          <p className="text-sm text-gray-600 mb-4">Schedule quiet hours when you won't receive notifications</p>
          
          <button className="w-full p-4 bg-gray-50 hover:bg-gray-100 rounded-2xl font-medium transition-all duration-200 active:scale-98">
            Set Quiet Hours
          </button>
        </div>
      </div>
    </div>
  );
}
