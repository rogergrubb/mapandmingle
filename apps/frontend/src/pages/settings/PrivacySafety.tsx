import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Shield, 
  Eye, 
  Lock, 
  Users, 
  Bell,
  MessageCircle,
  MapPin,
  Loader2,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import api from '../../lib/api';
import VisibilitySlider, { VisibilityLevel } from '../../components/privacy/VisibilitySlider';

interface PrivacySettings {
  visibilityLevel: VisibilityLevel;
  beaconDuration: number;
  allowMessages: 'everyone' | 'friends' | 'nobody';
  showOnlineStatus: boolean;
  allowTags: boolean;
  shareData: boolean;
}

export default function PrivacySafety() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [settings, setSettings] = useState<PrivacySettings>({
    visibilityLevel: 'circles',
    beaconDuration: 60,
    allowMessages: 'everyone',
    showOnlineStatus: true,
    allowTags: true,
    shareData: false,
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [visibilityRes, settingsRes] = await Promise.all([
        api.get('/api/visibility'),
        api.get('/api/settings/privacy').catch(() => null)
      ]);

      setSettings(prev => ({
        ...prev,
        visibilityLevel: visibilityRes.visibilityLevel || 'circles',
        beaconDuration: visibilityRes.beaconDuration || 60,
        ...(settingsRes || {})
      }));
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleVisibilityChange = async (level: VisibilityLevel) => {
    setSettings(prev => ({ ...prev, visibilityLevel: level }));
    setSaving(true);
    setError(null);
    
    try {
      await api.put('/api/visibility', { 
        visibilityLevel: level,
        beaconDuration: settings.beaconDuration 
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setError('Failed to update visibility');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleBeaconDurationChange = async (minutes: number) => {
    setSettings(prev => ({ ...prev, beaconDuration: minutes }));
    
    if (settings.visibilityLevel === 'beacon') {
      try {
        await api.put('/api/visibility', { 
          visibilityLevel: 'beacon',
          beaconDuration: minutes 
        });
      } catch (err) {
        console.error('Failed to update beacon duration:', err);
      }
    }
  };

  const handleSettingChange = async (key: keyof PrivacySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    
    try {
      await api.put('/api/settings/privacy', {
        ...settings,
        [key]: value
      });
    } catch (err) {
      console.error('Failed to update setting:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-24">
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
              <h1 className="text-xl font-semibold">Privacy & Visibility</h1>
              <p className="text-sm text-gray-600">Control who sees you</p>
            </div>
          </div>
          
          {/* Status indicator */}
          <div className="flex items-center gap-2">
            {saving && <Loader2 className="w-5 h-5 animate-spin text-purple-500" />}
            {saved && <CheckCircle className="w-5 h-5 text-green-500" />}
            {error && <AlertCircle className="w-5 h-5 text-red-500" />}
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Main Visibility Control - THE STAR OF THE SHOW */}
        <div className="space-y-2">
          <div className="flex items-center gap-2 px-1">
            <MapPin className="w-5 h-5 text-purple-600" />
            <h2 className="text-lg font-semibold">Your Visibility</h2>
          </div>
          <p className="text-sm text-gray-600 px-1 mb-4">
            Slide to control who can see you on the map. Your choice, your control.
          </p>
          
          <VisibilitySlider
            value={settings.visibilityLevel}
            onChange={handleVisibilityChange}
            beaconDuration={settings.beaconDuration}
            onBeaconDurationChange={handleBeaconDurationChange}
            showDetails={true}
          />
        </div>

        {/* Quick explanation */}
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-2xl p-4 border border-purple-100">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-purple-900">Your Privacy Matters</h3>
              <p className="text-sm text-purple-700 mt-1">
                MapMingle puts you in control. Unlike other apps, we never share your data. 
                Your location is only visible based on <strong>your</strong> choice above.
              </p>
            </div>
          </div>
        </div>

        {/* Additional Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm space-y-4">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <Lock className="w-5 h-5 text-gray-600" />
            Additional Privacy Controls
          </h3>

          {/* Who Can Message */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <MessageCircle className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Who can message you</p>
                <p className="text-sm text-gray-500">Control who can start conversations</p>
              </div>
            </div>
            <select
              value={settings.allowMessages}
              onChange={(e) => handleSettingChange('allowMessages', e.target.value)}
              className="px-3 py-2 bg-gray-100 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="everyone">Everyone</option>
              <option value="friends">Friends only</option>
              <option value="nobody">Nobody</option>
            </select>
          </div>

          {/* Show Online Status */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Eye className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Show online status</p>
                <p className="text-sm text-gray-500">Let others know when you're active</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('showOnlineStatus', !settings.showOnlineStatus)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.showOnlineStatus ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.showOnlineStatus ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Allow Tags */}
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Allow tags in posts</p>
                <p className="text-sm text-gray-500">Let others tag you in events & posts</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('allowTags', !settings.allowTags)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.allowTags ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.allowTags ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          {/* Data Sharing */}
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-gray-500" />
              <div>
                <p className="font-medium">Anonymous analytics</p>
                <p className="text-sm text-gray-500">Help improve MapMingle (no personal data)</p>
              </div>
            </div>
            <button
              onClick={() => handleSettingChange('shareData', !settings.shareData)}
              className={`relative w-12 h-7 rounded-full transition-colors ${
                settings.shareData ? 'bg-purple-500' : 'bg-gray-300'
              }`}
            >
              <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                settings.shareData ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>

        {/* Privacy Promise */}
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            🔒 We never sell your location data. Ever.
          </p>
          <a 
            href="/privacy" 
            className="text-sm text-purple-600 hover:text-purple-700 font-medium"
          >
            Read our Privacy Policy →
          </a>
        </div>
      </div>
    </div>
  );
}
