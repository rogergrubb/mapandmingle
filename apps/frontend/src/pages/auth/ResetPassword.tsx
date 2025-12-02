import { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle, Eye, EyeOff } from 'lucide-react';
import api from '../../lib/api';

export default function ResetPassword() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">The password reset link is missing or invalid.</p>
          <Link
            to="/login"
            className="inline-block bg-gradient-to-r from-pink-500 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
          >
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await api.post('/api/auth/reset-password', { token, password });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full">
        {success ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Password Reset</h2>
            <p className="text-gray-600 text-center mb-6">Your password has been successfully reset.</p>
            <p className="text-sm text-gray-600 text-center">Redirecting to login...</p>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Set New Password</h1>
            <p className="text-gray-600 mb-6">Enter your new password below.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-900"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    required
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-3.5 text-gray-600 hover:text-gray-900"
                  >
                    {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset Password'
                )}
              </button>
            </form>

            <p className="text-center text-gray-600 text-sm mt-6">
              Remember your password?{' '}
              <Link to="/login" className="text-pink-600 hover:text-pink-700 font-semibold">
                Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
