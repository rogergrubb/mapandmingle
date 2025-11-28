import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, HelpCircle, Mail, MessageCircle, ChevronDown, Send, Book, Shield, CreditCard } from 'lucide-react';
import api from '../../lib/api';

const FAQ_CATEGORIES = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: Book,
    questions: [
      {
        q: 'How do I create my first pin?',
        a: 'Tap the "+" button on the map view, select a location, add a description and photo, then tap "Create Pin". Your pin will be visible to nearby users!',
      },
      {
        q: 'How do I join events?',
        a: 'Browse events on the Events tab, tap on an event you\'re interested in, and click "Join Event". You\'ll receive notifications about event updates.',
      },
      {
        q: 'What are Mingles?',
        a: 'Mingles are spontaneous meetups! Create a mingle to let nearby users know you\'re available to hang out right now.',
      },
    ],
  },
  {
    id: 'privacy',
    title: 'Privacy & Safety',
    icon: Shield,
    questions: [
      {
        q: 'Who can see my location?',
        a: 'Your exact location is never shared. Other users only see your approximate area (within 1-2 miles). You can adjust location sharing in Privacy & Safety settings.',
      },
      {
        q: 'How do I block someone?',
        a: 'Go to their profile, tap the three dots menu, and select "Block User". They won\'t be able to see your profile or contact you.',
      },
      {
        q: 'Can I hide my profile?',
        a: 'Yes! Go to Privacy & Safety settings and enable "Hide Profile". Your profile will be invisible to other users until you turn it off.',
      },
    ],
  },
  {
    id: 'subscription',
    title: 'Subscription & Billing',
    icon: CreditCard,
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards, debit cards, and digital wallets through Stripe. Your payment information is securely encrypted.',
      },
      {
        q: 'Can I cancel my subscription anytime?',
        a: 'Yes! You can cancel your subscription at any time from the Subscription page. You\'ll continue to have access until the end of your billing period.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'We offer a 7-day money-back guarantee for new subscriptions. Contact support if you\'re not satisfied within the first week.',
      },
    ],
  },
];

export default function HelpSupport() {
  const navigate = useNavigate();
  const [expandedCategory, setExpandedCategory] = useState<string | null>('getting-started');
  const [expandedQuestion, setExpandedQuestion] = useState<string | null>(null);
  
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const handleSubmitTicket = async () => {
    if (!subject || !message) {
      alert('Please fill in all fields');
      return;
    }

    setSending(true);
    try {
      await api.post('/api/support/ticket', { subject, message });
      alert('Support ticket submitted! We\'ll get back to you within 24 hours.');
      setSubject('');
      setMessage('');
    } catch (error) {
      console.error('Failed to submit ticket:', error);
      alert('Failed to submit ticket. Please try again or email support@mapandmingle.com');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 pb-20">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-lg border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-all duration-200 active:scale-95"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-xl font-semibold">Help & Support</h1>
              <p className="text-sm text-gray-600">Find answers or contact us</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <a
            href="mailto:support@mapandmingle.com"
            className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-98 flex items-center gap-4"
          >
            <div className="p-3 bg-blue-100 rounded-full">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold">Email Support</h3>
              <p className="text-sm text-gray-600">support@mapandmingle.com</p>
            </div>
          </a>

          <button className="bg-white rounded-3xl p-6 shadow-sm hover:shadow-lg transition-all duration-200 active:scale-98 flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-full">
              <MessageCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold">Live Chat</h3>
              <p className="text-sm text-gray-600">Chat with our team</p>
            </div>
          </button>
        </div>

        {/* FAQ */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-purple-100 rounded-full">
              <HelpCircle className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Frequently Asked Questions</h2>
              <p className="text-sm text-gray-600">Find quick answers to common questions</p>
            </div>
          </div>

          <div className="space-y-4">
            {FAQ_CATEGORIES.map((category) => {
              const Icon = category.icon;
              const isExpanded = expandedCategory === category.id;

              return (
                <div key={category.id} className="border border-gray-200 rounded-2xl overflow-hidden">
                  <button
                    onClick={() => setExpandedCategory(isExpanded ? null : category.id)}
                    className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <span className="font-semibold">{category.title}</span>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-600 transition-transform duration-200 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {isExpanded && (
                    <div className="border-t border-gray-200 bg-gray-50">
                      {category.questions.map((item, index) => {
                        const questionId = `${category.id}-${index}`;
                        const isQuestionExpanded = expandedQuestion === questionId;

                        return (
                          <div key={index} className="border-b border-gray-200 last:border-0">
                            <button
                              onClick={() => setExpandedQuestion(isQuestionExpanded ? null : questionId)}
                              className="w-full p-4 text-left hover:bg-white transition-colors duration-200"
                            >
                              <div className="flex items-start justify-between gap-4">
                                <span className="font-medium text-gray-900">{item.q}</span>
                                <ChevronDown
                                  className={`w-5 h-5 text-gray-600 flex-shrink-0 transition-transform duration-200 ${
                                    isQuestionExpanded ? 'rotate-180' : ''
                                  }`}
                                />
                              </div>
                            </button>

                            {isQuestionExpanded && (
                              <div className="px-4 pb-4">
                                <p className="text-gray-700 leading-relaxed">{item.a}</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-3xl p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Still Need Help?</h2>
          <p className="text-gray-600 mb-6">Send us a message and we'll get back to you within 24 hours.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Subject
              </label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200"
                placeholder="What do you need help with?"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Message
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={6}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all duration-200 resize-none"
                placeholder="Describe your issue in detail..."
              />
            </div>

            <button
              onClick={handleSubmitTicket}
              disabled={sending}
              className="w-full py-3 bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-full font-medium hover:shadow-lg transition-all duration-200 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Send className="w-5 h-5" />
              {sending ? 'Sending...' : 'Send Message'}
            </button>
          </div>
        </div>

        {/* Additional Resources */}
        <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-3xl p-6 text-white">
          <h2 className="text-lg font-semibold mb-4">Additional Resources</h2>
          <div className="space-y-3">
            <a href="#" className="block p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors duration-200">
              Community Guidelines
            </a>
            <a href="#" className="block p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors duration-200">
              Terms of Service
            </a>
            <a href="#" className="block p-3 bg-white/20 rounded-2xl hover:bg-white/30 transition-colors duration-200">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
