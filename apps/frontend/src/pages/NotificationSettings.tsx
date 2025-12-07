import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, BellOff, Users, MapPin, Mail, MessageSquare, Smartphone,
  ArrowLeft, Save, TestTube, Clock, Moon, Check, AlertCircle
} from 'lucide-react';
import api from '../lib/api';

interface NotificationPreferences {
  notifyFriendPins: boolean;
  notifyNearbyPins: boolean;
  nearbyRadiusKm: number;
  notifyViaEmail: boolean;
  notifyViaSms: boolean;
  notifyViaInApp: boolean;
  phoneNumber: string | null;
  phoneVerified: boolean;
  notificationDigest: string;
  quietHoursStart: string | null;
  quietHoursEnd: string | null;
  quietHoursTimezone: string | null;
}

export default function NotificationSettings() {
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [testingSms, setTestingSms] = useState(false);
  const [testingInApp, setTestingInApp] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    fetchPreferences();
  }, []);

  const fetchPreferences = async () => {
    try {
      const response = await api.get('/api/notifications/preferences');
      const data = response.data || response;
      setPreferences(data);
      setQuietHoursEnabled(!!(data.quietHoursStart && data.quietHoursEnd));
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!preferences) return;
    setSaving(true);
    setMessage(null);

    try {
      const updateData = {
        ...preferences,
        quietHoursStart: quietHoursEnabled ? preferences.quietHoursStart : null,
        quietHoursEnd: quietHoursEnabled ? preferences.quietHoursEnd : null,
        quietHoursTimezone: quietHoursEnabled ? Intl.DateTimeFormat().resolvedOptions().timeZone : null,
      };

      await api.put('/api/notifications/preferences', updateData);
      setMessage({ type: 'success', text: 'Settings saved!' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async (type: 'email' | 'sms' | 'inapp') => {
    const setTesting = type === 'email' ? setTestingEmail : type === 'sms' ? setTestingSms : setTestingInApp;
    setTesting(true);
    setMessage(null);

    try {
      const response = await api.post('/api/notifications/test', { type });
      const data = response.data || response;
      setMessage({ type: data.success ? 'success' : 'error', text: data.message || data.error });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to send test notification' });
    } finally {
      setTesting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!preferences) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-500">Failed to load preferences</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-lg mx-auto px-4 py-4 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Notification Settings</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-6">
        {/* Message */}
        {message && (
          <div className={`p-4 rounded-xl flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? <Check className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            {message.text}
          </div>
        )}

        {/* Pin Alerts Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Bell className="w-5 h-5 text-pink-500" />
            Pin Alerts
          </h2>

          {/* Friend Pins */}
          <label className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-purple-500" />
              <div>
                <p className="font-medium">Friend Pins</p>
                <p className="text-sm text-gray-500">When friends drop a pin</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifyFriendPins}
              onChange={(e) => setPreferences({ ...preferences, notifyFriendPins: e.target.checked })}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
            />
          </label>

          {/* Nearby Pins */}
          <label className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <MapPin className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Nearby Pins</p>
                <p className="text-sm text-gray-500">When anyone nearby drops a pin</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={preferences.notifyNearbyPins}
              onChange={(e) => setPreferences({ ...preferences, notifyNearbyPins: e.target.checked })}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
            />
          </label>

          {/* Radius */}
          {preferences.notifyNearbyPins && (
            <div className="py-3 border-b">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">Notification Radius</span>
                <span className="font-medium">{preferences.nearbyRadiusKm} km</span>
              </div>
              <input
                type="range"
                min="1"
                max="50"
                step="1"
                value={preferences.nearbyRadiusKm}
                onChange={(e) => setPreferences({ ...preferences, nearbyRadiusKm: parseFloat(e.target.value) })}
                className="w-full accent-pink-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1 km</span>
                <span>50 km</span>
              </div>
            </div>
          )}
        </div>

        {/* Delivery Methods Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-pink-500" />
            Delivery Methods
          </h2>

          {/* In-App */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-pink-500" />
              <div>
                <p className="font-medium">In-App Notifications</p>
                <p className="text-sm text-gray-500">See alerts in the app</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestNotification('inapp')}
                disabled={testingInApp}
                className="text-xs text-pink-500 hover:underline disabled:opacity-50"
              >
                {testingInApp ? 'Sending...' : 'Test'}
              </button>
              <input
                type="checkbox"
                checked={preferences.notifyViaInApp}
                onChange={(e) => setPreferences({ ...preferences, notifyViaInApp: e.target.checked })}
                className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <Mail className="w-5 h-5 text-blue-500" />
              <div>
                <p className="font-medium">Email Notifications</p>
                <p className="text-sm text-gray-500">Get alerts via email</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleTestNotification('email')}
                disabled={testingEmail || !preferences.notifyViaEmail}
                className="text-xs text-pink-500 hover:underline disabled:opacity-50"
              >
                {testingEmail ? 'Sending...' : 'Test'}
              </button>
              <input
                type="checkbox"
                checked={preferences.notifyViaEmail}
                onChange={(e) => setPreferences({ ...preferences, notifyViaEmail: e.target.checked })}
                className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
              />
            </div>
          </div>

          {/* SMS */}
          <div className="py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Smartphone className="w-5 h-5 text-green-500" />
                <div>
                  <p className="font-medium">SMS Notifications</p>
                  <p className="text-sm text-gray-500">Get alerts via text message</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {preferences.phoneNumber && preferences.phoneVerified && (
                  <button
                    onClick={() => handleTestNotification('sms')}
                    disabled={testingSms || !preferences.notifyViaSms}
                    className="text-xs text-pink-500 hover:underline disabled:opacity-50"
                  >
                    {testingSms ? 'Sending...' : 'Test'}
                  </button>
                )}
                <input
                  type="checkbox"
                  checked={preferences.notifyViaSms}
                  onChange={(e) => setPreferences({ ...preferences, notifyViaSms: e.target.checked })}
                  className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
                />
              </div>
            </div>

            {preferences.notifyViaSms && (
              <div className="mt-3 ml-8">
                <label className="text-sm text-gray-600 block mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={preferences.phoneNumber || ''}
                  onChange={(e) => setPreferences({ ...preferences, phoneNumber: e.target.value })}
                  placeholder="+1 (555) 123-4567"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
                {preferences.phoneNumber && !preferences.phoneVerified && (
                  <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Phone not verified. Save settings to verify.
                  </p>
                )}
                {preferences.phoneVerified && (
                  <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                    <Check className="w-3 h-3" />
                    Phone verified
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Quiet Hours Section */}
        <div className="bg-white rounded-2xl p-4 shadow-sm">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Moon className="w-5 h-5 text-indigo-500" />
            Quiet Hours
          </h2>

          <label className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-3">
              <BellOff className="w-5 h-5 text-gray-400" />
              <div>
                <p className="font-medium">Enable Quiet Hours</p>
                <p className="text-sm text-gray-500">Pause notifications during set times</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={quietHoursEnabled}
              onChange={(e) => setQuietHoursEnabled(e.target.checked)}
              className="w-5 h-5 rounded text-pink-500 focus:ring-pink-500"
            />
          </label>

          {quietHoursEnabled && (
            <div className="py-3 space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">Start</label>
                  <input
                    type="time"
                    value={preferences.quietHoursStart || '22:00'}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursStart: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-sm text-gray-600 block mb-1">End</label>
                  <input
                    type="time"
                    value={preferences.quietHoursEnd || '08:00'}
                    onChange={(e) => setPreferences({ ...preferences, quietHoursEnd: e.target.value })}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                </div>
              </div>
              <p className="text-xs text-gray-500">
                Timezone: {Intl.DateTimeFormat().resolvedOptions().timeZone}
              </p>
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl
            hover:shadow-lg transition-all disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>

        {/* Info Note */}
        <p className="text-center text-sm text-gray-500">
          SMS notifications require Twilio to be configured.<br />
          Contact support if you need help setting up SMS.
        </p>
      </div>
    </div>
  );
}
