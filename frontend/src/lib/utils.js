import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

/**
 * Format currency in INR
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount || 0);
}

/**
 * Format date to readable string
 */
export function formatDate(dateStr) {
  if (!dateStr) return '—';
  const date = typeof dateStr === 'string' ? parseISO(dateStr) : dateStr;
  if (isToday(date)) return 'Today';
  if (isTomorrow(date)) return 'Tomorrow';
  return format(date, 'dd MMM yyyy');
}

/**
 * Format time to 12-hour format
 */
export function formatTime(timeStr) {
  if (!timeStr) return '—';
  const [hours, minutes] = timeStr.split(':');
  const h = parseInt(hours, 10);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${minutes} ${ampm}`;
}

/**
 * Relative time (e.g., "2 hours ago")
 */
export function timeAgo(dateStr) {
  if (!dateStr) return '';
  return formatDistanceToNow(parseISO(dateStr), { addSuffix: true });
}

/**
 * Get greeting based on time of day
 */
export function getGreeting() {
  const hour = new Date().getHours();
  if (hour >= 4 && hour < 12) return 'Good Morning';
  if (hour >= 12 && hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

/**
 * Generate initials from a name
 */
export function getInitials(firstName, lastName) {
  return `${(firstName || '')[0] || ''}${(lastName || '')[0] || ''}`.toUpperCase();
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text, maxLength = 50) {
  if (!text || text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
}

/**
 * CN — class name combiner
 */
export function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

/**
 * Safely parse specializations or any JSON / comma-separated array
 */
export function parseSpecializations(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) return parsed;
      if (typeof parsed === 'string') {
        return parsed.split(',').map(s => s.trim()).filter(Boolean);
      }
      return [];
    } catch {
      // Handles plain text, comma-separated strings, or malformed JSON like "hchuf"
      return trimmed.split(',').map(s => s.trim()).filter(Boolean);
    }
  }
  return [];
}

/**
 * Safely format an image or document URL.
 * Handles local backend uploads, remote HTTP/HTTPS URLs, blob previews, and public fallback assets.
 * Seamlessly resolves images across local development and VPS (Hostinger) production hosting.
 *
 * @param {string} path - Image path, relative URL, or full URL
 * @param {string} [fallback=''] - Fallback path if empty
 * @returns {string} Fully resolved and safe URL
 */
export function getImageUrl(path, fallback = '') {
  if (!path || typeof path !== 'string') return fallback;
  const trimmed = path.trim();
  if (!trimmed) return fallback;

  // Blob or Data URLs (used for instant preview during file selection)
  if (trimmed.startsWith('blob:') || trimmed.startsWith('data:')) {
    return trimmed;
  }

  // Remote external URLs
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  // Ensure leading slash
  const cleanPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;

  // If it's a backend upload
  if (cleanPath.startsWith('/uploads/')) {
    const backendOrigin = process.env.NEXT_PUBLIC_BACKEND_URL;
    if (backendOrigin && typeof window !== 'undefined' && !backendOrigin.includes(window.location.host)) {
      return `${backendOrigin.replace(/\/+$/, '')}${cleanPath}`;
    }
    return cleanPath;
  }

  return cleanPath;
}
