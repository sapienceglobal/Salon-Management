import { Router } from 'express';
import passport from '../../config/passport.js';
import { authenticate } from '../../middlewares/authenticate.js';
import { validate } from '../../middlewares/validate.js';
import { authLimiter, passwordResetLimiter } from '../../middlewares/rateLimiter.js';
import {
  registerSchema,
  loginSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
  changePasswordSchema,
} from './auth.validation.js';
import {
  register,
  login,
  refresh,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
  changePassword,
  getMe,
  googleCallback,
} from './auth.controller.js';

const router = Router();

// ===================================================================
// PUBLIC ROUTES (no authentication required)
// ===================================================================

// Register new business + admin
router.post('/register', authLimiter, validate(registerSchema), register);

// Login with email & password (Rate limiter disabled for testing)
router.post('/login', validate(loginSchema), login);

// Refresh access token
router.post('/refresh', refresh);

// Forgot password — send OTP email
router.post(
  '/forgot-password',
  passwordResetLimiter,
  validate(forgotPasswordSchema),
  forgotPassword
);

// Verify OTP
router.post(
  '/verify-otp',
  passwordResetLimiter,
  validate(verifyOtpSchema),
  verifyOtp
);

// Reset password with OTP
router.post(
  '/reset-password',
  passwordResetLimiter,
  validate(resetPasswordSchema),
  resetPassword
);

// Google OAuth — redirect to Google
router.get(
  '/google',
  passport.authenticate('google', {
    session: false,
    scope: ['profile', 'email'],
  })
);

// Google OAuth — callback from Google
router.get(
  '/google/callback',
  passport.authenticate('google', {
    session: false,
    failureRedirect: '/api/v1/auth/google/failure',
  }),
  googleCallback
);

// Google OAuth — failure handler
router.get('/google/failure', (req, res) => {
  res.status(401).json({
    success: false,
    statusCode: 401,
    message: 'Google authentication failed',
  });
});

// ===================================================================
// PRIVATE ROUTES (authentication required)
// ===================================================================

// Logout
router.post('/logout', authenticate, logout);

// Change password
router.post(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  changePassword
);

// Get current user profile
router.get('/me', authenticate, getMe);

export default router;
