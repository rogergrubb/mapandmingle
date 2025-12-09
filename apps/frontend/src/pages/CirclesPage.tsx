import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Users, Plus, Settings, ChevronRight, X, UserPlus, 
  Check, Trash2, ArrowLeft, Edit2
} from 'lucide-react';
import api from '../lib/api';
import { haptic } from '../lib/haptics';

interface CircleMember {
  id: string;
  name: string;
  image: string | null;
  role: string;
}

interface Circle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isOwner: boolean;
  memberCount: number;
  members: CircleMember[];
}

export default function CirclesPage() {
  const navigate = useNavigate();
  const [circles, setCircles] = useState<Circle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState<string | null>(null);
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleEmoji, setNewCircleEmoji] = useState('👨‍👩‍👧‍👦');
  const [inviteEmail, setInviteEmail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const emojis = ['👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👨‍👧', '👩‍👩‍👧', '👨‍👧', '👩‍👧', '👫', '🏠', '🚗', '⚽', '💼', '🎓'];

  useEffect(() => {
    fetchCircles();
  }, []);

  const fetchCircles = async () => {
    try {
      const res = await api.get('/api/circles');
      setCircles(res.data.circles || []);
    } catch (err) {
      console.error('Failed to fetch circles:', err);
    } finally {
      setLoading(false);
    }
  };

  const createCircle = async () => {
    if (!newCircleName.trim()) return;
    
    setSubmitting(true);
    haptic.lightTap();
    
    try {
      await api.post('/api/circles', {
        name: newCircleName.trim(),
        emoji: newCircleEmoji,
      });
      
      haptic.confirm();
      setShowCreateModal(false);
      setNewCircleName('');
      setNewCircleEmoji('👨‍👩‍👧‍👦');
      fetchCircles();
    } catch (err) {
      console.error('Failed to create circle:', err);
      haptic.softTick();
    } finally {
      setSubmitting(false);
    }
  };

  const inviteMember = async (circleId: string) => {
    if (!inviteEmail.trim()) return;
    
    setSubmitting(true);
    haptic.lightTap();
    
    try {
      await api.post(`/api/circles/${circleId}/invite`, {
        inviteeEmail: inviteEmail.trim(),
      });
      
      haptic.confirm();
      setShowInviteModal(null);
      setInviteEmail('');
      fetchCircles();
    } catch (err: any) {
      console.error('Failed to invite:', err);
      haptic.softTick();
      alert(err.response?.data?.error || 'Failed to invite member');
    } finally {
      setSubmitting(false);
    }
  };

  const deleteCircle = async (circleId: string, circleName: string) => {
    if (!confirm(`Delete "${circleName}"? This cannot be undone.`)) return;
    
    haptic.lightTap();
    
    try {
      await api.delete(`/api/circles/${circleId}`);
      haptic.confirm();
      fetchCircles();
    } catch (err) {
      console.error('Failed to delete circle:', err);
      haptic.softTick();
    }
  };

  const leaveCircle = async (circleId: string, circleName: string, userId: string) => {
    if (!confirm(`Leave "${circleName}"?`)) return;
    
    haptic.lightTap();
    
    try {
      await api.delete(`/api/circles/${circleId}/members/${userId}`);
      haptic.confirm();
      fetchCircles();
    } catch (err) {
      console.error('Failed to leave circle:', err);
      haptic.softTick();
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-gray-900">My Circles</h1>
            <p className="text-sm text-gray-500">Manage your family & friend groups</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="p-2 rounded-full bg-blue-100 text-blue-600 hover:bg-blue-200"
          >
            <Plus size={20} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {circles.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="w-20 h-20 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <Users size={36} className="text-blue-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">No Circles Yet</h3>
            <p className="text-sm text-gray-500 text-center max-w-xs mb-6">
              Create a circle to share your location with family and friends
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
            >
              <Plus size={18} className="inline mr-2" />
              Create Circle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {circles.map((circle) => (
              <div key={circle.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                {/* Circle Header */}
                <div className="p-4 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: circle.color + '20' }}
                      >
                        {circle.emoji}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900">{circle.name}</div>
                        <div className="text-sm text-gray-500">{circle.memberCount} members</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setShowInviteModal(circle.id)}
                        className="p-2 rounded-full bg-blue-50 text-blue-600 hover:bg-blue-100"
                      >
                        <UserPlus size={18} />
                      </button>
                      {circle.isOwner ? (
                        <button
                          onClick={() => deleteCircle(circle.id, circle.name)}
                          className="p-2 rounded-full bg-red-50 text-red-500 hover:bg-red-100"
                        >
                          <Trash2 size={18} />
                        </button>
                      ) : (
                        <button
                          onClick={() => leaveCircle(circle.id, circle.name, '')}
                          className="px-3 py-1.5 rounded-full bg-gray-100 text-gray-600 text-xs font-medium hover:bg-gray-200"
                        >
                          Leave
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Members */}
                <div className="divide-y divide-gray-50">
                  {circle.members.map((member) => (
                    <div key={member.id} className="px-4 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                        {member.image ? (
                          <img src={member.image} alt={member.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          member.name?.charAt(0).toUpperCase() || '?'
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{member.name}</div>
                        {member.role === 'owner' && (
                          <div className="text-xs text-blue-600">Owner</div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Create Circle</h2>
              <button 
                onClick={() => setShowCreateModal(false)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              {/* Emoji Picker */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Icon</label>
                <div className="flex flex-wrap gap-2">
                  {emojis.map((emoji) => (
                    <button
                      key={emoji}
                      onClick={() => setNewCircleEmoji(emoji)}
                      className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center transition-all ${
                        newCircleEmoji === emoji 
                          ? 'bg-blue-100 ring-2 ring-blue-500' 
                          : 'bg-gray-100 hover:bg-gray-200'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Name</label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g., Family, Close Friends, Carpool"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  maxLength={50}
                />
              </div>

              <button
                onClick={createCircle}
                disabled={!newCircleName.trim() || submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Circle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
          <div className="bg-white rounded-t-3xl sm:rounded-2xl w-full max-w-md">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">Invite Member</h2>
              <button 
                onClick={() => setShowInviteModal(null)}
                className="p-2 rounded-full hover:bg-gray-100"
              >
                <X size={20} className="text-gray-500" />
              </button>
            </div>
            
            <div className="p-4 space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 mb-2 block">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  They must have an account to join your circle
                </p>
              </div>

              <button
                onClick={() => inviteMember(showInviteModal)}
                disabled={!inviteEmail.trim() || submitting}
                className="w-full py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Sending...' : 'Send Invite'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
