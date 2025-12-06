import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMessage, setErrorMessage] = useState('');
  const { setTokens, fetchUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      console.log('AuthCallback: Starting callback handling');
      
      const accessToken = searchParams.get('accessToken');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');
      const detail = searchParams.get('detail');

      console.log('AuthCallback: accessToken present:', !!accessToken);
      console.log('AuthCallback: refreshToken present:', !!refreshToken);
      console.log('AuthCallback: error:', error);

      if (error) {
        console.error('AuthCallback: Error from backend:', error, detail);
        setStatus('error');
        setErrorMessage(getErrorMessage(error) + (detail ? ` (${detail})` : ''));
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      if (accessToken && refreshToken) {
        try {
          console.log('AuthCallback: Storing tokens...');
          
          // Store tokens in localStorage first
          localStorage.setItem('token', accessToken);
          localStorage.setItem('refreshToken', refreshToken);
          
          // Then call setTokens to update zustand state
          setTokens(accessToken, refreshToken);
          
          console.log('AuthCallback: Tokens stored, fetching user...');
          
          // Small delay to ensure state is updated
          await new Promise(resolve => setTimeout(resolve, 100));
          
          // Fetch user data
          await fetchUser();
          
          console.log('AuthCallback: User fetched, setting success...');
          setStatus('success');
          
          // Redirect to map after brief success message
          setTimeout(() => {
            console.log('AuthCallback: Redirecting to /map');
            navigate('/map');
          }, 1000);
        } catch (err) {
          console.error('AuthCallback: Error during auth:', err);
          setStatus('error');
          setErrorMessage('Failed to complete sign in. Please try again.');
          setTimeout(() => navigate('/login'), 3000);
        }
      } else {
        console.error('AuthCallback: Missing tokens');
        setStatus('error');
        setErrorMessage('Missing authentication data. Please try again.');
        setTimeout(() => navigate('/login'), 3000);
      }
    };

    handleCallback();
  }, [searchParams, navigate, setTokens, fetchUser]);

  const getErrorMessage = (error: string) => {
    switch (error) {
      case 'google_auth_failed':
        return 'Google authentication was cancelled or failed.';
      case 'no_code':
        return 'No authorization code received.';
      case 'token_exchange_failed':
        return 'Failed to exchange authorization code.';
      case 'no_email':
        return 'Could not retrieve email from Google.';
      case 'callback_failed':
        return 'Authentication callback failed.';
      default:
        return 'An unknown error occurred.';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-rose-500 to-purple-600 
                    flex items-center justify-center p-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="w-16 h-16 text-pink-500 mx-auto mb-4 animate-spin" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Signing you in...</h2>
            <p className="text-gray-600">Please wait while we complete your sign in.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome!</h2>
            <p className="text-gray-600">Sign in successful. Redirecting you now...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In Failed</h2>
            <p className="text-gray-600 mb-4">{errorMessage}</p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </>
        )}
      </div>
    </div>
  );
}
