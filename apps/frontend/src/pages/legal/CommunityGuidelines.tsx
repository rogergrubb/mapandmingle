import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CommunityGuidelines() {
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
            <h1 className="text-xl font-bold">Community Guidelines</h1>
            <p className="text-sm text-gray-500">Last updated: December 4, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Welcome to Map & Mingle</h2>
            <p className="text-gray-700 leading-relaxed mb-4">
              Map & Mingle is a location-based social platform designed to help people connect, 
              discover events, and build meaningful relationships in their communities. Our mission 
              is to create a safe, inclusive, and respectful environment where everyone can "Find 
              their people, wherever they are."
            </p>
            <p className="text-gray-700 leading-relaxed">
              These Community Guidelines establish the standards of behavior expected from all users. 
              By using Map & Mingle, you agree to follow these guidelines and help us maintain a 
              positive community for everyone.
            </p>
          </section>

          {/* Core Values */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Our Core Values</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🤝 Respect</h3>
                <p className="text-gray-600 text-sm">Treat every user with dignity and respect, regardless of differences.</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🛡️ Safety</h3>
                <p className="text-gray-600 text-sm">Prioritize your safety and the safety of others in all interactions.</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">🌈 Inclusivity</h3>
                <p className="text-gray-600 text-sm">Welcome people of all backgrounds, identities, and walks of life.</p>
              </div>
              <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-2">✨ Authenticity</h3>
                <p className="text-gray-600 text-sm">Be genuine in your interactions and represent yourself honestly.</p>
              </div>
            </div>
          </section>

          {/* Prohibited Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Prohibited Content & Behavior</h2>
            <p className="text-gray-700 mb-4">
              The following content and behaviors are strictly prohibited on Map & Mingle. 
              Violations may result in content removal, account suspension, or permanent ban.
            </p>

            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Violence & Threats</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Threats of violence against individuals or groups</li>
                  <li>Content that promotes, glorifies, or incites violence</li>
                  <li>Graphic violence or gore</li>
                  <li>Instructions for weapons, explosives, or harmful substances</li>
                  <li>Encouraging self-harm or suicide</li>
                  <li>Doxxing or sharing others' private information with malicious intent</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Harassment & Bullying</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Targeted harassment of individuals</li>
                  <li>Cyberbullying, intimidation, or repeated unwanted contact</li>
                  <li>Coordinated attacks against users</li>
                  <li>Creating accounts to circumvent blocks</li>
                  <li>Sharing private conversations without consent</li>
                  <li>Revenge content of any kind</li>
                  <li>Stalking or tracking users' locations without consent</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Hate Speech & Discrimination</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Content attacking individuals based on race, ethnicity, or national origin</li>
                  <li>Religious discrimination or attacks</li>
                  <li>Gender-based harassment or discrimination</li>
                  <li>LGBTQ+ discrimination or attacks</li>
                  <li>Discrimination based on disability or health conditions</li>
                  <li>Age-based discrimination</li>
                  <li>Slurs, dehumanizing language, or hateful symbols</li>
                  <li>Support for hate groups or extremist ideologies</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Sexual Content & Exploitation</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Sexually explicit content or pornography</li>
                  <li>Non-consensual intimate imagery</li>
                  <li>Sexual solicitation or prostitution</li>
                  <li>Sexual content involving minors (immediate permanent ban and law enforcement referral)</li>
                  <li>Unsolicited sexual messages or images</li>
                  <li>Sexual harassment of any kind</li>
                  <li>Content that sexualizes minors in any way</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Fraud & Deception</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Impersonating others or fake identities</li>
                  <li>Scams, phishing, or financial fraud</li>
                  <li>Misleading or deceptive content</li>
                  <li>Pyramid schemes or multi-level marketing solicitation</li>
                  <li>Fake events designed to deceive users</li>
                  <li>Catfishing or romance scams</li>
                  <li>False claims about products, services, or credentials</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Illegal Activities</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Drug trafficking or sales</li>
                  <li>Weapons trafficking</li>
                  <li>Human trafficking</li>
                  <li>Counterfeit goods</li>
                  <li>Stolen property</li>
                  <li>Any other illegal goods or services</li>
                  <li>Planning or coordinating illegal activities</li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-red-600 mb-2">🚫 Spam & Platform Abuse</h3>
                <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                  <li>Automated or bot accounts</li>
                  <li>Mass messaging or spam</li>
                  <li>Artificial engagement manipulation</li>
                  <li>Creating multiple accounts to evade bans</li>
                  <li>Selling or purchasing accounts</li>
                  <li>Unauthorized commercial solicitation</li>
                  <li>Malware distribution or hacking attempts</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Location & Safety */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Location Sharing & Safety</h2>
            <p className="text-gray-700 mb-4">
              Map & Mingle uses location data to help you connect with nearby users and events. 
              With this feature comes important responsibilities:
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Safety Considerations</h3>
              <ul className="list-disc list-inside text-yellow-700 space-y-1">
                <li>Only share your precise location with users you trust</li>
                <li>Use approximate location settings when connecting with new people</li>
                <li>Meet new connections in public places first</li>
                <li>Tell someone you trust about your plans when meeting new people</li>
                <li>Trust your instincts - if something feels wrong, leave the situation</li>
              </ul>
            </div>
            <div className="space-y-3">
              <p className="text-gray-700">
                <strong>DO NOT</strong> use location features to:
              </p>
              <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
                <li>Track or stalk other users</li>
                <li>Show up uninvited at someone's location</li>
                <li>Share others' locations without their explicit consent</li>
                <li>Create events at private locations without permission</li>
                <li>Use location data to target vulnerable individuals</li>
              </ul>
            </div>
          </section>

          {/* Event Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Event Creation Guidelines</h2>
            <p className="text-gray-700 mb-4">
              Events are a core feature of Map & Mingle. When creating or hosting events, you must:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4">
              <li>Provide accurate information about the event (time, location, nature of event)</li>
              <li>Only create events at locations where you have permission to gather</li>
              <li>Clearly communicate any costs, requirements, or restrictions</li>
              <li>Take responsibility for the safety and conduct of your event</li>
              <li>Comply with all local laws and regulations regarding gatherings</li>
              <li>Not discriminate against attendees based on protected characteristics</li>
              <li>Respond appropriately to safety concerns raised by attendees</li>
              <li>Not create fake or misleading events</li>
              <li>Cancel events promptly if circumstances change</li>
            </ul>
          </section>

          {/* Messaging Guidelines */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messaging & Communication</h2>
            <p className="text-gray-700 mb-4">
              When communicating with other users:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ DO</h3>
                <ul className="text-green-700 text-sm space-y-1">
                  <li>• Be respectful and courteous</li>
                  <li>• Accept "no" as an answer</li>
                  <li>• Respect others' boundaries</li>
                  <li>• Report concerning behavior</li>
                  <li>• Use the block feature when needed</li>
                  <li>• Keep conversations appropriate</li>
                </ul>
              </div>
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <h3 className="font-semibold text-red-800 mb-2">❌ DON'T</h3>
                <ul className="text-red-700 text-sm space-y-1">
                  <li>• Send unsolicited explicit content</li>
                  <li>• Harass users who don't respond</li>
                  <li>• Share private conversations publicly</li>
                  <li>• Make threats or intimidating statements</li>
                  <li>• Solicit personal/financial information</li>
                  <li>• Continue contact after being blocked</li>
                </ul>
              </div>
            </div>
          </section>

          {/* Age Requirements */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Age Requirements</h2>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-800 mb-3">
                <strong>You must be at least 18 years old to use Map & Mingle.</strong>
              </p>
              <p className="text-blue-700 text-sm">
                We do not knowingly collect information from users under 18. If we discover that 
                a user is under 18, their account will be immediately terminated. If you believe 
                a user is underage, please report them immediately through our reporting system.
              </p>
            </div>
          </section>

          {/* Reporting */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Reporting Violations</h2>
            <p className="text-gray-700 mb-4">
              If you encounter content or behavior that violates these guidelines, please report it 
              immediately. You can report:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-2 ml-4 mb-4">
              <li><strong>Users:</strong> Through their profile page using the report button</li>
              <li><strong>Messages:</strong> Long-press on the message and select "Report"</li>
              <li><strong>Events:</strong> Through the event detail page using the report button</li>
              <li><strong>Pins/Mingles:</strong> Through the pin detail view using the report button</li>
            </ul>
            <p className="text-gray-700 mb-4">
              All reports are reviewed by our Trust & Safety team. We take every report seriously 
              and will respond appropriately based on the severity of the violation.
            </p>
            <div className="bg-gray-100 rounded-xl p-4">
              <p className="text-gray-700 text-sm">
                <strong>Emergency Situations:</strong> If you believe someone is in immediate 
                danger, please contact your local emergency services (911 in the US) immediately. 
                Then report the situation to us at <strong>safety@mapandmingle.com</strong>
              </p>
            </div>
          </section>

          {/* Enforcement */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enforcement & Consequences</h2>
            <p className="text-gray-700 mb-4">
              Violations of these guidelines will result in enforcement actions proportional to 
              the severity of the violation:
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                <span className="text-yellow-500 font-bold">1</span>
                <div>
                  <p className="font-semibold text-gray-900">Warning</p>
                  <p className="text-gray-600 text-sm">For first-time minor violations</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-orange-50 rounded-lg">
                <span className="text-orange-500 font-bold">2</span>
                <div>
                  <p className="font-semibold text-gray-900">Content Removal</p>
                  <p className="text-gray-600 text-sm">Violating content will be removed</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-50 rounded-lg">
                <span className="text-red-500 font-bold">3</span>
                <div>
                  <p className="font-semibold text-gray-900">Temporary Suspension</p>
                  <p className="text-gray-600 text-sm">Account suspended for a period of time</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-red-100 rounded-lg">
                <span className="text-red-700 font-bold">4</span>
                <div>
                  <p className="font-semibold text-gray-900">Permanent Ban</p>
                  <p className="text-gray-600 text-sm">Account permanently terminated; may include device ban</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-purple-100 rounded-lg">
                <span className="text-purple-700 font-bold">5</span>
                <div>
                  <p className="font-semibold text-gray-900">Legal Action</p>
                  <p className="text-gray-600 text-sm">Referral to law enforcement for serious violations</p>
                </div>
              </div>
            </div>
            <p className="text-gray-700 mt-4 text-sm">
              We reserve the right to skip levels based on the severity of the violation. 
              Certain violations (child exploitation, credible threats, illegal activity) 
              result in immediate permanent ban and law enforcement referral.
            </p>
          </section>

          {/* Appeals */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Appeals Process</h2>
            <p className="text-gray-700 mb-4">
              If you believe your account was suspended or content was removed in error, you 
              may appeal the decision:
            </p>
            <ol className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
              <li>Email appeals@mapandmingle.com within 30 days of the action</li>
              <li>Include your account email and a detailed explanation</li>
              <li>Provide any evidence supporting your appeal</li>
              <li>Appeals are typically reviewed within 7-14 business days</li>
              <li>Our decision on appeals is final</li>
            </ol>
          </section>

          {/* Updates */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Updates to Guidelines</h2>
            <p className="text-gray-700">
              We may update these Community Guidelines from time to time. Significant changes 
              will be communicated through the app or via email. Continued use of Map & Mingle 
              after changes constitutes acceptance of the updated guidelines.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              Questions about these guidelines? Contact us:
            </p>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
              <p className="text-gray-700"><strong>Email:</strong> support@mapandmingle.com</p>
              <p className="text-gray-700"><strong>Safety Issues:</strong> safety@mapandmingle.com</p>
              <p className="text-gray-700"><strong>Appeals:</strong> appeals@mapandmingle.com</p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm text-center">
              Thank you for helping us build a safe and welcoming community. 
              Together, we can help everyone "Find their people."
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
