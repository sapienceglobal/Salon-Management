import LegalHeader from '@/components/public/LegalHeader';
import LegalFooter from '@/components/public/LegalFooter';
import Link from 'next/link';
import { 
  RiShieldCheckLine, 
  RiCalendarEventLine, 
  RiLockPasswordLine, 
  RiDatabase2Line,
  RiSmartphoneLine,
  RiUserSharedLine,
  RiTimeLine,
  RiDeleteBin7Line,
  RiCustomerService2Line,
  RiCheckLine,
  RiInformationLine
} from 'react-icons/ri';

export const metadata = {
  title: 'Privacy Policy | SalonTime',
  description: 'Learn how SalonTime collects, utilizes, protects, and handles personal data and salon management information in compliance with Google Play Store User Data policies.',
};

export default function PrivacyPolicyPage() {
  const lastUpdated = 'October 14, 2026';
  const effectiveDate = 'October 14, 2026';

  return (
    <div className="min-h-screen bg-[#FAF7F9] flex flex-col font-sans selection:bg-[#E91E63]/20 selection:text-[#E91E63]">
      <LegalHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-pink-50/30 to-[#FAF7F9] border-b border-pink-100/60 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-[#E91E63] text-xs font-bold mb-4">
            <RiShieldCheckLine className="text-sm" />
            <span>Google Play User Data & Privacy Standards</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-heading">
            Privacy Policy
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
            This Privacy Policy describes how <strong className="text-gray-900">SalonTime</strong> (&ldquo;we&rdquo;, &ldquo;us&rdquo;, or &ldquo;our&rdquo;) collects, processes, protects, and discloses personal information when you use our mobile application (available on Google Play Store) and our web-based salon management portal.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <RiTimeLine className="text-[#E91E63]" />
              <strong>Effective Date:</strong> {effectiveDate}
            </span>
            <span className="text-gray-300">&bull;</span>
            <span><strong>Last Updated:</strong> {lastUpdated}</span>
            <span className="text-gray-300">&bull;</span>
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <RiCheckLine />
              Play Console Compliant
            </span>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Left Table of Contents (Sticky on Desktop) */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1 text-xs">
              <div className="font-bold text-gray-900 uppercase tracking-wider mb-2 px-2 text-[11px]">
                Contents
              </div>
              <a href="#overview" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">1. Overview & Scope</a>
              <a href="#information-we-collect" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">2. Information We Collect</a>
              <a href="#permissions" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">3. Mobile Device Permissions</a>
              <a href="#how-we-use-data" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">4. How We Use Data</a>
              <a href="#third-parties" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">5. Third-Party Services</a>
              <a href="#security" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">6. Data Security & Storage</a>
              <a href="#retention-deletion" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">7. Retention & Account Deletion</a>
              <a href="#your-rights" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">8. Your Data Rights</a>
              <a href="#children" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">9. Children&apos;s Privacy</a>
              <a href="#contact" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">10. Contact Us</a>
            </div>
          </aside>

          {/* Right Detailed Sections */}
          <article className="lg:col-span-3 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">
            
            {/* Section 1 */}
            <section id="overview" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">1</span>
                <span>Overview & Scope</span>
              </h2>
              <p>
                SalonTime provides specialized business software for beauty salons, nail studios, barbershops, and spa wellness centers. Our solutions include an Android application distributed through Google Play and a responsive web administration console.
              </p>
              <p>
                We respect your personal privacy and are committed to safeguarding the confidentiality and integrity of all data processed through our platform. We never sell, rent, or trade your personal information or salon customer databases to data brokers or third-party advertisers.
              </p>
            </section>

            {/* Section 2 */}
            <section id="information-we-collect" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">2</span>
                <span>Information We Collect</span>
              </h2>
              <p>
                To provide seamless salon booking, point-of-sale, and customer relationship management, we collect the following categories of information:
              </p>

              <div className="space-y-4 pt-2">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <RiLockPasswordLine className="text-[#E91E63]" />
                    A. User Account Information
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    When an account is created for salon owners, managers, or staff members, we collect your name, email address, telephone number, job role (Admin, Manager, Staff), and encrypted password credentials (hashed with bcrypt).
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <RiCalendarEventLine className="text-[#E91E63]" />
                    B. Salon Operations & Customer CRM Data
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    Information entered into the salon management system, including customer names, phone numbers, appointment timestamps, requested salon services, assigned staff, service status, and lead enquiry notes.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/70">
                  <h3 className="font-bold text-gray-900 flex items-center gap-2 text-sm sm:text-base">
                    <RiSmartphoneLine className="text-[#E91E63]" />
                    C. Device, Diagnostic & Push Notification Data
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 mt-1">
                    We collect hardware model, operating system version, app build version, and Firebase Cloud Messaging (FCM) registration tokens to ensure push notifications for appointment alerts and status updates are delivered securely.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-pink-50/50 border border-pink-200/70">
                  <h3 className="font-bold text-pink-900 flex items-center gap-2 text-sm sm:text-base">
                    <RiInformationLine className="text-[#E91E63]" />
                    Financial Data Clarification
                  </h3>
                  <p className="text-xs sm:text-sm text-pink-800 mt-1">
                    We do <strong>NOT</strong> collect, process, or store raw credit/debit card numbers, CVVs, or bank net banking credentials. Any billing receipts generated inside the system record only transaction totals, selected payment modes (e.g. Cash, UPI, Card terminal), and timestamp logs for statutory salon bookkeeping.
                  </p>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="permissions" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">3</span>
                <span>Mobile Device Permissions (Android / Google Play)</span>
              </h2>
              <p>
                The SalonTime Android app requests only the minimum runtime permissions essential for operational functionality:
              </p>

              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-gray-900">INTERNET & ACCESS_NETWORK_STATE:</strong> Required to communicate securely with our cloud API servers via encrypted TLS channels.
                </li>
                <li>
                  <strong className="text-gray-900">POST_NOTIFICATIONS (Android 13+):</strong> Required to alert salon staff and administrators when new customer appointments are booked, rescheduled, or assigned. Users can toggle notifications off at any time in Android system settings.
                </li>
              </ul>

              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs sm:text-sm text-emerald-800 flex items-start gap-2.5">
                <RiCheckLine className="text-base text-emerald-600 shrink-0 mt-0.5" />
                <span>
                  <strong>Strict Policy Guarantee:</strong> The SalonTime app does <em>NOT</em> request background location, SMS reading, contact book harvesting, microphone, camera, or 3rd-party package installation permissions (<code className="bg-emerald-100 px-1 py-0.5 rounded text-emerald-900">REQUEST_INSTALL_PACKAGES</code> is completely removed).
                </span>
              </div>
            </section>

            {/* Section 4 */}
            <section id="how-we-use-data" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">4</span>
                <span>How We Use Your Information</span>
              </h2>
              <p>We process collected data strictly for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Facilitating salon appointment bookings, client check-ins, and service tracking.</li>
                <li>Enforcing <strong>Role-Based Access Control (RBAC)</strong>: ensuring that Managers and Staff accounts cannot view confidential business billing or financial reports.</li>
                <li>Transmitting real-time operational notifications and booking updates.</li>
                <li>Preventing malicious access, account takeover, and verifying user identity during password reset or account deletion.</li>
                <li>Complying with applicable legal, accounting, and fiscal regulations.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="third-parties" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">5</span>
                <span>Third-Party Services</span>
              </h2>
              <p>
                We integrate with a limited number of industry-standard third-party service providers that adhere to rigorous data privacy standards:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong className="text-gray-900">Google Play Services:</strong> For application distribution, verification, and Google Play In-App Updates.
                </li>
                <li>
                  <strong className="text-gray-900">Firebase Cloud Messaging (FCM):</strong> Hosted by Google Cloud, used exclusively to dispatch transactional push notifications to staff and salon owners.
                </li>
              </ul>
            </section>

            {/* Section 6 */}
            <section id="security" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">6</span>
                <span>Data Security & Storage</span>
              </h2>
              <p>
                We implement industry-grade technical and organizational safeguards to protect personal information against accidental loss, unauthorized access, alteration, or disclosure:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>All network communications between mobile clients, web portals, and servers utilize <strong>256-bit TLS/SSL encryption</strong>.</li>
                <li>Sensitive authentication credentials and passwords are encrypted using one-way <strong>bcrypt hashing with cryptographic salt rounds</strong>.</li>
                <li>Access to production databases is restricted to authorized administrative personnel through multi-factor authentication.</li>
              </ul>
            </section>

            {/* Section 7 */}
            <section id="retention-deletion" className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-200/80 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">7</span>
                <span>Data Retention & Account Deletion Policy</span>
              </h2>
              <p>
                We retain your personal data only for as long as your user account remains active or as required to fulfill the business purposes outlined in this policy.
              </p>
              <div className="p-4 rounded-xl bg-pink-50 border border-pink-200 text-sm space-y-3">
                <div className="flex items-center gap-2 font-bold text-[#E91E63]">
                  <RiDeleteBin7Line className="text-lg" />
                  <span>Google Play User Data Deletion Compliance</span>
                </div>
                <p className="text-gray-700 text-xs sm:text-sm">
                  You have the unconditional right to request the permanent deletion of your account and all associated personal data at any time. You can delete your account:
                </p>
                <ul className="list-disc pl-5 text-xs sm:text-sm text-gray-700 space-y-1">
                  <li><strong>Inside the Mobile App:</strong> Open Side Navigation Drawer &rarr; Tap &ldquo;Delete Account&rdquo; &rarr; Verify password.</li>
                  <li><strong>Directly Online on the Web:</strong> Use our dedicated web deletion portal.</li>
                </ul>
                <div className="pt-2">
                  <Link
                    href="/delete-account"
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#E91E63] text-white font-bold text-xs shadow-xs hover:bg-[#d81557] transition-all"
                  >
                    <span>Visit Account & Data Deletion Portal</span>
                    <RiShieldCheckLine />
                  </Link>
                </div>
              </div>
            </section>

            {/* Section 8 */}
            <section id="your-rights" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">8</span>
                <span>Your Data Rights</span>
              </h2>
              <p>Under applicable data privacy regulations, you have the right to:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li><strong>Access & Review:</strong> Request a copy of the personal information we hold about you.</li>
                <li><strong>Rectification:</strong> Request correction of inaccurate or incomplete personal details.</li>
                <li><strong>Erasure (Right to be Forgotten):</strong> Request complete purging of your personal records.</li>
                <li><strong>Withdraw Consent:</strong> Opt out of push notifications or communications at any time.</li>
              </ul>
            </section>

            {/* Section 9 */}
            <section id="children" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">9</span>
                <span>Children&apos;s Privacy</span>
              </h2>
              <p>
                Our services and applications are exclusively intended for commercial salon business owners, managers, and professional staff aged 18 and older. We do not knowingly solicit or collect personal information from children under the age of 13 (or under 16 in applicable jurisdictions). If we become aware that personal information of a minor has been collected without parental consent, we will promptly purge such data from our servers.
              </p>
            </section>

            {/* Section 10 */}
            <section id="contact" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">10</span>
                <span>Contact Us & Privacy Inquiries</span>
              </h2>
              <p>
                If you have questions, feedback, or concerns regarding this Privacy Policy or our data handling practices, please contact our Data Governance & Compliance Team:
              </p>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2 text-sm">
                <div className="font-bold text-gray-900">SalonTime Compliance Desk</div>
                <div className="text-gray-600">Email: <a href="mailto:support@salontime.in" className="text-[#E91E63] font-semibold hover:underline">support@salontime.in</a></div>
                <div className="text-gray-600">Website: <a href="https://salontime.in" className="text-[#E91E63] font-semibold hover:underline">https://salontime.in</a></div>
                <div className="text-gray-500 text-xs pt-1">Response time: Usually within 24–48 business hours.</div>
              </div>
            </section>

          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
