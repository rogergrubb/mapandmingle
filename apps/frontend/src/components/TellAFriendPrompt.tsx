import { useState, useEffect } from 'react';
import { X, Share2, Copy, Check, Mail, Phone, Users, Heart, Sparkles } from 'lucide-react';
import haptic from '../lib/haptics';
import api from '../lib/api';

interface TellAFriendPromptProps {
  onClose: () => void;
}

const VISIT_COUNT_KEY = 'mapandmingle_visit_count';
const PROMPT_SHOWN_KEY = 'mapandmingle_tellfriend_shown';
const PROMPT_DISMISSED_KEY = 'mapandmingle_tellfriend_dismissed';

// Helper to check if prompt should show
export function shouldShowTellAFriendPrompt(): boolean {
  // Don't show if user already dismissed it
  const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
  if (dismissed === 'true') return false;
  
  // Don't show if already shown this session
  const shownThisSession = sessionStorage.getItem(PROMPT_SHOWN_KEY);
  if (shownThisSession === 'true') return false;
  
  // Check visit count
  const visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  return visitCount >= 3;
}

// Helper to increment visit count (call on app load)
export function incrementVisitCount(): void {
  const currentCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10);
  localStorage.setItem(VISIT_COUNT_KEY, String(currentCount + 1));
}

// Helper to mark prompt as shown this session
export function markPromptShown(): void {
  sessionStorage.setItem(PROMPT_SHOWN_KEY, 'true');
}

export default function TellAFriendPrompt({ onClose }: TellAFriendPromptProps) {
  const [activeTab, setActiveTab] = useState<'share' | 'invite'>('share');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [copied, setCopied] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const shareUrl = 'https://www.mapandmingle.com';
  const shareText = "I've been using Map & Mingle to find my people - check it out!";

  useEffect(() => {
    // Mark as shown when component mounts
    markPromptShown();
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(PROMPT_DISMISSED_KEY, 'true');
    haptic.softTick();
    onClose();
  };

  const handleLater = () => {
    haptic.softTick();
    onClose();
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      haptic.confirm();
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleNativeShare = async () => {
    haptic.softTick();
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Map & Mingle - Find Your People',
          text: shareText,
          url: shareUrl,
        });
        haptic.confirm();
      } catch (err) {
        // User cancelled, that's okay
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  const handleSendInvite = async () => {
    if (!email && !phone) {
      setError('Please enter an email or phone number');
      return;
    }

    // Basic email validation
    if (email && !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }

    setSending(true);
    setError('');
    haptic.softTick();

    try {
      await api.post('/api/invites/send', {
        email: email || undefined,
        phone: phone || undefined,
        message: shareText,
      });
      
      setSent(true);
      haptic.confirm();
      setEmail('');
      setPhone('');
      
      // Reset sent state after 3 seconds
      setTimeout(() => setSent(false), 3000);
    } catch (err: any) {
      console.error('Failed to send invite:', err);
      setError(err?.response?.data?.error || 'Failed to send invite. Try copying the link instead!');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden animate-slideUp">
        {/* Header with gradient */}
        <div className="relative bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-6 text-white">
          {/* Decorative elements */}
          <div className="absolute top-4 right-12 opacity-20">
            <Sparkles className="w-8 h-8" />
          </div>
          <div className="absolute bottom-4 left-8 opacity-20">
            <Heart className="w-6 h-6" />
          </div>
          
          {/* Close button */}
          <button
            onClick={handleLater}
            className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="p-3 bg-white/20 rounded-2xl">
              <Users className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl font-bold">Loving Map & Mingle?</h2>
              <p className="text-white/80 text-sm">Help others find their people too!</p>
            </div>
          </div>
        </div>

        {/* Tab buttons */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setActiveTab('share')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'share'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Share2 className="w-4 h-4 inline mr-2" />
            Quick Share
          </button>
          <button
            onClick={() => setActiveTab('invite')}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === 'invite'
                ? 'text-purple-600 border-b-2 border-purple-600 bg-purple-50/50'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <Mail className="w-4 h-4 inline mr-2" />
            Send Invite
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          {activeTab === 'share' ? (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm text-center">
                Share Map & Mingle with everyone you know! The more people join, the more connections you can make.
              </p>
              
              {/* URL display */}
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <span className="flex-1 text-gray-700 text-sm font-medium truncate">
                  {shareUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className={`p-2 rounded-lg transition-all ${
                    copied 
                      ? 'bg-green-100 text-green-600' 
                      : 'bg-purple-100 text-purple-600 hover:bg-purple-200'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {copied && (
                <p className="text-green-600 text-sm text-center font-medium animate-fadeIn">
                  ✓ Link copied! Now share it everywhere!
                </p>
              )}

              {/* Share button */}
              <button
                onClick={handleNativeShare}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg"
              >
                <Share2 className="w-5 h-5" />
                Share with Friends
              </button>

              <p className="text-gray-400 text-xs text-center">
                Share via text, social media, email - anywhere!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-gray-600 text-sm text-center">
                Send a personal invite to someone specific.
              </p>

              {/* Email input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mail className="w-4 h-4 inline mr-1" />
                  Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {/* Phone input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Phone className="w-4 h-4 inline mr-1" />
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="(555) 123-4567"
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none transition-all"
                />
              </div>

              {error && (
                <p className="text-red-500 text-sm text-center">{error}</p>
              )}

              {sent && (
                <p className="text-green-600 text-sm text-center font-medium animate-fadeIn">
                  ✓ Invite sent successfully!
                </p>
              )}

              {/* Send button */}
              <button
                onClick={handleSendInvite}
                disabled={sending || (!email && !phone)}
                className="w-full py-3 px-4 bg-gradient-to-r from-pink-500 to-purple-600 text-white font-semibold rounded-xl hover:opacity-90 transition-opacity flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-5 h-5" />
                    Send Invite
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 pt-2 flex gap-3">
          <button
            onClick={handleLater}
            className="flex-1 py-2.5 px-4 text-gray-500 font-medium rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            Maybe Later
          </button>
          <button
            onClick={handleDismiss}
            className="flex-1 py-2.5 px-4 text-gray-400 font-medium rounded-xl hover:bg-gray-100 transition-colors text-sm"
          >
            Don't Show Again
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
}
