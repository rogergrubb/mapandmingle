import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function PrivacyPolicy() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="flex items-center p-4 max-w-4xl mx-auto">
          <button onClick={() => navigate(-1)} className="p-2 -ml-2 hover:bg-gray-100 rounded-full">
            <ArrowLeft size={24} />
          </button>
          <div className="ml-3">
            <h1 className="text-xl font-bold">Privacy Policy</h1>
            <p className="text-sm text-gray-500">Last updated: December 4, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
            <p className="mb-4">
              SellFast.Now LLC, doing business as Map & Mingle ("Company," "we," "us," or "our"), 
              is committed to protecting your privacy. This Privacy Policy explains how we collect, 
              use, disclose, and safeguard your information when you use our mobile application, 
              website, and related services (collectively, the "Service").
            </p>
            <p className="mb-4">
              <strong>Please read this Privacy Policy carefully.</strong> By accessing or using 
              the Service, you acknowledge that you have read, understood, and agree to be bound 
              by this Privacy Policy. If you do not agree with our policies and practices, please 
              do not use the Service.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 text-sm">
                <strong>California Residents:</strong> Please see Section 13 for additional 
                disclosures required under the California Consumer Privacy Act (CCPA) and 
                California Privacy Rights Act (CPRA).
              </p>
            </div>
          </section>

          {/* Information We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.1 Information You Provide Directly</h3>
            <p className="mb-4">We collect information you provide when you:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Create an Account:</strong> Name, email address, phone number, date of birth, 
                  password, and profile photos</li>
              <li><strong>Complete Your Profile:</strong> Bio, interests, activity preferences, 
                  display name, and other optional information</li>
              <li><strong>Use the Service:</strong> Messages, event details, comments, pins, 
                  photos, and other content you post</li>
              <li><strong>Make Purchases:</strong> Payment information (processed securely by 
                  our payment processors)</li>
              <li><strong>Contact Us:</strong> Information in your communications with our 
                  support team</li>
              <li><strong>Participate in Surveys or Promotions:</strong> Responses and contact 
                  information you provide</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.2 Information Collected Automatically</h3>
            <p className="mb-4">When you use our Service, we automatically collect:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Device Information:</strong> Device type, operating system, unique 
                  device identifiers, browser type, mobile network information</li>
              <li><strong>Location Data:</strong> Precise GPS location (with your permission), 
                  IP address-based location, Wi-Fi connection information</li>
              <li><strong>Usage Data:</strong> Features used, pages viewed, actions taken, 
                  time spent, search queries, interaction patterns</li>
              <li><strong>Log Data:</strong> Access times, pages viewed, app crashes, and 
                  other system activity</li>
              <li><strong>Cookies and Similar Technologies:</strong> See Section 7 for details</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">2.3 Information from Third Parties</h3>
            <p className="mb-4">We may receive information from:</p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li><strong>Social Media Platforms:</strong> If you sign in using Google, Apple, 
                  or other providers, we receive profile information they share</li>
              <li><strong>Analytics Providers:</strong> Aggregated usage and demographic data</li>
              <li><strong>Advertising Partners:</strong> Information about ad interactions</li>
              <li><strong>Other Users:</strong> Information about you included in reports or 
                  communications from other users</li>
            </ul>
          </section>

          {/* How We Use Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
            <p className="mb-4">We use the information we collect to:</p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Provide and Improve the Service</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Create and manage your account</li>
                  <li>Enable location-based features and connections</li>
                  <li>Facilitate communication between users</li>
                  <li>Process events, pins, and meetups</li>
                  <li>Personalize your experience and recommendations</li>
                  <li>Develop new features and improve existing ones</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Ensure Safety and Security</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Verify user identity and prevent fraud</li>
                  <li>Enforce our Terms of Service and Community Guidelines</li>
                  <li>Investigate and address violations and harmful conduct</li>
                  <li>Protect the safety of our users and the public</li>
                  <li>Detect and prevent spam, abuse, and security incidents</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Communicate with You</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Send service-related notifications and updates</li>
                  <li>Respond to your inquiries and support requests</li>
                  <li>Send marketing communications (with your consent)</li>
                  <li>Notify you about changes to our policies</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Legal and Business Purposes</h4>
                <ul className="list-disc list-inside text-gray-600 text-sm space-y-1">
                  <li>Comply with legal obligations</li>
                  <li>Respond to legal requests and prevent harm</li>
                  <li>Enforce our legal rights</li>
                  <li>Facilitate business transactions (e.g., mergers, acquisitions)</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Location Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Location Data</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 font-semibold mb-2">
                ⚠️ Location data is central to Map & Mingle's functionality
              </p>
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.1 Types of Location Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Precise Location:</strong> GPS coordinates from your device (requires 
                  your permission)</li>
              <li><strong>Approximate Location:</strong> General area based on IP address or 
                  Wi-Fi networks</li>
              <li><strong>Location You Provide:</strong> Addresses or places you manually enter</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.2 How We Use Location Data</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Show you nearby users, events, and pins</li>
              <li>Enable location sharing features in messages</li>
              <li>Allow you to create location-based events and pins</li>
              <li>Provide location-relevant recommendations</li>
              <li>Analyze usage patterns to improve the Service</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.3 Your Location Privacy Controls</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Visibility Mode:</strong> Choose who can see your approximate location</li>
              <li><strong>Ghost Mode:</strong> Hide your location from other users entirely</li>
              <li><strong>Device Settings:</strong> Revoke location permission at any time 
                  through your device settings</li>
              <li><strong>Precision Control:</strong> Some features allow approximate vs. 
                  precise location sharing</li>
            </ul>
            <p className="text-sm text-gray-600">
              Note: Some features may not function properly without location access. We will 
              never share your precise location with other users without your explicit action 
              (e.g., sharing location in a message).
            </p>
          </section>

          {/* Sharing Information */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. How We Share Your Information</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.1 With Other Users</h3>
            <p className="mb-4">Based on your privacy settings, other users may see:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Your profile information (name, photo, bio, interests)</li>
              <li>Your approximate location (if visibility is enabled)</li>
              <li>Events and pins you create</li>
              <li>Comments and messages you send to them</li>
              <li>Your activity status (last active)</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.2 With Service Providers</h3>
            <p className="mb-4">We share information with third parties who help us operate the Service:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Cloud Hosting:</strong> Google Cloud Platform, Amazon Web Services</li>
              <li><strong>Analytics:</strong> Usage analytics and crash reporting services</li>
              <li><strong>Payment Processing:</strong> Stripe (we do not store full payment details)</li>
              <li><strong>Email Services:</strong> Transactional and marketing email providers</li>
              <li><strong>Customer Support:</strong> Help desk and communication tools</li>
              <li><strong>Maps and Location:</strong> Mapbox for mapping functionality</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.3 For Legal Reasons</h3>
            <p className="mb-4">We may disclose information when we believe it's necessary to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Comply with applicable law, regulation, legal process, or government request</li>
              <li>Enforce our Terms of Service and other agreements</li>
              <li>Protect the safety, rights, or property of Map & Mingle, our users, or the public</li>
              <li>Detect, prevent, or address fraud, security, or technical issues</li>
              <li>Respond to emergency situations involving potential harm</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">5.4 Business Transfers</h3>
            <p>
              If Map & Mingle is involved in a merger, acquisition, bankruptcy, dissolution, 
              reorganization, or similar transaction, your information may be transferred as 
              part of that transaction. We will notify you of any change in ownership or uses 
              of your information.
            </p>
          </section>

          {/* Data Retention */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Data Retention</h2>
            <p className="mb-4">
              We retain your information for as long as necessary to provide the Service and 
              fulfill the purposes described in this Privacy Policy, unless a longer retention 
              period is required or permitted by law.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border p-3 text-left">Data Type</th>
                    <th className="border p-3 text-left">Retention Period</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border p-3">Account Information</td>
                    <td className="border p-3">Until account deletion + 30 days</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Messages</td>
                    <td className="border p-3">Until deleted by user or 2 years of inactivity</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Location History</td>
                    <td className="border p-3">90 days (precise), aggregated data longer</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Events/Pins</td>
                    <td className="border p-3">Until deleted or event expires + 90 days</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Photos/Media</td>
                    <td className="border p-3">Until deleted by user</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Usage Analytics</td>
                    <td className="border p-3">26 months (aggregated/anonymized)</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Support Communications</td>
                    <td className="border p-3">3 years after resolution</td>
                  </tr>
                  <tr>
                    <td className="border p-3">Legal/Safety Records</td>
                    <td className="border p-3">As required by law (typically 7 years)</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p className="mt-4 text-sm text-gray-600">
              After account deletion, some information may be retained in backups for a limited 
              period or as required for legal compliance, fraud prevention, or safety purposes.
            </p>
          </section>

          {/* Cookies */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Cookies and Tracking Technologies</h2>
            <p className="mb-4">We use cookies and similar technologies to:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Keep you logged in and remember your preferences</li>
              <li>Understand how you use the Service</li>
              <li>Improve and optimize our Service</li>
              <li>Deliver relevant content and advertisements</li>
              <li>Measure advertising effectiveness</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Types of Cookies</h3>
            <div className="space-y-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900">Essential Cookies</p>
                <p className="text-gray-600 text-sm">Required for the Service to function. Cannot be disabled.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900">Performance Cookies</p>
                <p className="text-gray-600 text-sm">Help us understand usage patterns and improve performance.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900">Functional Cookies</p>
                <p className="text-gray-600 text-sm">Remember your preferences and settings.</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-semibold text-gray-900">Advertising Cookies</p>
                <p className="text-gray-600 text-sm">Deliver relevant ads and measure their effectiveness.</p>
              </div>
            </div>
            
            <p className="mt-4 text-sm">
              You can manage cookie preferences through your browser settings. Note that 
              disabling certain cookies may affect Service functionality.
            </p>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Your Rights and Choices</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.1 Access and Portability</h3>
            <p className="mb-4">
              You have the right to request a copy of the personal information we hold about you. 
              You can download much of your data directly through the app's settings.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.2 Correction</h3>
            <p className="mb-4">
              You can update most of your personal information through the app. For information 
              you cannot update yourself, contact us at privacy@mapandmingle.com.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.3 Deletion</h3>
            <p className="mb-4">
              You can delete your account at any time through the app settings. Upon deletion:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Your profile will be removed from public view immediately</li>
              <li>Your data will be permanently deleted within 30 days</li>
              <li>Some information may be retained as described in Section 6</li>
              <li>Messages you sent to others may remain visible to them</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.4 Marketing Communications</h3>
            <p className="mb-4">
              You can opt out of marketing emails by clicking "unsubscribe" in any marketing 
              email or updating your notification preferences in the app.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.5 Push Notifications</h3>
            <p className="mb-4">
              You can disable push notifications through your device settings or the app's 
              notification settings.
            </p>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.6 Do Not Track</h3>
            <p>
              We do not currently respond to "Do Not Track" signals, as there is no industry 
              standard for how to respond to such signals.
            </p>
          </section>

          {/* Security */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Data Security</h2>
            <p className="mb-4">
              We implement appropriate technical and organizational security measures to protect 
              your information, including:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Encryption of data in transit (TLS/SSL) and at rest</li>
              <li>Secure cloud infrastructure with access controls</li>
              <li>Regular security assessments and penetration testing</li>
              <li>Employee training on data protection</li>
              <li>Incident response procedures</li>
              <li>Multi-factor authentication options</li>
            </ul>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <strong>Important:</strong> While we implement strong security measures, no 
                method of transmission over the Internet or electronic storage is 100% secure. 
                We cannot guarantee absolute security of your data.
              </p>
            </div>
          </section>

          {/* International Transfers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
            <p className="mb-4">
              Your information may be transferred to, and processed in, countries other than 
              your country of residence. These countries may have data protection laws that 
              differ from your country.
            </p>
            <p className="mb-4">
              We primarily process and store data in the United States. When we transfer data 
              from the European Economic Area (EEA), United Kingdom, or Switzerland, we use 
              appropriate safeguards such as:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Standard Contractual Clauses approved by the European Commission</li>
              <li>Data processing agreements with our service providers</li>
              <li>Compliance with applicable data protection frameworks</li>
            </ul>
          </section>

          {/* Children */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Children's Privacy</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 font-semibold mb-2">
                Map & Mingle is not intended for users under 18 years of age.
              </p>
              <p className="text-red-700 text-sm">
                We do not knowingly collect personal information from children under 18. If 
                we discover that we have collected information from a child under 18, we will 
                delete that information immediately. If you believe we have collected information 
                from a child under 18, please contact us at privacy@mapandmingle.com.
              </p>
            </div>
          </section>

          {/* Third Party Links */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Third-Party Links and Services</h2>
            <p>
              The Service may contain links to third-party websites, services, or content. 
              This Privacy Policy does not apply to those third parties. We encourage you 
              to review the privacy policies of any third-party services you access through 
              our Service. We are not responsible for the privacy practices of third parties.
            </p>
          </section>

          {/* California Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. California Privacy Rights (CCPA/CPRA)</h2>
            <p className="mb-4">
              If you are a California resident, you have additional rights under the California 
              Consumer Privacy Act (CCPA) and California Privacy Rights Act (CPRA):
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Your California Rights</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Right to Know:</strong> Request information about the categories and 
                  specific pieces of personal information we have collected</li>
              <li><strong>Right to Delete:</strong> Request deletion of your personal information</li>
              <li><strong>Right to Correct:</strong> Request correction of inaccurate personal information</li>
              <li><strong>Right to Opt-Out of Sale/Sharing:</strong> We do not sell your personal 
                  information. We may share information for targeted advertising, which you can 
                  opt out of in app settings.</li>
              <li><strong>Right to Limit Use of Sensitive Information:</strong> Request that we 
                  limit use of sensitive personal information</li>
              <li><strong>Right to Non-Discrimination:</strong> We will not discriminate against 
                  you for exercising your rights</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Categories of Information Collected</h3>
            <p className="mb-4">In the past 12 months, we have collected:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Identifiers (name, email, phone number, device IDs)</li>
              <li>Personal information under California Civil Code Section 1798.80(e)</li>
              <li>Protected classification characteristics (age, gender - optional)</li>
              <li>Commercial information (transaction history)</li>
              <li>Internet or network activity (usage data, browsing history)</li>
              <li>Geolocation data (precise and approximate location)</li>
              <li>Audio, electronic, visual information (photos you upload)</li>
              <li>Inferences drawn from the above</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">How to Exercise Your Rights</h3>
            <p className="mb-4">
              To exercise your California privacy rights, you may:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Email us at privacy@mapandmingle.com</li>
              <li>Use the privacy controls in the app settings</li>
              <li>Submit a request through our website</li>
            </ul>
            <p className="text-sm text-gray-600">
              We will verify your identity before processing your request. You may designate 
              an authorized agent to make a request on your behalf.
            </p>
          </section>

          {/* European Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. European Privacy Rights (GDPR)</h2>
            <p className="mb-4">
              If you are located in the European Economic Area (EEA), United Kingdom, or 
              Switzerland, you have rights under the General Data Protection Regulation (GDPR):
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Legal Bases for Processing</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Contract:</strong> Processing necessary to provide the Service you requested</li>
              <li><strong>Consent:</strong> Where you have given explicit consent (e.g., marketing)</li>
              <li><strong>Legitimate Interests:</strong> For security, fraud prevention, and 
                  Service improvement, balanced against your rights</li>
              <li><strong>Legal Obligation:</strong> Where required by applicable law</li>
            </ul>

            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">Your GDPR Rights</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li><strong>Access:</strong> Request a copy of your personal data</li>
              <li><strong>Rectification:</strong> Request correction of inaccurate data</li>
              <li><strong>Erasure:</strong> Request deletion of your data ("right to be forgotten")</li>
              <li><strong>Restriction:</strong> Request restriction of processing</li>
              <li><strong>Portability:</strong> Receive your data in a structured, machine-readable format</li>
              <li><strong>Objection:</strong> Object to processing based on legitimate interests</li>
              <li><strong>Withdraw Consent:</strong> Withdraw consent at any time where processing 
                  is based on consent</li>
            </ul>

            <p className="mb-4">
              To exercise these rights, contact us at privacy@mapandmingle.com or use the 
              privacy controls in the app.
            </p>

            <p className="text-sm text-gray-600">
              You also have the right to lodge a complaint with your local data protection 
              authority if you believe we have not complied with applicable data protection laws.
            </p>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Changes to This Privacy Policy</h2>
            <p className="mb-4">
              We may update this Privacy Policy from time to time. When we make material changes, 
              we will:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Update the "Last Updated" date at the top of this policy</li>
              <li>Notify you through the app or via email</li>
              <li>Where required by law, obtain your consent to material changes</li>
            </ul>
            <p>
              We encourage you to review this Privacy Policy periodically to stay informed 
              about how we are protecting your information.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Contact Us</h2>
            <p className="mb-4">
              If you have questions, concerns, or requests regarding this Privacy Policy or 
              our privacy practices, please contact us:
            </p>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
              <p className="mb-2"><strong>SellFast.Now LLC dba Map & Mingle</strong></p>
              <p className="mb-2"><strong>Privacy Inquiries:</strong> privacy@mapandmingle.com</p>
              <p className="mb-2"><strong>Data Protection Officer:</strong> dpo@mapandmingle.com</p>
              <p className="mb-2"><strong>General Support:</strong> support@mapandmingle.com</p>
              <p><strong>Website:</strong> www.mapandmingle.com</p>
            </div>
            <p className="mt-4 text-sm text-gray-600">
              We aim to respond to all privacy-related inquiries within 30 days.
            </p>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm text-center">
              This Privacy Policy was last updated on December 4, 2025. By using Map & Mingle, 
              you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
