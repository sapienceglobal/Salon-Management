import Link from 'next/link';
import Image from 'next/image';
import { 
  RiShieldCheckLine, 
  RiLockPasswordLine, 
  RiCloudLine,
  RiMailLine,
  RiCustomerService2Line,
  RiGooglePlayLine
} from 'react-icons/ri';

export default function LegalFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="w-full bg-[#0F1424] text-gray-300 border-t border-gray-800/80 pt-14 pb-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Top Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 lg:gap-12 pb-12 border-b border-gray-800">
          
          {/* Col 1: Brand Info */}
          <div className="md:col-span-2 space-y-4">
            <div className="relative h-10 w-44">
              <Image
                src="/salontime-brand-logo-dark.png"
                alt="SalonTime Logo"
                fill
                className="object-contain object-left"
              />
            </div>
            <p className="text-sm text-gray-400 max-w-md leading-relaxed">
              SalonTime is an enterprise-grade salon and spa management platform empowering salons, stylists, and managers with real-time appointments, staff scheduling, client CRM, inventory control, and business analytics.
            </p>
            <div className="flex flex-wrap items-center gap-4 pt-1">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-pink-950/40 border border-pink-700/40 text-pink-300 text-xs font-medium">
                <RiGooglePlayLine className="text-base text-pink-400" />
                <span>Google Play Certified Compliance</span>
              </div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-700/40 text-emerald-300 text-xs font-medium">
                <RiShieldCheckLine className="text-base text-emerald-400" />
                <span>256-bit TLS Data Encryption</span>
              </div>
            </div>
          </div>

          {/* Col 2: Legal & Governance */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Legal & Policies
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link 
                  href="/privacy-policy" 
                  className="hover:text-pink-400 transition-colors inline-block"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link 
                  href="/terms" 
                  className="hover:text-pink-400 transition-colors inline-block"
                >
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link 
                  href="/delete-account" 
                  className="text-pink-400 hover:text-pink-300 font-semibold transition-colors inline-block"
                >
                  Delete Account & Data
                </Link>
              </li>
              <li>
                <Link 
                  href="/login" 
                  className="hover:text-pink-400 transition-colors inline-block"
                >
                  Staff Login Portal
                </Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Support & Contact */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">
              Compliance & Support
            </h4>
            <p className="text-xs text-gray-400 leading-relaxed">
              For privacy inquiries, data deletion verifications, or compliance requests:
            </p>
            <div className="space-y-2 text-sm pt-1">
              <a 
                href="mailto:support@salontime.in" 
                className="flex items-center gap-2 text-pink-400 hover:text-pink-300 transition-colors"
              >
                <RiMailLine className="text-base shrink-0" />
                <span>support@salontime.in</span>
              </a>
              <div className="flex items-center gap-2 text-gray-400 text-xs">
                <RiCustomerService2Line className="text-base shrink-0 text-gray-500" />
                <span>Mon – Sat: 9:00 AM – 7:00 PM IST</span>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-gray-400">
          <p>
            &copy; {currentYear} SalonTime. All rights reserved. Built for professional salon & spa enterprises.
          </p>
          <div className="flex items-center gap-6">
            <Link href="/privacy-policy" className="hover:text-white transition-colors">Privacy</Link>
            <span className="text-gray-700">&bull;</span>
            <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
            <span className="text-gray-700">&bull;</span>
            <Link href="/delete-account" className="hover:text-white transition-colors">Data Deletion</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
