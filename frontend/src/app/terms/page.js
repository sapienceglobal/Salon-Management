import LegalHeader from '@/components/public/LegalHeader';
import LegalFooter from '@/components/public/LegalFooter';
import Link from 'next/link';
import { 
  RiFileTextLine, 
  RiShieldCheckLine, 
  RiTimeLine, 
  RiCheckLine,
  RiScales3Line,
  RiUserStarLine,
  RiAlertLine
} from 'react-icons/ri';

export const metadata = {
  title: 'Terms of Service | SalonTime',
  description: 'Terms and Conditions governing the use of SalonTime mobile application and web-based salon management platform.',
};

export default function TermsPage() {
  const lastUpdated = 'October 14, 2026';
  const effectiveDate = 'October 14, 2026';

  return (
    <div className="min-h-screen bg-[#FAF7F9] flex flex-col font-sans selection:bg-[#E91E63]/20 selection:text-[#E91E63]">
      <LegalHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-pink-50/30 to-[#FAF7F9] border-b border-pink-100/60 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pink-100/70 border border-pink-200 text-[#E91E63] text-xs font-bold mb-4">
            <RiScales3Line className="text-sm" />
            <span>Salon Management SaaS Agreement</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-heading">
            Terms of Service
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
            Please read these Terms of Service (&ldquo;Terms&rdquo;) carefully before using the <strong className="text-gray-900">SalonTime</strong> mobile application (distributed via Google Play) or our web portal. These Terms govern your access to and use of our salon appointment, point of sale, staff, and customer management services.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-4 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5">
              <RiTimeLine className="text-[#E91E63]" />
              <strong>Effective Date:</strong> {effectiveDate}
            </span>
            <span className="text-gray-300">&bull;</span>
            <span><strong>Last Updated:</strong> {lastUpdated}</span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 lg:gap-10">
          
          {/* Left Table of Contents */}
          <aside className="lg:col-span-1 hidden lg:block">
            <div className="sticky top-24 bg-white rounded-2xl p-4 border border-gray-200/80 shadow-xs space-y-1 text-xs">
              <div className="font-bold text-gray-900 uppercase tracking-wider mb-2 px-2 text-[11px]">
                Summary Sections
              </div>
              <a href="#acceptance" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">1. Acceptance of Terms</a>
              <a href="#accounts" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">2. Accounts & Role Hierarchy</a>
              <a href="#salon-responsibilities" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">3. Salon Responsibilities</a>
              <a href="#acceptable-use" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">4. Acceptable Use Policy</a>
              <a href="#intellectual-property" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">5. Intellectual Property</a>
              <a href="#data-privacy" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">6. Data Privacy & Security</a>
              <a href="#limitation" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">7. Limitation of Liability</a>
              <a href="#termination" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">8. Termination & Deletion</a>
              <a href="#contact-terms" className="block px-2.5 py-1.5 rounded-lg text-gray-600 hover:text-[#E91E63] hover:bg-pink-50 transition-colors">9. Contact & Legal Notices</a>
            </div>
          </aside>

          {/* Right Content */}
          <article className="lg:col-span-3 space-y-10 text-gray-700 leading-relaxed text-sm sm:text-base">
            
            {/* Section 1 */}
            <section id="acceptance" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">1</span>
                <span>Acceptance of Terms</span>
              </h2>
              <p>
                By downloading, accessing, browsing, or utilizing the SalonTime mobile application, web dashboard, or associated APIs, you agree to be bound by these Terms and our <Link href="/privacy-policy" className="text-[#E91E63] font-semibold hover:underline">Privacy Policy</Link>. If you do not agree to these Terms, you must immediately cease all access and uninstall the application.
              </p>
            </section>

            {/* Section 2 */}
            <section id="accounts" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">2</span>
                <span>User Accounts & Role Hierarchy (RBAC)</span>
              </h2>
              <p>
                Access to SalonTime requires an active registered account provided by an authorized salon administrator. Users are categorized by permission tiers:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>
                  <strong>Salon Administrator (Super Admin / Admin):</strong> Full administrative rights over all branches, billing configuration, financial analytics, invoices, and staff management.
                </li>
                <li>
                  <strong>Branch Manager:</strong> Operational management over appointments, walk-in customers, leads CRM, and assigned branch staff. Managers are strictly prohibited from viewing overall salon billing, financial ledgers, or global business settings.
                </li>
                <li>
                  <strong>Staff Member / Stylist:</strong> Permitted only to view their individual service schedules, assigned customer bookings, and update appointment completion statuses.
                </li>
              </ul>
              <p className="text-xs sm:text-sm text-gray-500 pt-2">
                Users are solely responsible for maintaining the confidentiality of their login credentials and passwords. Any activity conducted under your account credentials remains your responsibility.
              </p>
            </section>

            {/* Section 3 */}
            <section id="salon-responsibilities" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">3</span>
                <span>Salon Operations & Client Bookings</span>
              </h2>
              <p>
                SalonTime functions as a technology facilitator for salon scheduling and business administration. The salon owner or operating entity retains sole responsibility for:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>The physical delivery, quality, health, and hygiene standards of salon and spa treatments performed on clients.</li>
                <li>Ensuring client consent before recording their phone number or booking preferences into the salon CRM.</li>
                <li>Accuracy of service prices, taxes, and discounts applied during in-store billing checkout.</li>
              </ul>
            </section>

            {/* Section 4 */}
            <section id="acceptable-use" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">4</span>
                <span>Acceptable Use & Prohibited Conduct</span>
              </h2>
              <p>You agree not to engage in any of the following prohibited behaviors:</p>
              <ul className="list-disc pl-5 space-y-2 text-sm">
                <li>Attempting to probe, scan, bypass, or circumvent our Role-Based Access Controls (RBAC) to gain unauthorized access to billing or financial endpoints.</li>
                <li>Reverse engineering, decompiling, or disassembling any portion of the SalonTime APK or backend application source code.</li>
                <li>Using automated crawlers, scrapers, or bots to harvest data from our services without prior written consent.</li>
                <li>Transmitting malicious code, viruses, or exploiting vulnerabilities in our cloud infrastructure.</li>
              </ul>
            </section>

            {/* Section 5 */}
            <section id="intellectual-property" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">5</span>
                <span>Intellectual Property Rights</span>
              </h2>
              <p>
                All rights, title, and interest in and to the SalonTime software, trademarks, brand logos, graphical user interfaces, and mobile applications are and will remain the exclusive property of SalonTime. You are granted a limited, non-exclusive, non-transferable license to use the platform solely for legitimate salon business operations.
              </p>
            </section>

            {/* Section 6 */}
            <section id="data-privacy" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">6</span>
                <span>Data Privacy & Security</span>
              </h2>
              <p>
                Our handling of personal information is governed by our <Link href="/privacy-policy" className="text-[#E91E63] font-semibold hover:underline">Privacy Policy</Link>. All data transmitted across SalonTime services is protected using TLS encryption. We maintain strict safeguards to protect salon data and ensure compliance with Google Play Store User Data policies.
              </p>
            </section>

            {/* Section 7 */}
            <section id="limitation" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">7</span>
                <span>Disclaimer of Warranties & Limitation of Liability</span>
              </h2>
              <p>
                SalonTime is provided on an &ldquo;AS IS&rdquo; and &ldquo;AS AVAILABLE&rdquo; basis without warranties of any kind. While we strive for continuous 99.9% service uptime, we do not warrant that operation will be completely uninterrupted or error-free.
              </p>
              <p>
                To the fullest extent permitted by applicable law, SalonTime shall not be liable for any indirect, incidental, punitive, or consequential damages resulting from lost salon appointments, business interruptions, or loss of profits.
              </p>
            </section>

            {/* Section 8 */}
            <section id="termination" className="bg-white rounded-2xl p-6 sm:p-8 border border-pink-200/80 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">8</span>
                <span>Termination & Account Deletion</span>
              </h2>
              <p>
                You may terminate your account at any time by utilizing the in-app Account Deletion feature inside the mobile application or submitting a deletion request through our web portal.
              </p>
              <div className="p-4 rounded-xl bg-pink-50 border border-pink-200 text-xs sm:text-sm text-pink-900 flex items-start gap-2.5">
                <RiAlertLine className="text-base text-[#E91E63] shrink-0 mt-0.5" />
                <div>
                  <strong>Permanent Data Erasure:</strong> Account deletion permanently purges all personal login credentials, push tokens, and user settings. For comprehensive instructions and our direct web deletion tool, please visit our <Link href="/delete-account" className="font-bold underline text-[#E91E63]">Account Deletion Portal</Link>.
                </div>
              </div>
            </section>

            {/* Section 9 */}
            <section id="contact-terms" className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-100 shadow-xs space-y-4">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading flex items-center gap-3">
                <span className="w-8 h-8 rounded-xl bg-pink-100 text-[#E91E63] text-sm font-bold flex items-center justify-center shrink-0">9</span>
                <span>Contact & Legal Inquiries</span>
              </h2>
              <p>
                For questions regarding these Terms of Service or enterprise commercial licensing, please reach out to:
              </p>
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80 space-y-2 text-sm">
                <div className="font-bold text-gray-900">SalonTime Legal & Commercial Office</div>
                <div className="text-gray-600">Email: <a href="mailto:support@salontime.in" className="text-[#E91E63] font-semibold hover:underline">support@salontime.in</a></div>
                <div className="text-gray-600">Website: <a href="https://salontime.in" className="text-[#E91E63] font-semibold hover:underline">https://salontime.in</a></div>
              </div>
            </section>

          </article>
        </div>
      </main>

      <LegalFooter />
    </div>
  );
}
