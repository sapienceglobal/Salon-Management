'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { 
  RiShieldCheckLine, 
  RiFileTextLine, 
  RiDeleteBin7Line, 
  RiArrowRightLine, 
  RiMenu4Line, 
  RiCloseLine,
  RiExternalLinkLine
} from 'react-icons/ri';

const NAV_LINKS = [
  { href: '/privacy-policy', label: 'Privacy Policy', icon: RiShieldCheckLine },
  { href: '/terms', label: 'Terms of Service', icon: RiFileTextLine },
  { href: '/delete-account', label: 'Delete Account', icon: RiDeleteBin7Line },
];

export default function LegalHeader() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="relative h-10 w-44 sm:w-48 transition-transform group-hover:scale-[1.02]">
            <Image
              src="/salontime-brand-logo.png"
              alt="SalonTime Logo"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 lg:gap-2">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-pink-50 text-[#E91E63] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                }`}
              >
                <Icon className={`text-base ${isActive ? 'text-[#E91E63]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Action Button: Staff Login */}
        <div className="hidden md:flex items-center gap-3">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-bold bg-[#E91E63] hover:bg-[#d81557] text-white shadow-sm shadow-pink-500/20 hover:shadow-md transition-all active:scale-[0.98]"
          >
            <span>Staff Login</span>
            <RiArrowRightLine className="text-sm" />
          </Link>
        </div>

        {/* Mobile Hamburger Button */}
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="md:hidden p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-colors"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <RiCloseLine size={24} /> : <RiMenu4Line size={24} />}
        </button>
      </div>

      {/* Mobile Drawer / Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white/98 backdrop-blur-lg px-4 pt-3 pb-5 space-y-2 animate-[fadeIn_0.2s_ease-out]">
          {NAV_LINKS.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-colors ${
                  isActive
                    ? 'bg-pink-50 text-[#E91E63]'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Icon className={`text-lg ${isActive ? 'text-[#E91E63]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </Link>
            );
          })}

          <div className="pt-2 border-t border-gray-100 mt-2">
            <Link
              href="/login"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-bold bg-[#E91E63] text-white shadow-sm"
            >
              <span>Staff Login</span>
              <RiArrowRightLine className="text-sm" />
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
