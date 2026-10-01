'use client';

import PageHeaderGradient from '@/components/admin/common/PageHeaderGradient';

export default function MarketingPage() {
  return (
    <div className="relative min-h-[calc(100vh-120px)] -mx-6 -mt-6 p-6 overflow-hidden">
      <PageHeaderGradient height="h-[220px]" />
      <div className="relative z-10">
        <h1 className="font-heading text-2xl sm:text-[1.75rem] font-bold text-gray-900 dark:text-white mb-2">Marketing</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">Campaigns, leads, offers & promotions.</p>
      </div>
    </div>
  );
}
