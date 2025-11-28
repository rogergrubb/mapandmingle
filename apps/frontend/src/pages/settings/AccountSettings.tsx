import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Mail, Lock, Trash2, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

export default function AccountSettings() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  
  const [email, setEmail] = useState(user?.email || '');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [savingEmail, setSavingEmail] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const handleUpdateEmail = async () => {
    if (!email || email === user?.email) {
      alert('Please enter a new email address');
      return;
    }

    setSavingEmail(true);
    try {
      await api.put('/api/user/email', { email });
      alert('Email updated successfully! Please check your inbox to verify.');
    } catch (error) {
      console.error('Failed to update email:', error);
      alert('Failed to update email. Please try again.');
    } finally {
      setSavingEmail(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      alert('Please fill in all password fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      alert('Password must be at least 8 characters long');
      return;
    }

    setSavingPassword(true);
    try {
      await api.put('/api/user/password', {
        currentPassword,
        newPassword,
      });
      alert('Password updated successfully!');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error) {
      console.error('Failed to update password:', error);
      alert('Failed to update password. Please check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      alert('Please type DELETE to confirm');
      return;
    }

    if (!window.confirm('Are you absolutely sure? This action cannot be undone.')) {
      return;
    }

    try {
      await api.delete('/api/user/account');
      alert('Your account has been deleted. We\'re sorry to see you go!');
      logout();
      navigate('/');
    } catch (error) {
      console.error('Failed to delete account:', error);
      alert('Failed to delete account. Please try again or contact support.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Account Settings</h1>
              <p className="text-sm text-gray-600">Manage your account security</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Email Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-blue-100 rounded-full">
              <Mail className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Email Address</h2>
              <p className="text-sm text-gray-600">Update your email address</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                placeholder="your@email.com"
              />
            </div>

            <button
              onClick={handleUpdateEmail}
              disabled={savingEmail || email === user?.email}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {savingEmail ? 'Updating...' : 'Update Email'}
            </button>
          </div>
        </div>

        {/* Password Settings */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-full">
              <Lock className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Password</h2>
              <p className="text-sm text-gray-600">Change your password</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Current Password
              </label>
              <div className="relative">
                <input
                  type={showCurrentPassword ? 'text' : 'password'}
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 pr-12"
                  placeholder="Enter current password"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Password
              </label>
              <div className="relative">
                <input
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 pr-12"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 pr-12"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              onClick={handleUpdatePassword}
              disabled={savingPassword}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50"
            >
              {savingPassword ? 'Updating...' : 'Update Password'}
            </button>
          </div>
        </div>

        {/* Delete Account */}
        <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-red-100 rounded-full">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-red-900">Danger Zone</h2>
              <p className="text-sm text-red-700">Permanently delete your account</p>
            </div>
          </div>

          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all duration-200 active:scale-95 flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-white rounded-2xl border border-red-200">
                <p className="text-sm text-red-900 mb-3">
                  <strong>Warning:</strong> This action cannot be undone. All your data, including:
                </p>
                <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                  <li>Profile and photos</li>
                  <li>Events and mingles</li>
                  <li>Messages and connections</li>
                  <li>Saved pins and locations</li>
                </ul>
                <p className="text-sm text-red-900 mt-3">
                  will be permanently deleted.
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-red-900 mb-2">
                  Type <strong>DELETE</strong> to confirm
                </label>
                <input
                  type="text"
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  className="w-full px-4 py-3 bg-white border-2 border-red-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-red-500 transition-all duration-200"
                  placeholder="DELETE"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteConfirmText('');
                  }}
                  className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-full font-medium hover:bg-gray-300 transition-all duration-200 active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmText !== 'DELETE'}
                  className="flex-1 py-3 bg-red-600 text-white rounded-full font-medium hover:bg-red-700 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Delete Forever
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
