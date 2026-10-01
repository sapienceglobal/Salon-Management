'use client';

/**
 * Reusable PageHeaderGradient
 * Provides the signature pink-white ambient linear & radial gradient at the top of admin pages,
 * with dark mode plum/burgundy compatibility.
 */
export default function PageHeaderGradient({ className = '', height = 'h-[300px]' }) {
  return (
    <div
      className={`absolute top-0 left-0 right-0 ${height} pointer-events-none z-0 overflow-hidden ${className}`}
      style={{
        maskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
        WebkitMaskImage: 'linear-gradient(to bottom, black 0%, black 50%, transparent 100%)',
      }}
    >
      {/* ========================================================
          LIGHT MODE GRADIENTS (Hidden completely in dark mode)
         ======================================================== */}
      {/* Full-bleed ambient pink-white linear backdrop */}
      <div
        className="dark:hidden absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(255, 235, 243, 0.95) 0%, rgba(255, 242, 247, 0.75) 45%, rgba(255, 248, 252, 0.3) 75%, transparent 100%)',
        }}
      />

      {/* Ambient radial pink aura */}
      <div
        className="dark:hidden absolute top-0 right-0 w-3/4 h-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 70% 65% at 75% 25%, rgba(255, 202, 225, 0.85) 0%, rgba(255, 226, 239, 0.45) 50%, transparent 85%)',
        }}
      />

      {/* ========================================================
          DARK MODE GRADIENTS (Luxury seamless dark aura matching #0f0f1a)
         ======================================================== */}
      {/* Primary vertical dark wash: delicate rose-wine diffusing into dark background */}
      <div
        className="hidden dark:block absolute inset-0 pointer-events-none"
        style={{
          background:
            'linear-gradient(180deg, rgba(233, 30, 99, 0.16) 0%, rgba(194, 24, 91, 0.08) 35%, rgba(15, 15, 26, 0.3) 70%, transparent 100%)',
        }}
      />

      {/* Primary ambient radial aura: top-right glowing rose aura */}
      <div
        className="hidden dark:block absolute top-0 right-0 w-3/4 h-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 65% at 75% 15%, rgba(233, 30, 99, 0.18) 0%, rgba(194, 24, 91, 0.06) 50%, transparent 85%)',
        }}
      />

      {/* Secondary accent radial aura: top-left subtle violet glow for depth */}
      <div
        className="hidden dark:block absolute top-0 left-0 w-1/2 h-full pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 60% 50% at 20% 0%, rgba(168, 85, 247, 0.09) 0%, transparent 75%)',
        }}
      />
    </div>
  );
}
