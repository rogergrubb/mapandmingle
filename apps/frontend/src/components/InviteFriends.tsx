import { useState, useEffect } from 'react';
import { Share2, Copy, Check, Users, Gift, X } from 'lucide-react';
import api from '../lib/api';
import haptic from '../lib/haptics';

interface InviteFriendsProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InviteFriends({ isOpen, onClose }: InviteFriendsProps) {
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchReferralCode();
    }
  }, [isOpen]);

  const fetchReferralCode = async () => {
    setLoading(true);
    try {
      const response = await api.get('/api/users/me/referral-code');
      const data = response.data || response;
      setReferralCode(data.referralCode);
      setShareUrl(data.shareUrl);
    } catch (error) {
      console.error('Failed to get referral code:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      haptic.success();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const handleShare = async () => {
    if (!shareUrl) return;
    
    haptic.softTick();
    
    // Use Web Share API if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Map & Mingle!',
          text: 'Find your people! Join me on Map & Mingle - the app that helps you connect with others nearby.',
          url: shareUrl,
        });
      } catch (error) {
        // User cancelled or share failed, fall back to copy
        handleCopy();
      }
    } else {
      // Fall back to copy
      handleCopy();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 p-6 text-white relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X size={20} />
          </button>
          
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Gift size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold">Invite Friends</h2>
              <p className="text-white/80 text-sm">Share the love!</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Benefits */}
              <div className="mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">Why invite friends?</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-3 text-gray-600">
                    <Users size={18} className="text-purple-500" />
                    <span className="text-sm">More people to connect with nearby</span>
                  </div>
                  <div className="flex items-center gap-3 text-gray-600">
                    <Gift size={18} className="text-pink-500" />
                    <span className="text-sm">Help your friends find their people</span>
                  </div>
                </div>
              </div>

              {/* Referral Code */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your invite code
                </label>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-gray-100 rounded-xl px-4 py-3 font-mono text-lg font-bold text-center tracking-wider">
                    {referralCode || '--------'}
                  </div>
                  <button
                    onClick={handleCopy}
                    className="p-3 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check size={20} className="text-green-500" />
                    ) : (
                      <Copy size={20} className="text-gray-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Share Link */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Or share this link
                </label>
                <div className="bg-gray-100 rounded-xl px-4 py-3 text-sm text-gray-600 break-all">
                  {shareUrl || 'Loading...'}
                </div>
              </div>

              {/* Share Button */}
              <button
                onClick={handleShare}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity"
              >
                <Share2 size={20} />
                Share Invite Link
              </button>

              {copied && (
                <p className="text-center text-green-600 text-sm mt-3 animate-pulse">
                  ✓ Copied to clipboard!
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
