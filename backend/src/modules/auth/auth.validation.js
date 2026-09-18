import { z } from 'zod';

/**
 * Zod validation schemas for Auth module.
 * Every field is strictly validated before reaching the controller.
 */

// Strong password policy
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export const registerSchema = {
  body: z.object({
    business_name: z.string().min(2, 'Business name must be at least 2 characters').max(255),
    first_name: z.string().min(1, 'First name is required').max(100),
    last_name: z.string().max(100).optional(),
    email: z.string().email('Invalid email format').max(255),
    password: passwordSchema,
    phone: z.string().min(10).max(20).optional(),
  }),
};

export const loginSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    password: z.string().min(1, 'Password is required'),
    rememberMe: z.boolean().optional().default(false),
  }),
};

export const forgotPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
  }),
};

export const verifyOtpSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    otp: z.string().length(6, 'OTP must be exactly 6 digits'),
  }),
};

export const resetPasswordSchema = {
  body: z.object({
    email: z.string().email('Invalid email format'),
    token: z.string().length(6, 'OTP must be exactly 6 digits'),
    password: passwordSchema,
  }),
};

export const changePasswordSchema = {
  body: z.object({
    current_password: z.string().min(1, 'Current password is required'),
    new_password: passwordSchema,
  }).refine((data) => data.current_password !== data.new_password, {
    message: 'New password must be different from current password',
    path: ['new_password'],
  }),
};
