import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Crown, Check, Zap, Star, Shield, Sparkles } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import api from '../../lib/api';

const PLANS = [
  {
    id: 'free',
    name: 'Free',
    price: 0,
    period: 'forever',
    icon: Star,
    color: 'gray',
    features: [
      'Create up to 10 pins',
      'Join unlimited events',
      'Basic messaging',
      'Standard profile',
      'Community access',
    ],
  },
  {
    id: 'basic',
    name: 'Basic',
    price: 4.99,
    period: 'month',
    icon: Zap,
    color: 'blue',
    popular: false,
    features: [
      'Create unlimited pins',
      'Priority event access',
      'Advanced messaging',
      'Custom profile themes',
      'Remove ads',
      'See who viewed your profile',
    ],
  },
  {
    id: 'premium',
    name: 'Premium',
    price: 9.99,
    period: 'month',
    icon: Crown,
    color: 'purple',
    popular: true,
    features: [
      'Everything in Basic',
      'Verified badge',
      'Advanced analytics',
      'Priority support',
      'Exclusive events access',
      'Custom badges',
      'Boost your profile',
      'Unlimited photo uploads',
    ],
  },
];

export default function Subscription() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const [selectedPlan, setSelectedPlan] = useState('free');
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly');

  const handleSubscribe = async (planId: string) => {
    if (planId === 'free') {
      alert('You are already on the free plan!');
      return;
    }

    try {
      // Create checkout session
      // Map plan to tier for API
      const tier = planId === 'premium' ? 'premium' : 'basic';
      
      const response = await api.post('/api/subscription/create-checkout', {
        tier: tier,
      });

      // Redirect to Stripe checkout
      const checkoutUrl = response.data.url || response.data.checkoutUrl;
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        throw new Error('No checkout URL returned from server');
      }
    } catch (error) {
      console.error('Stripe checkout error:', error);
      alert('Failed to start checkout. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Subscription</h1>
              <p className="text-sm text-gray-600">Upgrade to unlock premium features</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Billing Period Toggle */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-full p-1 shadow-sm inline-flex">
            <button
              onClick={() => setBillingPeriod('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                billingPeriod === 'monthly'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 relative ${
                billingPeriod === 'yearly'
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-md'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Yearly
              <span className="absolute -top-2 -right-2 px-2 py-0.5 bg-green-500 text-white text-xs rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const Icon = plan.icon;
            const price = billingPeriod === 'yearly' && plan.price > 0
              ? (plan.price * 12 * 0.8 / 12).toFixed(2)
              : plan.price;

            return (
              <div
                key={plan.id}
                className={`bg-white rounded-3xl p-8 shadow-sm hover:shadow-xl transition-all duration-300 relative ${
                  plan.popular ? 'ring-2 ring-purple-500 scale-105' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-sm font-medium rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className={`inline-flex p-4 bg-${plan.color}-100 rounded-full mb-4`}>
                    <Icon className={`w-8 h-8 text-${plan.color}-600`} />
                  </div>
                  <h3 className="text-2xl font-bold mb-2">{plan.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold">${price}</span>
                    <span className="text-gray-600">/{plan.period}</span>
                  </div>
                  {billingPeriod === 'yearly' && plan.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${((plan.price * 12 * 0.2) / 12).toFixed(2)}/month
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  className={`w-full py-3 rounded-full font-semibold transition-all duration-200 active:scale-95 ${
                    plan.popular
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                      : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                  }`}
                >
                  {plan.id === 'free' ? 'Current Plan' : 'Subscribe'}
                </button>
              </div>
            );
          })}
        </div>

        {/* Premium Features Showcase */}
        <div className="mt-16 bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl p-8 text-white">
          <div className="text-center mb-8">
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-3xl font-bold mb-2">Why Go Premium?</h2>
            <p className="text-white/90">Unlock the full MapMingle experience</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Crown className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Verified Badge</h3>
              <p className="text-white/80 text-sm">Stand out with a verified checkmark on your profile</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Zap className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Boost Your Profile</h3>
              <p className="text-white/80 text-sm">Get 10x more visibility and connections</p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-white/20 rounded-full flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="font-semibold mb-2">Priority Support</h3>
              <p className="text-white/80 text-sm">Get help faster with dedicated support</p>
            </div>
          </div>
        </div>

        {/* Current Subscription */}
        {user?.isPremium && (
          <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Current Subscription</h2>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Premium Plan</p>
                <p className="text-sm text-gray-600">Renews on December 28, 2025</p>
              </div>
              <button className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-full font-medium transition-all duration-200">
                Cancel Subscription
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
