import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Terms() {
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
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: November 29, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                By accessing or using Map & Mingle ("the Service"), you agree to be bound by these Terms of 
                Service ("Terms"). If you do not agree to these Terms, please do not use our Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Eligibility</h2>
              <p className="text-gray-600 leading-relaxed">
                You must be at least 18 years old to use Map & Mingle. By using the Service, you represent 
                and warrant that you are at least 18 years of age and have the legal capacity to enter into 
                these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. Account Registration</h2>
              <p className="text-gray-600 leading-relaxed mb-4">
                To use certain features of our Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Provide accurate and complete information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. User Conduct</h2>
              <p className="text-gray-600 leading-relaxed mb-4">You agree NOT to:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Use the Service for any illegal purpose</li>
                <li>Harass, abuse, or harm other users</li>
                <li>Post false, misleading, or fraudulent content</li>
                <li>Impersonate any person or entity</li>
                <li>Share explicit, violent, or offensive content</li>
                <li>Spam or send unsolicited messages</li>
                <li>Attempt to hack or disrupt the Service</li>
                <li>Scrape or collect user data without permission</li>
                <li>Use the Service for commercial purposes without authorization</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Content</h2>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Your Content</h3>
              <p className="text-gray-600 leading-relaxed mb-4">
                You retain ownership of content you post on Map & Mingle. By posting content, you grant us 
                a non-exclusive, royalty-free, worldwide license to use, display, and distribute your content 
                in connection with the Service.
              </p>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Content Guidelines</h3>
              <p className="text-gray-600 leading-relaxed">
                All content must comply with our Community Guidelines. We reserve the right to remove any 
                content that violates these Terms or is otherwise objectionable.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Safety</h2>
              <p className="text-gray-600 leading-relaxed">
                While we strive to create a safe environment, we cannot guarantee the conduct of users. 
                You are responsible for your own safety when interacting with other users. We recommend 
                meeting in public places and informing someone you trust about your plans.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Premium Services</h2>
              <p className="text-gray-600 leading-relaxed">
                Map & Mingle offers premium subscription features. By purchasing a subscription, you agree 
                to the pricing and billing terms presented at the time of purchase. Subscriptions 
                automatically renew unless canceled before the renewal date.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Termination</h2>
              <p className="text-gray-600 leading-relaxed">
                We may suspend or terminate your account at any time for violations of these Terms or for 
                any other reason. You may delete your account at any time through the app settings.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Disclaimers</h2>
              <p className="text-gray-600 leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT GUARANTEE THAT 
                YOU WILL FIND MATCHES OR THAT THE SERVICE WILL MEET YOUR EXPECTATIONS. WE ARE NOT 
                RESPONSIBLE FOR THE ACTIONS OF OTHER USERS.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, MAP & MINGLE SHALL NOT BE LIABLE FOR ANY INDIRECT, 
                INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF THE SERVICE.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Indemnification</h2>
              <p className="text-gray-600 leading-relaxed">
                You agree to indemnify and hold harmless Map & Mingle and its officers, directors, employees, 
                and agents from any claims, damages, or expenses arising from your use of the Service or 
                violation of these Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600 leading-relaxed">
                We may modify these Terms at any time. We will notify you of material changes by posting 
                the updated Terms on our website or through the app. Continued use of the Service after 
                changes constitutes acceptance of the new Terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Governing Law</h2>
              <p className="text-gray-600 leading-relaxed">
                These Terms shall be governed by and construed in accordance with the laws of the State of 
                California, without regard to its conflict of law provisions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Contact Us</h2>
              <p className="text-gray-600 leading-relaxed">
                If you have any questions about these Terms, please contact us at:
              </p>
              <p className="text-gray-600 mt-2">
                <strong>Email:</strong>{' '}
                <a href="mailto:legal@mapandmingle.com" className="text-pink-500 hover:underline">
                  legal@mapandmingle.com
                </a>
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
