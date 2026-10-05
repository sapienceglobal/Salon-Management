/* eslint-disable @next/next/no-img-element */
'use client';

import { useState } from 'react';
import {
  RiScissors2Line,
  RiScissorsLine,
  RiBrushLine,
  RiMagicLine,
  RiSparklingLine,
  RiStarSmileLine,
  RiUserStarLine,
  RiFlowerLine,
  RiUserSmileLine,
  RiPaletteLine,
  RiDropLine,
  RiHandHeartLine,
  RiVipCrownLine,
  RiHeart3Line,
  RiUser3Line,
  RiCustomerService2Line,
} from 'react-icons/ri';
import { MdFace2, MdFace6 } from 'react-icons/md';
import { getImageUrl } from '@/lib/utils';

// ==========================================
// 1. STAFF PRESETS & ICONS
// ==========================================
export const PRESET_STAFF_AVATARS = [];

export const PRESET_STAFF_ICONS = [
  { id: 'icon_female', name: 'Female (DP)', icon: MdFace2, color: '#EC4899' },
  { id: 'icon_male', name: 'Male (DP)', icon: MdFace6, color: '#3B82F6' },
  { id: 'icon_scissors', name: 'Hair Specialist', icon: RiScissors2Line, color: '#E91E63' },
  { id: 'icon_brush', name: 'Makeup Artist', icon: RiBrushLine, color: '#9C27B0' },
  { id: 'icon_magic', name: 'Color Expert', icon: RiMagicLine, color: '#3F51B5' },
  { id: 'icon_spa', name: 'Spa Therapist', icon: RiSparklingLine, color: '#009688' },
  { id: 'icon_star', name: 'Top Stylist', icon: RiStarSmileLine, color: '#F59E0B' },
  { id: 'icon_manager', name: 'Manager / Front Desk', icon: RiUserStarLine, color: '#10B981' },
];

// ==========================================
// 2. CUSTOMER PRESETS & ICONS
// ==========================================
export const PRESET_CUSTOMER_AVATARS = [];

export const PRESET_CUSTOMER_ICONS = [
  { id: 'cust_female', name: 'Female (DP)', icon: MdFace2, color: '#EC4899' },
  { id: 'cust_male', name: 'Male (DP)', icon: MdFace6, color: '#3B82F6' },
  { id: 'cust_smile', name: 'Happy Client', icon: RiUserSmileLine, color: '#E91E63' },
  { id: 'cust_crown', name: 'VIP Elite Member', icon: RiVipCrownLine, color: '#F59E0B' },
  { id: 'cust_heart', name: 'Loyal Customer', icon: RiHeart3Line, color: '#EC4899' },
  { id: 'cust_star', name: 'Preferred Guest', icon: RiStarSmileLine, color: '#8B5CF6' },
  { id: 'cust_sparkle', name: 'New / Glow Up', icon: RiSparklingLine, color: '#06B6D4' },
  { id: 'cust_user', name: 'Walk-In Guest', icon: RiUser3Line, color: '#10B981' },
];

// ==========================================
// 3. SERVICE PRESETS & ICONS
// ==========================================
export const PRESET_SERVICE_IMAGES = [
  { id: 'men', name: 'Men Haircut', url: '/service_men_haircut.png' },
  { id: 'women', name: 'Women Haircut', url: '/service_women_haircut.png' },
  { id: 'spa', name: 'Hair Spa', url: '/service_hair_spa.png' },
  { id: 'keratin', name: 'Keratin', url: '/service_keratin.png' },
];

export const PRESET_SERVICE_ICONS = [
  { id: 'scissors', name: 'Haircut', icon: RiScissorsLine, color: '#EC4899' },
  { id: 'sparkles', name: 'Glow / Style', icon: RiSparklingLine, color: '#F59E0B' },
  { id: 'spa', name: 'Spa / Flora', icon: RiFlowerLine, color: '#10B981' },
  { id: 'facial', name: 'Facial / Skin', icon: RiUserSmileLine, color: '#06B6D4' },
  { id: 'makeup', name: 'Makeup / Art', icon: RiPaletteLine, color: '#8B5CF6' },
  { id: 'treatment', name: 'Treatment', icon: RiDropLine, color: '#3B82F6' },
  { id: 'care', name: 'Care / Nails', icon: RiHandHeartLine, color: '#EC4899' },
  { id: 'premium', name: 'VIP / Bridal', icon: RiVipCrownLine, color: '#EAB308' },
  { id: 'brush', name: 'Color / Dye', icon: RiBrushLine, color: '#9333EA' },
  { id: 'magic', name: 'Special', icon: RiMagicLine, color: '#6366F1' },
];

// Master lookup map for any icon identifier
const ALL_ICONS_MAP = {
  // Staff
  icon_female: { icon: MdFace2, color: '#EC4899' },
  icon_male: { icon: MdFace6, color: '#3B82F6' },
  icon_scissors: { icon: RiScissors2Line, color: '#E91E63' },
  icon_brush: { icon: RiBrushLine, color: '#9C27B0' },
  icon_magic: { icon: RiMagicLine, color: '#3F51B5' },
  icon_spa: { icon: RiSparklingLine, color: '#009688' },
  icon_star: { icon: RiStarSmileLine, color: '#F59E0B' },
  icon_manager: { icon: RiUserStarLine, color: '#10B981' },

  // Customers
  cust_female: { icon: MdFace2, color: '#EC4899' },
  cust_male: { icon: MdFace6, color: '#3B82F6' },
  cust_smile: { icon: RiUserSmileLine, color: '#E91E63' },
  cust_crown: { icon: RiVipCrownLine, color: '#F59E0B' },
  cust_heart: { icon: RiHeart3Line, color: '#EC4899' },
  cust_star: { icon: RiStarSmileLine, color: '#8B5CF6' },
  cust_sparkle: { icon: RiSparklingLine, color: '#06B6D4' },
  cust_user: { icon: RiUser3Line, color: '#10B981' },

  // Services
  scissors: { icon: RiScissorsLine, color: '#EC4899' },
  sparkles: { icon: RiSparklingLine, color: '#F59E0B' },
  spa: { icon: RiFlowerLine, color: '#10B981' },
  facial: { icon: RiUserSmileLine, color: '#06B6D4' },
  makeup: { icon: RiPaletteLine, color: '#8B5CF6' },
  treatment: { icon: RiDropLine, color: '#3B82F6' },
  care: { icon: RiHandHeartLine, color: '#EC4899' },
  premium: { icon: RiVipCrownLine, color: '#EAB308' },
  brush: { icon: RiBrushLine, color: '#9333EA' },
  magic: { icon: RiMagicLine, color: '#6366F1' },
};

/**
 * Size presets for consistent dimensions & icon scaling
 */
const SIZE_CLASSES = {
  xs: { box: 'w-6 h-6 text-xs', text: 'text-[9px]' },
  sm: { box: 'w-8 h-8 text-sm', text: 'text-[11px]' },
  md: { box: 'w-10 h-10 text-base', text: 'text-xs' },
  lg: { box: 'w-12 h-12 text-xl', text: 'text-sm' },
  xl: { box: 'w-14 h-14 text-2xl', text: 'text-base' },
  '2xl': { box: 'w-16 h-16 text-3xl', text: 'text-lg' },
};

export default function VisualAvatar({
  image,
  icon,
  color,
  name = '',
  type = 'staff', // 'staff' | 'customer' | 'service'
  size = 'md',
  shape = 'circle', // 'circle' | 'rounded' | 'square'
  className = '',
  alt = '',
  badge = null,
}) {
  const [imgError, setImgError] = useState(false);

  // Normalize image and icon inputs
  const rawImage = typeof image === 'string' ? image.trim() : '';
  const isIconPrefix = rawImage.startsWith('icon:');
  const iconId = isIconPrefix ? rawImage.replace('icon:', '').trim() : (icon || '');
  const isPhysicalImage = Boolean(rawImage && !isIconPrefix);

  const matchedIconMeta = iconId ? ALL_ICONS_MAP[iconId] : null;
  const IconComponent = matchedIconMeta?.icon || (type === 'service' ? RiScissorsLine : type === 'customer' ? RiUserSmileLine : RiUserStarLine);
  const effectiveColor = color || matchedIconMeta?.color || (type === 'service' ? '#EC4899' : '#E91E63');

  // Calculate shape class
  const shapeClass =
    shape === 'circle'
      ? 'rounded-full'
      : shape === 'rounded'
      ? size === 'xl' || size === '2xl'
        ? 'rounded-2xl'
        : 'rounded-xl'
      : 'rounded-lg';

  const sizeMeta = SIZE_CLASSES[size] || SIZE_CLASSES.md;

  // Extract initials
  const initials = (() => {
    if (!name) return type === 'service' ? 'S' : type === 'customer' ? 'C' : 'S';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
  })();

  // 1. If it's explicitly an icon representation
  if (iconId || isIconPrefix) {
    return (
      <div className="relative inline-block shrink-0">
        <div
          style={{
            backgroundColor: `${effectiveColor}18`,
            color: effectiveColor,
            borderColor: `${effectiveColor}35`,
          }}
          className={`${sizeMeta.box} ${shapeClass} flex items-center justify-center shrink-0 border shadow-xs transition-transform duration-200 select-none ${className}`}
          title={name || alt}
        >
          <IconComponent />
        </div>
        {badge}
      </div>
    );
  }

  // 2. If it has a physical image URL and hasn't errored
  if (isPhysicalImage && !imgError) {
    const finalUrl = getImageUrl(rawImage);
    return (
      <div className="relative inline-block shrink-0">
        <img
          src={finalUrl}
          alt={alt || name || 'Avatar'}
          onError={() => setImgError(true)}
          className={`${sizeMeta.box} ${shapeClass} object-cover shrink-0 border border-gray-100 dark:border-white/10 shadow-xs transition-transform duration-200 ${className}`}
        />
        {badge}
      </div>
    );
  }

  // 3. Fallback: initials badge with entity color
  return (
    <div className="relative inline-block shrink-0">
      <div
        style={{
          backgroundColor: effectiveColor,
        }}
        className={`${sizeMeta.box} ${shapeClass} flex items-center justify-center font-bold text-white shadow-xs shrink-0 select-none tracking-tight ${sizeMeta.text} ${className}`}
        title={name || alt}
      >
        {initials}
      </div>
      {badge}
    </div>
  );
}
