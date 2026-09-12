/**
 * Application-wide constants and enums.
 * Single source of truth for magic strings.
 */

export const USER_ROLES = Object.freeze({
  SUPER_ADMIN: 'super_admin',
  ADMIN: 'admin',
  MANAGER: 'manager',
  STAFF: 'staff',
  RECEPTIONIST: 'receptionist',
});

/**
 * Role hierarchy — higher index = more permissions.
 * Used by authorize middleware to check access levels.
 */
export const ROLE_HIERARCHY = Object.freeze({
  [USER_ROLES.SUPER_ADMIN]: 5,
  [USER_ROLES.ADMIN]: 4,
  [USER_ROLES.MANAGER]: 3,
  [USER_ROLES.RECEPTIONIST]: 2,
  [USER_ROLES.STAFF]: 1,
});

export const APPOINTMENT_STATUS = Object.freeze({
  PLANNED: 'planned',
  ONGOING: 'ongoing',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  NO_SHOW: 'no_show',
});

export const APPOINTMENT_SOURCE = Object.freeze({
  WALK_IN: 'walk_in',
  PHONE: 'phone',
  ONLINE: 'online',
  APP: 'app',
});

export const INVOICE_STATUS = Object.freeze({
  DRAFT: 'draft',
  PAID: 'paid',
  PARTIAL: 'partial',
  UNPAID: 'unpaid',
  REFUNDED: 'refunded',
  CANCELLED: 'cancelled',
});

export const PAYMENT_METHOD = Object.freeze({
  CASH: 'cash',
  CARD: 'card',
  UPI: 'upi',
  WALLET: 'wallet',
  SPLIT: 'split',
});

export const PAYMENT_STATUS = Object.freeze({
  SUCCESS: 'success',
  FAILED: 'failed',
  PENDING: 'pending',
  REFUNDED: 'refunded',
});

export const ATTENDANCE_STATUS = Object.freeze({
  PRESENT: 'present',
  ABSENT: 'absent',
  HALF_DAY: 'half_day',
  WEEKLY_OFF: 'weekly_off',
  HOLIDAY: 'holiday',
  LEAVE: 'leave',
});

export const LEAD_STATUS = Object.freeze({
  NEW: 'new',
  CONTACTED: 'contacted',
  FOLLOW_UP: 'follow_up',
  CONVERTED: 'converted',
  LOST: 'lost',
});

export const CAMPAIGN_TYPE = Object.freeze({
  SMS: 'sms',
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
});

export const CAMPAIGN_STATUS = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  SENDING: 'sending',
  SENT: 'sent',
  FAILED: 'failed',
});

export const WALLET_TRANSACTION_TYPE = Object.freeze({
  CREDIT: 'credit',
  DEBIT: 'debit',
});

export const REWARD_TRANSACTION_TYPE = Object.freeze({
  EARNED: 'earned',
  REDEEMED: 'redeemed',
  EXPIRED: 'expired',
  BONUS: 'bonus',
});

export const INVOICE_ITEM_TYPE = Object.freeze({
  SERVICE: 'service',
  PRODUCT: 'product',
  PACKAGE: 'package',
  MEMBERSHIP: 'membership',
  PREPAID: 'prepaid',
});

export const MEMBERSHIP_STATUS = Object.freeze({
  ACTIVE: 'active',
  EXPIRED: 'expired',
  CANCELLED: 'cancelled',
});

export const GENDER = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
});

export const CUSTOMER_SOURCE = Object.freeze({
  WALK_IN: 'walk_in',
  REFERRAL: 'referral',
  ONLINE: 'online',
  CAMPAIGN: 'campaign',
});

export const COMMISSION_TYPE = Object.freeze({
  FLAT: 'flat',
  PERCENTAGE: 'percentage',
  TIERED: 'tiered',
});

export const DISCOUNT_TYPE = Object.freeze({
  FLAT: 'flat',
  PERCENTAGE: 'percentage',
});

export const AUDIT_ACTIONS = Object.freeze({
  CREATE: 'CREATE',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
});

// Pagination defaults
export const PAGINATION = Object.freeze({
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
});
