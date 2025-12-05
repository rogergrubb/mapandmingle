import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function TermsOfService() {
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
            <h1 className="text-xl font-bold">Terms of Service</h1>
            <p className="text-sm text-gray-500">Last updated: December 4, 2025</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 pb-24">
        <div className="bg-white rounded-2xl shadow-sm p-6 md:p-8 space-y-8 text-gray-700 leading-relaxed">
          
          {/* Introduction */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Agreement to Terms</h2>
            <p className="mb-4">
              Welcome to Map & Mingle ("Company," "we," "us," or "our"). These Terms of Service 
              ("Terms") constitute a legally binding agreement between you ("User," "you," or "your") 
              and SellFast.Now LLC, a California limited liability company doing business as Map & Mingle, 
              governing your access to and use of the Map & Mingle website, mobile application, and 
              all related services (collectively, the "Service").
            </p>
            <p className="mb-4">
              <strong>BY ACCESSING OR USING THE SERVICE, YOU ACKNOWLEDGE THAT YOU HAVE READ, 
              UNDERSTOOD, AND AGREE TO BE BOUND BY THESE TERMS.</strong> If you do not agree 
              to these Terms, you must not access or use the Service.
            </p>
            <p className="mb-4">
              We reserve the right to modify these Terms at any time. We will notify you of 
              material changes by posting the updated Terms on the Service and updating the 
              "Last Updated" date. Your continued use of the Service after any such changes 
              constitutes your acceptance of the new Terms.
            </p>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 text-sm">
                <strong>IMPORTANT:</strong> These Terms contain an arbitration agreement and 
                class action waiver that affect your legal rights. Please read Sections 18 and 
                19 carefully.
              </p>
            </div>
          </section>

          {/* Eligibility */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Eligibility</h2>
            <p className="mb-4">To use the Service, you must:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Be at least 18 years of age</li>
              <li>Have the legal capacity to enter into a binding agreement</li>
              <li>Not be prohibited from using the Service under applicable law</li>
              <li>Not have been previously banned from the Service</li>
              <li>Not be a convicted sex offender</li>
              <li>Not be located in a country subject to U.S. government embargo</li>
            </ul>
            <p>
              By using the Service, you represent and warrant that you meet all eligibility 
              requirements. We reserve the right to verify your eligibility and refuse service 
              to anyone at our sole discretion.
            </p>
          </section>

          {/* Account Registration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">3. Account Registration & Security</h2>
            <p className="mb-4">
              To access certain features of the Service, you must create an account. When 
              creating an account, you agree to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Maintain the security of your password and account credentials</li>
              <li>Accept responsibility for all activities under your account</li>
              <li>Notify us immediately of any unauthorized access or security breach</li>
              <li>Not share your account credentials with any third party</li>
              <li>Not create more than one account per person</li>
              <li>Not create accounts for others without their permission</li>
            </ul>
            <p>
              We reserve the right to suspend or terminate accounts that appear to be fake, 
              fraudulent, or in violation of these Terms.
            </p>
          </section>

          {/* User Content */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">4. User Content</h2>
            <p className="mb-4">
              <strong>"User Content"</strong> means any content you submit, post, upload, or 
              otherwise make available through the Service, including but not limited to profile 
              information, photos, messages, event details, pins, comments, and location data.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.1 Content Ownership</h3>
            <p className="mb-4">
              You retain ownership of your User Content. However, by submitting User Content 
              to the Service, you grant us a worldwide, non-exclusive, royalty-free, sublicensable, 
              and transferable license to use, reproduce, modify, adapt, publish, translate, 
              create derivative works from, distribute, perform, and display such User Content 
              in connection with operating and providing the Service and promoting Map & Mingle.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.2 Content Representations</h3>
            <p className="mb-4">By submitting User Content, you represent and warrant that:</p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>You own or have the necessary rights to use and authorize use of the content</li>
              <li>Your content does not violate any third party's rights, including intellectual property rights</li>
              <li>Your content does not violate any applicable laws or regulations</li>
              <li>Your content does not contain viruses or harmful code</li>
              <li>Your content is accurate and not misleading</li>
              <li>Any photos you upload are of yourself or you have permission to use them</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">4.3 Content Moderation</h3>
            <p>
              We reserve the right, but have no obligation, to monitor, review, edit, or remove 
              any User Content at our sole discretion. We may remove content that violates these 
              Terms, our Community Guidelines, or that we find objectionable. We are not responsible 
              for any User Content posted by users.
            </p>
          </section>

          {/* Prohibited Uses */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">5. Prohibited Uses</h2>
            <p className="mb-4">
              In addition to the restrictions set forth in our Community Guidelines, you agree 
              not to use the Service to:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Violate any applicable law, regulation, or third-party rights</li>
              <li>Engage in any form of harassment, stalking, or intimidation</li>
              <li>Collect or harvest user data without authorization</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Circumvent any security features or access controls</li>
              <li>Use automated systems (bots, scrapers, etc.) without permission</li>
              <li>Create fake accounts or misrepresent your identity</li>
              <li>Engage in commercial activities not authorized by us</li>
              <li>Transmit spam, chain letters, or unsolicited communications</li>
              <li>Solicit money or conduct financial scams</li>
              <li>Recruit users for competing services</li>
              <li>Reverse engineer, decompile, or attempt to extract source code</li>
              <li>Use the Service in any manner that could damage or overburden it</li>
              <li>Assist or enable any third party in doing any of the above</li>
            </ul>
          </section>

          {/* Location Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Location Services</h2>
            <p className="mb-4">
              The Service uses location data to provide its core features. By using the Service, 
              you acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>We collect and process your location data as described in our Privacy Policy</li>
              <li>Your location may be visible to other users based on your privacy settings</li>
              <li>Location data may not always be accurate due to technical limitations</li>
              <li>You are responsible for how you use location features</li>
              <li>We are not liable for any consequences arising from location-based interactions</li>
            </ul>
            <p>
              <strong>WARNING:</strong> Exercise caution when sharing your location with others. 
              We strongly recommend meeting new connections in public places and informing 
              someone you trust about your plans.
            </p>
          </section>

          {/* Events */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Events & Meetups</h2>
            <p className="mb-4">
              The Service allows users to create and attend events. You acknowledge and agree that:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Map & Mingle does not organize, host, or endorse any events created by users</li>
              <li>Event organizers are solely responsible for their events</li>
              <li>Attendance at any event is at your own risk</li>
              <li>We do not verify event details, safety, or the identity of organizers/attendees</li>
              <li>We are not liable for any injury, loss, or damage arising from events</li>
              <li>Event organizers must comply with all applicable laws and regulations</li>
            </ul>
            <p>
              By creating an event, you agree to take responsibility for the safety and conduct 
              of your event and to comply with all applicable laws, including those related to 
              public gatherings, permits, and liability.
            </p>
          </section>

          {/* Payments */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Payments & Subscriptions</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.1 Subscription Services</h3>
            <p className="mb-4">
              Certain features of the Service may require a paid subscription ("Premium Features"). 
              By subscribing, you agree to pay the applicable fees and authorize us to charge 
              your payment method on a recurring basis.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.2 Billing & Renewal</h3>
            <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
              <li>Subscriptions automatically renew unless cancelled before the renewal date</li>
              <li>Prices may change with notice; continued use constitutes acceptance</li>
              <li>You are responsible for keeping your payment information current</li>
              <li>Failed payments may result in suspension of Premium Features</li>
            </ul>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.3 Refunds</h3>
            <p className="mb-4">
              Subscription fees are generally non-refundable. We may, at our sole discretion, 
              provide refunds or credits in certain circumstances. Refunds requested within 
              14 days of initial purchase may be considered on a case-by-case basis.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">8.4 Trial Periods</h3>
            <p>
              We may offer free trial periods for Premium Features. At the end of the trial, 
              you will be automatically charged unless you cancel before the trial ends. 
              Trial offers are limited to one per user.
            </p>
          </section>

          {/* Intellectual Property */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Intellectual Property Rights</h2>
            <p className="mb-4">
              The Service and its entire contents, features, and functionality (including but 
              not limited to all information, software, text, displays, images, video, audio, 
              and the design, selection, and arrangement thereof) are owned by the Company, 
              its licensors, or other providers of such material and are protected by United 
              States and international copyright, trademark, patent, trade secret, and other 
              intellectual property or proprietary rights laws.
            </p>
            <p className="mb-4">
              The Map & Mingle name, logo, and all related names, logos, product and service 
              names, designs, and slogans are trademarks of the Company or its affiliates. 
              You must not use such marks without the prior written permission of the Company.
            </p>
            <p>
              You are granted a limited, non-exclusive, non-transferable, revocable license 
              to access and use the Service for personal, non-commercial purposes in accordance 
              with these Terms.
            </p>
          </section>

          {/* Third Party Services */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Third-Party Services & Links</h2>
            <p className="mb-4">
              The Service may contain links to third-party websites, services, or content that 
              are not owned or controlled by Map & Mingle. We have no control over, and assume 
              no responsibility for, the content, privacy policies, or practices of any 
              third-party websites or services.
            </p>
            <p>
              You acknowledge and agree that Map & Mingle shall not be responsible or liable, 
              directly or indirectly, for any damage or loss caused or alleged to be caused 
              by or in connection with the use of any such third-party content, goods, or services.
            </p>
          </section>

          {/* Privacy */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Privacy</h2>
            <p>
              Your privacy is important to us. Our Privacy Policy explains how we collect, use, 
              disclose, and protect your personal information. By using the Service, you agree 
              to the collection and use of information in accordance with our Privacy Policy, 
              which is incorporated into these Terms by reference.
            </p>
          </section>

          {/* DMCA */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Copyright Infringement (DMCA)</h2>
            <p className="mb-4">
              We respect the intellectual property rights of others. If you believe that any 
              content on the Service infringes your copyright, please submit a DMCA notice to 
              our designated copyright agent:
            </p>
            <div className="bg-gray-100 rounded-xl p-4 mb-4">
              <p><strong>DMCA Agent</strong></p>
              <p>SellFast.Now LLC</p>
              <p>Email: dmca@mapandmingle.com</p>
            </div>
            <p className="text-sm">
              Your notice must include: (1) identification of the copyrighted work; (2) 
              identification of the infringing material; (3) your contact information; (4) 
              a statement of good faith belief; (5) a statement of accuracy under penalty 
              of perjury; and (6) your physical or electronic signature.
            </p>
          </section>

          {/* Termination */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">13. Termination</h2>
            <p className="mb-4">
              We may terminate or suspend your account and access to the Service immediately, 
              without prior notice or liability, for any reason, including without limitation 
              if you breach these Terms.
            </p>
            <p className="mb-4">
              You may terminate your account at any time by deleting your account through the 
              app settings or by contacting us at support@mapandmingle.com.
            </p>
            <p>
              Upon termination, your right to use the Service will immediately cease. All 
              provisions of these Terms which by their nature should survive termination 
              shall survive, including ownership provisions, warranty disclaimers, indemnity, 
              and limitations of liability.
            </p>
          </section>

          {/* Disclaimers */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">14. Disclaimers</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 mb-4">
                <strong>THE SERVICE IS PROVIDED ON AN "AS IS" AND "AS AVAILABLE" BASIS WITHOUT 
                ANY WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED.</strong>
              </p>
              <p className="text-red-700 text-sm mb-4">
                TO THE FULLEST EXTENT PERMITTED BY LAW, MAP & MINGLE DISCLAIMS ALL WARRANTIES, 
                EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF 
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, TITLE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-red-700 text-sm mb-4">
                WE DO NOT WARRANT THAT: (A) THE SERVICE WILL MEET YOUR REQUIREMENTS; (B) THE 
                SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE; (C) THE RESULTS 
                OBTAINED FROM USE OF THE SERVICE WILL BE ACCURATE OR RELIABLE; (D) ANY ERRORS 
                IN THE SERVICE WILL BE CORRECTED.
              </p>
              <p className="text-red-700 text-sm">
                WE DO NOT SCREEN USERS, CONDUCT BACKGROUND CHECKS, OR VERIFY USER IDENTITIES. 
                WE MAKE NO REPRESENTATIONS OR WARRANTIES AS TO THE CONDUCT, IDENTITY, INTENTIONS, 
                LEGITIMACY, OR VERACITY OF USERS. YOU ARE SOLELY RESPONSIBLE FOR YOUR INTERACTIONS 
                WITH OTHER USERS.
              </p>
            </div>
          </section>

          {/* Limitation of Liability */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">15. Limitation of Liability</h2>
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <p className="text-red-800 mb-4">
                <strong>TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, IN NO EVENT SHALL 
                MAP & MINGLE, ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AGENTS, SUPPLIERS, 
                OR LICENSORS BE LIABLE FOR:</strong>
              </p>
              <ul className="list-disc list-inside text-red-700 text-sm space-y-2 mb-4">
                <li>ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES</li>
                <li>ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES</li>
                <li>ANY DAMAGES ARISING FROM YOUR USE OR INABILITY TO USE THE SERVICE</li>
                <li>ANY DAMAGES ARISING FROM INTERACTIONS WITH OTHER USERS</li>
                <li>ANY DAMAGES ARISING FROM EVENTS OR MEETUPS FACILITATED THROUGH THE SERVICE</li>
                <li>ANY PERSONAL INJURY OR PROPERTY DAMAGE</li>
                <li>ANY UNAUTHORIZED ACCESS TO OR ALTERATION OF YOUR DATA</li>
                <li>ANY THIRD-PARTY CONDUCT OR CONTENT ON THE SERVICE</li>
              </ul>
              <p className="text-red-700 text-sm">
                IN NO EVENT SHALL OUR TOTAL LIABILITY TO YOU FOR ALL CLAIMS ARISING FROM OR 
                RELATING TO THE SERVICE EXCEED THE GREATER OF: (A) THE AMOUNT YOU PAID US IN 
                THE TWELVE (12) MONTHS PRECEDING THE CLAIM; OR (B) ONE HUNDRED DOLLARS ($100).
              </p>
            </div>
          </section>

          {/* Indemnification */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">16. Indemnification</h2>
            <p>
              You agree to defend, indemnify, and hold harmless Map & Mingle, its affiliates, 
              licensors, and service providers, and its and their respective officers, directors, 
              employees, contractors, agents, licensors, suppliers, successors, and assigns from 
              and against any claims, liabilities, damages, judgments, awards, losses, costs, 
              expenses, or fees (including reasonable attorneys' fees) arising out of or relating 
              to: (a) your violation of these Terms; (b) your User Content; (c) your use of the 
              Service; (d) your interactions with other users; (e) your violation of any 
              third-party rights; or (f) your violation of any applicable laws.
            </p>
          </section>

          {/* Governing Law */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">17. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of 
              the State of California, United States, without regard to its conflict of law 
              principles. You agree to submit to the personal jurisdiction of the state and 
              federal courts located in Contra Costa County, California for any actions not 
              subject to arbitration.
            </p>
          </section>

          {/* Arbitration */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">18. Arbitration Agreement</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-4">
              <p className="text-yellow-800 font-semibold mb-2">PLEASE READ THIS SECTION CAREFULLY</p>
            </div>
            <p className="mb-4">
              <strong>Binding Arbitration:</strong> You and Map & Mingle agree that any dispute, 
              claim, or controversy arising out of or relating to these Terms or the Service 
              (collectively, "Disputes") will be resolved exclusively through final and binding 
              arbitration, rather than in court, except that either party may bring individual 
              claims in small claims court if they qualify.
            </p>
            <p className="mb-4">
              <strong>Arbitration Rules:</strong> Arbitration will be conducted by JAMS under 
              its Streamlined Arbitration Rules and Procedures. The arbitration will be held 
              in Contra Costa County, California, or another mutually agreed location.
            </p>
            <p className="mb-4">
              <strong>Waiver of Jury Trial:</strong> YOU AND MAP & MINGLE WAIVE ANY CONSTITUTIONAL 
              AND STATUTORY RIGHTS TO GO TO COURT AND HAVE A TRIAL IN FRONT OF A JUDGE OR A JURY.
            </p>
            <p>
              <strong>Opt-Out:</strong> You may opt out of this arbitration agreement by sending 
              written notice to arbitration-optout@mapandmingle.com within 30 days of first 
              accepting these Terms. Your notice must include your name, email, mailing address, 
              and a clear statement that you wish to opt out of the arbitration agreement.
            </p>
          </section>

          {/* Class Action Waiver */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">19. Class Action Waiver</h2>
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
              <p className="text-yellow-800 mb-4">
                <strong>YOU AND MAP & MINGLE AGREE THAT EACH MAY BRING CLAIMS AGAINST THE OTHER 
                ONLY IN YOUR OR ITS INDIVIDUAL CAPACITY AND NOT AS A PLAINTIFF OR CLASS MEMBER 
                IN ANY PURPORTED CLASS OR REPRESENTATIVE PROCEEDING.</strong>
              </p>
              <p className="text-yellow-700 text-sm">
                Unless both you and Map & Mingle agree otherwise, the arbitrator may not 
                consolidate more than one person's claims and may not otherwise preside over 
                any form of a representative or class proceeding.
              </p>
            </div>
          </section>

          {/* Miscellaneous */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">20. Miscellaneous</h2>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">20.1 Entire Agreement</h3>
            <p className="mb-4">
              These Terms, together with our Privacy Policy and Community Guidelines, constitute 
              the entire agreement between you and Map & Mingle regarding the Service and 
              supersede all prior agreements.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">20.2 Severability</h3>
            <p className="mb-4">
              If any provision of these Terms is held to be invalid or unenforceable, such 
              provision shall be struck and the remaining provisions shall remain in full force 
              and effect.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">20.3 Waiver</h3>
            <p className="mb-4">
              Our failure to enforce any right or provision of these Terms shall not constitute 
              a waiver of such right or provision.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">20.4 Assignment</h3>
            <p className="mb-4">
              You may not assign or transfer these Terms without our prior written consent. 
              We may assign or transfer these Terms, in whole or in part, without restriction.
            </p>
            
            <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-3">20.5 Force Majeure</h3>
            <p>
              We shall not be liable for any failure or delay in performing our obligations 
              due to causes beyond our reasonable control, including natural disasters, war, 
              terrorism, riots, embargoes, acts of civil or military authorities, fire, floods, 
              accidents, strikes, or shortages.
            </p>
          </section>

          {/* Contact */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">21. Contact Information</h2>
            <p className="mb-4">
              For questions about these Terms, please contact us:
            </p>
            <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-4">
              <p className="mb-2"><strong>SellFast.Now LLC dba Map & Mingle</strong></p>
              <p><strong>Email:</strong> legal@mapandmingle.com</p>
              <p><strong>Support:</strong> support@mapandmingle.com</p>
              <p><strong>Website:</strong> www.mapandmingle.com</p>
            </div>
          </section>

          <div className="border-t pt-6 mt-8">
            <p className="text-gray-500 text-sm text-center">
              By using Map & Mingle, you acknowledge that you have read, understood, and 
              agree to be bound by these Terms of Service.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
