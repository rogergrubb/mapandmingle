import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <div className="max-w-4xl mx-auto px-4 py-12">
        {/* Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Home
        </Link>

        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: November 29, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 leading-relaxed">
                Welcome to Map & Mingle ("we," "our," or "us"). We are committed to protecting your privacy 
                and personal information. This Privacy Policy explains how we collect, use, disclose, and 
                safeguard your information when you use our mobile application and website (collectively, the "Service").
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Personal Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                When you create an account, we may collect:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
                <li>Name and display name</li>
                <li>Email address</li>
                <li>Profile photos</li>
                <li>Date of birth</li>
                <li>Gender and gender preferences</li>
                <li>Bio and interests</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Location Information</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                With your consent, we collect precise location data to show you nearby users and events. 
                You can disable location services at any time through your device settings.
              </p>

              <h3 className="text-lg font-medium text-gray-800 mb-2">Usage Information</h3>
              <p className="text-gray-600 leading-relaxed">
                We automatically collect information about how you interact with our Service, including 
                pages visited, features used, and time spent on the app.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 leading-relaxed mb-4">We use your information to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide and maintain our Service</li>
                <li>Connect you with other users based on location and interests</li>
                <li>Show you relevant events and activities nearby</li>
                <li>Send you notifications about matches, messages, and events</li>
                <li>Improve and personalize your experience</li>
                <li>Ensure safety and prevent fraud</li>
                <li>Communicate with you about updates and promotions</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                We may share your information with:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li><strong>Other Users:</strong> Your profile information is visible to other users based on your privacy settings</li>
                <li><strong>Service Providers:</strong> Third parties that help us operate our Service (hosting, analytics, payment processing)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
              </ul>
              <p className="text-gray-600 leading-relaxed mt-4">
                We do not sell your personal information to third parties.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 leading-relaxed">
                We implement appropriate technical and organizational measures to protect your personal 
                information against unauthorized access, alteration, disclosure, or destruction. However, 
                no method of transmission over the Internet is 100% secure.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You have the right to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate data</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Export your data</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Children's Privacy</h2>
              <p className="text-gray-600 leading-relaxed">
                Our Service is not intended for users under 18 years of age. We do not knowingly collect 
                personal information from children under 18.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Changes to This Policy</h2>
              <p className="text-gray-600 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of any changes by 
                posting the new Privacy Policy on this page and updating the "Last updated" date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about this Privacy Policy, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:privacy@mapandmingle.com" className="text-pink-500 hover:underline">
                  privacy@mapandmingle.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
