import React from 'react';
import Link from 'next/link';
import { RiArrowUpLine, RiArrowDownLine, RiArrowRightSLine } from 'react-icons/ri';

export default function StatCard({
  icon: Icon,
  label,
  value,
  color = "bg-brand/15 text-brand",
  trend,
  up,
  loading = false,
  delay = "0s",
  href,
}) {
  const CardContent = (
    <div
      className={`bg-admin-card border border-admin-border rounded-2xl p-5 flex items-center gap-4 hover:border-admin-border-light hover:-translate-y-0.5 hover:shadow-[0_8px_25px_rgba(0,0,0,0.3)] transition-all duration-150 animate-[fadeIn_0.5s_ease_forwards] h-full ${href ? 'cursor-pointer' : ''}`}
      style={{ animationDelay: delay }}
    >
      <div className={`w-[52px] h-[52px] rounded-[10px] flex items-center justify-center text-2xl shrink-0 ${color}`}>
        {Icon && <Icon />}
      </div>
      <div className="flex-1">
        <div className="text-[0.8rem] text-admin-text-secondary mb-1">{label}</div>
        <div className="font-heading text-2xl font-bold">{loading ? '-' : value}</div>
        {trend && (
          <div className={`text-xs mt-1 flex items-center gap-1 ${up ? 'text-accent-green' : 'text-admin-text-muted'}`}>
            {up ? <RiArrowUpLine /> : <RiArrowDownLine />} {trend}
          </div>
        )}
      </div>
      {href ? (
        <button className="text-xl text-admin-text-muted p-1.5 rounded-full hover:bg-admin-surface-hover hover:text-admin-text transition-all duration-150">
          <RiArrowRightSLine />
        </button>
      ) : (
        <div className="w-8 h-8"></div> // Spacer
      )}
    </div>
  );

  if (href) {
    return <Link href={href} className="block h-full">{CardContent}</Link>;
  }

  return CardContent;
}
