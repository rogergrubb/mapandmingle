import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { MapPin, Users, Heart, Briefcase, Calendar, Plane, ArrowRight } from 'lucide-react';
import api from '../lib/api';

export function Join() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [referrer, setReferrer] = useState<{
    referrerName: string;
    referrerAvatar?: string;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (code) {
      checkReferralCode();
      // Store the referral code for signup
      localStorage.setItem('referralCode', code.toUpperCase());
    }
  }, [code]);

  const checkReferralCode = async () => {
    try {
      const response = await api.get(`/api/users/referral/${code}`);
      const data = response.data || response;
      if (data.valid) {
        setReferrer(data);
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  const features = [
    { icon: Heart, label: 'Dating', color: 'text-pink-500' },
    { icon: Users, label: 'Friends', color: 'text-purple-500' },
    { icon: Briefcase, label: 'Networking', color: 'text-blue-500' },
    { icon: Calendar, label: 'Events', color: 'text-green-500' },
    { icon: Plane, label: 'Travel', color: 'text-orange-500' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 flex flex-col">
      {/* Header */}
      <div className="p-6 text-center text-white">
        <div className="flex items-center justify-center gap-2 mb-2">
          <MapPin className="w-8 h-8" />
          <span className="text-2xl font-bold">Map & Mingle</span>
        </div>
        <p className="text-white/80">Find your people</p>
      </div>

      {/* Main Card */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
          {loading ? (
            <div className="p-12 flex items-center justify-center">
              <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Invitation Header */}
              <div className="p-8 text-center border-b">
                {referrer && !error ? (
                  <>
                    {referrer.referrerAvatar ? (
                      <img
                        src={referrer.referrerAvatar}
                        alt={referrer.referrerName}
                        className="w-20 h-20 rounded-full mx-auto mb-4 border-4 border-pink-100"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                        <Users className="w-10 h-10 text-white" />
                      </div>
                    )}
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      {referrer.referrerName} invited you!
                    </h1>
                    <p className="text-gray-600">
                      Join Map & Mingle and start connecting with people nearby.
                    </p>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                      <MapPin className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                      Join Map & Mingle
                    </h1>
                    <p className="text-gray-600">
                      The app that helps you find your people, wherever you are.
                    </p>
                  </>
                )}
              </div>

              {/* Features */}
              <div className="p-6">
                <p className="text-sm text-gray-500 mb-4 text-center">Connect for...</p>
                <div className="flex justify-center gap-4 mb-8">
                  {features.map(({ icon: Icon, label, color }) => (
                    <div key={label} className="text-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-1">
                        <Icon className={`w-6 h-6 ${color}`} />
                      </div>
                      <span className="text-xs text-gray-600">{label}</span>
                    </div>
                  ))}
                </div>

                {/* CTA Buttons */}
                <Link
                  to="/login"
                  className="w-full bg-gradient-to-r from-pink-500 to-purple-500 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2 hover:opacity-90 transition-opacity mb-3"
                >
                  Get Started
                  <ArrowRight size={20} />
                </Link>

                <p className="text-center text-sm text-gray-500">
                  Already have an account?{' '}
                  <Link to="/login" className="text-pink-600 font-medium">
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="p-6 text-center text-white/60 text-sm">
        <p>© 2024 Map & Mingle. All rights reserved.</p>
      </div>
    </div>
  );
}
