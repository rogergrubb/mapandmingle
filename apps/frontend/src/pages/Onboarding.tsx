import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../components/common/Button';
import { Input } from '../components/common/Input';
import api from '../lib/api';
import { User, Heart, Target, Lock, Bell, CheckCircle } from 'lucide-react';

type Step = 'basics' | 'demographics' | 'interests' | 'intent' | 'looking' | 'privacy' | 'permissions' | 'complete';

const INTERESTS = [
  'Hiking', 'Photography', 'Coffee', 'Music', 'Art', 'Food', 'Travel',
  'Sports', 'Gaming', 'Reading', 'Fitness', 'Yoga', 'Dancing', 'Cooking',
  'Movies', 'Technology', 'Fashion', 'Nature', 'Pets', 'Volunteering'
];

const ACTIVITIES = ['Socializing', 'Dating', 'Networking', 'Making Friends', 'Exploring'];
const LOOKING_FOR = ['Friends', 'Dating', 'Activity Partners', 'Professional Network', 'Just Exploring'];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('basics');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    age: '',
    gender: '',
    location: '',
    interests: [] as string[],
    activityIntent: [] as string[],
    lookingFor: [] as string[],
    profileVisibility: 'public',
    showLocation: true,
    allowMessages: true,
    notifications: true,
    locationPermission: false,
  });

  const handleNext = () => {
    const steps: Step[] = ['basics', 'demographics', 'interests', 'intent', 'looking', 'privacy', 'permissions', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex < steps.length - 1) {
      setStep(steps[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const steps: Step[] = ['basics', 'demographics', 'interests', 'intent', 'looking', 'privacy', 'permissions', 'complete'];
    const currentIndex = steps.indexOf(step);
    if (currentIndex > 0) {
      setStep(steps[currentIndex - 1]);
    }
  };

  const handleComplete = async () => {
    try {
      // Save profile data
      await api.put('/api/users/profile', {
        displayName: formData.name,
        bio: formData.bio,
        age: formData.age ? parseInt(formData.age) : null,
        gender: formData.gender,
        location: formData.location,
        interests: JSON.stringify(formData.interests),
        lookingFor: JSON.stringify(formData.lookingFor),
        activityIntent: formData.activityIntent.join(', '),
        visibilityMode: formData.profileVisibility,
        ghostMode: !formData.showLocation,
      });
      
      // Mark onboarding as complete
      await api.post('/api/users/onboarding/complete');
      
      navigate('/map');
    } catch (error) {
      console.error('Failed to complete onboarding:', error);
    }
  };

  const toggleArrayItem = (array: string[], item: string) => {
    return array.includes(item)
      ? array.filter((i) => i !== item)
      : [...array, item];
  };

  const progress = {
    basics: 14,
    demographics: 28,
    interests: 42,
    intent: 56,
    looking: 70,
    privacy: 84,
    permissions: 98,
    complete: 100,
  }[step];

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-4">
      <div className="max-w-2xl mx-auto py-8">
        {/* Progress Bar */}
        <div className="bg-white/20 rounded-full h-2 mb-8">
          <div
            className="bg-white rounded-full h-2 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {/* Step: Basics */}
          {step === 'basics' && (
            <div>
              <div className="flex items-center mb-6">
                <User className="w-8 h-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Tell us about yourself</h2>
              </div>
              <div className="space-y-4">
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                  <textarea
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    placeholder="Tell us a bit about yourself..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-transparent resize-none"
                  />
                </div>
                <Button onClick={handleNext} className="w-full">Continue</Button>
              </div>
            </div>
          )}

          {/* Step: Demographics */}
          {step === 'demographics' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">A few more details</h2>
              <div className="space-y-4">
                <Input
                  label="Age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="25"
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="">Select...</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="non-binary">Non-binary</option>
                    <option value="prefer-not-to-say">Prefer not to say</option>
                  </select>
                </div>
                <Input
                  label="Location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="City, Country"
                />
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                  <Button onClick={handleNext} className="flex-1">Continue</Button>
                </div>
              </div>
            </div>
          )}

          {/* Step: Interests */}
          {step === 'interests' && (
            <div>
              <div className="flex items-center mb-6">
                <Heart className="w-8 h-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">What are your interests?</h2>
              </div>
              <p className="text-gray-600 mb-4">Select all that apply</p>
              <div className="flex flex-wrap gap-2 mb-6">
                {INTERESTS.map((interest) => (
                  <button
                    key={interest}
                    onClick={() =>
                      setFormData({
                        ...formData,
                        interests: toggleArrayItem(formData.interests, interest),
                      })
                    }
                    className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                      formData.interests.includes(interest)
                        ? 'bg-pink-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {interest}
                  </button>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {/* Step: Activity Intent */}
          {step === 'intent' && (
            <div>
              <div className="flex items-center mb-6">
                <Target className="w-8 h-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">What brings you here?</h2>
              </div>
              <div className="space-y-3 mb-6">
                {ACTIVITIES.map((activity) => (
                  <label key={activity} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.activityIntent.includes(activity)}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          activityIntent: toggleArrayItem(formData.activityIntent, activity),
                        })
                      }
                      className="w-5 h-5 text-pink-600 rounded"
                    />
                    <span className="ml-3 text-gray-900">{activity}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {/* Step: Looking For */}
          {step === 'looking' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">What are you looking for?</h2>
              <div className="space-y-3 mb-6">
                {LOOKING_FOR.map((item) => (
                  <label key={item} className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input
                      type="checkbox"
                      checked={formData.lookingFor.includes(item)}
                      onChange={() =>
                        setFormData({
                          ...formData,
                          lookingFor: toggleArrayItem(formData.lookingFor, item),
                        })
                      }
                      className="w-5 h-5 text-pink-600 rounded"
                    />
                    <span className="ml-3 text-gray-900">{item}</span>
                  </label>
                ))}
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {/* Step: Privacy */}
          {step === 'privacy' && (
            <div>
              <div className="flex items-center mb-6">
                <Lock className="w-8 h-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Privacy Settings</h2>
              </div>
              <div className="space-y-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Profile Visibility</label>
                  <select
                    value={formData.profileVisibility}
                    onChange={(e) => setFormData({ ...formData, profileVisibility: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500"
                  >
                    <option value="public">Public</option>
                    <option value="friends">Friends Only</option>
                    <option value="private">Private</option>
                  </select>
                </div>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-gray-900">Show my location on map</span>
                  <input
                    type="checkbox"
                    checked={formData.showLocation}
                    onChange={(e) => setFormData({ ...formData, showLocation: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <span className="text-gray-900">Allow messages from anyone</span>
                  <input
                    type="checkbox"
                    checked={formData.allowMessages}
                    onChange={(e) => setFormData({ ...formData, allowMessages: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Continue</Button>
              </div>
            </div>
          )}

          {/* Step: Permissions */}
          {step === 'permissions' && (
            <div>
              <div className="flex items-center mb-6">
                <Bell className="w-8 h-8 text-pink-600 mr-3" />
                <h2 className="text-2xl font-bold text-gray-900">Permissions</h2>
              </div>
              <div className="space-y-4 mb-6">
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <div className="text-gray-900 font-medium">Enable Notifications</div>
                    <div className="text-sm text-gray-500">Get updates about messages and events</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.notifications}
                    onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                </label>
                <label className="flex items-center justify-between p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <div>
                    <div className="text-gray-900 font-medium">Location Services</div>
                    <div className="text-sm text-gray-500">Find nearby people and places</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={formData.locationPermission}
                    onChange={(e) => setFormData({ ...formData, locationPermission: e.target.checked })}
                    className="w-5 h-5 text-pink-600 rounded"
                  />
                </label>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={handleBack} className="flex-1">Back</Button>
                <Button onClick={handleNext} className="flex-1">Complete</Button>
              </div>
            </div>
          )}

          {/* Step: Complete */}
          {step === 'complete' && (
            <div className="text-center">
              <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">You're All Set!</h2>
              <p className="text-gray-600 mb-8">
                Welcome to MapMingle! Start exploring and connecting with people nearby.
              </p>
              <Button onClick={handleComplete} className="w-full">
                Start Exploring
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
