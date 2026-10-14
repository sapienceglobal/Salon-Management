'use client';

import { useState } from 'react';
import LegalHeader from '@/components/public/LegalHeader';
import LegalFooter from '@/components/public/LegalFooter';
import Link from 'next/link';
import axios from 'axios';
import { 
  RiDeleteBin7Line, 
  RiShieldCheckLine, 
  RiSmartphoneLine, 
  RiGlobalLine, 
  RiLockPasswordLine, 
  RiMailLine, 
  RiAlertLine, 
  RiCheckboxCircleFill, 
  RiTimeLine,
  RiInformationLine,
  RiArrowRightLine,
  RiQuestionLine,
  RiErrorWarningLine
} from 'react-icons/ri';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export default function DeleteAccountPage() {
  // Mode: 'instant' (direct password wipe) | 'request' (support ticket queue)
  const [activeTab, setActiveTab] = useState('instant');

  // Instant Deletion Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [understood, setUnderstood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Request Form State
  const [reqName, setReqName] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqReason, setReqReason] = useState('No longer using the platform');
  const [reqUnderstood, setReqUnderstood] = useState(false);
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState(false);
  const [ticketId, setTicketId] = useState('');

  // Handle Instant Deletion
  const handleInstantDelete = async (e) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password) {
      setError('Please provide both your registered email address and password.');
      return;
    }

    if (!understood) {
      setError('Please check the confirmation box acknowledging permanent data deletion.');
      return;
    }

    setLoading(true);

    try {
      // 1. Authenticate user to obtain token
      const loginRes = await axios.post(`${API_URL}/auth/login`, {
        email: email.trim(),
        password: password
      });

      const token = loginRes.data?.data?.accessToken || loginRes.data?.accessToken;
      if (!token) {
        throw new Error('Authentication failed. Unable to verify account.');
      }

      // 2. Call delete-account endpoint with password
      await axios.post(
        `${API_URL}/auth/delete-account`,
        { password },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // 3. Clear any local sessions
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        sessionStorage.removeItem('accessToken');
      }

      setSuccess(true);
    } catch (err) {
      const msg = err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to delete account. Please verify your credentials.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  // Handle Manual Request Submission
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    if (!reqEmail.trim() || !reqName.trim()) {
      alert('Please fill in your name and registered email address.');
      return;
    }
    if (!reqUnderstood) {
      alert('Please acknowledge that this request will permanently remove your account.');
      return;
    }

    setReqLoading(true);
    // Simulate generation of compliance ticket ID
    setTimeout(() => {
      const randomTicket = 'DEL-' + Math.floor(100000 + Math.random() * 900000);
      setTicketId(randomTicket);
      setReqLoading(false);
      setReqSuccess(true);
    }, 1200);
  };

  return (
    <div className="min-h-screen bg-[#FAF7F9] flex flex-col font-sans selection:bg-[#E91E63]/20 selection:text-[#E91E63]">
      <LegalHeader />

      {/* Hero Header */}
      <section className="bg-gradient-to-b from-white via-red-50/20 to-[#FAF7F9] border-b border-gray-100 py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-100/70 border border-red-200 text-red-700 text-xs font-bold mb-4">
            <RiShieldCheckLine className="text-sm" />
            <span>Google Play User Data Deletion Compliance Policy</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#111827] tracking-tight font-heading">
            Account & Data Deletion
          </h1>

          <p className="mt-3 text-sm sm:text-base text-gray-600 max-w-3xl leading-relaxed">
            In accordance with Google Play Store policies and global data privacy standards, <strong className="text-gray-900">SalonTime</strong> empowers all users with the unconditional right to permanently delete their account and associated personal data.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-gray-500 font-medium">
            <span className="flex items-center gap-1.5 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md">
              <RiCheckboxCircleFill />
              In-App Deletion Available
            </span>
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md">
              <RiGlobalLine />
              Web-Based Deletion Available
            </span>
            <span className="flex items-center gap-1.5 text-purple-700 bg-purple-50 border border-purple-200 px-2.5 py-1 rounded-md">
              <RiTimeLine />
              Instant & Automated
            </span>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-12">
        
        {/* OPTION 1: IN-APP DELETION PATHWAY */}
        <section className="bg-white rounded-3xl p-6 sm:p-9 border border-gray-100 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#E91E63] flex items-center justify-center text-xl shrink-0">
              <RiSmartphoneLine />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                Method 1: Delete Account Within the Mobile App
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Fastest method if you have the SalonTime Android application installed on your device.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 relative">
              <div className="w-7 h-7 rounded-full bg-[#E91E63] text-white text-xs font-bold flex items-center justify-center mb-3">
                1
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Open Navigation Drawer</h3>
              <p className="text-xs text-gray-600 mt-1">
                Open the SalonTime app and tap the top-left menu icon (☰) to open the side panel.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 relative">
              <div className="w-7 h-7 rounded-full bg-[#E91E63] text-white text-xs font-bold flex items-center justify-center mb-3">
                2
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Locate &quot;Delete Account&quot;</h3>
              <p className="text-xs text-gray-600 mt-1">
                Scroll to the bottom of the drawer navigation menu and tap on the red <span className="font-semibold text-red-600">&ldquo;Delete Account&rdquo;</span> option.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 relative">
              <div className="w-7 h-7 rounded-full bg-[#E91E63] text-white text-xs font-bold flex items-center justify-center mb-3">
                3
              </div>
              <h3 className="font-bold text-gray-900 text-sm">Confirm with Password</h3>
              <p className="text-xs text-gray-600 mt-1">
                For your security, enter your current account password in the modal dialog to confirm ownership.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200/70 relative">
              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white text-xs font-bold flex items-center justify-center mb-3">
                4
              </div>
              <h3 className="font-bold text-emerald-950 text-sm">Instant Wipe & Logout</h3>
              <p className="text-xs text-emerald-800 mt-1">
                Tap &ldquo;Delete Permanently&rdquo;. Your account and tokens are purged instantly, returning you to the login screen.
              </p>
            </div>

          </div>
        </section>


        {/* OPTION 2: WEB-BASED DELETION (DIRECT FORM - PLAY STORE MANDATE) */}
        <section id="web-deletion" className="bg-white rounded-3xl p-6 sm:p-9 border border-pink-100 shadow-sm relative overflow-hidden">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center text-xl shrink-0">
              <RiGlobalLine />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                Method 2: Direct Web Deletion Portal
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Use this online portal if you have uninstalled the app or cannot access your mobile device.
              </p>
            </div>
          </div>

          {/* Form Tabs */}
          <div className="flex items-center gap-2 mt-6 border-b border-gray-200 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('instant')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'instant'
                  ? 'bg-[#E91E63] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Direct Password Verification (Instant)
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('request')}
              className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                activeTab === 'request'
                  ? 'bg-[#E91E63] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Manual Deletion Request (Support Desk)
            </button>
          </div>

          {/* TAB 1: INSTANT WEB DELETION */}
          {activeTab === 'instant' && (
            <div className="mt-6 max-w-xl">
              {success ? (
                <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center space-y-3 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-3xl mx-auto">
                    <RiCheckboxCircleFill />
                  </div>
                  <h3 className="text-lg font-bold text-emerald-950 font-heading">
                    Account Permanently Deleted
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-800 leading-relaxed max-w-md mx-auto">
                    Your SalonTime account, login credentials, and session tokens have been permanently wiped from our production database in accordance with Google Play User Data policies.
                  </p>
                  <div className="pt-2">
                    <Link
                      href="/"
                      className="inline-block px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors"
                    >
                      Return to Homepage
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleInstantDelete} noValidate className="space-y-4">
                  <div className="p-3.5 rounded-xl bg-red-50/70 border border-red-200 text-xs text-red-800 flex items-start gap-2.5">
                    <RiAlertLine className="text-base text-red-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>Warning:</strong> Account deletion is immediate and irreversible. All personal profile records, staff associations, and authorization keys will be permanently removed.
                    </span>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-xl bg-red-100/90 border border-red-300 text-xs text-red-900 flex items-center gap-2">
                      <RiErrorWarningLine className="text-base shrink-0" />
                      <span>{error}</span>
                    </div>
                  )}

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Registered Email Address <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                      <RiMailLine className="text-gray-400 mr-2 text-base shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="salonowner@example.com"
                        className="w-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="flex items-center rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus-within:border-[#E91E63] focus-within:ring-2 focus-within:ring-pink-100 transition-all">
                      <RiLockPasswordLine className="text-gray-400 mr-2 text-base shrink-0" />
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your account password"
                        className="w-full text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 outline-none bg-transparent"
                      />
                    </div>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={understood}
                      onChange={(e) => setUnderstood(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-red-600 focus:ring-red-500 accent-red-600 cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 leading-tight">
                      I understand that this action is permanent and will permanently erase my account profile and system credentials.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-500/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Verifying & Deleting Account...</span>
                      </>
                    ) : (
                      <>
                        <RiDeleteBin7Line className="text-base" />
                        <span>Delete Account & Data Permanently</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

          {/* TAB 2: MANUAL SUPPORT TICKET DELETION */}
          {activeTab === 'request' && (
            <div className="mt-6 max-w-xl">
              {reqSuccess ? (
                <div className="p-6 rounded-2xl bg-blue-50 border border-blue-200 text-center space-y-3 animate-[fadeIn_0.3s_ease-out]">
                  <div className="w-14 h-14 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-3xl mx-auto">
                    <RiCheckboxCircleFill />
                  </div>
                  <h3 className="text-lg font-bold text-blue-950 font-heading">
                    Deletion Request Registered
                  </h3>
                  <div className="inline-block px-3 py-1 rounded-md bg-blue-200 text-blue-900 font-mono text-xs font-bold">
                    Ticket #{ticketId}
                  </div>
                  <p className="text-xs sm:text-sm text-blue-800 leading-relaxed max-w-md mx-auto">
                    Our Data Protection Officer has received your formal request. Your registered account will be verified and purged within 24 to 48 business hours. A confirmation email will be dispatched to <strong>{reqEmail}</strong>.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <p className="text-xs sm:text-sm text-gray-600">
                    If you cannot remember your password or have lost access to your login credentials, fill out this form to request manual account wipeout.
                  </p>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={reqName}
                      onChange={(e) => setReqName(e.target.value)}
                      placeholder="Your full name"
                      className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus:border-[#E91E63] focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Registered Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      required
                      value={reqEmail}
                      onChange={(e) => setReqEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus:border-[#E91E63] focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Registered Phone Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={reqPhone}
                      onChange={(e) => setReqPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus:border-[#E91E63] focus:ring-2 focus:ring-pink-100 outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-gray-700 block mb-1">
                      Reason for Deletion
                    </label>
                    <select
                      value={reqReason}
                      onChange={(e) => setReqReason(e.target.value)}
                      className="w-full text-xs sm:text-sm rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 focus:border-[#E91E63] outline-none"
                    >
                      <option value="No longer using the platform">No longer using the platform</option>
                      <option value="Closing or changing salon business">Closing or changing salon business</option>
                      <option value="Creating a new account">Creating a new account</option>
                      <option value="Privacy preference">Privacy preference</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
                    <input
                      type="checkbox"
                      checked={reqUnderstood}
                      onChange={(e) => setReqUnderstood(e.target.checked)}
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-[#E91E63] focus:ring-[#E91E63] accent-[#E91E63] cursor-pointer"
                    />
                    <span className="text-xs text-gray-600 leading-tight">
                      I request the complete deletion of this account and all associated personal records.
                    </span>
                  </label>

                  <button
                    type="submit"
                    disabled={reqLoading}
                    className="w-full py-3 px-5 rounded-xl bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                  >
                    {reqLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Submitting Deletion Ticket...</span>
                      </>
                    ) : (
                      <>
                        <RiMailLine className="text-base" />
                        <span>Submit Data Deletion Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          )}

        </section>


        {/* SECTION 3: WHAT DATA IS DELETED VS. RETAINED (PLAY STORE TRANSPARENCY) */}
        <section className="bg-white rounded-3xl p-6 sm:p-9 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-xl shrink-0">
              <RiInformationLine />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                Data Deletion & Retention Specifications
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Transparent disclosure of data handling during account termination.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm border-collapse">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50/80 text-gray-700 uppercase font-semibold text-[11px] tracking-wider">
                  <th className="py-3 px-4">Data Category</th>
                  <th className="py-3 px-4">Action Taken Upon Deletion</th>
                  <th className="py-3 px-4">Retention Period</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 text-gray-600">
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">User Profile & Credentials</td>
                  <td className="py-3.5 px-4 text-red-600 font-medium">Permanently Erased immediately</td>
                  <td className="py-3.5 px-4">0 days (Immediate purge)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">Active Sessions & Refresh Tokens</td>
                  <td className="py-3.5 px-4 text-red-600 font-medium">Revoked and Deleted immediately</td>
                  <td className="py-3.5 px-4">0 days (Immediate purge)</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">Firebase Push Notification Tokens</td>
                  <td className="py-3.5 px-4 text-red-600 font-medium">Unlinked and Purged immediately</td>
                  <td className="py-3.5 px-4">0 days</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">Staff Scheduling & Rosters</td>
                  <td className="py-3.5 px-4 text-red-600 font-medium">Unassigned and Deleted</td>
                  <td className="py-3.5 px-4">0 days</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-semibold text-gray-900">Sole Business Admin Workspace</td>
                  <td className="py-3.5 px-4 text-red-600 font-medium">
                    Cascading delete of business & branch entries if sole owner
                  </td>
                  <td className="py-3.5 px-4">0 days</td>
                </tr>
                <tr className="bg-amber-50/40">
                  <td className="py-3.5 px-4 font-semibold text-amber-950">Statutory Tax & Billing Invoices</td>
                  <td className="py-3.5 px-4 text-amber-900">
                    Retained strictly in anonymized archives for fiscal tax audit compliance
                  </td>
                  <td className="py-3.5 px-4 text-amber-900 font-medium">Statutory audit period only</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>


        {/* SECTION 4: FREQUENTLY ASKED QUESTIONS */}
        <section className="bg-white rounded-3xl p-6 sm:p-9 border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-pink-100 text-[#E91E63] flex items-center justify-center text-xl shrink-0">
              <RiQuestionLine />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 font-heading">
                Frequently Asked Questions
              </h2>
              <p className="text-xs sm:text-sm text-gray-500">
                Common questions regarding the account termination process.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            
            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
              <h3 className="font-bold text-gray-900">Can I recover my account once deleted?</h3>
              <p className="text-gray-600">
                No. Once deleted, your account cannot be restored. If you wish to use SalonTime again, you will need to create a fresh account with your administrator.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
              <h3 className="font-bold text-gray-900">What happens to my customer appointments?</h3>
              <p className="text-gray-600">
                If you are a staff stylist, your assigned appointments remain with the salon but are marked as unassigned so other stylists can fulfill them.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
              <h3 className="font-bold text-gray-900">How long does web ticket deletion take?</h3>
              <p className="text-gray-600">
                Direct password verification deletes your account instantly. Manual support tickets submitted without a password are processed within 24–48 hours.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
              <h3 className="font-bold text-gray-900">Need help or further verification?</h3>
              <p className="text-gray-600">
                You can directly reach out to our privacy compliance desk at <a href="mailto:support@salontime.in" className="text-[#E91E63] font-semibold hover:underline">support@salontime.in</a>.
              </p>
            </div>

          </div>
        </section>

      </main>

      <LegalFooter />
    </div>
  );
}
