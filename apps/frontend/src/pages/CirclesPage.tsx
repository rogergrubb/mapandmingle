import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Users, Plus, ChevronRight, X, UserPlus, 
  Check, Trash2, ArrowLeft, Edit2, Search,
  Phone, Video, MessageCircle, MapPin, Shield,
  Crown, Settings, ChevronDown
} from 'lucide-react';
import api from '../lib/api';
import { haptic } from '../lib/haptics';

interface CircleMember {
  id: string;
  name: string;
  image: string | null;
  role: string;
  lastActiveAt?: string;
  hasLocation?: boolean;
}

interface Circle {
  id: string;
  name: string;
  emoji: string;
  color: string;
  isOwner: boolean;
  memberCount: number;
  members: CircleMember[];
  createdAt?: string;
}

interface Connection {
  id: string;
  name: string;
  image: string | null;
  connectionId: string;
}

// Comprehensive icon list
const CIRCLE_ICONS = [
  // Family
  '👨‍👩‍👧‍👦', '👨‍👩‍👧', '👨‍👩‍👦', '👨‍👨‍👧', '👩‍👩‍👧', '👨‍👧', '👩‍👧', '👨‍👦', '👩‍👦',
  // People
  '👫', '👬', '👭', '🧑‍🤝‍🧑', '💑', '👪', '👥',
  // Places & Activities  
  '🏠', '🏡', '🏢', '🏫', '⛪', '🏥',
  // Transport
  '🚗', '🚕', '🚌', '✈️', '🚴', '🛵', '🏍️',
  // Sports & Activities
  '⚽', '🏀', '🎾', '🏊', '🎮', '🎬', '🎵', '📚', '💼', '🎓', '🏃', '🧘',
  // Hearts & Love
  '❤️', '💕', '💖', '💝', '💗', '💓', '🩷', '🧡', '💛', '💚', '💙', '💜',
  // Nature & Places
  '🌳', '🏔️', '🏖️', '🌅', '🌸', '🌺', '🌻',
  // Groups & Social
  '🤝', '🎉', '🎊', '✨', '⭐', '🌟', '💫',
  // Safety & Care
  '🛡️', '🔒', '🩺', '💊', '🏥', '🚨',
  // Work & School
  '💻', '📱', '📊', '📈', '🎨', '✏️', '📝',
  // Fun
  '🎭', '🎪', '🎯', '🎲', '🧩', '🎸', '🎹',
];

const CIRCLE_COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#6366F1', // Indigo
];

export default function CirclesPage() {
  const navigate = useNavigate();
  const { circleId } = useParams();
  
  const [circles, setCircles] = useState<Circle[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showAddMembersModal, setShowAddMembersModal] = useState<string | null>(null);
  const [selectedCircle, setSelectedCircle] = useState<Circle | null>(null);
  
  // Create circle form
  const [newCircleName, setNewCircleName] = useState('');
  const [newCircleEmoji, setNewCircleEmoji] = useState('👨‍👩‍👧‍👦');
  const [newCircleColor, setNewCircleColor] = useState('#3B82F6');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  useEffect(() => {
    fetchCircles();
    fetchConnections();
  }, []);

  useEffect(() => {
    if (circleId && circles.length > 0) {
      const circle = circles.find(c => c.id === circleId);
      if (circle) setSelectedCircle(circle);
    }
  }, [circleId, circles]);

  const fetchCircles = async () => {
    try {
      const res = await api.get('/api/circles');
      setCircles(res.data?.circles || res.circles || []);
    } catch (err) {
      console.error('Failed to fetch circles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const res = await api.get('/api/circles/connections');
      setConnections(res.data?.connections || res.connections || []);
    } catch (err) {
      console.error('Failed to fetch connections:', err);
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
        color: newCircleColor,
        memberIds: selectedMembers,
      });
      
      haptic.confirm();
      setShowCreateModal(false);
      resetCreateForm();
      fetchCircles();
    } catch (err) {
      console.error('Failed to create circle:', err);
      haptic.softTick();
    } finally {
      setSubmitting(false);
    }
  };

  const addMembersToCircle = async (circleId: string) => {
    if (selectedMembers.length === 0) return;
    
    setSubmitting(true);
    haptic.lightTap();
    
    try {
      await api.post(`/api/circles/${circleId}/members`, {
        memberIds: selectedMembers,
      });
      
      haptic.confirm();
      setShowAddMembersModal(null);
      setSelectedMembers([]);
      fetchCircles();
    } catch (err) {
      console.error('Failed to add members:', err);
      haptic.softTick();
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
      setSelectedCircle(null);
      fetchCircles();
    } catch (err) {
      console.error('Failed to delete circle:', err);
      haptic.softTick();
    }
  };

  const removeMember = async (circleId: string, memberId: string, memberName: string) => {
    if (!confirm(`Remove ${memberName} from this circle?`)) return;
    
    try {
      await api.delete(`/api/circles/${circleId}/members/${memberId}`);
      haptic.confirm();
      fetchCircles();
    } catch (err) {
      console.error('Failed to remove member:', err);
    }
  };

  const resetCreateForm = () => {
    setNewCircleName('');
    setNewCircleEmoji('👨‍👩‍👧‍👦');
    setNewCircleColor('#3B82F6');
    setSelectedMembers([]);
    setSearchQuery('');
    setShowIconPicker(false);
    setShowColorPicker(false);
  };

  const toggleMember = (memberId: string) => {
    setSelectedMembers(prev => 
      prev.includes(memberId) 
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  const filteredConnections = connections.filter(conn =>
    conn.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Get connections not already in circle for add members modal
  const getAvailableConnections = (circle: Circle) => {
    const memberIds = circle.members.map(m => m.id);
    return connections.filter(conn => !memberIds.includes(conn.id));
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Circle Detail View
  if (selectedCircle) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSelectedCircle(null)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div 
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: selectedCircle.color + '20' }}
            >
              {selectedCircle.emoji}
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{selectedCircle.name}</h1>
              <p className="text-sm text-gray-500">{selectedCircle.memberCount} members</p>
            </div>
            {selectedCircle.isOwner && (
              <button
                onClick={() => deleteCircle(selectedCircle.id, selectedCircle.name)}
                className="p-2 rounded-full text-red-500 hover:bg-red-50"
              >
                <Trash2 size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border-b border-gray-100 px-4 py-3">
          <div className="flex gap-2 overflow-x-auto">
            <button
              onClick={() => navigate(`/messages?circle=${selectedCircle.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-full text-sm font-medium whitespace-nowrap"
            >
              <MessageCircle size={16} /> Group Chat
            </button>
            <button
              onClick={() => navigate(`/map?circle=${selectedCircle.id}`)}
              className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-full text-sm font-medium whitespace-nowrap"
            >
              <MapPin size={16} /> View on Map
            </button>
            {selectedCircle.isOwner && (
              <button
                onClick={() => {
                  setSelectedMembers([]);
                  setShowAddMembersModal(selectedCircle.id);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-purple-50 text-purple-600 rounded-full text-sm font-medium whitespace-nowrap"
              >
                <UserPlus size={16} /> Add Members
              </button>
            )}
          </div>
        </div>

        {/* Members List */}
        <div className="flex-1 overflow-y-auto p-4">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">Members</h3>
          <div className="space-y-2">
            {selectedCircle.members.map(member => (
              <div 
                key={member.id}
                className="bg-white rounded-xl p-3 flex items-center gap-3"
              >
                <div className="relative">
                  {member.image ? (
                    <img src={member.image} alt="" className="w-12 h-12 rounded-full object-cover" />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                      <Users size={20} className="text-gray-400" />
                    </div>
                  )}
                  {member.hasLocation && (
                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white" />
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{member.name}</span>
                    {member.role === 'owner' && (
                      <Crown size={14} className="text-yellow-500" />
                    )}
                    {member.role === 'admin' && (
                      <Shield size={14} className="text-blue-500" />
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {member.role === 'owner' ? 'Owner' : member.role === 'admin' ? 'Admin' : 'Member'}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => navigate(`/messages/${member.id}`)}
                    className="p-2 rounded-full hover:bg-gray-100"
                    title="Message"
                  >
                    <MessageCircle size={18} className="text-gray-400" />
                  </button>
                  {selectedCircle.isOwner && member.role !== 'owner' && (
                    <button
                      onClick={() => removeMember(selectedCircle.id, member.id, member.name)}
                      className="p-2 rounded-full hover:bg-red-50"
                      title="Remove"
                    >
                      <X size={18} className="text-gray-400 hover:text-red-500" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Circles List View
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
            onClick={() => {
              resetCreateForm();
              setShowCreateModal(true);
            }}
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
              onClick={() => {
                resetCreateForm();
                setShowCreateModal(true);
              }}
              className="px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700"
            >
              <Plus size={18} className="inline mr-2" />
              Create Circle
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {circles.map((circle) => (
              <div 
                key={circle.id} 
                className="bg-white rounded-2xl shadow-sm overflow-hidden cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => setSelectedCircle(circle)}
              >
                <div className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl"
                        style={{ backgroundColor: circle.color + '20' }}
                      >
                        {circle.emoji}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-900 flex items-center gap-2">
                          {circle.name}
                          {circle.isOwner && <Crown size={14} className="text-yellow-500" />}
                        </div>
                        <div className="text-sm text-gray-500">{circle.memberCount} members</div>
                      </div>
                    </div>
                    <ChevronRight size={20} className="text-gray-400" />
                  </div>
                  
                  {/* Member Avatars */}
                  <div className="flex items-center mt-3 -space-x-2">
                    {circle.members.slice(0, 5).map((member, i) => (
                      <div 
                        key={member.id}
                        className="w-8 h-8 rounded-full border-2 border-white overflow-hidden bg-gray-200"
                        style={{ zIndex: 5 - i }}
                      >
                        {member.image ? (
                          <img src={member.image} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-gray-500">
                            {member.name.charAt(0)}
                          </div>
                        )}
                      </div>
                    ))}
                    {circle.memberCount > 5 && (
                      <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-100 flex items-center justify-center text-xs font-medium text-gray-600">
                        +{circle.memberCount - 5}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create Circle Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-bold">Create Circle</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Modal Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {/* Icon & Color */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Icon & Color</label>
                <div className="flex items-center gap-3">
                  {/* Icon Picker Button */}
                  <button
                    onClick={() => setShowIconPicker(!showIconPicker)}
                    className="w-16 h-16 rounded-xl flex items-center justify-center text-3xl border-2 border-dashed border-gray-300 hover:border-blue-400 transition-colors"
                    style={{ backgroundColor: newCircleColor + '20' }}
                  >
                    {newCircleEmoji}
                  </button>
                  
                  {/* Color Picker */}
                  <div className="flex flex-wrap gap-2">
                    {CIRCLE_COLORS.map(color => (
                      <button
                        key={color}
                        onClick={() => setNewCircleColor(color)}
                        className={`w-8 h-8 rounded-full transition-transform ${newCircleColor === color ? 'ring-2 ring-offset-2 ring-blue-500 scale-110' : ''}`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

                {/* Icon Grid */}
                {showIconPicker && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-xl max-h-48 overflow-y-auto">
                    <div className="grid grid-cols-8 gap-2">
                      {CIRCLE_ICONS.map(icon => (
                        <button
                          key={icon}
                          onClick={() => {
                            setNewCircleEmoji(icon);
                            setShowIconPicker(false);
                          }}
                          className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl hover:bg-white transition-colors ${newCircleEmoji === icon ? 'bg-white ring-2 ring-blue-500' : ''}`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Name */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">Name</label>
                <input
                  type="text"
                  value={newCircleName}
                  onChange={(e) => setNewCircleName(e.target.value)}
                  placeholder="e.g., Family, Close Friends, Carpool"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 outline-none"
                  maxLength={50}
                />
              </div>

              {/* Add Members */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Add Members <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                
                {connections.length === 0 ? (
                  <div className="text-center py-6 bg-gray-50 rounded-xl">
                    <Users size={24} className="mx-auto text-gray-400 mb-2" />
                    <p className="text-sm text-gray-500">No connections yet</p>
                    <p className="text-xs text-gray-400 mt-1">Connect with people on the map first</p>
                  </div>
                ) : (
                  <>
                    {/* Search */}
                    <div className="relative mb-3">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search connections..."
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-blue-500 outline-none text-sm"
                      />
                    </div>

                    {/* Connections List */}
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {filteredConnections.map(conn => (
                        <button
                          key={conn.id}
                          onClick={() => toggleMember(conn.id)}
                          className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                            selectedMembers.includes(conn.id) 
                              ? 'bg-blue-50 border-2 border-blue-500' 
                              : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                          }`}
                        >
                          {conn.image ? (
                            <img src={conn.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <span className="text-sm font-bold text-gray-600">{conn.name.charAt(0)}</span>
                            </div>
                          )}
                          <span className="flex-1 text-left font-medium">{conn.name}</span>
                          {selectedMembers.includes(conn.id) && (
                            <Check size={20} className="text-blue-500" />
                          )}
                        </button>
                      ))}
                    </div>

                    {selectedMembers.length > 0 && (
                      <p className="text-sm text-blue-600 mt-2">
                        {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                      </p>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-4 py-3 border-t">
              <button
                onClick={createCircle}
                disabled={!newCircleName.trim() || submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {submitting ? 'Creating...' : 'Create Circle'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Members Modal */}
      {showAddMembersModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl w-full max-w-md max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b">
              <h2 className="text-lg font-bold">Add Members</h2>
              <button onClick={() => setShowAddMembersModal(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X size={20} />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4">
              {(() => {
                const circle = circles.find(c => c.id === showAddMembersModal);
                if (!circle) return null;
                
                const available = getAvailableConnections(circle);
                
                if (available.length === 0) {
                  return (
                    <div className="text-center py-8">
                      <Users size={32} className="mx-auto text-gray-400 mb-3" />
                      <p className="text-gray-500">All your connections are already members</p>
                    </div>
                  );
                }

                return (
                  <div className="space-y-2">
                    {available.map(conn => (
                      <button
                        key={conn.id}
                        onClick={() => toggleMember(conn.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                          selectedMembers.includes(conn.id) 
                            ? 'bg-blue-50 border-2 border-blue-500' 
                            : 'bg-gray-50 border-2 border-transparent hover:bg-gray-100'
                        }`}
                      >
                        {conn.image ? (
                          <img src={conn.image} alt="" className="w-10 h-10 rounded-full object-cover" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                            <span className="text-sm font-bold text-gray-600">{conn.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="flex-1 text-left font-medium">{conn.name}</span>
                        {selectedMembers.includes(conn.id) && (
                          <Check size={20} className="text-blue-500" />
                        )}
                      </button>
                    ))}
                  </div>
                );
              })()}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t">
              <button
                onClick={() => addMembersToCircle(showAddMembersModal)}
                disabled={selectedMembers.length === 0 || submitting}
                className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-semibold disabled:opacity-50"
              >
                {submitting ? 'Adding...' : `Add ${selectedMembers.length} Member${selectedMembers.length !== 1 ? 's' : ''}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
