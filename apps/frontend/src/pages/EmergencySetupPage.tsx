import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Shield, Phone, Mail, Users, Check, ChevronRight, ChevronLeft,
  Plus, Trash2, Edit2, X, AlertTriangle, Bell, MessageCircle,
  UserPlus, ArrowLeft, PhoneCall, MessageSquare, Grip
} from 'lucide-react';
import api from '../lib/api';
import { haptic } from '../lib/haptics';

interface EmergencyContact {
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  relationship: string | null;
  priority: number;
  notifyViaCall: boolean;
  notifyViaSms: boolean;
  notifyViaApp: boolean;
  notifyViaEmail: boolean;
  linkedUser?: {
    id: string;
    name: string;
    image: string | null;
  } | null;
}

interface SetupStatus {
  setupComplete: boolean;
  setupPercentage: number;
  hasContacts: boolean;
  contactCount: number;
  hasPhone: boolean;
  phoneVerified: boolean;
  hasCircle: boolean;
  circleCount: number;
}

const RELATIONSHIPS = [
  'Spouse/Partner',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Roommate',
  'Coworker',
  'Neighbor',
  'Other'
];

export default function EmergencySetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [setupStatus, setSetupStatus] = useState<SetupStatus | null>(null);
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Add/Edit contact form
  const [showContactForm, setShowContactForm] = useState(false);
  const [editingContact, setEditingContact] = useState<EmergencyContact | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    relationship: '',
    notifyViaCall: true,
    notifyViaSms: true,
    notifyViaApp: false,
    notifyViaEmail: true,
  });

  // Phone setup
  const [userPhone, setUserPhone] = useState('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statusRes, contactsRes] = await Promise.all([
        api.get('/api/safety/emergency-setup'),
        api.get('/api/safety/emergency-contacts'),
      ]);
      
      setSetupStatus(statusRes.data || statusRes);
      setContacts(contactsRes.data?.contacts || contactsRes.contacts || []);
      
      // Determine starting step
      const status = statusRes.data || statusRes;
      if (!status.hasContacts) {
        setStep(1); // Start at add contacts
      } else if (!status.hasPhone) {
        setStep(2); // Phone setup
      } else {
        setStep(0); // Overview
      }
    } catch (err) {
      console.error('Failed to fetch setup data:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveContact = async () => {
    if (!formData.name.trim()) {
      alert('Please enter a name');
      return;
    }
    if (!formData.phone && !formData.email) {
      alert('Please enter a phone number or email');
      return;
    }

    setSaving(true);
    haptic.lightTap();

    try {
      if (editingContact) {
        await api.put(`/api/safety/emergency-contacts/${editingContact.id}`, formData);
      } else {
        await api.post('/api/safety/emergency-contacts', formData);
      }
      
      haptic.confirm();
      setShowContactForm(false);
      resetForm();
      fetchData();
    } catch (err) {
      console.error('Failed to save contact:', err);
      alert('Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const deleteContact = async (contactId: string) => {
    if (!confirm('Remove this emergency contact?')) return;
    
    try {
      await api.delete(`/api/safety/emergency-contacts/${contactId}`);
      haptic.confirm();
      fetchData();
    } catch (err) {
      console.error('Failed to delete contact:', err);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      relationship: '',
      notifyViaCall: true,
      notifyViaSms: true,
      notifyViaApp: false,
      notifyViaEmail: true,
    });
    setEditingContact(null);
  };

  const editContact = (contact: EmergencyContact) => {
    setEditingContact(contact);
    setFormData({
      name: contact.name,
      phone: contact.phone || '',
      email: contact.email || '',
      relationship: contact.relationship || '',
      notifyViaCall: contact.notifyViaCall,
      notifyViaSms: contact.notifyViaSms,
      notifyViaApp: contact.notifyViaApp,
      notifyViaEmail: contact.notifyViaEmail,
    });
    setShowContactForm(true);
  };

  const savePhone = async () => {
    if (!userPhone.trim()) {
      alert('Please enter your phone number');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/api/profile', { phoneNumber: userPhone });
      haptic.confirm();
      fetchData();
      setStep(3); // Go to test
    } catch (err) {
      console.error('Failed to save phone:', err);
      alert('Failed to save phone number');
    } finally {
      setSaving(false);
    }
  };

  const testEmergencyAlert = async () => {
    if (!confirm('This will send a TEST alert to your emergency contacts. Continue?')) return;
    
    haptic.lightTap();
    
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 });
      }).catch(() => null);

      await api.post('/api/safety/emergency-alert', {
        latitude: pos?.coords.latitude || 0,
        longitude: pos?.coords.longitude || 0,
        message: 'This is a TEST emergency alert',
        alertType: 'test',
      });

      haptic.confirm();
      alert('Test alert sent! Check that your contacts received it.');
    } catch (err) {
      console.error('Test alert failed:', err);
      alert('Failed to send test alert');
    }
  };

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-3 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Overview/Dashboard
  if (step === 0) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(-1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ArrowLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Emergency Setup</h1>
              <p className="text-sm text-gray-500">Configure your emergency alerts</p>
            </div>
          </div>
        </div>

        {/* Setup Progress */}
        <div className="bg-gradient-to-r from-red-500 to-orange-500 px-4 py-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Shield size={24} />
            </div>
            <div>
              <div className="text-2xl font-bold">{setupStatus?.setupPercentage || 0}%</div>
              <div className="text-sm opacity-90">Setup Complete</div>
            </div>
          </div>
          <div className="w-full bg-white/20 rounded-full h-2">
            <div 
              className="bg-white rounded-full h-2 transition-all duration-500"
              style={{ width: `${setupStatus?.setupPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* Setup Items */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Emergency Contacts */}
          <div 
            className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer ${setupStatus?.hasContacts ? 'border-2 border-green-500' : ''}`}
            onClick={() => setStep(1)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${setupStatus?.hasContacts ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {setupStatus?.hasContacts ? <Check size={20} /> : <Users size={20} />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Emergency Contacts</div>
                <div className="text-sm text-gray-500">
                  {setupStatus?.hasContacts ? `${setupStatus.contactCount} contact${setupStatus.contactCount !== 1 ? 's' : ''} added` : 'Add people to notify'}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Phone Number */}
          <div 
            className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer ${setupStatus?.hasPhone ? 'border-2 border-green-500' : ''}`}
            onClick={() => setStep(2)}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${setupStatus?.hasPhone ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {setupStatus?.hasPhone ? <Check size={20} /> : <Phone size={20} />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Your Phone Number</div>
                <div className="text-sm text-gray-500">
                  {setupStatus?.hasPhone ? 'Phone number saved' : 'Required for receiving alerts'}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Circles */}
          <div 
            className={`bg-white rounded-2xl p-4 shadow-sm cursor-pointer ${setupStatus?.hasCircle ? 'border-2 border-green-500' : ''}`}
            onClick={() => navigate('/circles')}
          >
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${setupStatus?.hasCircle ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
                {setupStatus?.hasCircle ? <Check size={20} /> : <Users size={20} />}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">Safety Circles</div>
                <div className="text-sm text-gray-500">
                  {setupStatus?.hasCircle ? `In ${setupStatus.circleCount} circle${setupStatus.circleCount !== 1 ? 's' : ''}` : 'Join or create a circle'}
                </div>
              </div>
              <ChevronRight size={20} className="text-gray-400" />
            </div>
          </div>

          {/* Test Button */}
          {setupStatus?.setupComplete && (
            <button
              onClick={testEmergencyAlert}
              className="w-full py-4 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-semibold flex items-center justify-center gap-2"
            >
              <AlertTriangle size={20} />
              Test Emergency Alert
            </button>
          )}
        </div>
      </div>
    );
  }

  // Step 1: Emergency Contacts
  if (step === 1) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(0)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Emergency Contacts</h1>
              <p className="text-sm text-gray-500">People who will be notified in an emergency</p>
            </div>
            <button
              onClick={() => { resetForm(); setShowContactForm(true); }}
              className="p-2 rounded-full bg-red-100 text-red-600"
            >
              <Plus size={20} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {contacts.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users size={32} className="text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-1">No Emergency Contacts</h3>
              <p className="text-sm text-gray-500 mb-6">Add someone who should be notified if you trigger an emergency alert</p>
              <button
                onClick={() => { resetForm(); setShowContactForm(true); }}
                className="px-6 py-3 bg-red-600 text-white rounded-full font-medium"
              >
                <UserPlus size={18} className="inline mr-2" />
                Add Contact
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {contacts.map((contact, index) => (
                <div key={contact.id} className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center text-red-600 font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-gray-900">{contact.name}</div>
                      {contact.relationship && (
                        <div className="text-xs text-gray-500">{contact.relationship}</div>
                      )}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {contact.phone && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <Phone size={10} /> {contact.phone}
                          </span>
                        )}
                        {contact.email && (
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded-full flex items-center gap-1">
                            <Mail size={10} /> {contact.email}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-2 mt-2">
                        {contact.notifyViaCall && <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">📞 Call</span>}
                        {contact.notifyViaSms && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">💬 SMS</span>}
                        {contact.notifyViaEmail && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">📧 Email</span>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => editContact(contact)} className="p-2 hover:bg-gray-100 rounded-full">
                        <Edit2 size={16} className="text-gray-400" />
                      </button>
                      <button onClick={() => deleteContact(contact.id)} className="p-2 hover:bg-red-50 rounded-full">
                        <Trash2 size={16} className="text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              <button
                onClick={() => { resetForm(); setShowContactForm(true); }}
                className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-500 hover:border-red-500 hover:text-red-500 transition-colors"
              >
                <Plus size={18} className="inline mr-2" />
                Add Another Contact
              </button>
            </div>
          )}
        </div>

        {contacts.length > 0 && (
          <div className="px-4 py-3 bg-white border-t">
            <button
              onClick={() => setStep(setupStatus?.hasPhone ? 3 : 2)}
              className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold"
            >
              Continue
            </button>
          </div>
        )}

        {/* Add/Edit Contact Modal */}
        {showContactForm && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-3 border-b">
                <h2 className="text-lg font-bold">{editingContact ? 'Edit Contact' : 'Add Emergency Contact'}</h2>
                <button onClick={() => { setShowContactForm(false); resetForm(); }} className="p-2 rounded-full hover:bg-gray-100">
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Contact name"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Relationship</label>
                  <select
                    value={formData.relationship}
                    onChange={(e) => setFormData(prev => ({ ...prev, relationship: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none"
                  >
                    <option value="">Select relationship</option>
                    {RELATIONSHIPS.map(rel => (
                      <option key={rel} value={rel}>{rel}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Phone Number</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+1 (555) 123-4567"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="email@example.com"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2">How to notify</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifyViaCall}
                        onChange={(e) => setFormData(prev => ({ ...prev, notifyViaCall: e.target.checked }))}
                        className="w-5 h-5 rounded text-red-500"
                      />
                      <PhoneCall size={18} className="text-gray-500" />
                      <span className="flex-1">Auto-dial phone</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifyViaSms}
                        onChange={(e) => setFormData(prev => ({ ...prev, notifyViaSms: e.target.checked }))}
                        className="w-5 h-5 rounded text-red-500"
                      />
                      <MessageSquare size={18} className="text-gray-500" />
                      <span className="flex-1">Send SMS</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifyViaEmail}
                        onChange={(e) => setFormData(prev => ({ ...prev, notifyViaEmail: e.target.checked }))}
                        className="w-5 h-5 rounded text-red-500"
                      />
                      <Mail size={18} className="text-gray-500" />
                      <span className="flex-1">Send email</span>
                    </label>
                    <label className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.notifyViaApp}
                        onChange={(e) => setFormData(prev => ({ ...prev, notifyViaApp: e.target.checked }))}
                        className="w-5 h-5 rounded text-red-500"
                      />
                      <Bell size={18} className="text-gray-500" />
                      <span className="flex-1">In-app notification (if they have MapMingle)</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="px-4 py-3 border-t">
                <button
                  onClick={saveContact}
                  disabled={saving}
                  className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50"
                >
                  {saving ? 'Saving...' : (editingContact ? 'Save Changes' : 'Add Contact')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Step 2: Phone Setup
  if (step === 2) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(1)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Your Phone Number</h1>
              <p className="text-sm text-gray-500">Required to receive emergency alerts</p>
            </div>
          </div>
        </div>

        <div className="flex-1 p-4">
          <div className="bg-white rounded-2xl p-6 shadow-sm">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Phone size={28} className="text-red-600" />
            </div>
            
            <h3 className="text-lg font-semibold text-center mb-2">Add Your Phone</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Your phone number will be used to contact you in case of emergencies from your circles
            </p>

            <input
              type="tel"
              value={userPhone}
              onChange={(e) => setUserPhone(e.target.value)}
              placeholder="+1 (555) 123-4567"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-red-500 outline-none text-center text-lg"
            />

            <p className="text-xs text-gray-400 text-center mt-2">
              We'll send you a verification code
            </p>
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-t space-y-2">
          <button
            onClick={savePhone}
            disabled={saving || !userPhone.trim()}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Continue'}
          </button>
          <button
            onClick={() => setStep(3)}
            className="w-full py-3 text-gray-500 font-medium"
          >
            Skip for now
          </button>
        </div>
      </div>
    );
  }

  // Step 3: Complete
  if (step === 3) {
    return (
      <div className="h-full bg-gray-50 flex flex-col">
        <div className="bg-white border-b border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3">
            <button onClick={() => setStep(2)} className="p-2 -ml-2 rounded-full hover:bg-gray-100">
              <ChevronLeft size={20} className="text-gray-600" />
            </button>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">Setup Complete!</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col items-center justify-center p-6">
          <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6">
            <Check size={48} className="text-green-600" />
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">You're Protected!</h2>
          <p className="text-gray-500 text-center mb-8">
            Your emergency contacts will be notified instantly if you trigger an alert
          </p>

          <div className="w-full max-w-sm space-y-3">
            <div className="bg-white rounded-xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Check size={20} className="text-green-600" />
              </div>
              <div>
                <div className="font-semibold">{contacts.length} Emergency Contact{contacts.length !== 1 ? 's' : ''}</div>
                <div className="text-sm text-gray-500">Ready to receive alerts</div>
              </div>
            </div>

            {setupStatus?.hasPhone && (
              <div className="bg-white rounded-xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <Check size={20} className="text-green-600" />
                </div>
                <div>
                  <div className="font-semibold">Phone Number Added</div>
                  <div className="text-sm text-gray-500">You can receive alerts</div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-4 py-3 bg-white border-t space-y-2">
          <button
            onClick={testEmergencyAlert}
            className="w-full py-3 border-2 border-red-500 text-red-500 rounded-xl font-semibold"
          >
            <AlertTriangle size={18} className="inline mr-2" />
            Send Test Alert
          </button>
          <button
            onClick={() => navigate('/safety')}
            className="w-full py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return null;
}
