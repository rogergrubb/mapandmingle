import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Loader2, CheckCircle } from 'lucide-react';
import api from '../../lib/api';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/api/auth/request-reset', { email });
      setSubmitted(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full">
        <button
          onClick={() => navigate('/login')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Login
        </button>

        {submitted ? (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2 text-center">Check Your Email</h2>
            <p className="text-gray-600 text-center mb-6">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-sm text-gray-600 text-center mb-6">
              The link expires in 1 hour. If you don't see the email, check your spam folder.
            </p>
            <button
              onClick={() => navigate('/login')}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow"
            >
              Back to Login
            </button>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
            <p className="text-gray-600 mb-6">Enter your email and we'll send you a link to reset your password.</p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
                  {error}
                </div>
              )}

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:shadow-lg transition-shadow disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Reset Link'
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
